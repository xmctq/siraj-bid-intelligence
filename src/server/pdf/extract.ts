import "server-only";
import { createHash } from "node:crypto";
import { extractText, getDocumentProxy } from "unpdf";
import { MAX_PAGES, MAX_UPLOAD_BYTES } from "@/domain/api";
import { AppError } from "@/server/errors";

export type ExtractedPdf = { pages: string[]; hash: string };

const PDF_MAGIC = "%PDF-";
/** Below this many characters across the whole document we assume a scanned, image-only PDF. */
const MIN_TEXT_CHARS = 200;

export function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function assertPdfFile(bytes: Uint8Array): void {
  if (bytes.byteLength === 0) {
    throw new AppError("empty_file", "The uploaded file is empty.");
  }
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new AppError("file_too_large", "PDFs must be 4 MB or smaller.", 413);
  }
  const header = Buffer.from(bytes.subarray(0, 1024)).toString("latin1");
  if (!header.includes(PDF_MAGIC)) {
    throw new AppError("invalid_file_type", "Only PDF documents are supported.", 415);
  }
}

export function normalizePageText(text: string): string {
  return text
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractPdf(bytes: Uint8Array): Promise<ExtractedPdf> {
  assertPdfFile(bytes);
  const hash = sha256(bytes);

  let pages: string[];
  try {
    // pdf.js may detach the buffer it is given, so hand it a copy.
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    if (pdf.numPages > MAX_PAGES) {
      throw new AppError("too_many_pages", `Documents are limited to ${MAX_PAGES} pages.`, 413);
    }
    const result = await extractText(pdf, { mergePages: false });
    pages = result.text.map(normalizePageText);
  } catch (error) {
    if (error instanceof AppError) throw error;
    const name = error instanceof Error ? error.name : "";
    if (name === "PasswordException") {
      throw new AppError("encrypted_pdf", "This PDF is password-protected. Please upload an unlocked copy.");
    }
    throw new AppError("unreadable_pdf", "We couldn't read this PDF. It may be corrupted.");
  }

  const totalChars = pages.reduce((sum, page) => sum + page.length, 0);
  if (totalChars < MIN_TEXT_CHARS) {
    throw new AppError(
      "no_text_layer",
      "This PDF has no selectable text (it looks scanned). Please upload a text-based PDF.",
    );
  }
  return { pages, hash };
}
