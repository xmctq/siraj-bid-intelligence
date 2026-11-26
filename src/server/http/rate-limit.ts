import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { rateLimits } from "@/server/db/schema";
import { AppError } from "@/server/errors";

export type RateLimitRule = { limit: number; windowSeconds: number };

/** Per-IP limits plus a global daily cap on AI calls to protect the free Gemini quota. */
export const RATE_LIMITS = {
  upload: { limit: 10, windowSeconds: 60 * 60 },
  analyze: { limit: 10, windowSeconds: 60 * 60 },
  chat: { limit: 30, windowSeconds: 10 * 60 },
  checklist: { limit: 120, windowSeconds: 60 },
  aiGlobalDaily: { limit: 400, windowSeconds: 24 * 60 * 60 },
} satisfies Record<string, RateLimitRule>;

/**
 * Fixed-window counter stored in Postgres, so limits hold across serverless instances.
 * One atomic upsert per check.
 */
export async function hitRateLimit(key: string, rule: RateLimitRule): Promise<{ allowed: boolean; count: number }> {
  const db = await getDb();
  const windowExpired = sql`${rateLimits.windowStart} < now() - make_interval(secs => ${rule.windowSeconds})`;
  const [row] = await db
    .insert(rateLimits)
    .values({ key, count: 1, windowStart: sql`now()` })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${windowExpired} then 1 else ${rateLimits.count} + 1 end`,
        windowStart: sql`case when ${windowExpired} then now() else ${rateLimits.windowStart} end`,
      },
    })
    .returning({ count: rateLimits.count });
  const count = row?.count ?? 1;
  return { allowed: count <= rule.limit, count };
}

export async function enforceRateLimit(key: string, rule: RateLimitRule): Promise<void> {
  const { allowed } = await hitRateLimit(key, rule);
  if (!allowed) {
    throw new AppError("rate_limited", "Too many requests. Please wait a moment and try again.", 429);
  }
}

/** Applies the per-IP rule for an AI action and the global daily AI budget. */
export async function enforceAiRateLimit(action: "upload" | "analyze" | "chat", ip: string): Promise<void> {
  await enforceRateLimit(`${action}:${ip}`, RATE_LIMITS[action]);
  const { allowed } = await hitRateLimit("ai:global", RATE_LIMITS.aiGlobalDaily);
  if (!allowed) {
    throw new AppError(
      "ai_quota",
      "The demo has reached its daily AI budget. Existing analyses remain available; please try again tomorrow.",
      429,
    );
  }
}
