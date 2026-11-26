"use client";

import { cn } from "@/lib/utils";
import { useEvidence } from "./evidence-context";

/** Clickable "p. N" chips that open the source page with the passage highlighted. */
export function PageRefs({ pages, quote, className }: { pages: number[]; quote?: string; className?: string }) {
  const evidence = useEvidence();
  if (pages.length === 0) return null;
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1", className)}>
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => evidence?.openEvidence(page, quote)}
          className="inline-flex h-5 items-center rounded border bg-background px-1.5 text-[11px] font-medium text-muted-foreground tabular transition-colors outline-none hover:border-primary/40 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`View source on page ${page}`}
        >
          p.{page}
        </button>
      ))}
    </span>
  );
}
