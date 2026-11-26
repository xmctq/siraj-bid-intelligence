"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { WorkspaceCounts } from "@/features/tenders/server/queries";
import { cn } from "@/lib/utils";
import { isNavActive, NAV_GROUPS, type NavBadge } from "./nav-items";

const BADGE_CLASSES: Record<NavBadge["tone"], string> = {
  neutral: "bg-muted text-muted-foreground",
  danger: "bg-danger-soft text-danger",
  brand: "bg-brand-soft text-brand",
};

export function SidebarNav({ counts, onNavigate }: { counts: WorkspaceCounts; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="space-y-6">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground/80 uppercase">{group.label}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isNavActive(pathname, item.href);
              const badge = item.badge?.(counts);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-sidebar-foreground transition-colors outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                      active && "bg-brand-soft text-primary hover:bg-brand-soft",
                    )}
                  >
                    {active && <span aria-hidden className="absolute top-2 bottom-2 -left-3 w-[3px] rounded-r-full bg-primary" />}
                    <HugeiconsIcon
                      icon={item.icon}
                      size={18}
                      strokeWidth={1.7}
                      className={active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}
                    />
                    <span className="flex-1">{item.label}</span>
                    {badge && (
                      <span className={cn("min-w-5 rounded-full px-1.5 py-px text-center text-[10px] font-semibold tabular", BADGE_CLASSES[badge.tone])}>
                        {badge.value}
                        <span className="sr-only"> items</span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
