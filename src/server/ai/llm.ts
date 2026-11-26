import type { z } from "zod";

export type GenerateJsonRequest<T> = {
  /** Short name used in logs, e.g. "analyze-tender". */
  task: string;
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  temperature?: number;
  maxOutputTokens?: number;
};

/** Provider-agnostic contract: every call returns schema-validated data or throws AiError. */
export interface LlmClient {
  generateJson<T>(request: GenerateJsonRequest<T>): Promise<T>;
}

export type AiErrorCode = "rate_limited" | "unavailable" | "invalid_output" | "timeout" | "configuration" | "unknown";

const USER_MESSAGES: Record<AiErrorCode, string> = {
  rate_limited: "The AI service is rate-limited right now. Please try again in a minute.",
  unavailable: "The AI service is temporarily unavailable. Please try again shortly.",
  invalid_output: "The AI returned an incomplete result. Please try again.",
  timeout: "The AI took too long to respond. Please try again.",
  configuration: "The AI service is not configured.",
  unknown: "The AI request failed. Please try again.",
};

export class AiError extends Error {
  constructor(
    public readonly code: AiErrorCode,
    detail?: string,
  ) {
    super(detail ?? code);
    this.name = "AiError";
  }

  get userMessage(): string {
    return USER_MESSAGES[this.code];
  }

  get retryable(): boolean {
    return this.code !== "configuration";
  }
}
