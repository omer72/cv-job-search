# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # dev server on :3000
npm run build      # next build
npm run lint       # next lint
npm run typecheck  # tsc --noEmit
```

No test suite exists. Verification is `npm run typecheck && npm run build`.
Requires `OPENAI_API_KEY` in `.env.local` (`SERPER_API_KEY` optional — see `.env.example`).

## Architecture

Next.js 15 App Router, React 19, Tailwind v4 (CSS-first `@theme` in `src/app/globals.css`,
no tailwind.config). Single client page + three POST route handlers. No database: all state
lives in `localStorage` under `cv-job-match:v1`, owned entirely by `src/app/page.tsx`
(one `Persisted` object; children get props + setters, no context/store).

Flow: `/api/cv/parse` (PDF → text → profile + review in parallel) → `/api/jobs/search`
(companies → live postings) → `/api/match` (profile + jobs → ranked fit scores).
`page.tsx#runSearch` chains the last two in one user action.

`src/lib/schemas.ts` is the contract for everything. Every zod schema there is used three
ways: to validate LLM output, as the exported TypeScript type for the UI, and (for
`CvProfileSchema`/`JobSchema`) to validate request bodies in `/api/match`. Change a schema
and the prompt `shape` string that mirrors it must change too — they are hand-kept in sync.

### LLM calls

All model access goes through `jsonCompletion` in `src/lib/ai.ts`. It takes a zod `schema`
plus a `shape` string appended to the system prompt, and retries once with the validation
error fed back to the model. Never call the OpenAI client directly; add prompts as new
`jsonCompletion` callers (see `lib/cv.ts`, `lib/match.ts`, `lib/search.ts`). Model comes
from `OPENAI_MODEL`, default `gpt-4o-mini`.

### Job discovery (`lib/ats.ts`, `lib/slug.ts`, `lib/search.ts`)

Company name → `candidateSlugs()` guesses board slugs → `findBoard()` fans out all six
public ATS providers × top-3 slugs in parallel and keeps whichever returns the most jobs.
Each provider is a `Provider` function mapping one vendor's JSON to `Job`; adding a board
means writing one such function and appending it to `PROVIDERS`. No keys, no auth.

Fallback when no board matches: `findCareersUrl()` (Serper web search if keyed, else
domain/path probing) → `getPageText()` → LLM extraction. LinkedIn is deliberately never
scraped; `linkedinJobsUrl()` produces a manual search link instead.

### Match scoring (`lib/match.ts`)

`preScore()` is a pure deterministic heuristic (skill overlap + title overlap − seniority
distance) used to rank *all* jobs cheaply. Only the top `deep` (24) get an LLM pass, in
batches of 6; the rest keep the heuristic score. Any batch failure degrades to
`fallbackMatch` rather than erroring the request — cost control is the whole point of this
split, so don't replace it with per-job LLM calls.

### Conventions

- Failure is degradation, not exceptions: `getJson`/`getPageText` return `null`, per-company
  search errors become a `note` on that company's `CompanyResult`, batch scoring falls back.
  Preserve this — one bad company must never fail the whole run.
- All outbound fetches go through `fetchWithTimeout` in `lib/http.ts` (browser UA, abort
  timeout). HTML is reduced with `htmlToText`, which renders links as `label [href]` because
  the extraction prompt depends on that form.
- Routes: `runtime = "nodejs"` + a generous `maxDuration`, and always return
  `{ error: string }` with a status the UI surfaces verbatim.
- `pdfjs-dist` is in `serverExternalPackages`; `lib/pdf.ts` imports the legacy build so it
  runs worker-free server-side. Scanned PDFs (<200 non-space chars) are rejected with 422.
- Shared primitives (`Card`, `Button`, `cx`, badges) live in `components/ui.tsx`; colors use
  the `ink-*` scale and every surface needs its `dark:` variant.
