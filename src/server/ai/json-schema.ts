import { z } from "zod";

type JsonObject = { [key: string]: unknown };

const UNSUPPORTED_KEYS = new Set(["$schema", "additionalProperties"]);
const MAX_SAFE = Number.MAX_SAFE_INTEGER;

function clean(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(clean);
  if (!node || typeof node !== "object") return node;
  const result: JsonObject = {};
  for (const [key, value] of Object.entries(node as JsonObject)) {
    if (UNSUPPORTED_KEYS.has(key)) continue;
    // Zod emits ±MAX_SAFE_INTEGER bounds for ints; they add noise to the model's schema.
    if ((key === "maximum" && value === MAX_SAFE) || (key === "minimum" && value === -MAX_SAFE)) continue;
    result[key] = clean(value);
  }
  return result;
}

/** Converts a Zod schema to the JSON Schema subset accepted by Gemini structured output. */
export function toResponseJsonSchema(schema: z.ZodType): unknown {
  return clean(z.toJSONSchema(schema, { target: "draft-2020-12", io: "output" }));
}
