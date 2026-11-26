import { AiBrain01Icon, AiChat02Icon, ArrowRight01Icon, CancelCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Ring } from "@/components/charts/ring";
import { DeadlineBadge, Dot, Pill, StatusBadge } from "@/components/status/badges";
import { progressTone, SEVERITY_META } from "@/components/status/tones";
import { Button } from "@/components/ui/button";
import { SEVERITIES, type Severity, type TenderAnalysis } from "@/domain/analysis";
import type { TenderStatus } from "@/domain/api";
import { formatDate, percent } from "@/lib/format";
import type { ChecklistProgress } from "../../types";

const COMPLEXITY_TONE = { low: "success", medium: "warning", high: "danger" } as const;

function MiniStat({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border bg-background/60 p-3.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1.5">{children}</div>
      {hint && <div className="mt-1 truncate text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function TenderHero({
  tender,
  analysis,
  checklist,
  riskCounts,
  actions,
}: {
  tender: {
    id: string;
    title: string;
    issuer: string | null;
    referenceNumber: string | null;
    fileName: string;
    status: TenderStatus;
    isSample: boolean;
    submissionDeadline: Date | null;
    pageCount: number;
  };
  analysis: TenderAnalysis | null;
  checklist: ChecklistProgress;
  riskCounts: Record<Severity, number>;
  actions: ReactNode;
}) {
  const compliance = percent(checklist.completed, checklist.total);
  return (
    <section className="grid overflow-hidden rounded-2xl border bg-card shadow-[0_1px_2px_oklch(0.27_0.035_275/0.04)] xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-5 p-5 sm:p-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {tender.referenceNumber && (
              <span className="metric inline-flex h-6 items-center rounded-md border bg-muted/60 px-2 text-[11px] font-medium">
                {tender.referenceNumber}
              </span>
            )}
            <StatusBadge status={tender.status} />
            {tender.isSample && <Pill tone="neutral">Sample</Pill>}
            {analysis && (
              <Pill tone={COMPLEXITY_TONE[analysis.assessment.complexity]}>
                {analysis.assessment.complexity.charAt(0).toUpperCase() + analysis.assessment.complexity.slice(1)} complexity
              </Pill>
            )}
          </div>
          <h1 className="text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-[28px]">{tender.title}</h1>
          <p className="text-sm text-muted-foreground">{tender.issuer ?? tender.fileName}</p>
        </div>

        {analysis && (
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniStat label="Compliance" hint={`${checklist.mandatoryCompleted}/${checklist.mandatoryTotal} mandatory items`}>
              <div className="flex items-center gap-3">
                <Ring value={compliance} tone={progressTone(compliance)} label="Compliance progress" />
                <p>
                  <span className="metric text-2xl font-semibold">{compliance}</span>
                  <span className="text-xs text-muted-foreground"> /100</span>
                </p>
              </div>
            </MiniStat>
            <MiniStat label="Submission deadline" hint={analysis.submissionDeadline.rawText ? `As written: “${analysis.submissionDeadline.rawText}”` : undefined}>
              <p className="metric text-lg leading-tight font-semibold">{tender.submissionDeadline ? formatDate(tender.submissionDeadline) : "Not stated"}</p>
              <DeadlineBadge deadline={tender.submissionDeadline} className="mt-1.5" />
            </MiniStat>
            <MiniStat label="Identified risks" hint={`${tender.pageCount} pages analyzed`}>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {SEVERITIES.map((severity) => (
                  <span key={severity} className="inline-flex items-center gap-1.5 text-sm">
                    <Dot tone={SEVERITY_META[severity].tone} className="size-2" />
                    <span className="metric font-semibold">{riskCounts[severity]}</span>
                    <span className="text-[11px] text-muted-foreground">{SEVERITY_META[severity].label}</span>
                  </span>
                ))}
              </div>
            </MiniStat>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {analysis && (
            <Button asChild className="shadow-sm">
              <Link href={`/tenders/${tender.id}?tab=assistant`} scroll={false}>
                <HugeiconsIcon icon={AiChat02Icon} size={16} />
                Ask the AI assistant
              </Link>
            </Button>
          )}
          {actions}
        </div>
      </div>

      <aside className="bg-command flex flex-col gap-3 border-t p-5 sm:p-6 xl:border-t-0 xl:border-l">
        <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] text-primary uppercase">
          <HugeiconsIcon icon={AiBrain01Icon} size={15} aria-hidden />
          AI brief
        </p>
        {analysis ? (
          <>
            <p className="text-sm leading-relaxed text-foreground/85">{analysis.overview.summary}</p>
            <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-primary/10 pt-3 text-xs">
              <div>
                <dt className="text-muted-foreground">Estimated value</dt>
                <dd className="mt-0.5 font-medium">{analysis.overview.estimatedValue ?? "Not disclosed"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Contract duration</dt>
                <dd className="mt-0.5 font-medium">{analysis.overview.contractDuration ?? "Not stated"}</dd>
              </div>
            </dl>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">The brief appears once the analysis completes.</p>
        )}
      </aside>
    </section>
  );
}

export function CriticalBanner({ tenderId, count, example }: { tenderId: string; count: number; example: string }) {
  if (count === 0) return null;
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-danger-mid/40 bg-danger-soft/70 px-4 py-3 sm:flex-row sm:items-center">
      <span className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
        <HugeiconsIcon icon={CancelCircleIcon} size={20} className="shrink-0 text-danger" aria-hidden />
        <span className="text-sm">
          <strong className="font-semibold text-danger">
            {count} critical finding{count === 1 ? "" : "s"} could disqualify this bid
          </strong>
          <span className="text-muted-foreground"> · e.g. {example}</span>
        </span>
      </span>
      <Button asChild variant="outline" size="sm" className="shrink-0 bg-card">
        <Link href={`/tenders/${tenderId}?tab=risks`} scroll={false}>
          Review risks
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
        </Link>
      </Button>
    </div>
  );
}
