import { AiBrain01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { WorkspaceCounts } from "@/features/tenders/server/queries";

/** Live pipeline status from the database (no decorative "online" claims). */
export function AiStatusCard({ counts }: { counts: WorkspaceCounts }) {
  const analyzing = counts.analyzing > 0;
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2 text-xs font-medium">
        <span className="relative flex size-2">
          {analyzing && <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />}
          <span className={analyzing ? "relative size-2 rounded-full bg-primary" : "relative size-2 rounded-full bg-success"} />
        </span>
        {analyzing ? `Analyzing ${counts.analyzing} tender${counts.analyzing === 1 ? "" : "s"}` : "All analyses current"}
        <HugeiconsIcon icon={AiBrain01Icon} size={15} strokeWidth={1.7} className="ml-auto text-muted-foreground" aria-hidden />
      </div>
      <p className="metric mt-2 text-[11px] text-muted-foreground">
        {counts.tenders} tenders · {counts.pagesIndexed} pages indexed
      </p>
    </div>
  );
}
