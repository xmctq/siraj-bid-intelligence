import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: IconSvgElement;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center", className)}>
      <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
        <HugeiconsIcon icon={icon} size={22} strokeWidth={1.6} aria-hidden />
      </span>
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  action,
  className,
}: {
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div role="alert" className={cn("flex items-start gap-3 rounded-xl border border-danger/25 bg-danger-soft/60 p-4", className)}>
      <HugeiconsIcon icon={AlertCircleIcon} size={20} strokeWidth={1.8} className="mt-0.5 shrink-0 text-danger" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}
