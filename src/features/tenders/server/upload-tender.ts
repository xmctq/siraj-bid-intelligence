import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { tenderFiles, tenderPages, tenders } from "@/server/db/schema";
import { extractPdf } from "@/server/pdf/extract";

export type UploadResult = { id: string; status: "processing" | "ready" | "failed"; duplicate: boolean };

export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "document.pdf";
  const cleaned = base.replace(/[\u0000-\u001f\u007f<>"]/g, "").trim().slice(0, 200);
  return cleaned || "document.pdf";
}

/** Readable placeholder title until the AI extracts the official one. */
export function titleFromFileName(fileName: string): string {
  const stem = fileName.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return stem ? stem.charAt(0).toUpperCase() + stem.slice(1) : "Untitled tender";
}

async function findByHash(hash: string): Promise<UploadResult | null> {
  const db = await getDb();
  const [existing] = await db
    .select({ id: tenders.id, status: tenders.status })
    .from(tenders)
    .where(eq(tenders.fileHash, hash))
    .limit(1);
  return existing ? { ...existing, duplicate: true } : null;
}

/**
 * Validates and extracts the PDF, then stores the tender, the original file and its per-page text.
 * Identical files (same SHA-256) are deduplicated so the AI never re-processes a document.
 */
export async function createTenderFromUpload(input: {
  fileName: string;
  bytes: Uint8Array;
  isSample?: boolean;
}): Promise<UploadResult> {
  const { pages, hash } = await extractPdf(input.bytes);
  const existing = await findByHash(hash);
  if (existing) return existing;

  const db = await getDb();
  const fileName = sanitizeFileName(input.fileName);
  let tenderId: string;
  try {
    const [created] = await db
      .insert(tenders)
      .values({
        title: titleFromFileName(fileName),
        fileName,
        fileSize: input.bytes.byteLength,
        fileHash: hash,
        pageCount: pages.length,
        status: "processing",
        isSample: input.isSample ?? false,
        analysisStartedAt: new Date(),
      })
      .returning({ id: tenders.id });
    if (!created) throw new Error("Tender insert returned no row");
    tenderId = created.id;
  } catch (error) {
    // A concurrent upload of the same file won the unique constraint race.
    const raced = await findByHash(hash);
    if (raced) return raced;
    throw error;
  }

  try {
    await db.insert(tenderFiles).values({ tenderId, data: Buffer.from(input.bytes) });
    await db.insert(tenderPages).values(pages.map((text, index) => ({ tenderId, pageNumber: index + 1, text })));
  } catch (error) {
    await db.delete(tenders).where(eq(tenders.id, tenderId));
    throw error;
  }

  return { id: tenderId, status: "processing", duplicate: false };
}
