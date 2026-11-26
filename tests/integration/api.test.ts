import { readFile } from "node:fs/promises";
import path from "node:path";
import { beforeAll, describe, expect, it, vi } from "vitest";

// after() needs a Next.js request scope; collect the background work so tests can await it.
const background: Promise<unknown>[] = [];
vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return { ...actual, after: (task: () => unknown) => background.push(Promise.resolve(task())) };
});

const { POST: uploadTender, GET: listTenders } = await import("@/app/api/tenders/route");
const { GET: getTender, DELETE: deleteTender } = await import("@/app/api/tenders/[id]/route");
const { GET: getStatus } = await import("@/app/api/tenders/[id]/status/route");
const { PATCH: patchChecklist } = await import("@/app/api/tenders/[id]/checklist/[itemId]/route");
const { POST: ask } = await import("@/app/api/tenders/[id]/chat/route");
const { GET: getPage } = await import("@/app/api/tenders/[id]/pages/[page]/route");
const { runTenderAnalysis } = await import("@/features/tenders/server/analyze-tender");
const { AiError } = await import("@/server/ai/llm");

const SAMPLE = path.join(process.cwd(), "public", "samples", "EWA-RFQ-2026-309-Smart-Meter-Supply.pdf");
const params = <T,>(value: T) => ({ params: Promise.resolve(value) });
const ip = (n: number) => ({ "x-forwarded-for": `10.0.0.${n}` });

function uploadRequest(bytes: Uint8Array, name: string, headers: Record<string, string> = ip(1)) {
  const form = new FormData();
  // Copy into a plain ArrayBuffer-backed view (BlobPart typing in newer @types/node).
  form.append("file", new File([new Uint8Array(bytes)], name, { type: "application/pdf" }));
  return new Request("http://test/api/tenders", { method: "POST", body: form, headers });
}

let tenderId: string;

beforeAll(async () => {
  const response = await uploadTender(uploadRequest(await readFile(SAMPLE), "sample.pdf"), params({}));
  expect(response.status).toBe(201);
  tenderId = ((await response.json()) as { id: string }).id;
  await Promise.all(background);
});

describe("POST /api/tenders", () => {
  it("rejects files that are not PDFs", async () => {
    const response = await uploadTender(uploadRequest(new TextEncoder().encode("hello world"), "notes.pdf"), params({}));
    expect(response.status).toBe(415);
    expect(await response.json()).toEqual({ error: { code: "invalid_file_type", message: "Only PDF documents are supported." } });
  });

  it("deduplicates an identical document instead of re-analyzing it", async () => {
    const response = await uploadTender(uploadRequest(await readFile(SAMPLE), "again.pdf"), params({}));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: tenderId, duplicate: true });
  });
});

describe("analysis pipeline", () => {
  it("stores the validated analysis, checklist and risks", async () => {
    const status = await (await getStatus(new Request("http://test"), params({ id: tenderId }))).json();
    expect(status).toMatchObject({ status: "ready", stale: false });

    const detail = await (await getTender(new Request("http://test"), params({ id: tenderId }))).json();
    expect(detail.tender.title).toBe("Mock Tender for Automated Tests");
    expect(detail.tender.submissionDeadline).toBe("2030-01-15T12:00:00.000Z");
    expect(detail.checklist).toHaveLength(2);
    expect(detail.risks[0].severity).toBe("critical");
  });

  it("records a friendly error when the AI provider fails", async () => {
    await runTenderAnalysis(tenderId, {
      generateJson: () => Promise.reject(new AiError("rate_limited")),
    });
    const status = await (await getStatus(new Request("http://test"), params({ id: tenderId }))).json();
    expect(status.status).toBe("failed");
    expect(status.errorMessage).toMatch(/rate-limited/);
    await runTenderAnalysis(tenderId); // restore for later tests
  });

  it("lists tenders with aggregated progress and risk counts", async () => {
    const body = await (await listTenders(new Request("http://test/api/tenders?q=Mock"), params({}))).json();
    expect(body.total).toBe(1);
    expect(body.items[0].checklist.total).toBe(2);
    expect(body.items[0].risks.critical).toBe(1);
  });
});

describe("checklist", () => {
  it("marks an item completed and validates input", async () => {
    const detail = await (await getTender(new Request("http://test"), params({ id: tenderId }))).json();
    const itemId = detail.checklist[0].id as string;
    const patch = (body: unknown) =>
      patchChecklist(
        new Request("http://test", { method: "PATCH", body: JSON.stringify(body), headers: ip(2) }),
        params({ id: tenderId, itemId }),
      );

    const ok = await patch({ completed: true });
    expect(ok.status).toBe(200);
    expect(await ok.json()).toMatchObject({ completed: true });
    expect((await patch({ completed: "yes" })).status).toBe(400);
  });

  it("returns 404 for an unknown item and 400 for a malformed id", async () => {
    const body = { method: "PATCH", body: JSON.stringify({ completed: true }), headers: ip(2) };
    const missing = await patchChecklist(new Request("http://test", body), params({ id: tenderId, itemId: crypto.randomUUID() }));
    expect(missing.status).toBe(404);
    const malformed = await patchChecklist(new Request("http://test", body), params({ id: "nope", itemId: "nope" }));
    expect(malformed.status).toBe(400);
  });
});

describe("assistant", () => {
  it("answers with page citations and persists the exchange", async () => {
    const response = await ask(
      new Request("http://test", { method: "POST", body: JSON.stringify({ question: "When is the deadline?" }), headers: ip(3) }),
      params({ id: tenderId }),
    );
    expect(response.status).toBe(201);
    const { message } = await response.json();
    expect(message.citations).toEqual([{ page: 1, quote: "15 January 2030" }]);
  });

  it("rejects empty questions", async () => {
    const response = await ask(
      new Request("http://test", { method: "POST", body: JSON.stringify({ question: " " }), headers: ip(3) }),
      params({ id: tenderId }),
    );
    expect(response.status).toBe(400);
  });

  it("serves extracted page text for evidence", async () => {
    const response = await getPage(new Request("http://test"), params({ id: tenderId, page: "1" }));
    expect((await response.json()).text).toContain("Smart Electricity Meters");
  });
});

describe("rate limiting and protection", () => {
  it("rate-limits uploads per client", async () => {
    const bytes = new TextEncoder().encode("x");
    let last = 0;
    for (let i = 0; i < 11; i++) last = (await uploadTender(uploadRequest(bytes, "x.pdf", ip(9)), params({}))).status;
    expect(last).toBe(429);
  });

  it("protects sample tenders from deletion", async () => {
    const { getDb } = await import("@/server/db/client");
    const { tenders } = await import("@/server/db/schema");
    const { eq } = await import("drizzle-orm");
    await (await getDb()).update(tenders).set({ isSample: true }).where(eq(tenders.id, tenderId));
    const response = await deleteTender(new Request("http://test", { method: "DELETE", headers: ip(4) }), params({ id: tenderId }));
    expect(response.status).toBe(403);
  });
});
