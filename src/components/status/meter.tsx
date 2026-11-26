import { cn } from "@/lib/utils";
import { progressTone, TONE_CLASSES, type Tone } from "./tones";

/** Thin, accessible progress bar used for compliance progress and distributions. */
export function Meter({
  value,
  tone,
  label,
  className,
}: {
  value: number;
  tone?: Tone;
  label: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", TONE_CLASSES[tone ?? progressTone(clamped)].bar)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
