# Requirements — AI Tender Intelligence (Sirati assessment)

Source: `Sirati - Technical Assessment - AI Tender Intelligence-1.pdf` (6 pages: 1 page of requirements, 5 pages of design references).

**Objective:** a functional AI-powered enterprise platform that helps organizations review, understand and evaluate government tenders and RFPs.

## Functional requirements

| ID | Requirement | Acceptance check |
|----|-------------|------------------|
| R1 | **Dashboard** shows uploaded tenders | Tender list/table with name, issuer, status |
| R2 | Dashboard shows **submission deadlines** | Deadline + countdown per tender, "upcoming deadlines" panel |
| R3 | Dashboard shows **compliance progress** | Per-tender progress bar + portfolio average KPI |
| R4 | Dashboard shows **identified risks** | Risk counts by severity per tender + portfolio KPI |
| R5 | **Upload tender documents in PDF** | Drag-and-drop/file picker, PDF only, size-limited, validated server-side |
| R6 | **Process PDF contents** | Server extracts text page-by-page and stores it |
| R7 | **AI extraction of key information** (title, issuer, reference, value, contract period, contacts, summary) | Shown on tender overview |
| R8 | AI extraction of **eligibility criteria** | Listed with page references |
| R9 | AI extraction of **submission deadlines** (and other key dates) | Timeline with page references |
| R10 | AI extraction of **deliverables** | Listed with page references |
| R11 | AI extraction of **technical requirements** | Listed with page references |
| R12 | **Generated compliance checklist** of tender requirements | Created by AI from the document |
| R13 | Checklist is **interactive**: review and **mark as completed** (persisted) | Toggle persists across reloads; progress updates |
| R14 | **Risk assessment**: potential risks | Severity, category, description, mitigation |
| R15 | Risk assessment: **missing information** | Explicit list of gaps/ambiguities in the tender |
| R16 | Risk assessment: **critical requirements needing attention** | Flagged critical/mandatory items |
| R17 | **AI Assistant**: ask questions about uploaded tenders | Chat per tender, history persisted |
| R18 | Assistant answers are **contextual with page-level document references** | Citations (page + quote) that open the PDF at that page |

## Technical requirements (mandatory)

| ID | Requirement |
|----|-------------|
| T1 | Next.js and TypeScript |
| T2 | Tailwind CSS and shadcn/ui components |
| T3 | **Hugeicons** for iconography (no other icon set) |
| T4 | Database integration for persistent storage |
| T5 | Functional LLM integration with **structured outputs** |
| T6 | Secure server-side API handling (keys server-only, validation, rate limits) |
| T7 | Proper loading, empty and error states |

## Design expectations

- D1 Polished, modern, enterprise-grade UI: consistent typography, spacing, iconography, intuitive navigation (benchmark: the reference screens — sidebar nav, KPI cards, restrained data viz, calm dense lists, status pills, evidence side-by-side with list).
- D2 Independent product thinking and creativity.
- D3 **No** generic AI-looking UI, **no hardcoded AI responses**, **no non-functional interactions** (every button must do something).

## Submission requirements

- S1 Live deployed application
- S2 GitHub repository with source code
- S3 README with setup instructions and architectural decisions
- S4 At least one sample tender document demonstrating the complete workflow

## Non-functional requirements (from brief + engineering standards)

- N1 Everything on free tiers (Vercel Hobby, Neon free, Gemini free tier)
- N2 Validation of all input with Zod; AI output validated against schemas before storage
- N3 Upload limits: PDF MIME + magic bytes, ≤ 4 MB (Vercel request body limit is 4.5 MB)
- N4 Prompt-injection hardening: document text is wrapped as untrusted data, system prompt forbids following instructions inside it
- N5 Rate limiting on uploads, analysis and chat (protects free AI quota)
- N6 Security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy)
- N7 No stack traces in production error responses
- N8 Serverless functions fit Vercel limits (analysis runs in background via `after()`, client polls)
- N9 Cache AI results: identical PDF (SHA-256) is not re-analyzed
- N10 Responsive (mobile → desktop) and accessible (semantic HTML, labels, keyboard, contrast)
- N11 Tests: unit, integration, component, E2E; single `npm test`

## Evaluation weights (drive prioritization)

UI/UX 30% · Functionality 25% · AI integration & reliability 20% · Code quality 15% · Product thinking 10%

## Bonus / optional (self-directed product thinking)

- B1 Bid/No-bid readiness score and AI recommendation
- B2 Deadline countdown with urgency colouring
- B3 Checklist filters (status/category) and per-item page links
- B4 Suggested questions in the assistant
- B5 In-app PDF viewer jumping to cited page
- B6 Re-run analysis / retry on failure

## Ambiguities and assumptions

| # | Ambiguity | Assumption |
|---|-----------|------------|
| A1 | Authentication not mentioned | Single shared demo workspace, no login. Keeps reviewer friction at zero. Sample tenders are protected from deletion; writes are rate-limited per IP. |
| A2 | AI provider not specified | Google Gemini (free tier, native JSON-schema structured output, 1M-token context). Model configurable via env. |
| A3 | "Page-level references" | PDF text is extracted per page; every AI-extracted item and every assistant answer carries page numbers + a short supporting quote. |
| A4 | Scanned (image-only) PDFs | Out of scope for OCR; detected (no text layer) and reported with a clear error. |
| A5 | Max document size | 4 MB / 150 pages — covers typical RFPs while staying under serverless limits. Larger docs: chat uses page retrieval to fit context. |
| A6 | "Compliance progress" | % of checklist items marked complete (mandatory items weighted in readiness score). |
| A7 | Deadline time zones | Stored as ISO dates as stated in the document; displayed in the viewer's locale. |
| A8 | Language | English UI; Arabic documents are processed (Gemini is multilingual) but UI is not localized. |
