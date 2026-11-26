import { describe, expect, it } from "vitest";
import { parseAnswer } from "@/features/assistant/answer-format";
import { computePortfolioStats, summarizePortfolio } from "@/features/dashboard/stats";
import { splitByQuote } from "@/features/evidence/highlight";
import { EMPTY_PROGRESS, EMPTY_RISKS, type TenderSummary } from "@/features/tenders/types";
import { describeDeadline } from "@/lib/format";

const now = new Date("2026-11-26T12:00:00Z");

describe("describeDeadline", () => {
  it.each([
    [null, "none", "No deadline found"],
    ["2026-11-25T12:00:00Z", "overdue", "Closed 1d ago"],
    ["2026-11-26T18:00:00Z", "urgent", "6h left"],
    ["2026-11-30T12:00:00Z", "urgent", "4 days left"],
    ["2026-12-10T12:00:00Z", "soon", "14 days left"],
    ["2027-01-21T12:00:00Z", "normal", "56 days left"],
  ])("%s → %s", (deadline, urgency, label) => {
    const info = describeDeadline(deadline, now);
    expect(info.urgency).toBe(urgency);
    expect(info.label).toBe(label);
  });
});

describe("parseAnswer", () => {
  it("parses paragraphs, bullets, bold and citation markers without HTML", () => {
    const blocks = parseAnswer("The bond is **2%** [1].\n\n- Valid 120 days [2]\n- Original copy\n<script>x</script>");
    expect(blocks[0]).toEqual({
      type: "paragraph",
      content: [
        { type: "text", value: "The bond is " },
        { type: "bold", value: "2%" },
        { type: "text", value: " " },
        { type: "cite", index: 1 },
        { type: "text", value: "." },
      ],
    });
    expect(blocks[1]?.type).toBe("list");
    expect(blocks[2]).toEqual({ type: "paragraph", content: [{ type: "text", value: "<script>x</script>" }] });
  });
});

describe("splitByQuote", () => {
  it("highlights a quote despite whitespace and punctuation differences", () => {
    const segments = splitByQuote("A bid bond of 2%  of the total\nbid value, issued by a bank.", "bid bond of 2% of the total bid value");
    expect(segments.find((s) => s.highlighted)?.text).toBe("bid bond of 2%  of the total\nbid value");
  });

  it("returns the text unhighlighted when the quote is absent", () => {
    expect(splitByQuote("Some text", "missing words entirely here")).toEqual([{ text: "Some text", highlighted: false }]);
  });
});

describe("computePortfolioStats", () => {
  const tender = (id: string, deadline: string | null, completed: number, total: number, critical = 0): TenderSummary => ({
    id,
    title: id,
    issuer: null,
    referenceNumber: null,
    status: "ready",
    submissionDeadline: deadline ? new Date(deadline) : null,
    pageCount: 1,
    isSample: false,
    createdAt: now,
    checklist: { ...EMPTY_PROGRESS, total, completed },
    risks: { ...EMPTY_RISKS, critical },
  });

  it("aggregates open tenders only and finds the next deadline", () => {
    const stats = computePortfolioStats(
      [
        tender("closed", "2026-11-01T00:00:00Z", 0, 10, 5),
        tender("soon", "2026-12-01T00:00:00Z", 2, 4, 1),
        tender("later", "2027-02-01T00:00:00Z", 1, 6),
      ],
      now,
    );
    expect(stats.open).toBe(2);
    expect(stats.nextDeadline?.id).toBe("soon");
    expect(stats.compliancePercent).toBe(30);
    expect(stats.risks.critical).toBe(1);
    expect(stats.deadlinesWithin14Days).toBe(1);
    expect(summarizePortfolio(stats)).toBe("2 open tenders · 1 closing within 14 days · 1 critical risk needs attention.");
  });
});
