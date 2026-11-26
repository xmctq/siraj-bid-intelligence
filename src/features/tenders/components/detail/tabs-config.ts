export const TENDER_TABS = ["overview", "requirements", "checklist", "risks", "assistant"] as const;
export type TenderTab = (typeof TENDER_TABS)[number];

export function isTenderTab(value: unknown): value is TenderTab {
  return typeof value === "string" && (TENDER_TABS as readonly string[]).includes(value);
}
