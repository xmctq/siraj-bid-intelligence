import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { assistantAnswerSchema } from "@/domain/analysis";
import { getLlmClient, type LlmClient } from "@/server/ai";
import { selectRelevantPages } from "@/server/ai/document";
import { normalizeAnswer } from "@/server/ai/normalize";
import { ANSWER_QUESTION_SYSTEM, buildAnswerQuestionPrompt } from "@/server/ai/prompts/answer-question";
import { getDb } from "@/server/db/client";
import { chatMessages, tenders, type ChatMessageRow } from "@/server/db/schema";
import { AppError, notFound } from "@/server/errors";
import { getTenderPages } from "@/features/tenders/server/queries";

/** ~30k tokens of document context per question keeps answers fast and well inside free-tier limits. */
const CONTEXT_CHAR_BUDGET = 120_000;
const HISTORY_TURNS = 6;

export async function getChatHistory(tenderId: string): Promise<ChatMessageRow[]> {
  const db = await getDb();
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.tenderId, tenderId))
    .orderBy(asc(chatMessages.createdAt))
    .limit(200);
}

export async function askQuestion(tenderId: string, question: string, llm?: LlmClient): Promise<ChatMessageRow> {
  const db = await getDb();
  const [tender] = await db
    .select({ status: tenders.status, pageCount: tenders.pageCount })
    .from(tenders)
    .where(eq(tenders.id, tenderId))
    .limit(1);
  if (!tender) throw notFound("Tender");
  if (tender.status !== "ready") {
    throw new AppError("tender_not_ready", "The assistant is available once the analysis has finished.", 409);
  }

  const [allPages, recent] = await Promise.all([
    getTenderPages(tenderId),
    db
      .select({ role: chatMessages.role, content: chatMessages.content })
      .from(chatMessages)
      .where(eq(chatMessages.tenderId, tenderId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(HISTORY_TURNS),
  ]);
  const pages = selectRelevantPages(allPages, question, CONTEXT_CHAR_BUDGET);

  const raw = await (llm ?? getLlmClient()).generateJson({
    task: "answer-question",
    system: ANSWER_QUESTION_SYSTEM,
    prompt: buildAnswerQuestionPrompt({ pages, totalPages: tender.pageCount, question, history: recent.reverse() }),
    schema: assistantAnswerSchema,
    temperature: 0.1,
    maxOutputTokens: 4096,
  });
  const answer = normalizeAnswer(raw, new Set(pages.map((p) => p.pageNumber)));

  // Saved only after a successful answer, so failed attempts don't pollute the history.
  const askedAt = new Date();
  await db.insert(chatMessages).values({ tenderId, role: "user", content: question, createdAt: askedAt });
  const [saved] = await db
    .insert(chatMessages)
    .values({
      tenderId,
      createdAt: new Date(askedAt.getTime() + 1),
      role: "assistant",
      content: answer.answer,
      citations: answer.citations,
      answerable: answer.answerable,
    })
    .returning();
  if (!saved) throw new Error("Failed to store assistant message");
  return saved;
}
