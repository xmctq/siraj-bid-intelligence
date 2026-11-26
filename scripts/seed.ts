/**
 * Seeds the bundled sample tenders by running them through the real pipeline
 * (PDF extraction + live AI analysis). Idempotent: already-analyzed samples are skipped.
 * Usage: npm run db:seed            (add --force to re-analyze)
 */
import "./load-env";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { runTenderAnalysis } from "@/features/tenders/server/analyze-tender";
import { createTenderFromUpload } from "@/features/tenders/server/upload-tender";
import { SAMPLE_FILES } from "@/features/tenders/samples";
import { getDb } from "@/server/db/client";
import { tenders } from "@/server/db/schema";

async function main() {
  const force = process.argv.includes("--force");
  const db = await getDb();

  for (const sample of SAMPLE_FILES) {
    const bytes = await readFile(path.join(process.cwd(), "public", "samples", sample.fileName));
    const { id } = await createTenderFromUpload({ fileName: sample.fileName, bytes, isSample: true });
    await db.update(tenders).set({ isSample: true }).where(eq(tenders.id, id));

    const [row] = await db.select({ status: tenders.status }).from(tenders).where(eq(tenders.id, id));
    if (row?.status === "ready" && !force) {
      console.log(`✓ ${sample.title} already analyzed`);
      continue;
    }
    console.log(`… analyzing ${sample.title}`);
    const started = Date.now();
    await runTenderAnalysis(id);
    const [result] = await db
      .select({ status: tenders.status, error: tenders.errorMessage })
      .from(tenders)
      .where(eq(tenders.id, id));
    console.log(
      result?.status === "ready"
        ? `✓ ${sample.title} analyzed in ${((Date.now() - started) / 1000).toFixed(1)}s`
        : `✗ ${sample.title} failed: ${result?.error}`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
