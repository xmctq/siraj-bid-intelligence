const DAY_MS = 24 * 60 * 60 * 1000;

export type DeadlineUrgency = "overdue" | "urgent" | "soon" | "normal" | "none";

export type DeadlineInfo = {
  urgency: DeadlineUrgency;
  daysLeft: number | null;
  label: string;
};

/** Human countdown + urgency bucket used consistently across dashboard, lists and detail pages. */
export function describeDeadline(deadline: Date | string | null, now: Date = new Date()): DeadlineInfo {
  if (!deadline) return { urgency: "none", daysLeft: null, label: "No deadline found" };
  const date = typeof deadline === "string" ? new Date(deadline) : deadline;
  const diffMs = date.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffMs / DAY_MS);

  if (diffMs < 0) {
    const ago = Math.max(1, Math.floor(-diffMs / DAY_MS));
    return { urgency: "overdue", daysLeft, label: diffMs > -DAY_MS ? "Closed today" : `Closed ${ago}d ago` };
  }
  if (diffMs < DAY_MS) {
    const hours = Math.max(1, Math.round(diffMs / (60 * 60 * 1000)));
    return { urgency: "urgent", daysLeft: 0, label: `${hours}h left` };
  }
  const urgency: DeadlineUrgency = daysLeft <= 7 ? "urgent" : daysLeft <= 21 ? "soon" : "normal";
  return { urgency, daysLeft, label: `${daysLeft} day${daysLeft === 1 ? "" : "s"} left` };
}

export function formatDate(value: Date | string | null, options?: { withTime?: boolean }): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  // UTC everywhere: identical on server and client (no hydration drift), and labelled when a time is shown.
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
    ...(options?.withTime ? { hour: "2-digit", minute: "2-digit", timeZoneName: "short" } : {}),
  }).format(date);
}

export function formatRelative(value: Date | string, now: Date = new Date()): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const diffSeconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds) return formatter.format(Math.round(diffSeconds / seconds), unit);
  }
  return "just now";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function percent(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
