import { Dot } from "@/components/status/badges";
import { SEVERITY_META } from "@/components/status/tones";
import { SEVERITIES } from "@/domain/analysis";
import type { RiskCounts } from "../types";

/** Compact severity counts, e.g. "● 2  ● 3  ● 1". Zero counts are hidden. */
export function RiskCountsInline({ risks }: { risks: RiskCounts }) {
  const visible = SEVERITIES.filter((s) => risks[s] > 0);
  if (visible.length === 0) return <span className="text-xs text-muted-foreground">None</span>;
  return (
    <span className="inline-flex items-center gap-2.5">
      {visible.map((severity) => (
        <span
          key={severity}
          className="inline-flex items-center gap-1 text-xs font-medium tabular"
          title={`${risks[severity]} ${SEVERITY_META[severity].label.toLowerCase()}`}
        >
          <Dot tone={SEVERITY_META[severity].tone} />
          {risks[severity]}
          <span className="sr-only">{SEVERITY_META[severity].label}</span>
        </span>
      ))}
    </span>
  );
}
