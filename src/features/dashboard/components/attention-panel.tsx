import { Alert02Icon, ArrowRight01Icon, CancelCircleIcon, CheckmarkCircle02Icon, Notification03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { Panel } from "@/components/layout/panel";
import { SeverityBadge } from "@/components/status/badges";
import { EmptyState } from "@/components/status/states";
import { RISK_KIND_META } from "@/components/status/tones";
import { Button } from "@/components/ui/button";
import type { RiskKind, Severity } from "@/domain/analysis";
import type { AttentionRisk } from "@/features/tenders/server/queries";
import { cn } from "@/lib/utils";

export function AttentionPanel({ items, total, className }: { items: AttentionRisk[]; total: number; className?: string }) {
  return (
    <Panel
      title="Needs your attention"
      subtitle={`${total} critical and high findings across open tenders`}
      icon={Notification03Icon}
      tone="caution"
      className={className}
      action={
        <Button asChild variant="outline" size="sm">
          <Link href="/risks">
            Risk register
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
          </Link>
        </Button>
      }
    >
      {items.length === 0 ? (
        <EmptyState
          icon={CheckmarkCircle02Icon}
          title="Nothing urgent"
          description="Critical and high-severity findings will appear here."
          className="m-5 mt-0"
        />
      ) : (
        <ul className="space-y-2 px-3 pb-3">
          {items.map((risk) => {
            const critical = risk.severity === "critical";
            return (
              <li key={risk.id} className="flex flex-col gap-3 rounded-xl border border-transparent p-2.5 transition-colors hover:border-border hover:bg-muted/40 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-full",
                      critical ? "bg-danger-soft text-danger" : "bg-caution-soft text-caution",
                    )}
                  >
                    <HugeiconsIcon icon={critical ? CancelCircleIcon : Alert02Icon} size={18} strokeWidth={1.8} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-semibold">{risk.title}</p>
                    <div className="mt-1 flex min-w-0 items-center gap-2">
                      <SeverityBadge severity={risk.severity as Severity} />
                      <p className="truncate text-xs text-muted-foreground">
                        {RISK_KIND_META[risk.kind as RiskKind]?.label ?? "Risk"} · {risk.tenderTitle}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2 pl-12 sm:pl-0">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/tenders/${risk.tenderId}`}>View tender</Link>
                  </Button>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/risks?risk=${risk.id}`}>Review finding</Link>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
