"use client";

import { CheckListIcon } from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Pill } from "@/components/status/badges";
import { Meter } from "@/components/status/meter";
import { EmptyState } from "@/components/status/states";
import { PRIORITY_META } from "@/components/status/tones";
import { Checkbox } from "@/components/ui/checkbox";
import { CHECKLIST_CATEGORIES, type ChecklistCategory, type Priority } from "@/domain/analysis";
import { PageRefs } from "@/features/evidence/page-refs";
import { apiFetch, jsonInit } from "@/lib/api-client";
import { percent } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ChecklistItemView = {
  id: string;
  category: string;
  requirement: string;
  guidance: string;
  mandatory: boolean;
  priority: string;
  pages: number[];
  completed: boolean;
};

type StatusFilter = "all" | "open" | "done";

const CATEGORY_LABELS: Record<ChecklistCategory, string> = {
  eligibility: "Eligibility",
  administrative: "Administrative",
  technical: "Technical",
  financial: "Financial",
  legal: "Legal",
  submission: "Submission",
};

function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category as ChecklistCategory] ?? category;
}

export function ChecklistPanel({ tenderId, initialItems }: { tenderId: string; initialItems: ChecklistItemView[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [category, setCategory] = useState<string | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [saves, setSaves] = useState(0);

  // Refresh server-rendered progress (header stats) once the user pauses toggling.
  useEffect(() => {
    if (saves === 0) return;
    const timer = setTimeout(() => router.refresh(), 800);
    return () => clearTimeout(timer);
  }, [saves, router]);

  const completed = items.filter((i) => i.completed).length;
  const mandatory = items.filter((i) => i.mandatory);
  const mandatoryDone = mandatory.filter((i) => i.completed).length;
  const value = percent(completed, items.length);

  const categories = useMemo(() => {
    const present = new Set(items.map((i) => i.category));
    const ordered: string[] = CHECKLIST_CATEGORIES.filter((c) => present.has(c));
    return [...ordered, ...[...present].filter((c) => !ordered.includes(c))];
  }, [items]);

  const visible = items.filter(
    (item) =>
      (statusFilter === "all" || (statusFilter === "done" ? item.completed : !item.completed)) &&
      (!category || item.category === category),
  );
  const groups = categories
    .map((c) => ({ category: c, items: visible.filter((i) => i.category === c) }))
    .filter((g) => g.items.length > 0);

  async function toggle(item: ChecklistItemView, next: boolean) {
    setPending((s) => new Set(s).add(item.id));
    setItems((all) => all.map((i) => (i.id === item.id ? { ...i, completed: next } : i)));
    try {
      await apiFetch(`/api/tenders/${tenderId}/checklist/${item.id}`, jsonInit("PATCH", { completed: next }));
      setSaves((n) => n + 1);
    } catch (error) {
      setItems((all) => all.map((i) => (i.id === item.id ? { ...i, completed: !next } : i)));
      toast.error(`Couldn't update "${item.requirement}". ${(error as Error).message}`);
    } finally {
      setPending((s) => {
        const copy = new Set(s);
        copy.delete(item.id);
        return copy;
      });
    }
  }

  if (items.length === 0) {
    return <EmptyState icon={CheckListIcon} title="No checklist items" description="The analysis did not produce checklist items for this document." />;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border bg-card p-4" aria-label="Compliance progress">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-semibold tabular">{value}%</p>
            <p className="text-xs text-muted-foreground tabular">
              {completed} of {items.length} items complete · {mandatoryDone} of {mandatory.length} mandatory
            </p>
          </div>
          {mandatoryDone === mandatory.length && mandatory.length > 0 ? (
            <Pill tone="success">All mandatory items covered</Pill>
          ) : (
            <Pill tone="caution">{mandatory.length - mandatoryDone} mandatory items open</Pill>
          )}
        </div>
        <Meter value={value} label="Checklist completion" className="mt-3 h-2" />
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label="Filter by status" className="flex w-fit gap-1 rounded-lg border bg-card p-1">
          {(["all", "open", "done"] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={statusFilter === f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium text-muted-foreground capitalize outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                statusFilter === f && "bg-muted text-foreground",
              )}
            >
              {f === "done" ? "Completed" : f}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-1.5">
          {[null, ...categories].map((c) => (
            <button
              key={c ?? "all"}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className={cn(
                "h-7 rounded-full border px-2.5 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                category === c && "border-primary/40 bg-brand-soft text-primary",
              )}
            >
              {c ? categoryLabel(c) : "All categories"}
            </button>
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState icon={CheckListIcon} title="Nothing here" description="No items match these filters." />
      ) : (
        groups.map((group) => (
          <section key={group.category} className="rounded-xl border bg-card" aria-label={categoryLabel(group.category)}>
            <h3 className="flex items-center justify-between border-b px-4 py-2.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {categoryLabel(group.category)}
              <span className="tabular normal-case">
                {group.items.filter((i) => i.completed).length}/{group.items.length}
              </span>
            </h3>
            <ul className="divide-y">
              {group.items.map((item) => {
                const priority = PRIORITY_META[item.priority as Priority];
                const inputId = `check-${item.id}`;
                return (
                  <li key={item.id} className={cn("flex gap-3 px-4 py-3 transition-colors", item.completed && "bg-muted/30")}>
                    <Checkbox
                      id={inputId}
                      checked={item.completed}
                      disabled={pending.has(item.id)}
                      onCheckedChange={(checked) => toggle(item, checked === true)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <label
                        htmlFor={inputId}
                        className={cn("cursor-pointer text-sm leading-snug font-medium", item.completed && "text-muted-foreground line-through")}
                      >
                        {item.requirement}
                      </label>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.guidance}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {item.mandatory && <Pill tone="danger">Mandatory</Pill>}
                        {priority && <Pill tone={priority.tone}>{priority.label}</Pill>}
                        <PageRefs pages={item.pages} quote={item.requirement} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
