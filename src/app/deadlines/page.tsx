import { Calendar03Icon, Flag02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { PageHeader } from "@/components/layout/page-header";
import { Pill } from "@/components/status/badges";
import { EmptyState } from "@/components/status/states";
import { URGENCY_TONE } from "@/components/status/tones";
import { DateTile } from "@/features/dashboard/components/coming-up-panel";
import { listKeyDates, type TimelineEvent } from "@/features/tenders/server/queries";
import { describeDeadline, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Deadlines" };

function groupByMonth(events: TimelineEvent[]): [string, TimelineEvent[]][] {
  const formatter = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  const groups = new Map<string, TimelineEvent[]>();
  for (const event of events) {
    const key = formatter.format(event.date);
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }
  return [...groups.entries()];
}

export default async function DeadlinesPage() {
  await connection();
  const now = new Date();
  const events = await listKeyDates();
  const upcoming = events.filter((e) => e.date.getTime() >= now.getTime());
  const past = events.filter((e) => e.date.getTime() < now.getTime());

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Monitor / Deadlines"
        title="Deadlines & milestones"
        description="Every dated milestone the AI found across your tenders: site visits, clarification cut-offs, submissions and openings."
      />

      {events.length === 0 ? (
        <EmptyState icon={Calendar03Icon} title="No dates yet" description="Dates appear once tenders are analyzed." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-6">
            {groupByMonth(upcoming).map(([month, items]) => (
              <section key={month} aria-labelledby={`m-${month}`} className="rounded-2xl border bg-card">
                <h2 id={`m-${month}`} className="border-b px-5 py-3 text-sm font-semibold">
                  {month}
                  <span className="ml-2 font-normal text-muted-foreground">{items.length} milestones</span>
                </h2>
                <ol className="divide-y">
                  {items.map((event, index) => {
                    const info = describeDeadline(event.date, now);
                    return (
                      <li key={index}>
                        <Link
                          href={`/tenders/${event.tenderId}`}
                          className={cn(
                            "flex items-center gap-4 px-5 py-3.5 outline-none hover:bg-muted/40 focus-visible:bg-muted/60",
                            event.isSubmission && "bg-brand-soft/30",
                          )}
                        >
                          <DateTile date={event.date} highlight={event.isSubmission} />
                          <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-2 text-sm font-semibold">
                              {event.isSubmission && <HugeiconsIcon icon={Flag02Icon} size={14} className="shrink-0 text-primary" aria-label="Submission deadline" />}
                              <span className="truncate">{event.label}</span>
                            </p>
                            <p className="truncate text-xs text-muted-foreground">{event.tenderTitle}</p>
                            <p className="mt-0.5 truncate text-[11px] text-muted-foreground/80">As written: “{event.rawText}”</p>
                          </div>
                          <Pill tone={URGENCY_TONE[info.urgency]}>{info.label}</Pill>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}
            {upcoming.length === 0 && <EmptyState icon={Calendar03Icon} title="Nothing upcoming" description="All known milestones have passed." />}
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl border bg-card p-5">
              <h2 className="text-sm font-semibold">At a glance</h2>
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Upcoming milestones</dt>
                  <dd className="metric font-medium">{upcoming.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Submission deadlines</dt>
                  <dd className="metric font-medium">{upcoming.filter((e) => e.isSubmission).length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Within 7 days</dt>
                  <dd className="metric font-medium text-danger">
                    {upcoming.filter((e) => e.date.getTime() - now.getTime() <= 7 * 86_400_000).length}
                  </dd>
                </div>
              </dl>
            </section>
            {past.length > 0 && (
              <section className="rounded-2xl border bg-card p-5">
                <h2 className="text-sm font-semibold">Recently passed</h2>
                <ul className="mt-3 space-y-2.5">
                  {past
                    .slice(-5)
                    .reverse()
                    .map((event, index) => (
                      <li key={index} className="text-sm">
                        <p className="truncate text-muted-foreground line-through decoration-muted-foreground/40">{event.label}</p>
                        <p className="metric text-[11px] text-muted-foreground">{formatDate(event.date)}</p>
                      </li>
                    ))}
                </ul>
              </section>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
