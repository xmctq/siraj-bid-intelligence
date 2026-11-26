import "server-only";
import { and, asc, count, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { SEVERITIES, type Severity } from "@/domain/analysis";
import type { TenderStatus } from "@/domain/api";
import { getDb } from "@/server/db/client";
import { checklistItems, risks, tenderPages, tenders } from "@/server/db/schema";
import { notFound } from "@/server/errors";
import { EMPTY_PROGRESS, EMPTY_RISKS, type ChecklistProgress, type RiskCounts, type TenderSummary } from "../types";

export const TENDERS_PAGE_SIZE = 10;

/** Columns needed for lists; excludes the heavy analysis JSON. */
const summaryColumns = {
  id: tenders.id,
  title: tenders.title,
  issuer: tenders.issuer,
  referenceNumber: tenders.referenceNumber,
  status: tenders.status,
  submissionDeadline: tenders.submissionDeadline,
  pageCount: tenders.pageCount,
  isSample: tenders.isSample,
  createdAt: tenders.createdAt,
};

type SummaryRow = Omit<TenderSummary, "checklist" | "risks">;

/** Aggregates checklist progress and risk counts for many tenders in two grouped queries (no N+1). */
async function attachStats(rows: SummaryRow[]): Promise<TenderSummary[]> {
  if (rows.length === 0) return [];
  const db = await getDb();
  const ids = rows.map((row) => row.id);

  const [progressRows, riskRows] = await Promise.all([
    db
      .select({
        tenderId: checklistItems.tenderId,
        total: count(),
        completed: sql<number>`count(*) filter (where ${checklistItems.completed})`.mapWith(Number),
        mandatoryTotal: sql<number>`count(*) filter (where ${checklistItems.mandatory})`.mapWith(Number),
        mandatoryCompleted: sql<number>`count(*) filter (where ${checklistItems.mandatory} and ${checklistItems.completed})`.mapWith(
          Number,
        ),
      })
      .from(checklistItems)
      .where(inArray(checklistItems.tenderId, ids))
      .groupBy(checklistItems.tenderId),
    db
      .select({ tenderId: risks.tenderId, severity: risks.severity, total: count() })
      .from(risks)
      .where(inArray(risks.tenderId, ids))
      .groupBy(risks.tenderId, risks.severity),
  ]);

  const progressById = new Map<string, ChecklistProgress>(
    progressRows.map(({ tenderId, ...progress }) => [tenderId, progress]),
  );
  const risksById = new Map<string, RiskCounts>();
  for (const { tenderId, severity, total } of riskRows) {
    if (!SEVERITIES.includes(severity as Severity)) continue;
    const counts = risksById.get(tenderId) ?? { ...EMPTY_RISKS };
    counts[severity as Severity] = total;
    risksById.set(tenderId, counts);
  }

  return rows.map((row) => ({
    ...row,
    checklist: progressById.get(row.id) ?? EMPTY_PROGRESS,
    risks: risksById.get(row.id) ?? EMPTY_RISKS,
  }));
}

export async function listTenders(params: { q?: string; status?: TenderStatus; page: number }) {
  const db = await getDb();
  const filters: SQL[] = [];
  if (params.q) {
    const pattern = `%${params.q.replace(/[%_\\]/g, "\\$&")}%`;
    const match = or(ilike(tenders.title, pattern), ilike(tenders.issuer, pattern), ilike(tenders.referenceNumber, pattern));
    if (match) filters.push(match);
  }
  if (params.status) filters.push(eq(tenders.status, params.status));
  const where = filters.length ? and(...filters) : undefined;

  const [rows, [totals]] = await Promise.all([
    db
      .select(summaryColumns)
      .from(tenders)
      .where(where)
      .orderBy(desc(tenders.createdAt))
      .limit(TENDERS_PAGE_SIZE)
      .offset((params.page - 1) * TENDERS_PAGE_SIZE),
    db.select({ total: count() }).from(tenders).where(where),
  ]);

  return {
    items: await attachStats(rows),
    total: totals?.total ?? 0,
    page: params.page,
    pageSize: TENDERS_PAGE_SIZE,
  };
}

export type AttentionRisk = {
  id: string;
  tenderId: string;
  tenderTitle: string;
  severity: Severity;
  kind: string;
  title: string;
};

export async function getDashboardData() {
  const db = await getDb();
  const [rows, attention] = await Promise.all([
    db.select(summaryColumns).from(tenders).orderBy(desc(tenders.createdAt)).limit(50),
    db
      .select({
        id: risks.id,
        tenderId: risks.tenderId,
        tenderTitle: tenders.title,
        severity: risks.severity,
        kind: risks.kind,
        title: risks.title,
      })
      .from(risks)
      .innerJoin(tenders, eq(tenders.id, risks.tenderId))
      .where(inArray(risks.severity, ["critical", "high"]))
      .orderBy(sql`case ${risks.severity} when 'critical' then 0 else 1 end`, desc(tenders.createdAt), asc(risks.position))
      .limit(6),
  ]);
  return { tenders: await attachStats(rows), attention: attention as AttentionRisk[] };
}

export type WorkspaceCounts = {
  tenders: number;
  analyzing: number;
  openCriticalRisks: number;
  upcomingDeadlines: number;
  pagesIndexed: number;
};

/** Small aggregate for the app shell (nav badges, status card). One round trip. */
export async function getWorkspaceCounts(): Promise<WorkspaceCounts> {
  const db = await getDb();
  const [row] = await db
    .select({
      tenders: count(),
      analyzing: sql<number>`count(*) filter (where ${tenders.status} = 'processing')`.mapWith(Number),
      upcomingDeadlines: sql<number>`count(*) filter (where ${tenders.submissionDeadline} >= now())`.mapWith(Number),
      pagesIndexed: sql<number>`coalesce(sum(${tenders.pageCount}), 0)`.mapWith(Number),
      openCriticalRisks: sql<number>`(select count(*) from ${risks} r join ${tenders} t on t.id = r.tender_id
        where r.severity = 'critical' and (t.submission_deadline is null or t.submission_deadline >= now()))`.mapWith(Number),
    })
    .from(tenders);
  return row ?? { tenders: 0, analyzing: 0, openCriticalRisks: 0, upcomingDeadlines: 0, pagesIndexed: 0 };
}

export type RegisterRisk = {
  id: string;
  tenderId: string;
  tenderTitle: string;
  tenderDeadline: Date | null;
  kind: string;
  severity: string;
  title: string;
  description: string;
  mitigation: string;
  pages: number[];
};

/** Cross-tender risk register, most severe first. */
export async function listAllRisks(): Promise<RegisterRisk[]> {
  const db = await getDb();
  return db
    .select({
      id: risks.id,
      tenderId: risks.tenderId,
      tenderTitle: tenders.title,
      tenderDeadline: tenders.submissionDeadline,
      kind: risks.kind,
      severity: risks.severity,
      title: risks.title,
      description: risks.description,
      mitigation: risks.mitigation,
      pages: risks.pages,
    })
    .from(risks)
    .innerJoin(tenders, eq(tenders.id, risks.tenderId))
    .orderBy(
      sql`case ${risks.severity} when 'critical' then 0 when 'high' then 1 when 'medium' then 2 else 3 end`,
      desc(tenders.createdAt),
      asc(risks.position),
    )
    .limit(300);
}

export type TimelineEvent = {
  tenderId: string;
  tenderTitle: string;
  label: string;
  date: Date;
  rawText: string;
  isSubmission: boolean;
};

/** Every dated milestone across analyzed tenders, from the stored analysis JSON. */
export async function listKeyDates(): Promise<TimelineEvent[]> {
  const db = await getDb();
  const rows = await db
    .select({ id: tenders.id, title: tenders.title, analysis: tenders.analysis, deadline: tenders.submissionDeadline })
    .from(tenders)
    .where(eq(tenders.status, "ready"))
    .limit(100);

  const events: TimelineEvent[] = [];
  for (const row of rows) {
    for (const item of row.analysis?.keyDates ?? []) {
      const date = item.date ? new Date(item.date) : null;
      if (!date || Number.isNaN(date.getTime())) continue;
      events.push({
        tenderId: row.id,
        tenderTitle: row.title,
        label: item.label,
        date,
        rawText: item.rawText,
        isSubmission: Boolean(row.deadline && Math.abs(row.deadline.getTime() - date.getTime()) < 60_000),
      });
    }
  }
  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export async function getTenderDetail(id: string) {
  const db = await getDb();
  const [tender] = await db.select().from(tenders).where(eq(tenders.id, id)).limit(1);
  if (!tender) throw notFound("Tender");
  const [checklist, riskRows] = await Promise.all([
    db.select().from(checklistItems).where(eq(checklistItems.tenderId, id)).orderBy(asc(checklistItems.position)),
    db.select().from(risks).where(eq(risks.tenderId, id)).orderBy(asc(risks.position)),
  ]);
  return { tender, checklist, risks: riskRows };
}

export async function getTenderStatus(id: string) {
  const db = await getDb();
  const [row] = await db
    .select({
      id: tenders.id,
      status: tenders.status,
      errorMessage: tenders.errorMessage,
      analysisStartedAt: tenders.analysisStartedAt,
    })
    .from(tenders)
    .where(eq(tenders.id, id))
    .limit(1);
  if (!row) throw notFound("Tender");
  return row;
}

export async function getTenderPage(id: string, pageNumber: number) {
  const db = await getDb();
  const [page] = await db
    .select({ pageNumber: tenderPages.pageNumber, text: tenderPages.text })
    .from(tenderPages)
    .where(and(eq(tenderPages.tenderId, id), eq(tenderPages.pageNumber, pageNumber)))
    .limit(1);
  if (!page) throw notFound("Page");
  return page;
}

export async function getTenderPages(id: string) {
  const db = await getDb();
  return db
    .select({ pageNumber: tenderPages.pageNumber, text: tenderPages.text })
    .from(tenderPages)
    .where(eq(tenderPages.tenderId, id))
    .orderBy(asc(tenderPages.pageNumber));
}
