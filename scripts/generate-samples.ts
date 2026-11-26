/**
 * Generates the sample tender PDFs in public/samples from scripts/samples/documents.ts.
 * Usage: npm run samples:generate
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import { SAMPLE_DOCUMENTS, type SampleDocument, type Section } from "./samples/documents";

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = { x: 60, top: 64, bottom: 72 };
const CONTENT_WIDTH = PAGE.width - MARGIN.x * 2;
const INK = rgb(0.13, 0.15, 0.2);
const MUTED = rgb(0.42, 0.45, 0.52);
const ACCENT = rgb(0.07, 0.35, 0.75);
const RULE = rgb(0.85, 0.87, 0.9);

type Fonts = { regular: PDFFont; bold: PDFFont };

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

class Writer {
  private page!: PDFPage;
  private y = 0;
  readonly pages: PDFPage[] = [];

  constructor(
    private readonly pdf: PDFDocument,
    private readonly fonts: Fonts,
  ) {
    this.newPage();
  }

  newPage() {
    this.page = this.pdf.addPage([PAGE.width, PAGE.height]);
    this.pages.push(this.page);
    this.y = PAGE.height - MARGIN.top;
  }

  private ensure(height: number) {
    if (this.y - height < MARGIN.bottom) this.newPage();
  }

  text(content: string, opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; indent?: number; gap?: number } = {}) {
    const size = opts.size ?? 10.5;
    const font = opts.bold ? this.fonts.bold : this.fonts.regular;
    const indent = opts.indent ?? 0;
    const lineHeight = size * 1.45;
    for (const line of wrap(content, font, size, CONTENT_WIDTH - indent)) {
      this.ensure(lineHeight);
      this.page.drawText(line, { x: MARGIN.x + indent, y: this.y - size, size, font, color: opts.color ?? INK });
      this.y -= lineHeight;
    }
    this.y -= opts.gap ?? 6;
  }

  bullet(content: string) {
    const size = 10.5;
    const lines = wrap(content, this.fonts.regular, size, CONTENT_WIDTH - 16);
    this.ensure(size * 1.45 * Math.min(lines.length, 2));
    this.page.drawCircle({ x: MARGIN.x + 5, y: this.y - size * 0.62, size: 1.8, color: INK });
    this.text(content, { indent: 16, gap: 4 });
  }

  table(rows: string[][]) {
    const colWidths = [CONTENT_WIDTH * 0.62, CONTENT_WIDTH * 0.38];
    const size = 10;
    rows.forEach((row, rowIndex) => {
      const font = rowIndex === 0 ? this.fonts.bold : this.fonts.regular;
      const cellLines = row.map((cell, i) => wrap(cell, font, size, (colWidths[i] ?? 0) - 12));
      const height = Math.max(...cellLines.map((l) => l.length)) * size * 1.4 + 10;
      this.ensure(height);
      if (rowIndex === 0) {
        this.page.drawRectangle({ x: MARGIN.x, y: this.y - height, width: CONTENT_WIDTH, height, color: rgb(0.95, 0.96, 0.98) });
      }
      let x = MARGIN.x;
      cellLines.forEach((lines, i) => {
        lines.forEach((line, li) => {
          this.page.drawText(line, { x: x + 6, y: this.y - 6 - size - li * size * 1.4, size, font, color: INK });
        });
        x += colWidths[i] ?? 0;
      });
      this.y -= height;
      this.page.drawLine({ start: { x: MARGIN.x, y: this.y }, end: { x: MARGIN.x + CONTENT_WIDTH, y: this.y }, thickness: 0.6, color: RULE });
    });
    this.y -= 10;
  }

  rule() {
    this.page.drawLine({ start: { x: MARGIN.x, y: this.y }, end: { x: MARGIN.x + CONTENT_WIDTH, y: this.y }, thickness: 1, color: RULE });
    this.y -= 18;
  }
}

function writeSection(writer: Writer, section: Section) {
  let heading = section.heading;
  if (heading.startsWith("PAGEBREAK ")) {
    writer.newPage();
    heading = heading.slice("PAGEBREAK ".length);
  }
  writer.text(heading, { size: 13, bold: true, color: ACCENT, gap: 8 });
  for (const paragraph of section.paragraphs) writer.text(paragraph, { gap: 8 });
  for (const bullet of section.bullets ?? []) writer.bullet(bullet);
  if (section.table) writer.table(section.table);
  writer.text("", { gap: 6 });
}

async function renderDocument(doc: SampleDocument): Promise<{ bytes: Uint8Array; pages: number }> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(doc.title);
  pdf.setAuthor(doc.issuer);
  pdf.setSubject(`Tender ${doc.reference}`);
  const fonts = { regular: await pdf.embedFont(StandardFonts.Helvetica), bold: await pdf.embedFont(StandardFonts.HelveticaBold) };
  const writer = new Writer(pdf, fonts);

  writer.text(doc.issuer.toUpperCase(), { size: 9.5, bold: true, color: ACCENT, gap: 10 });
  writer.text(doc.title, { size: 20, bold: true, gap: 10 });
  writer.text(`Reference: ${doc.reference}    Issue date: ${doc.issueDate}`, { size: 10, color: MUTED, gap: 14 });
  writer.rule();
  for (const section of doc.sections) writeSection(writer, section);

  const total = writer.pages.length;
  writer.pages.forEach((page, index) => {
    const footer = `${doc.reference}  |  Page ${index + 1} of ${total}`;
    page.drawText(footer, { x: MARGIN.x, y: 36, size: 8.5, font: fonts.regular, color: MUTED });
    page.drawText("FICTIONAL SAMPLE DOCUMENT", {
      x: PAGE.width - MARGIN.x - fonts.bold.widthOfTextAtSize("FICTIONAL SAMPLE DOCUMENT", 8.5),
      y: 36,
      size: 8.5,
      font: fonts.bold,
      color: MUTED,
    });
  });

  // Fixed dates keep the output byte-identical across runs, so the SHA-256 dedupe stays stable.
  const fixedDate = new Date("2026-11-20T00:00:00Z");
  pdf.setCreationDate(fixedDate);
  pdf.setModificationDate(fixedDate);
  return { bytes: await pdf.save({ useObjectStreams: false }), pages: total };
}

async function main() {
  const outDir = path.join(process.cwd(), "public", "samples");
  await mkdir(outDir, { recursive: true });
  for (const doc of SAMPLE_DOCUMENTS) {
    const { bytes, pages } = await renderDocument(doc);
    await writeFile(path.join(outDir, doc.fileName), bytes);
    console.log(`${doc.fileName}: ${pages} pages, ${(bytes.byteLength / 1024).toFixed(1)} KB`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
