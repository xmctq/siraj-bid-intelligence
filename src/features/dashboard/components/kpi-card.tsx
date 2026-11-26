import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { TONE_CLASSES, type Tone } from "@/components/status/tones";
import { cn } from "@/lib/utils";

/** KPI tile: the whole card links to the view that explains the number. */
export function KpiCard({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
  href,
  children,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: IconSvgElement;
  tone?: Tone;
  href: string;
  children?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border bg-card p-5 shadow-[0_1px_2px_oklch(0.27_0.035_275/0.04)] transition-all outline-none hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_oklch(0.4_0.08_275/0.25)] focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
        <span className={cn("grid size-10 place-items-center rounded-xl", TONE_CLASSES[tone].soft)}>
          <HugeiconsIcon icon={icon} size={20} strokeWidth={1.7} aria-hidden />
        </span>
      </div>
      <p className={cn("metric mt-1 text-[32px] leading-none font-semibold", tone !== "neutral" && TONE_CLASSES[tone].text)}>{value}</p>
      {children && <div className="mt-3">{children}</div>}
      <div className="mt-3 flex items-end justify-between gap-2">
        {hint && <p className="line-clamp-1 text-xs text-muted-foreground">{hint}</p>}
        <HugeiconsIcon
          icon={ArrowUpRight01Icon}
          size={16}
          className="ml-auto shrink-0 text-muted-foreground/60 transition-colors group-hover:text-primary"
          aria-hidden
        />
      </div>
    </Link>
  );
}
