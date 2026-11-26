import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import type { ReactNode } from "react";
import { TONE_CLASSES, type Tone } from "@/components/status/tones";
import { cn } from "@/lib/utils";

/** The one card language used across the app: icon tile + title + subtitle + optional action. */
export function Panel({
  title,
  subtitle,
  icon,
  tone = "brand",
  action,
  children,
  className,
  id,
}: {
  title: string;
  subtitle?: ReactNode;
  icon: IconSvgElement;
  tone?: Tone;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const headingId = id ?? `panel-${title.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <section aria-labelledby={headingId} className={cn("flex flex-col rounded-2xl border bg-card shadow-[0_1px_2px_oklch(0.27_0.035_275/0.04)]", className)}>
      <header className="flex items-center gap-3 px-5 pt-4 pb-3">
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", TONE_CLASSES[tone].soft)}>
          <HugeiconsIcon icon={icon} size={18} strokeWidth={1.7} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={headingId} className="text-sm font-semibold">
            {title}
          </h2>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
