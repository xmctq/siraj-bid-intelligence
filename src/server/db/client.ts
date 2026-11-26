import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { getEnv } from "@/server/env";
import * as schema from "./schema";

export type Db = NeonHttpDatabase<typeof schema>;

const MIGRATIONS_FOLDER = path.join(process.cwd(), "drizzle");

// Survives Next.js hot reloads in development.
const globalForDb = globalThis as unknown as { dbPromise?: Promise<Db> };

/**
 * Neon (HTTP driver) when DATABASE_URL is set, otherwise an embedded PGlite instance
 * that is migrated on first use, so local development and tests need no setup.
 * Both expose the same Drizzle query-builder API.
 */
async function createDb(): Promise<Db> {
  const env = getEnv();
  if (env.DATABASE_URL) {
    return drizzleNeon(neon(env.DATABASE_URL), { schema });
  }
  const [{ PGlite }, { drizzle: drizzlePglite }, { migrate }] = await Promise.all([
    import("@electric-sql/pglite"),
    import("drizzle-orm/pglite"),
    import("drizzle-orm/pglite/migrator"),
  ]);
  if (env.PGLITE_DIR !== "memory") mkdirSync(env.PGLITE_DIR, { recursive: true });
  const client = env.PGLITE_DIR === "memory" ? new PGlite() : new PGlite(env.PGLITE_DIR);
  const db = drizzlePglite(client, { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  return db as unknown as Db;
}

export function getDb(): Promise<Db> {
  globalForDb.dbPromise ??= createDb();
  return globalForDb.dbPromise;
}

/** Test helper: drop the cached instance so the next getDb() starts fresh. */
export function resetDbForTests(): void {
  globalForDb.dbPromise = undefined;
}
