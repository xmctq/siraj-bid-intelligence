/** Applies Drizzle migrations to the configured database. Usage: npm run db:migrate */
import "./load-env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { getDb } from "@/server/db/client";

async function main() {
  const url = process.env.DATABASE_URL;
  if (url) {
    await migrate(drizzle(neon(url)), { migrationsFolder: "drizzle" });
    console.log("Migrations applied to Postgres.");
  } else {
    await getDb(); // PGlite migrates itself on first use.
    console.log("Migrations applied to local PGlite database.");
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
