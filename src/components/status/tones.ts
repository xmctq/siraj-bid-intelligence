import type { Priority, RiskKind, Severity } from "@/domain/analysis";
import type { TenderStatus } from "@/domain/api";
import type { DeadlineUrgency } from "@/lib/format";

export type Tone = "danger" | "caution" | "warning" | "success" | "brand" | "neutral";

export const TONE_CLASSES: Record<Tone, { soft: string; text: string; dot: string; bar: string }> = {
  danger: { soft: "bg-danger-soft text-danger", text: "text-danger", dot: "bg-danger-mid", bar: "bg-danger-mid" },
  caution: { soft: "bg-caution-soft text-caution", text: "text-caution", dot: "bg-caution-mid", bar: "bg-caution-mid" },
  warning: { soft: "bg-warning-soft text-warning", text: "text-warning", dot: "bg-warning-mid", bar: "bg-warning-mid" },
  success: { soft: "bg-success-soft text-success", text: "text-success", dot: "bg-success-mid", bar: "bg-success-mid" },
  brand: { soft: "bg-brand-soft text-brand", text: "text-brand", dot: "bg-brand-mid", bar: "bg-brand-mid" },
  neutral: { soft: "bg-muted text-muted-foreground", text: "text-muted-foreground", dot: "bg-neutral-mid", bar: "bg-neutral-mid" },
};

export const SEVERITY_META: Record<Severity, { label: string; tone: Tone }> = {
  critical: { label: "Critical", tone: "danger" },
  high: { label: "High", tone: "caution" },
  medium: { label: "Medium", tone: "warning" },
  low: { label: "Low", tone: "neutral" },
};

export const PRIORITY_META: Record<Priority, { label: string; tone: Tone }> = {
  high: { label: "High priority", tone: "caution" },
  medium: { label: "Medium priority", tone: "warning" },
  low: { label: "Low priority", tone: "neutral" },
};

export const RISK_KIND_META: Record<RiskKind, { label: string; description: string }> = {
  critical_requirement: {
    label: "Critical requirements",
    description: "Pass/fail conditions that can disqualify the bid.",
  },
  missing_information: {
    label: "Missing information",
    description: "Gaps and ambiguities to raise as clarification questions.",
  },
  risk: { label: "Commercial & delivery risks", description: "Exposure to weigh before committing to bid." },
};

export const STATUS_META: Record<TenderStatus, { label: string; tone: Tone }> = {
  processing: { label: "Analyzing", tone: "brand" },
  ready: { label: "Analyzed", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
};

export const URGENCY_TONE: Record<DeadlineUrgency, Tone> = {
  overdue: "neutral",
  urgent: "danger",
  soon: "warning",
  normal: "success",
  none: "neutral",
};

export function progressTone(percentComplete: number): Tone {
  if (percentComplete >= 100) return "success";
  if (percentComplete >= 50) return "brand";
  return percentComplete > 0 ? "warning" : "neutral";
}
