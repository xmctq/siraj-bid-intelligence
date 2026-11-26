import { SEVERITIES } from "@/domain/analysis";
import type { RiskCounts, TenderSummary } from "@/features/tenders/types";
import { percent } from "@/lib/format";

export type PortfolioStats = {
  total: number;
  open: number;
  analyzing: number;
  nextDeadline: TenderSummary | null;
  deadlinesWithin14Days: number;
  compliancePercent: number;
  checklistCompleted: number;
  checklistTotal: number;
  risks: RiskCounts;
};

const DAY_MS = 86_400_000;

/** Tenders whose deadline hasn't passed (or isn't known yet) are still "open" for bidding. */
export function isOpen(tender: TenderSummary, now: Date): boolean {
  return !tender.submissionDeadline || tender.submissionDeadline.getTime() >= now.getTime();
}

export function sortByDeadline(tenders: TenderSummary[], now: Date): TenderSummary[] {
  const rank = (t: TenderSummary) => {
    if (!t.submissionDeadline) return Number.MAX_SAFE_INTEGER - 1;
    const time = t.submissionDeadline.getTime();
    // Upcoming first (soonest first), then closed ones.
    return time >= now.getTime() ? time : Number.MAX_SAFE_INTEGER / 2 + (now.getTime() - time);
  };
  return [...tenders].sort((a, b) => rank(a) - rank(b));
}

export function computePortfolioStats(tenders: TenderSummary[], now: Date = new Date()): PortfolioStats {
  const open = tenders.filter((t) => isOpen(t, now));
  const upcoming = open
    .filter((t) => t.submissionDeadline)
    .sort((a, b) => a.submissionDeadline!.getTime() - b.submissionDeadline!.getTime());

  const checklistTotal = open.reduce((sum, t) => sum + t.checklist.total, 0);
  const checklistCompleted = open.reduce((sum, t) => sum + t.checklist.completed, 0);

  const risks = Object.fromEntries(
    SEVERITIES.map((severity) => [severity, open.reduce((sum, t) => sum + t.risks[severity], 0)]),
  ) as RiskCounts;

  return {
    total: tenders.length,
    open: open.length,
    analyzing: tenders.filter((t) => t.status === "processing").length,
    nextDeadline: upcoming[0] ?? null,
    deadlinesWithin14Days: upcoming.filter((t) => t.submissionDeadline!.getTime() - now.getTime() <= 14 * DAY_MS).length,
    compliancePercent: percent(checklistCompleted, checklistTotal),
    checklistCompleted,
    checklistTotal,
    risks,
  };
}

export function summarizePortfolio(stats: PortfolioStats): string {
  if (stats.total === 0) return "Upload your first tender to start building your bid pipeline.";
  const parts = [`${stats.open} open tender${stats.open === 1 ? "" : "s"}`];
  if (stats.deadlinesWithin14Days > 0) {
    parts.push(`${stats.deadlinesWithin14Days} closing within 14 days`);
  }
  if (stats.risks.critical > 0) {
    const one = stats.risks.critical === 1;
    parts.push(`${stats.risks.critical} critical risk${one ? " needs" : "s need"} attention`);
  }
  return `${parts.join(" · ")}.`;
}
