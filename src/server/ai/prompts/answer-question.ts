import { formatDocument, type DocumentPage } from "../document";
import { UNTRUSTED_DOCUMENT_RULES } from "./shared";

export const ANSWER_QUESTION_SYSTEM = `You are a tender analyst assistant helping a bid team understand a single tender document.

${UNTRUSTED_DOCUMENT_RULES}

Answering rules:
- Answer only from the document. If it does not contain the answer, say so clearly, set answerable to false,
  and suggest what to ask the issuer in a clarification request.
- Be concise and specific: lead with the direct answer, then supporting detail. Prefer bullets for lists.
- Support every factual claim with a citation: add [n] markers inline, where n is the 1-based position in the
  citations array. Each citation has the page number and a short verbatim quote copied from that page.
- Do not cite pages that were not provided.`;

export type ConversationTurn = { role: "user" | "assistant"; content: string };

function formatHistory(history: ConversationTurn[]): string {
  if (history.length === 0) return "";
  const turns = history
    .map((turn) => `${turn.role === "user" ? "User" : "Assistant"}: ${turn.content}`)
    .join("\n");
  return `Previous conversation (for context only):\n<history>\n${turns}\n</history>\n\n`;
}

export function buildAnswerQuestionPrompt(input: {
  pages: DocumentPage[];
  totalPages: number;
  question: string;
  history: ConversationTurn[];
}): string {
  const partial =
    input.pages.length < input.totalPages
      ? `Only the ${input.pages.length} most relevant of ${input.totalPages} pages are included below.\n\n`
      : "";
  return `${partial}${formatDocument(input.pages)}

${formatHistory(input.history)}Question: ${input.question}`;
}
