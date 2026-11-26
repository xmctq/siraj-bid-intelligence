import { TaskDone01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { Panel } from "@/components/layout/panel";
import { DeadlineBadge } from "@/components/status/badges";
import { Meter } from "@/components/status/meter";
import type { TenderSummary } from "@/features/tenders/types";
import { percent } from "@/lib/format";

/** SHIFT-style table: one row per tender, bar under the name, aligned numeric columns. */
export function ComplianceBreakdown({ tenders, className }: { tenders: TenderSummary[]; className?: string }) {
  const rows = tenders.filter((t) => t.status === "ready").slice(0, 6);
  return (
    <Panel title="Compliance by tender" subtitle="Checklist items completed by the bid team" icon={TaskDone01Icon} tone="success" className={className}>
      <div className="overflow-x-auto px-5 pb-4">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-left text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              <th className="pb-2 font-medium">Tender</th>
              <th className="w-24 pb-2 text-right font-medium">Progress</th>
              <th className="w-28 pb-2 text-right font-medium">Mandatory</th>
              <th className="w-32 pb-2 text-right font-medium">Deadline</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((tender) => {
              const value = percent(tender.checklist.completed, tender.checklist.total);
              return (
                <tr key={tender.id}>
                  <td className="py-3 pr-4">
                    <Link href={`/tenders/${tender.id}?tab=checklist`} className="line-clamp-1 font-medium outline-none hover:text-primary focus-visible:underline">
                      {tender.title}
                    </Link>
                    <Meter value={value} label={`Compliance for ${tender.title}`} className="mt-2 max-w-64" />
                  </td>
                  <td className="metric py-3 text-right">{value}%</td>
                  <td className="metric py-3 text-right text-muted-foreground">
                    {tender.checklist.mandatoryCompleted} / {tender.checklist.mandatoryTotal}
                  </td>
                  <td className="py-3 text-right">
                    <DeadlineBadge deadline={tender.submissionDeadline} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
