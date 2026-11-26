"use client";

import { Delete02Icon, MoreHorizontalIcon, RefreshIcon, ViewIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiFetch } from "@/lib/api-client";

type Dialog = "reanalyze" | "delete" | null;

export function TenderActions({ tenderId, isSample, canReanalyze }: { tenderId: string; isSample: boolean; canReanalyze: boolean }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [pending, setPending] = useState(false);

  async function reanalyze() {
    setPending(true);
    try {
      await apiFetch(`/api/tenders/${tenderId}/analyze`, { method: "POST" });
      toast.success("Re-analysis started.");
      setDialog(null);
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    setPending(true);
    try {
      await apiFetch(`/api/tenders/${tenderId}`, { method: "DELETE" });
      toast.success("Tender deleted.");
      router.push("/tenders");
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
      setPending(false);
    }
  }

  return (
    <>
      <Button asChild variant="outline">
        <a href={`/api/tenders/${tenderId}/file`} target="_blank" rel="noopener noreferrer">
          <HugeiconsIcon icon={ViewIcon} size={16} />
          View PDF
        </a>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="More actions">
            <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem disabled={!canReanalyze} onSelect={() => setDialog("reanalyze")}>
            <HugeiconsIcon icon={RefreshIcon} size={16} />
            Re-run analysis
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={isSample}
            onSelect={() => setDialog("delete")}
            title={isSample ? "Sample tenders can't be deleted" : undefined}
          >
            <HugeiconsIcon icon={Delete02Icon} size={16} />
            {isSample ? "Delete (sample protected)" : "Delete tender"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={dialog !== null} onOpenChange={(open) => !open && !pending && setDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialog === "delete" ? "Delete this tender?" : "Re-run the AI analysis?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialog === "delete"
                ? "The document, analysis, checklist progress and assistant history will be permanently removed."
                : "The checklist and risks will be regenerated from the document. Checklist progress will be reset."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              variant={dialog === "delete" ? "destructive" : "default"}
              onClick={(event) => {
                event.preventDefault();
                void (dialog === "delete" ? remove() : reanalyze());
              }}
            >
              {pending ? "Working…" : dialog === "delete" ? "Delete" : "Re-run analysis"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
