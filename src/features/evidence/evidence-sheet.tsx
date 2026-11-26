"use client";

import { ArrowLeft01Icon, ArrowRight01Icon, LinkSquare02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PageTextView } from "./page-text-view";

export function EvidenceSheet({
  tenderId,
  pageCount,
  target,
  onNavigate,
  onClose,
}: {
  tenderId: string;
  pageCount: number;
  target: { page: number; quote?: string } | null;
  onNavigate: (page: number) => void;
  onClose: () => void;
}) {
  const page = target?.page;
  return (
    <Sheet open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b p-5 pr-12">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-primary uppercase">Source evidence</p>
          <SheetTitle>
            Page {page} <span className="font-normal text-muted-foreground">of {pageCount}</span>
          </SheetTitle>
          <SheetDescription>
            {target?.quote ? "The cited passage is highlighted in the extracted text." : "Extracted text of this page."}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-5">{page && <PageTextView tenderId={tenderId} page={page} quote={target?.quote} />}</div>
        <div className="flex items-center gap-2 border-t p-3">
          <Button variant="outline" size="icon-sm" disabled={!page || page <= 1} onClick={() => page && onNavigate(page - 1)} aria-label="Previous page">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
          </Button>
          <span className="metric text-xs text-muted-foreground">
            {page} / {pageCount}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={!page || page >= pageCount}
            onClick={() => page && onNavigate(page + 1)}
            aria-label="Next page"
          >
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </Button>
          <Button asChild variant="ghost" size="sm" className="ml-auto">
            <a href={`/api/tenders/${tenderId}/file#page=${page}`} target="_blank" rel="noopener noreferrer">
              Open original PDF
              <HugeiconsIcon icon={LinkSquare02Icon} size={14} />
            </a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
