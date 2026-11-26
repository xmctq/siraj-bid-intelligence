import "server-only";
import { ApiError, GoogleGenAI } from "@google/genai";
import { AiError, type GenerateJsonRequest, type LlmClient } from "./llm";
import { toResponseJsonSchema } from "./json-schema";

type GeminiOptions = {
  apiKey: string;
  model: string;
  fallbackModel?: string;
  timeoutMs?: number;
  /** Attempts per model before moving to the fallback model. */
  attemptsPerModel?: number;
  sleep?: (ms: number) => Promise<void>;
};

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function classifyGeminiError(error: unknown): AiError {
  if (error instanceof AiError) return error;
  if (error instanceof ApiError) {
    if (error.status === 429) return new AiError("rate_limited", error.message);
    if (error.status === 401 || error.status === 403) return new AiError("configuration", error.message);
    if (error.status === 408 || error.status === 504) return new AiError("timeout", error.message);
    if (error.status >= 500) return new AiError("unavailable", error.message);
    return new AiError("unknown", error.message);
  }
  if (error instanceof Error && (error.name === "AbortError" || /timed? ?out/i.test(error.message))) {
    return new AiError("timeout", error.message);
  }
  return new AiError("unknown", error instanceof Error ? error.message : String(error));
}

export function parseJsonResponse<T>(text: string | undefined, schema: GenerateJsonRequest<T>["schema"]): T {
  if (!text) throw new AiError("invalid_output", "Empty response");
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new AiError("invalid_output", "Response was not valid JSON");
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new AiError("invalid_output", `Schema validation failed: ${parsed.error.issues[0]?.message ?? ""}`);
  }
  return parsed.data;
}

export class GeminiClient implements LlmClient {
  private readonly ai: GoogleGenAI;
  private readonly models: string[];
  private readonly timeoutMs: number;
  private readonly attemptsPerModel: number;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(options: GeminiOptions) {
    this.ai = new GoogleGenAI({ apiKey: options.apiKey });
    this.models = [options.model, options.fallbackModel].filter((m): m is string => Boolean(m));
    this.timeoutMs = options.timeoutMs ?? 120_000;
    this.attemptsPerModel = options.attemptsPerModel ?? 2;
    this.sleep = options.sleep ?? defaultSleep;
  }

  async generateJson<T>(request: GenerateJsonRequest<T>): Promise<T> {
    const responseJsonSchema = toResponseJsonSchema(request.schema);
    let lastError = new AiError("unknown");

    for (const model of this.models) {
      for (let attempt = 1; attempt <= this.attemptsPerModel; attempt++) {
        try {
          const response = await this.ai.models.generateContent({
            model,
            contents: request.prompt,
            config: {
              systemInstruction: request.system,
              responseMimeType: "application/json",
              responseJsonSchema,
              temperature: request.temperature ?? 0.2,
              maxOutputTokens: request.maxOutputTokens ?? 32_768,
              httpOptions: { timeout: this.timeoutMs },
            },
          });
          return parseJsonResponse(response.text, request.schema);
        } catch (error) {
          lastError = classifyGeminiError(error);
          console.warn(`[ai] ${request.task} failed on ${model} (attempt ${attempt}): ${lastError.code}`);
          if (!lastError.retryable) throw lastError;
          if (attempt < this.attemptsPerModel) await this.sleep(1000 * 2 ** (attempt - 1));
        }
      }
    }
    throw lastError;
  }
}
