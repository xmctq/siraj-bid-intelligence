"use client";

import { Alert02Icon, CheckmarkCircle02Icon, HelpCircleIcon, Shield01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { SeverityBadge } from "@/components/status/badges";
import { EmptyState } from "@/components/status/states";
import { RISK_KIND_META, SEVERITY_META, TONE_CLASSES } from "@/components/status/tones";
import { RISK_KINDS, SEVERITIES, type RiskKind, type Severity } from "@/domain/analysis";
import { PageRefs } from "@/features/evidence/page-refs";
import { cn } from "@/lib/utils";

export type RiskView = {
  id: string;
  kind: string;
  severity: string;
  title: string;
  description: string;
  mitigation: string;
  pages: number[];
};

const KIND_ICONS: Record<RiskKind, typeof Alert02Icon> = {
  critical_requirement: Shield01Icon,
  missing_information: HelpCircleIcon,
  risk: Alert02Icon,
};

const KIND_ORDER: RiskKind[] = ["critical_requirement", "missing_information", "risk"];

export function RiskRegister({ risks }: { risks: RiskView[] }) {
  const [severity, setSeverity] = useState<Severity | null>(null);

  if (risks.length === 0) {
    return <EmptyState icon={CheckmarkCircle02Icon} title="No risks identified" description="The analysis found no notable risks in this document." />;
  }

  const counts = Object.fromEntries(SEVERITIES.map((s) => [s, risks.filter((r) => r.severity === s).length])) as Record<Severity, number>;
  const visible = severity ? risks.filter((r) => r.severity === severity) : risks;

  return (
    <div className="space-y-4">
      <div role="group" aria-label="Filter by severity" className="flex flex-wrap gap-2">
        {SEVERITIES.map((s) => {
          const tone = TONE_CLASSES[SEVERITY_META[s].tone];
          const active = severity === s;
          return (
            <button
              key={s}
              type="button"
              aria-pressed={active}
              disabled={counts[s] === 0}
              onClick={() => setSeverity(active ? null : s)}
              className={cn(
                "flex min-w-28 items-center gap-2.5 rounded-lg border bg-card px-3 py-2 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
                active && "border-primary/50 ring-1 ring-primary/30",
              )}
            >
              <span className={cn("size-2 rounded-full", tone.dot)} aria-hidden />
              <span className="flex flex-col">
                <span className="text-lg leading-tight font-semibold tabular">{counts[s]}</span>
                <span className="text-[11px] text-muted-foreground">{SEVERITY_META[s].label}</span>
              </span>
            </button>
          );
        })}
        {severity && (
          <button type="button" onClick={() => setSeverity(null)} className="px-2 text-xs text-primary hover:underline">
            Clear filter
          </button>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {KIND_ORDER.filter((kind) => RISK_KINDS.includes(kind)).map((kind) => {
          const group = visible.filter((r) => r.kind === kind);
          const meta = RISK_KIND_META[kind];
          return (
            <section key={kind} aria-labelledby={`risk-${kind}`} className="flex flex-col rounded-xl border bg-card">
              <header className="flex items-start gap-2 border-b px-4 py-3">
                <HugeiconsIcon icon={KIND_ICONS[kind]} size={18} strokeWidth={1.8} className="mt-px text-muted-foreground" aria-hidden />
                <div className="flex-1">
                  <h3 id={`risk-${kind}`} className="text-sm font-semibold">
                    {meta.label} <span className="font-normal text-muted-foreground tabular">({group.length})</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">{meta.description}</p>
                </div>
              </header>
              {group.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">None{severity ? " at this severity" : ""}.</p>
              ) : (
                <ul className="divide-y">
                  {group.map((risk) => (
                    <li key={risk.id} className="space-y-2 px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm leading-snug font-medium">{risk.title}</p>
                        <SeverityBadge severity={risk.severity as Severity} />
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">{risk.description}</p>
                      <div className="rounded-md bg-muted/60 px-3 py-2 text-xs leading-relaxed">
                        <span className="font-medium">Recommended action: </span>
                        {risk.mitigation}
                      </div>
                      {risk.pages.length > 0 ? (
                        <PageRefs pages={risk.pages} />
                      ) : (
                        <p className="text-[11px] text-muted-foreground italic">Not addressed anywhere in the document</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
