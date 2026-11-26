# Plan — AI Tender Intelligence

## Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js (App Router) + TypeScript strict** | Mandated (T1); server components + route handlers keep AI calls server-only |
| UI | **Tailwind CSS v4 + shadcn/ui** | Mandated (T2); accessible Radix primitives |
| Icons | **Hugeicons** (`@hugeicons/react` + `@hugeicons/core-free-icons`) | Mandated (T3) |
| Database | **Neon Postgres** (prod) / **PGlite** (local + tests) via **Drizzle ORM** | Mandated persistence (T4); parameterized queries; local dev and tests run with zero setup |
| LLM | **Google Gemini** (`@google/genai`, default `gemini-2.5-flash`) | Free tier, native JSON-schema structured output (T5), 1M context fits full tenders |
| PDF parsing | **unpdf** (serverless pdf.js build) | Per-page text extraction for page-level references, works on Vercel |
| Validation | **Zod v4** | One schema → request validation, AI JSON schema, and output validation |
| Tests | **Vitest + Testing Library + Playwright** | Standard, fast |
| Hosting | **Vercel Hobby** | Free, git-connected auto deploys |

## Free services

| Service | Free limits | Why we stay inside |
|---------|-------------|--------------------|
| Vercel Hobby | 100 GB bandwidth, function max 300 s (fluid), 4.5 MB request body | Upload capped at 4 MB; analysis ~20–60 s; low traffic |
| Neon free | 0.5 GB storage, 190 compute-hours, autosuspend (wakes in <1 s) | PDFs ≤ 4 MB stored as `bytea`; a few dozen tenders ≈ tens of MB; never expires |
| Gemini API free tier | ~10 RPM / ~250 RPD for Flash | SHA-256 dedupe (same PDF never re-analyzed), per-IP rate limits, results cached in DB |

No separate blob storage: PDFs live in Postgres (one fewer service and secret).

## AI integration design

- **Provider abstraction** `LlmClient.generateJson({ system, prompt, schema })` → Gemini implementation sets `responseMimeType: application/json` + `responseJsonSchema` (from `z.toJSONSchema`) and then **re-validates with Zod**. Mock implementation used only by tests (`AI_PROVIDER=mock`, refused on Vercel).
- **Prompts** live in `src/server/ai/prompts/*` (one file per task): `analyze-tender.ts`, `answer-question.ts`.
- **Page tagging:** each page is wrapped as `<page number="N">…</page>` inside a `<document>` block. Every extracted item must cite `pages: number[]`; citations outside 1..pageCount are dropped server-side.
- **Prompt-injection guard:** system prompt states document content is untrusted data; instructions inside it must be ignored; output is schema-constrained so it can't take actions.
- **Reliability:** 2 retries with exponential backoff on 429/5xx/timeouts; fallback model (`gemini-2.5-flash-lite`) on overload; per-call timeout; friendly error stored on tender (`status=failed`) with "Retry analysis" button.
- **Long documents:** cap 150 pages. Analysis sends the whole tagged doc (≈100k tokens worst case). Chat uses whole doc when < ~120k chars, else lexical page retrieval (top-k pages by term score + first pages).
- **Serverless timeouts:** upload handler extracts text, stores, returns immediately; analysis runs in `after()` (same function, `maxDuration=300`). Client polls status with a stepper UI.
- **Caching:** SHA-256 of the PDF is unique → re-uploading returns the existing analyzed tender. Assistant history is persisted.

## Architecture

```
Browser (RSC pages + client islands)
   │  fetch (JSON / multipart)
   ▼
Route handlers  src/app/api/**        ← Zod validation, rate limit, error mapping
   ▼
Services        src/features/*/server ← business logic (upload, analyze, checklist, chat)
   ├─► AI        src/server/ai         ← LlmClient, prompts, schemas
   ├─► PDF       src/server/pdf        ← extraction, validation
   └─► Data      src/server/db         ← Drizzle schema + queries
```
Server components read via the same service/query layer (no HTTP round-trip).

## Data model

- `tenders` id, title, issuer, reference, file_name, file_size, file_hash (unique), page_count, status (`processing|ready|failed`), error, submission_deadline, analysis (jsonb, Zod-validated), is_sample, created_at, analyzed_at
- `tender_files` tender_id (pk/fk), data bytea
- `tender_pages` (tender_id, page_number) pk, text
- `checklist_items` id, tender_id (idx), category, requirement, guidance, mandatory, priority, pages int[], completed, completed_at, position
- `risks` id, tender_id (idx), kind (`risk|missing_information|critical_requirement`), severity, title, description, mitigation, pages int[]
- `chat_messages` id, tender_id (idx), role, content, citations jsonb, created_at
- `rate_limits` key pk, count, window_start

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/tenders` | List tenders with progress + risk counts |
| POST | `/api/tenders` | multipart upload (PDF ≤ 4 MB) → `{ id, status }` |
| GET/DELETE | `/api/tenders/:id` | Detail / delete (samples protected) |
| GET | `/api/tenders/:id/status` | Poll analysis status |
| POST | `/api/tenders/:id/analyze` | Re-run analysis |
| GET | `/api/tenders/:id/file` | Stream PDF (inline) |
| PATCH | `/api/tenders/:id/checklist/:itemId` | `{ completed }` |
| GET/POST | `/api/tenders/:id/chat` | History / ask `{ question }` → `{ answer, citations[] }` |

Errors: `{ error: { code, message } }`, no internals.

## Folder structure

```
src/
  app/                 routes (dashboard, tenders, tenders/[id], api/*)
  components/ui        shadcn primitives
  components/layout    shell, sidebar, page header
  features/
    dashboard/         KPI cards, deadline list, charts
    tenders/           upload, list, overview, status polling, server services
    checklist/         interactive checklist
    risks/             risk register
    assistant/         chat UI + service
  server/
    ai/                client, gemini, mock, prompts/, schemas
    db/                schema, client, queries
    pdf/               extraction
    http/              api error helpers, rate limit
  lib/                 shared utils (dates, formatting)
scripts/               sample PDF generation, seeding
public/samples/        sample tender PDFs
tests/                 unit, integration, component, e2e
```

## Deployment

1. Push to GitHub (public repo). 2. Vercel → import repo, add Neon via Vercel Marketplace (free) → `DATABASE_URL` set automatically. 3. Add `GEMINI_API_KEY`. 4. `npm run db:migrate` + `npm run db:seed` (processes sample tenders through the real AI pipeline). 5. Verify live.

## Build steps

1. Scaffold, tooling, shadcn, Hugeicons, Drizzle schema (T1–T4)
2. PDF extraction + upload API + storage (R5, R6, N3, N9)
3. AI layer: schemas, prompts, Gemini client, analysis pipeline (R7–R12, R14–R16, T5)
4. Tender detail UI: overview, requirements, checklist, risks (R7–R16, R13)
5. Assistant with citations + PDF viewer (R17, R18)
6. Dashboard + tender list (R1–R4)
7. Security: headers, rate limits, error mapping (T6, N4–N7)
8. Sample tender PDFs + seed (S4)
9. Tests + CI (N11)
10. Deploy + verify (S1, S2), README (S3)
