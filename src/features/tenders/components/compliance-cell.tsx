import { Meter } from "@/components/status/meter";
import { percent } from "@/lib/format";
import type { ChecklistProgress } from "../types";

export function ComplianceCell({ progress }: { progress: ChecklistProgress }) {
  if (progress.total === 0) return <span className="text-xs text-muted-foreground">—</span>;
  const value = percent(progress.completed, progress.total);
  return (
    <div className="flex min-w-28 items-center gap-2.5">
      <Meter value={value} label="Compliance progress" className="flex-1" />
      <span className="w-9 text-right text-xs font-medium tabular">{value}%</span>
    </div>
  );
}
