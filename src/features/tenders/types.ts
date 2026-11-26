import type { Severity } from "@/domain/analysis";
import type { TenderStatus } from "@/domain/api";

export type ChecklistProgress = {
  total: number;
  completed: number;
  mandatoryTotal: number;
  mandatoryCompleted: number;
};

export type RiskCounts = Record<Severity, number>;

export type TenderSummary = {
  id: string;
  title: string;
  issuer: string | null;
  referenceNumber: string | null;
  status: TenderStatus;
  submissionDeadline: Date | null;
  pageCount: number;
  isSample: boolean;
  createdAt: Date;
  checklist: ChecklistProgress;
  risks: RiskCounts;
};

export const EMPTY_PROGRESS: ChecklistProgress = { total: 0, completed: 0, mandatoryTotal: 0, mandatoryCompleted: 0 };
export const EMPTY_RISKS: RiskCounts = { critical: 0, high: 0, medium: 0, low: 0 };
