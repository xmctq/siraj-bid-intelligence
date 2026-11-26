import { z } from "zod";

/**
 * The structured contract between the LLM and the application.
 * The same schema is (1) sent to Gemini as the response JSON schema and
 * (2) used to validate the response before anything is stored.
 */

export const SEVERITIES = ["critical", "high", "medium", "low"] as const;
export const PRIORITIES = ["high", "medium", "low"] as const;
export const RISK_KINDS = ["risk", "missing_information", "critical_requirement"] as const;
export const CHECKLIST_CATEGORIES = [
  "eligibility",
  "administrative",
  "technical",
  "financial",
  "legal",
  "submission",
] as const;
export const COMPLEXITY_LEVELS = ["low", "medium", "high"] as const;

export type Severity = (typeof SEVERITIES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type RiskKind = (typeof RISK_KINDS)[number];
export type ChecklistCategory = (typeof CHECKLIST_CATEGORIES)[number];

const pages = z
  .array(z.number().int().min(1))
  .describe("1-based page numbers (from the <page number> tags) where this information appears");

const nullableText = (description: string) => z.string().nullable().describe(description);

const isoDate = z
  .string()
  .nullable()
  .describe(
    "ISO 8601 date-time (YYYY-MM-DDTHH:mm:ss, add the UTC offset if the document states a time zone). null if no exact date is given.",
  );

export const tenderAnalysisSchema = z.object({
  overview: z.object({
    title: z.string().describe("Official tender / RFP title"),
    issuer: nullableText("Issuing organization"),
    referenceNumber: nullableText("Tender or RFP reference number"),
    procurementType: nullableText("e.g. Open tender, RFP, RFQ, Framework agreement"),
    sector: nullableText("Industry or domain, e.g. Transport, Healthcare IT"),
    summary: z.string().describe("3-4 sentence executive summary of scope and objectives"),
    estimatedValue: nullableText("Budget or estimated contract value with currency, if stated"),
    contractDuration: nullableText("Contract period, if stated"),
    location: nullableText("Place of performance, if stated"),
    contact: nullableText("Contact person / email for clarifications, if stated"),
  }),
  submissionDeadline: z.object({
    date: isoDate,
    rawText: nullableText("The deadline exactly as written in the document"),
    pages,
  }),
  keyDates: z
    .array(
      z.object({
        label: z.string().describe("e.g. Clarification questions deadline, Site visit, Bid opening"),
        date: isoDate,
        rawText: z.string().describe("The date as written in the document"),
        pages,
      }),
    )
    .describe("All dated milestones in chronological order, including the submission deadline"),
  eligibilityCriteria: z.array(
    z.object({
      criterion: z.string(),
      mandatory: z.boolean(),
      pages,
    }),
  ),
  technicalRequirements: z.array(
    z.object({
      title: z.string().describe("Short name, max ~8 words"),
      description: z.string(),
      category: z.string().describe("e.g. Functional, Integration, Security, Performance, Infrastructure"),
      mandatory: z.boolean(),
      pages,
    }),
  ),
  deliverables: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      timeline: nullableText("When it is due, if stated"),
      pages,
    }),
  ),
  evaluationCriteria: z.array(
    z.object({
      criterion: z.string(),
      weight: nullableText("Weight or points, e.g. 40%"),
      pages,
    }),
  ),
  checklist: z
    .array(
      z.object({
        requirement: z.string().describe("Actionable item a bidder must satisfy or submit, imperative form"),
        category: z.enum(CHECKLIST_CATEGORIES),
        mandatory: z.boolean(),
        priority: z.enum(PRIORITIES),
        guidance: z.string().describe("One sentence on how to satisfy it or what evidence to include"),
        pages,
      }),
    )
    .describe("Compliance checklist covering every requirement a bidder must meet to submit a compliant bid"),
  risks: z
    .array(
      z.object({
        kind: z.enum(RISK_KINDS),
        severity: z.enum(SEVERITIES),
        title: z.string().describe("Short headline, max ~10 words"),
        description: z.string(),
        mitigation: z.string().describe("Concrete recommended action for the bid team"),
        pages: pages.describe("Pages the risk relates to; empty only for information missing from the whole document"),
      }),
    )
    .describe(
      "risk = commercial/legal/delivery risk; missing_information = something a bidder needs that the document omits or leaves ambiguous; critical_requirement = a pass/fail or disqualifying requirement needing attention",
    ),
  assessment: z.object({
    complexity: z.enum(COMPLEXITY_LEVELS),
    keyConsiderations: z
      .array(z.string())
      .describe("3-5 short bullets a bid manager should weigh before deciding to bid"),
  }),
  suggestedQuestions: z
    .array(z.string())
    .describe("4 specific questions a bid team would likely ask about this document"),
});

export type TenderAnalysis = z.infer<typeof tenderAnalysisSchema>;

export const citationSchema = z.object({
  page: z.number().int().min(1),
  quote: z.string().describe("Short verbatim excerpt (max ~30 words) from that page supporting the answer"),
});

export const assistantAnswerSchema = z.object({
  answer: z
    .string()
    .describe(
      "Answer in plain text. Use short paragraphs or '- ' bullet lines; **bold** allowed. Reference citations inline as [1], [2] matching the citations array order.",
    ),
  answerable: z
    .boolean()
    .describe("false if the document does not contain the information needed to answer"),
  citations: z.array(citationSchema),
});

export type Citation = z.infer<typeof citationSchema>;
export type AssistantAnswer = z.infer<typeof assistantAnswerSchema>;
