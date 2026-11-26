import type { AssistantAnswer, TenderAnalysis } from "@/domain/analysis";
import { AiError, type GenerateJsonRequest, type LlmClient } from "./llm";

/**
 * Deterministic provider for automated tests and offline development only
 * (AI_PROVIDER=mock). It is refused on Vercel deployments, see getLlmClient().
 */
export const MOCK_ANALYSIS: TenderAnalysis = {
  overview: {
    title: "Mock Tender for Automated Tests",
    issuer: "Test Authority",
    referenceNumber: "TEST-001",
    procurementType: "Open tender",
    sector: "Information Technology",
    summary: "Deterministic analysis used by the automated test suite.",
    estimatedValue: null,
    contractDuration: "12 months",
    location: null,
    contact: null,
  },
  submissionDeadline: { date: "2030-01-15T12:00:00Z", rawText: "15 January 2030, 12:00", pages: [1] },
  keyDates: [{ label: "Submission deadline", date: "2030-01-15T12:00:00Z", rawText: "15 January 2030", pages: [1] }],
  eligibilityCriteria: [{ criterion: "Registered company", mandatory: true, pages: [1] }],
  technicalRequirements: [
    { title: "Uptime", description: "99.9% availability", category: "Performance", mandatory: true, pages: [1] },
  ],
  deliverables: [{ title: "Platform", description: "Deployed platform", timeline: null, pages: [1] }],
  evaluationCriteria: [{ criterion: "Technical", weight: "70%", pages: [1] }],
  checklist: [
    {
      requirement: "Submit company registration certificate",
      category: "eligibility",
      mandatory: true,
      priority: "high",
      guidance: "Attach a valid certificate.",
      pages: [1],
    },
    {
      requirement: "Provide technical proposal",
      category: "technical",
      mandatory: true,
      priority: "medium",
      guidance: "Address each requirement.",
      pages: [1],
    },
  ],
  risks: [
    {
      kind: "missing_information",
      severity: "high",
      title: "Budget not stated",
      description: "No budget given.",
      mitigation: "Ask a clarification question.",
      pages: [],
    },
    {
      kind: "critical_requirement",
      severity: "critical",
      title: "Bid bond required",
      description: "Bid bond is mandatory.",
      mitigation: "Arrange bond early.",
      pages: [1],
    },
  ],
  assessment: { complexity: "medium", keyConsiderations: ["Mock consideration"] },
  suggestedQuestions: ["What is the submission deadline?"],
};

export const MOCK_ANSWER: AssistantAnswer = {
  answer: "The submission deadline is 15 January 2030 [1].",
  answerable: true,
  citations: [{ page: 1, quote: "15 January 2030" }],
};

const RESPONSES: Record<string, unknown> = {
  "analyze-tender": MOCK_ANALYSIS,
  "answer-question": MOCK_ANSWER,
};

export class MockLlmClient implements LlmClient {
  async generateJson<T>(request: GenerateJsonRequest<T>): Promise<T> {
    const response = RESPONSES[request.task];
    if (!response) throw new AiError("unknown", `No mock response for ${request.task}`);
    return request.schema.parse(structuredClone(response));
  }
}
