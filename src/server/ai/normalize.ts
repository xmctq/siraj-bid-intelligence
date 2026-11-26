import { SEVERITIES, type AssistantAnswer, type TenderAnalysis } from "@/domain/analysis";

const MAX_PAGES_PER_ITEM = 6;
const LIST_LIMITS = { checklist: 40, risks: 30, other: 30 } as const;

/** Keeps only real page numbers (1..pageCount), unique and sorted. */
export function clampPages(pages: number[], pageCount: number): number[] {
  return [...new Set(pages.filter((p) => Number.isInteger(p) && p >= 1 && p <= pageCount))]
    .sort((a, b) => a - b)
    .slice(0, MAX_PAGES_PER_ITEM);
}

/** Parses model-provided ISO dates, rejecting nonsense. */
export function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();
  return year >= 2000 && year <= 2100 ? date : null;
}

const DEADLINE_LABEL = /submission|closing|deadline|due date/i;

export type NormalizedAnalysis = {
  analysis: TenderAnalysis;
  submissionDeadline: Date | null;
};

export function normalizeAnalysis(raw: TenderAnalysis, pageCount: number): NormalizedAnalysis {
  const fixPages = <T extends { pages: number[] }>(item: T): T => ({ ...item, pages: clampPages(item.pages, pageCount) });
  const cap = <T>(items: T[], limit: number = LIST_LIMITS.other) => items.slice(0, limit);

  const keyDates = cap(raw.keyDates.map(fixPages)).sort((a, b) => {
    const da = parseIsoDate(a.date)?.getTime() ?? Number.POSITIVE_INFINITY;
    const db = parseIsoDate(b.date)?.getTime() ?? Number.POSITIVE_INFINITY;
    return da - db;
  });

  const severityRank = (s: string) => SEVERITIES.indexOf(s as (typeof SEVERITIES)[number]);
  const risks = cap(raw.risks.map(fixPages), LIST_LIMITS.risks).sort(
    (a, b) => severityRank(a.severity) - severityRank(b.severity),
  );

  const analysis: TenderAnalysis = {
    ...raw,
    submissionDeadline: fixPages(raw.submissionDeadline),
    keyDates,
    eligibilityCriteria: cap(raw.eligibilityCriteria.map(fixPages)),
    technicalRequirements: cap(raw.technicalRequirements.map(fixPages)),
    deliverables: cap(raw.deliverables.map(fixPages)),
    evaluationCriteria: cap(raw.evaluationCriteria.map(fixPages)),
    checklist: cap(raw.checklist.map(fixPages), LIST_LIMITS.checklist),
    risks,
    assessment: { ...raw.assessment, keyConsiderations: raw.assessment.keyConsiderations.slice(0, 6) },
    suggestedQuestions: raw.suggestedQuestions.filter((q) => q.trim().length > 0).slice(0, 4),
  };

  const submissionDeadline =
    parseIsoDate(raw.submissionDeadline.date) ??
    parseIsoDate(keyDates.find((d) => DEADLINE_LABEL.test(d.label))?.date);

  return { analysis, submissionDeadline };
}

/**
 * Drops citations to pages that were not supplied to the model and renumbers the
 * inline [n] markers so they still point at the right citation.
 */
export function normalizeAnswer(raw: AssistantAnswer, allowedPages: ReadonlySet<number>): AssistantAnswer {
  const indexMap = new Map<number, number>();
  const citations: AssistantAnswer["citations"] = [];
  raw.citations.forEach((citation, index) => {
    if (!allowedPages.has(citation.page)) return;
    citations.push({ page: citation.page, quote: citation.quote.trim().slice(0, 400) });
    indexMap.set(index + 1, citations.length);
  });

  const answer = raw.answer
    .replace(/\[(\d+)\]/g, (_match, n: string) => {
      const mapped = indexMap.get(Number(n));
      return mapped ? `[${mapped}]` : "";
    })
    .replace(/ +([.,;:])/g, "$1")
    .trim();

  return { answer, answerable: raw.answerable, citations };
}
