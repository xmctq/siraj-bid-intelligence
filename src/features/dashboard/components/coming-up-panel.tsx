import { ArrowRight01Icon, Calendar03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { Panel } from "@/components/layout/panel";
import { Pill } from "@/components/status/badges";
import { EmptyState } from "@/components/status/states";
import { Button } from "@/components/ui/button";
import type { TimelineEvent } from "@/features/tenders/server/queries";
import { describeDeadline } from "@/lib/format";
import { cn } from "@/lib/utils";

export function DateTile({ date, highlight }: { date: Date; highlight?: boolean }) {
  return (
    <div
      className={cn(
        "flex w-12 shrink-0 flex-col items-center rounded-xl border py-1.5",
        highlight ? "border-primary/20 bg-brand-soft text-primary" : "bg-muted/50",
      )}
    >
      <span className="text-[10px] font-semibold tracking-wide uppercase opacity-80">
        {new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(date)}
      </span>
      <span className="metric text-lg leading-tight font-semibold">{date.getUTCDate()}</span>
    </div>
  );
}

export function ComingUpPanel({ events }: { events: TimelineEvent[] }) {
  return (
    <Panel
      title="Coming up"
      subtitle="Next milestones across all tenders"
      icon={Calendar03Icon}
      tone="brand"
      action={
        <Button asChild variant="ghost" size="icon-sm" aria-label="All deadlines">
          <Link href="/deadlines">
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </Link>
        </Button>
      }
    >
      {events.length === 0 ? (
        <EmptyState icon={Calendar03Icon} title="No upcoming dates" className="m-5 mt-0" />
      ) : (
        <ul className="space-y-1 px-3 pb-3">
          {events.map((event, index) => {
            const info = describeDeadline(event.date);
            return (
              <li key={index}>
                <Link
                  href={`/tenders/${event.tenderId}`}
                  className="flex items-center gap-3 rounded-xl p-2 outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <DateTile date={event.date} highlight={event.isSubmission} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{event.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{event.tenderTitle}</p>
                  </div>
                  {event.isSubmission ? (
                    <Pill tone={info.urgency === "urgent" ? "danger" : "brand"}>{info.label}</Pill>
                  ) : (
                    <span className="text-[11px] whitespace-nowrap text-muted-foreground tabular">{info.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
