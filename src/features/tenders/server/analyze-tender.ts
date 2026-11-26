import "server-only";
import { and, eq, lt, ne, or, isNull } from "drizzle-orm";
import { tenderAnalysisSchema } from "@/domain/analysis";
import { getLlmClient, AiError, type LlmClient } from "@/server/ai";
import { normalizeAnalysis } from "@/server/ai/normalize";
import { ANALYZE_TENDER_SYSTEM, buildAnalyzeTenderPrompt } from "@/server/ai/prompts/analyze-tender";
import { getDb } from "@/server/db/client";
import { checklistItems, risks, tenders } from "@/server/db/schema";
import { AppError, notFound } from "@/server/errors";
import { getTenderPages } from "./queries";

/** An analysis "processing" for longer than this was interrupted (e.g. function timeout). */
export const STALE_ANALYSIS_MS = 6 * 60 * 1000;

export function isAnalysisStale(status: string, startedAt: Date | null, now = Date.now()): boolean {
  return status === "processing" && (!startedAt || now - startedAt.getTime() > STALE_ANALYSIS_MS);
}

/**
 * Atomically moves a tender into "processing" unless an analysis is already running.
 * Throws if another analysis is in flight.
 */
export async function claimTenderForAnalysis(tenderId: string): Promise<void> {
  const db = await getDb();
  const staleBefore = new Date(Date.now() - STALE_ANALYSIS_MS);
  const claimed = await db
    .update(tenders)
    .set({ status: "processing", errorMessage: null, analysisStartedAt: new Date() })
    .where(
      and(
        eq(tenders.id, tenderId),
        or(ne(tenders.status, "processing"), isNull(tenders.analysisStartedAt), lt(tenders.analysisStartedAt, staleBefore)),
      ),
    )
    .returning({ id: tenders.id });
  if (claimed.length > 0) return;

  const [exists] = await db.select({ id: tenders.id }).from(tenders).where(eq(tenders.id, tenderId)).limit(1);
  if (!exists) throw notFound("Tender");
  throw new AppError("analysis_in_progress", "An analysis is already running for this tender.", 409);
}

/**
 * Runs the AI analysis and persists results. Never throws: failures are recorded on the
 * tender so the UI can show them and offer a retry.
 */
export async function runTenderAnalysis(tenderId: string, llm?: LlmClient): Promise<void> {
  const db = await getDb();
  try {
    const pages = await getTenderPages(tenderId);
    if (pages.length === 0) throw notFound("Tender");

    const client = llm ?? getLlmClient();
    const raw = await client.generateJson({
      task: "analyze-tender",
      system: ANALYZE_TENDER_SYSTEM,
      prompt: buildAnalyzeTenderPrompt(pages),
      schema: tenderAnalysisSchema,
      temperature: 0.2,
    });
    const { analysis, submissionDeadline } = normalizeAnalysis(raw, pages.length);

    await db.delete(checklistItems).where(eq(checklistItems.tenderId, tenderId));
    await db.delete(risks).where(eq(risks.tenderId, tenderId));
    if (analysis.checklist.length > 0) {
      await db.insert(checklistItems).values(
        analysis.checklist.map((item, position) => ({ tenderId, position, ...item })),
      );
    }
    if (analysis.risks.length > 0) {
      await db.insert(risks).values(analysis.risks.map((risk, position) => ({ tenderId, position, ...risk })));
    }
    await db
      .update(tenders)
      .set({
        status: "ready",
        errorMessage: null,
        analysis,
        title: analysis.overview.title.trim() || undefined,
        issuer: analysis.overview.issuer,
        referenceNumber: analysis.overview.referenceNumber,
        submissionDeadline,
        analyzedAt: new Date(),
      })
      .where(eq(tenders.id, tenderId));
  } catch (error) {
    const message =
      error instanceof AiError
        ? error.userMessage
        : error instanceof AppError
          ? error.message
          : "Analysis failed unexpectedly. Please retry.";
    console.error(`[analysis] tender ${tenderId} failed`, error);
    await db
      .update(tenders)
      .set({ status: "failed", errorMessage: message })
      .where(eq(tenders.id, tenderId))
      .catch((dbError: unknown) => console.error("[analysis] could not record failure", dbError));
  }
}
