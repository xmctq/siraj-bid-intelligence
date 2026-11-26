import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { tenders } from "@/server/db/schema";
import { AppError, notFound } from "@/server/errors";

export async function deleteTender(id: string): Promise<void> {
  const db = await getDb();
  const [tender] = await db.select({ isSample: tenders.isSample }).from(tenders).where(eq(tenders.id, id)).limit(1);
  if (!tender) throw notFound("Tender");
  if (tender.isSample) {
    throw new AppError("sample_protected", "Sample tenders are kept so every reviewer can try the workflow.", 403);
  }
  await db.delete(tenders).where(eq(tenders.id, id));
}
