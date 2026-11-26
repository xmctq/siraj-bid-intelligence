# Siraj · Bid Intelligence

**Live app:** _LIVE_URL_  ·  **No login needed.** Three sample tenders are already analyzed.

Siraj is an AI workspace for reviewing government tenders and RFPs. Upload a tender PDF and, in under a minute, Siraj extracts the key facts, eligibility criteria, deadlines, deliverables and technical requirements; generates an interactive compliance checklist; flags risks, missing information and disqualifying requirements; and answers questions about the document with **page-level citations** you can click to see the highlighted source text.

> _Siraj_ (سراج) means "lamp" or "guiding light" in Arabic: it lights up what matters in a long tender.

---

## Try it in 60 seconds

1. **Overview:** portfolio KPIs, what needs attention, upcoming milestones, compliance by tender, risk severity.
2. Open **AI-Enabled Smart Traffic Management Platform**: see the AI brief, the red "could disqualify this bid" banner, and the tabs.
3. **Compliance checklist:** tick items; progress updates everywhere and persists.
4. **Risks / Risk register:** findings by type and severity, each with a recommended action and its source page.
5. **AI assistant:** click a suggested question; click a `p.N` citation to see the highlighted passage.
6. **Upload tender:** drop your own PDF, or press **Use sample** (samples are in [`public/samples`](public/samples)).

## Requirements coverage

| Brief requirement | Where |
|---|---|
| Dashboard: tenders, deadlines, compliance progress, risks | `/` Overview, `/tenders`, `/deadlines`, `/risks` |
| PDF upload & processing | `/tenders/new` → per-page text extraction (unpdf), stored in Postgres |
| AI analysis: key info, eligibility, deadlines, deliverables, technical requirements | Tender → Overview / Requirements tabs |
| Interactive compliance checklist | Tender → Compliance checklist (optimistic, persisted, filterable) |
| Risk assessment: risks, missing info, critical requirements | Tender → Risks, and the cross-tender Risk register |
| AI assistant with page-level references | Tender → AI assistant (citations open the highlighted page text) |
| Next.js + TypeScript, Tailwind + shadcn/ui, Hugeicons | Next.js 16 App Router, TS strict, Tailwind v4, shadcn (radix), Hugeicons only |
| Database | Neon Postgres via Drizzle ORM (PGlite locally/tests) |
| LLM with structured outputs | Gemini JSON-schema output, generated from Zod and re-validated with Zod |
| Secure server-side API | Keys server-only, Zod validation, rate limits, CSP/HSTS headers, safe errors |
| Loading, empty, error states | Route skeletons, empty states, inline errors with retry everywhere |
| Sample tender | 3 fictional tenders in `public/samples`, seeded through the real pipeline |

## Tech stack & key decisions

| Choice | Why |
|---|---|
| **Next.js 16 (App Router) + TypeScript strict** | Mandated; server components read data directly, route handlers keep AI calls server-side |
| **Tailwind v4 + shadcn/ui + Hugeicons** | Mandated; a custom pastel token system (OKLCH) with semantic severity/urgency tones |
| **Google Gemini** (`gemini-3.5-flash`, fallback `gemini-3.5-flash-lite`) | Free tier, native JSON-schema structured output, long context fits whole tenders |
| **Drizzle + Neon Postgres** | Free, serverless Postgres; parameterized queries; PDFs stored as `bytea` (one fewer service) |
| **PGlite** for local dev & tests | Zero-setup local database with the same SQL; tests are hermetic |
| **unpdf** | Serverless-friendly pdf.js for per-page text, which powers page citations |
| **Vercel Hobby** | Free hosting, git-connected deploys |

Everything runs on free tiers (Vercel Hobby, Neon free, Gemini free tier).

## How the AI pipeline works

```
PDF ─► validate (magic bytes, ≤4 MB, ≤150 pages) ─► SHA-256 dedupe ─► extract text per page
     ─► store tender + file + pages ─► respond 201 (UI polls status)
                                     └► after(): Gemini analysis
                                          prompt = system rules + <document><page number="N">…</page></document>
                                          output = JSON schema from Zod ─► Zod re-validation
                                          ─► normalize (clamp page refs, parse dates, sort risks)
                                          ─► save analysis, checklist items, risks
Question ─► pick relevant pages (whole doc if small, lexical retrieval if large) ─► Gemini (JSON: answer + citations)
        ─► drop citations to pages not supplied, renumber [n] markers ─► save chat
```

**Reliability:** retries with backoff, automatic fallback model on overload/rate limits, per-call timeouts, failures recorded on the tender with a **Retry analysis** button, stale-run detection.
**Safety:** document text is wrapped as untrusted data and the system prompt forbids following instructions inside it; wrapper tags inside the PDF text are neutralized; output is schema-constrained and re-validated; answers render as React text (never HTML).
**Cost control:** identical PDFs are never re-analyzed (hash dedupe); per-IP and global daily AI rate limits stored in Postgres.
**Prompts** live in [`src/server/ai/prompts`](src/server/ai/prompts).

## Architecture & folders

```
src/
  app/                 routes: / · /tenders · /tenders/new · /tenders/[id] · /risks · /deadlines · /api/**
  components/          ui (shadcn), layout (shell, nav, panels), status (badges, meters, states), charts
  domain/              shared Zod schemas: AI output contract, API inputs
  features/
    dashboard/         KPIs, attention, coming-up, compliance breakdown, portfolio stats
    tenders/           upload, list, detail (hero, tabs), server services & queries
    checklist/         interactive checklist + update service
    risks/             per-tender risk view + cross-tender register
    assistant/         chat UI, answer parser, ask-question service
    evidence/          page-reference chips, evidence sheet, quote highlighting
  server/
    ai/                LLM client interface, Gemini + mock providers, prompts, normalization
    db/                Drizzle schema & client (Neon or PGlite)
    pdf/               validation & per-page extraction
    http/              route wrapper, error mapping, rate limiting
scripts/               sample PDF generator, migrations, seeding
tests/                 unit, integration (API), component, e2e (Playwright)
```

## Run locally

```bash
git clone <repo-url> && cd siraj-bid-intelligence
npm install
cp .env.example .env          # add GEMINI_API_KEY (free: https://aistudio.google.com/apikey)
npm run db:seed               # analyzes the 3 sample tenders (uses the embedded DB if DATABASE_URL is empty)
npm run dev                   # http://localhost:3000
```

To use Postgres instead, set `DATABASE_URL` and run `npm run db:migrate` before seeding.

## Tests

```bash
npm run test:unit   # Vitest: unit, API integration (in-memory DB, mocked AI), component tests
npm run test:e2e    # Playwright journeys (mock AI, throwaway DB)
npm test            # both
npm run lint && npm run typecheck
```

The AI provider is mocked in tests (`AI_PROVIDER=mock`, refused on Vercel), so tests are fast, deterministic and free.

## Assumptions

- **No authentication:** a single shared demo workspace so reviewers can start immediately. Writes are rate-limited and sample tenders can't be deleted.
- Text-based PDFs only (scanned PDFs are detected and rejected with a clear message); limit 4 MB / 150 pages.
- Dates are shown in UTC with the original wording from the document alongside.
- English UI; documents in other languages are analyzed and summarized in English.

## With more time

- Auth and multi-tenant workspaces with roles (bid manager, reviewer) and checklist assignees/notes
- OCR for scanned tenders; side-by-side PDF viewer with highlight overlays
- Streaming assistant responses; embeddings-based retrieval for very large tenders
- Bid/no-bid scoring against a company profile; export of checklist and clarification questions
