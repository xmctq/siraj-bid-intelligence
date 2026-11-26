"use client";

import { Alert02Icon, ArrowRight01Icon, CheckmarkCircle02Icon, FileSearchIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Dot, Pill, SeverityBadge } from "@/components/status/badges";
import { EmptyState } from "@/components/status/states";
import { RISK_KIND_META, SEVERITY_META } from "@/components/status/tones";
import { RISK_KINDS, SEVERITIES, type RiskKind, type Severity } from "@/domain/analysis";
import { PageTextView } from "@/features/evidence/page-text-view";
import type { RegisterRisk } from "@/features/tenders/server/queries";
import { cn } from "@/lib/utils";

type KindFilter = RiskKind | "all";

function matches(risk: RegisterRisk, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return [risk.title, risk.description, risk.tenderTitle].some((field) => field.toLowerCase().includes(q));
}

function RiskDetail({ risk }: { risk: RegisterRisk }) {
  const [page, setPage] = useState<number | null>(risk.pages[0] ?? null);
  const kind = RISK_KIND_META[risk.kind as RiskKind];
  return (
    <article className="flex h-full flex-col">
      <header className="space-y-3 border-b p-5">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={risk.severity as Severity} />
          <Pill tone="neutral">{kind?.label ?? "Risk"}</Pill>
        </div>
        <h2 className="text-lg leading-snug font-semibold">{risk.title}</h2>
        <Link href={`/tenders/${risk.tenderId}?tab=risks`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          {risk.tenderTitle}
          <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
        </Link>
      </header>
      <dl className="divide-y text-sm">
        <div className="space-y-1 p-5">
          <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Finding</dt>
          <dd className="leading-relaxed">{risk.description}</dd>
        </div>
        <div className="space-y-1 bg-brand-soft/40 p-5">
          <dt className="text-[11px] font-semibold tracking-wide text-primary uppercase">Recommended action</dt>
          <dd className="leading-relaxed">{risk.mitigation}</dd>
        </div>
      </dl>
      <section className="flex min-h-0 flex-1 flex-col border-t" aria-label="Source evidence">
        <div className="flex items-center gap-2 px-5 pt-4 pb-3">
          <HugeiconsIcon icon={FileSearchIcon} size={16} className="text-muted-foreground" aria-hidden />
          <h3 className="text-sm font-semibold">Source evidence</h3>
          <div className="ml-auto flex gap-1">
            {risk.pages.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={page === p}
                onClick={() => setPage(p)}
                className={cn(
                  "metric h-6 rounded-md border px-2 text-[11px] outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  page === p ? "border-primary/30 bg-brand-soft text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                p.{p}
              </button>
            ))}
          </div>
        </div>
        <div className="max-h-[420px] flex-1 overflow-y-auto px-5 pb-5">
          {page ? (
            <div className="rounded-xl border bg-muted/30 p-4">
              <PageTextView tenderId={risk.tenderId} page={page} />
            </div>
          ) : (
            <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              This is missing from the whole document, so there is no page to cite. Raise it as a clarification question with the issuer.
            </p>
          )}
        </div>
      </section>
    </article>
  );
}

export function RiskWorkspace({ risks, initialRiskId }: { risks: RegisterRisk[]; initialRiskId?: string }) {
  const [kind, setKind] = useState<KindFilter>("all");
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initialRiskId ?? risks[0]?.id ?? null);

  const filtered = useMemo(
    () =>
      risks.filter(
        (risk) => (kind === "all" || risk.kind === kind) && (!severity || risk.severity === severity) && matches(risk, query),
      ),
    [risks, kind, severity, query],
  );
  const selected = filtered.find((r) => r.id === selectedId) ?? filtered[0] ?? null;

  if (risks.length === 0) {
    return <EmptyState icon={CheckmarkCircle02Icon} title="No findings yet" description="Risks appear here once tenders are analyzed." />;
  }

  const kindCount = (k: KindFilter) => (k === "all" ? risks.length : risks.filter((r) => r.kind === k).length);

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-[0_1px_2px_oklch(0.27_0.035_275/0.04)]">
      <div className="flex flex-col gap-3 border-b p-3 lg:flex-row lg:items-center">
        <div role="group" aria-label="Filter by type" className="flex w-fit flex-wrap gap-1 rounded-xl bg-muted/70 p-1">
          {(["all", ...RISK_KINDS] as KindFilter[]).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              onClick={() => setKind(k)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                kind === k && "bg-card text-foreground shadow-sm",
              )}
            >
              {k === "all" ? "All findings" : RISK_KIND_META[k].label}
              <span className="metric ml-1.5 text-muted-foreground">{kindCount(k)}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-2 lg:justify-end">
          <div role="group" aria-label="Filter by severity" className="flex gap-1">
            {SEVERITIES.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={severity === s}
                onClick={() => setSeverity(severity === s ? null : s)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                  severity === s && "border-primary/30 bg-brand-soft text-foreground",
                )}
              >
                <Dot tone={SEVERITY_META[s].tone} className="size-2" />
                {SEVERITY_META[s].label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-56">
            <HugeiconsIcon icon={Search01Icon} size={15} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search findings…"
              aria-label="Search findings"
              className="h-8 w-full rounded-lg border bg-background pr-2 pl-8 text-xs outline-none focus-visible:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/30"
            />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="border-b lg:border-r lg:border-b-0">
          <p className="metric border-b px-4 py-2 text-[11px] text-muted-foreground">{filtered.length} findings</p>
          {filtered.length === 0 ? (
            <EmptyState icon={Alert02Icon} title="No findings match" description="Adjust the filters or search." className="m-4" />
          ) : (
            <ul className="max-h-[640px] divide-y overflow-y-auto" role="listbox" aria-label="Findings">
              {filtered.map((risk) => {
                const active = selected?.id === risk.id;
                return (
                  <li key={risk.id} role="option" aria-selected={active}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(risk.id)}
                      className={cn(
                        "relative flex w-full gap-3 px-4 py-3 text-left outline-none hover:bg-muted/40 focus-visible:bg-muted/60",
                        active && "bg-brand-soft/50 hover:bg-brand-soft/50",
                      )}
                    >
                      {active && <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-primary" />}
                      <Dot tone={SEVERITY_META[risk.severity as Severity]?.tone ?? "neutral"} className="mt-1.5 size-2" />
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 text-sm font-medium">{risk.title}</span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {RISK_KIND_META[risk.kind as RiskKind]?.label} · {risk.tenderTitle}
                        </span>
                      </span>
                      <SeverityBadge severity={risk.severity as Severity} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="min-h-[480px]">
          {selected ? (
            <RiskDetail key={selected.id} risk={selected} />
          ) : (
            <EmptyState icon={FileSearchIcon} title="Select a finding" className="m-6" />
          )}
        </div>
      </div>
    </div>
  );
}
