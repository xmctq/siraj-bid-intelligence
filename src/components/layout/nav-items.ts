import {
  Alert02Icon,
  Calendar03Icon,
  CloudUploadIcon,
  DashboardSquare01Icon,
  Files01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import type { WorkspaceCounts } from "@/features/tenders/server/queries";

export type NavBadge = { value: number; tone: "neutral" | "danger" | "brand" };

export type NavItem = {
  href: string;
  label: string;
  icon: IconSvgElement;
  badge?: (counts: WorkspaceCounts) => NavBadge | null;
};

export type NavGroup = { label: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Monitor",
    items: [
      { href: "/", label: "Overview", icon: DashboardSquare01Icon },
      {
        href: "/tenders",
        label: "Tenders",
        icon: Files01Icon,
        badge: (c) => (c.tenders > 0 ? { value: c.tenders, tone: "neutral" } : null),
      },
      {
        href: "/risks",
        label: "Risk register",
        icon: Alert02Icon,
        badge: (c) => (c.openCriticalRisks > 0 ? { value: c.openCriticalRisks, tone: "danger" } : null),
      },
      {
        href: "/deadlines",
        label: "Deadlines",
        icon: Calendar03Icon,
        badge: (c) => (c.upcomingDeadlines > 0 ? { value: c.upcomingDeadlines, tone: "brand" } : null),
      },
    ],
  },
  {
    label: "Workspace",
    items: [{ href: "/tenders/new", label: "Upload tender", icon: CloudUploadIcon }],
  },
];

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/" || href === "/tenders/new") return pathname === href;
  // "/tenders" stays active on tender detail pages but not on the upload page.
  return pathname === href || (pathname.startsWith(`${href}/`) && pathname !== "/tenders/new");
}

/** Breadcrumb label for the top bar. */
export function sectionForPath(pathname: string): { group: string; label: string } {
  for (const group of NAV_GROUPS) {
    const match = [...group.items].reverse().find((item) => isNavActive(pathname, item.href));
    if (match) return { group: group.label, label: match.label };
  }
  return { group: "Monitor", label: "Tenders" };
}
