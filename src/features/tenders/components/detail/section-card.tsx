import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  icon,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  icon?: IconSvgElement;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("rounded-2xl border bg-card shadow-[0_1px_2px_oklch(0.27_0.035_275/0.04)]", className)}>
      <header className="flex items-center gap-3 border-b px-5 py-3.5">
        {icon && (
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-primary">
            <HugeiconsIcon icon={icon} size={16} strokeWidth={1.7} aria-hidden />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </header>
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function MandatoryPill({ mandatory }: { mandatory: boolean }) {
  return mandatory ? (
    <span className="inline-flex h-5 items-center rounded-full bg-danger-soft px-2 text-[11px] font-medium text-danger">Mandatory</span>
  ) : (
    <span className="inline-flex h-5 items-center rounded-full bg-muted px-2 text-[11px] font-medium text-muted-foreground">Optional</span>
  );
}

export function EmptyLine({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}
