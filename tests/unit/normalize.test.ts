import { describe, expect, it } from "vitest";
import { assistantAnswerSchema, tenderAnalysisSchema } from "@/domain/analysis";
import { MOCK_ANALYSIS } from "@/server/ai/mock";
import { clampPages, normalizeAnalysis, normalizeAnswer, parseIsoDate } from "@/server/ai/normalize";

describe("clampPages", () => {
  it("drops out-of-range and duplicate pages and sorts the rest", () => {
    expect(clampPages([5, 0, 2, 2, 99, -1, 3], 5)).toEqual([2, 3, 5]);
  });
});

describe("parseIsoDate", () => {
  it("parses ISO dates and rejects garbage or implausible years", () => {
    expect(parseIsoDate("2027-01-21T12:00:00+03:00")?.toISOString()).toBe("2027-01-21T09:00:00.000Z");
    expect(parseIsoDate("not a date")).toBeNull();
    expect(parseIsoDate("1890-01-01")).toBeNull();
    expect(parseIsoDate(null)).toBeNull();
  });
});

describe("normalizeAnalysis", () => {
  it("clamps citations, orders risks by severity and resolves the deadline", () => {
    const raw = tenderAnalysisSchema.parse({
      ...MOCK_ANALYSIS,
      submissionDeadline: { date: null, rawText: null, pages: [] },
      keyDates: [
        { label: "Site visit", date: "2030-01-02T00:00:00Z", rawText: "2 Jan", pages: [1] },
        { label: "Proposal submission deadline", date: "2030-01-10T09:00:00Z", rawText: "10 Jan", pages: [7] },
      ],
      risks: [
        { ...MOCK_ANALYSIS.risks[0]!, severity: "low", pages: [1, 50] },
        { ...MOCK_ANALYSIS.risks[1]!, severity: "critical" },
      ],
    });
    const { analysis, submissionDeadline } = normalizeAnalysis(raw, 3);
    expect(analysis.risks.map((r) => r.severity)).toEqual(["critical", "low"]);
    expect(analysis.risks[1]!.pages).toEqual([1]);
    expect(analysis.keyDates[1]!.pages).toEqual([]);
    // Falls back to the key date labelled as the submission deadline.
    expect(submissionDeadline?.toISOString()).toBe("2030-01-10T09:00:00.000Z");
  });
});

describe("normalizeAnswer", () => {
  it("removes citations to pages that were not provided and renumbers markers", () => {
    const raw = assistantAnswerSchema.parse({
      answer: "Bond is 2% [1]. Validity is 120 days [2]. Site visit is mandatory [3].",
      answerable: true,
      citations: [
        { page: 4, quote: "2% of the total bid value" },
        { page: 40, quote: "hallucinated page" },
        { page: 1, quote: "Mandatory site visit" },
      ],
    });
    const result = normalizeAnswer(raw, new Set([1, 4]));
    expect(result.citations).toEqual([
      { page: 4, quote: "2% of the total bid value" },
      { page: 1, quote: "Mandatory site visit" },
    ]);
    expect(result.answer).toBe("Bond is 2% [1]. Validity is 120 days. Site visit is mandatory [2].");
  });
});
