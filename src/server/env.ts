import "server-only";
import { z } from "zod";

/** Treats empty strings (e.g. `KEY=` in .env files) as unset. */
const optional = <T extends z.ZodType>(schema: T) => z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  /** Postgres connection string (Neon). When absent, an embedded PGlite database is used. */
  DATABASE_URL: optional(z.string().url()),
  /** PGlite data directory for local development, or "memory" for an ephemeral database. */
  PGLITE_DIR: z.string().default(".data/pglite"),
  AI_PROVIDER: z.enum(["gemini", "mock"]).default("gemini"),
  GEMINI_API_KEY: optional(z.string().min(1)),
  GEMINI_MODEL: z.string().min(1).default("gemini-3.5-flash"),
  GEMINI_FALLBACK_MODEL: z.string().min(1).default("gemini-3.5-flash-lite"),
  /** Set by Vercel on every deployment. */
  VERCEL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

export function getEnv(): Env {
  if (!cached) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      throw new Error(`Invalid environment configuration: ${z.prettifyError(parsed.error)}`);
    }
    cached = parsed.data;
  }
  return cached;
}
