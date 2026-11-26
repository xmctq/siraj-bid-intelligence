"use client";

import { CheckmarkCircle02Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ErrorState } from "@/components/status/states";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { RetryAnalysisButton } from "./retry-analysis-button";

type StatusResponse = { status: "processing" | "ready" | "failed"; errorMessage: string | null; stale: boolean };

const POLL_MS = 3000;
/** Expected durations, used only to pace the visual stepper. The real state comes from polling. */
const STAGES = [
  { label: "Document uploaded and text extracted", until: 0 },
  { label: "Reading the tender and extracting key information", until: 20 },
  { label: "Building the compliance checklist", until: 35 },
  { label: "Assessing risks and missing information", until: Number.POSITIVE_INFINITY },
];

export function AnalysisProgress({ tenderId, pageCount, startedAt }: { tenderId: string; pageCount: number; startedAt: string | null }) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(() => (startedAt ? (Date.now() - new Date(startedAt).getTime()) / 1000 : 0));
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    const tick = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const status = await apiFetch<StatusResponse>(`/api/tenders/${tenderId}/status`);
        if (!active) return;
        if (status.status !== "processing") router.refresh();
        else if (status.stale) setProblem("The analysis was interrupted before it finished.");
      } catch {
        // Transient network errors: keep polling.
      }
    };
    const interval = setInterval(poll, POLL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [tenderId, router]);

  if (problem) {
    return <ErrorState title="Analysis interrupted" description={problem} action={<RetryAnalysisButton tenderId={tenderId} />} />;
  }

  const current = STAGES.findIndex((stage) => elapsed < stage.until);
  return (
    <section aria-live="polite" className="rounded-xl border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-brand-soft text-primary">
          <HugeiconsIcon icon={Loading03Icon} size={20} className="animate-spin" aria-hidden />
        </span>
        <div>
          <h2 className="text-base font-semibold">Analyzing tender</h2>
          <p className="text-sm text-muted-foreground">
            Reviewing {pageCount} page{pageCount === 1 ? "" : "s"} · usually under a minute · {Math.floor(elapsed)}s elapsed
          </p>
        </div>
      </div>
      <ol className="mt-5 space-y-3">
        {STAGES.map((stage, index) => {
          const done = index < current || index === 0;
          const active = index === current && index !== 0;
          return (
            <li key={stage.label} className="flex items-center gap-3 text-sm">
              <span
                className={cn(
                  "grid size-6 place-items-center rounded-full border",
                  done && "border-success/30 bg-success-soft text-success",
                  active && "border-primary/30 bg-brand-soft text-primary",
                )}
              >
                {done ? (
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} aria-hidden />
                ) : active ? (
                  <HugeiconsIcon icon={Loading03Icon} size={13} className="animate-spin" aria-hidden />
                ) : (
                  <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                )}
              </span>
              <span className={cn(!done && !active && "text-muted-foreground", active && "font-medium")}>{stage.label}</span>
            </li>
          );
        })}
      </ol>
      <p className="mt-5 text-xs text-muted-foreground">You can leave this page. The analysis continues in the background.</p>
    </section>
  );
}
