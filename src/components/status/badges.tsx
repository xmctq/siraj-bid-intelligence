import { Clock01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ReactNode } from "react";
import type { Severity } from "@/domain/analysis";
import type { TenderStatus } from "@/domain/api";
import { describeDeadline } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SEVERITY_META, STATUS_META, TONE_CLASSES, URGENCY_TONE, type Tone } from "./tones";

export function Pill({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1 rounded-full px-2 text-[11px] font-medium whitespace-nowrap",
        TONE_CLASSES[tone].soft,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Dot({ tone, className }: { tone: Tone; className?: string }) {
  return <span aria-hidden className={cn("inline-block size-1.5 shrink-0 rounded-full", TONE_CLASSES[tone].dot, className)} />;
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const meta = SEVERITY_META[severity];
  return (
    <Pill tone={meta.tone}>
      <Dot tone={meta.tone} />
      {meta.label}
    </Pill>
  );
}

export function StatusBadge({ status }: { status: TenderStatus }) {
  const meta = STATUS_META[status];
  return (
    <Pill tone={meta.tone}>
      {status === "processing" ? (
        <HugeiconsIcon icon={Loading03Icon} size={12} className="animate-spin" aria-hidden />
      ) : (
        <Dot tone={meta.tone} />
      )}
      {meta.label}
    </Pill>
  );
}

export function DeadlineBadge({ deadline, className }: { deadline: Date | null; className?: string }) {
  const info = describeDeadline(deadline);
  if (info.urgency === "none") {
    return <span className={cn("text-xs text-muted-foreground", className)}>Not stated</span>;
  }
  return (
    <Pill tone={URGENCY_TONE[info.urgency]} className={className}>
      <HugeiconsIcon icon={Clock01Icon} size={12} strokeWidth={2} aria-hidden />
      {info.label}
    </Pill>
  );
}
