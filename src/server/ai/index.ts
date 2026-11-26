import "server-only";
import { getEnv } from "@/server/env";
import { GeminiClient } from "./gemini";
import { AiError, type LlmClient } from "./llm";
import { MockLlmClient } from "./mock";

let client: LlmClient | undefined;

export function getLlmClient(): LlmClient {
  if (client) return client;
  const env = getEnv();
  if (env.AI_PROVIDER === "mock") {
    if (env.VERCEL) throw new AiError("configuration", "The mock AI provider cannot run on a deployment.");
    client = new MockLlmClient();
    return client;
  }
  if (!env.GEMINI_API_KEY) throw new AiError("configuration", "GEMINI_API_KEY is not set.");
  client = new GeminiClient({
    apiKey: env.GEMINI_API_KEY,
    model: env.GEMINI_MODEL,
    fallbackModel: env.GEMINI_FALLBACK_MODEL,
  });
  return client;
}

export { AiError } from "./llm";
export type { LlmClient } from "./llm";
