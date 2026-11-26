"use client";

import { useEffect, useRef } from "react";
import { ErrorState } from "@/components/status/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { splitByQuote } from "./highlight";
import { usePageText } from "./use-page-text";

/** Extracted page text with the cited passage highlighted and scrolled into view. */
export function PageTextView({ tenderId, page, quote }: { tenderId: string; page: number; quote?: string }) {
  const state = usePageText(tenderId, page);
  const markRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (state.status === "ready") markRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [state.status, page, quote]);

  if (state.status === "error") {
    return (
      <ErrorState
        title="Couldn't load this page"
        description={state.message}
        action={
          <Button size="sm" variant="outline" onClick={state.retry}>
            Try again
          </Button>
        }
      />
    );
  }
  if (state.status !== "ready") {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading page">
        {Array.from({ length: 9 }, (_, i) => (
          <Skeleton key={i} className="h-3.5" style={{ width: `${68 + ((i * 13) % 30)}%` }} />
        ))}
      </div>
    );
  }
  return (
    <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-foreground/85">
      {state.text
        ? splitByQuote(state.text, quote).map((segment, index) =>
            segment.highlighted ? (
              <mark key={index} ref={markRef} className="rounded bg-warning-soft px-0.5 text-foreground ring-1 ring-warning-mid">
                {segment.text}
              </mark>
            ) : (
              <span key={index}>{segment.text}</span>
            ),
          )
        : "This page has no extractable text."}
    </p>
  );
}
