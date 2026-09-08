# CV → Job Match

Upload a CV, get a graded review with specific fixes, then list the companies you
want to work at and see their real open roles ranked by how well your CV fits.

## Setup

```bash
npm install
cp .env.example .env.local     # add your OPENAI_API_KEY
npm run dev                   # http://localhost:3000
```

## How it works

**1. CV upload** — `POST /api/cv/parse`
The PDF is parsed server-side with pdf.js (no worker, no upload to a third party).
Two model calls then run in parallel: one extracts a structured profile (skills,
tools, titles, seniority, years), the other produces the review. Scanned/image
PDFs are rejected with a clear message rather than silently returning nonsense.

**2. CV review**
Score out of 100, prioritised issues (each naming the section and the exact fix),
ATS warnings, missing sections, keyword suggestions, and up to four verbatim
bullet rewrites.

**3. Job discovery** — `POST /api/jobs/search`
For each company the app derives plausible board slugs from the name and hits the
public JSON APIs of the major ATS platforms in parallel:

| Platform | Endpoint |
| --- | --- |
| Greenhouse | `boards-api.greenhouse.io/v1/boards/<slug>/jobs` |
| Lever | `api.lever.co/v0/postings/<slug>` |
| Ashby | `api.ashbyhq.com/posting-api/job-board/<slug>` |
| SmartRecruiters | `api.smartrecruiters.com/v1/companies/<slug>/postings` |
| Recruitee | `<slug>.recruitee.com/api/offers/` |
| Workable | `apply.workable.com/api/v1/widget/accounts/<slug>` |

These need no API key and return structured, current postings — the most reliable
source available. If no board matches, the app falls back to locating the
company's own careers page (web search when `SERPER_API_KEY` is set, otherwise
domain probing across `/careers`, `/jobs`, `careers.<domain>`), fetches it,
reduces it to text and has the model extract the openings.

**4. Match scoring** — `POST /api/match`
A cheap deterministic pre-score (skill overlap + title overlap − seniority
distance) ranks every job; the top 24 get a full LLM analysis in batches of six,
the rest keep the heuristic score. Each analysed role returns a calibrated
percentage, matched and missing skills, seniority and location fit, the reasoning,
and the specific CV edits that would raise that score.

## About LinkedIn

LinkedIn has no public jobs API and blocks automated access — scraping it would
break their terms and get the requests blocked quickly. Instead, every company
gets a link to a pre-filled LinkedIn jobs search you can open and scan yourself.
The ATS boards above are where the postings actually originate, so in practice
they cover most of what LinkedIn would show anyway.

## Notes

- State (CV text, profile, review, companies, results) lives in the browser's
  local storage. Nothing is persisted server-side; there is no database.
- The only outbound calls are to the OpenAI API with your key, the ATS endpoints
  above, and the company careers pages themselves.
- `OPENAI_MODEL` defaults to `gpt-4o-mini`. A stronger model gives noticeably
  better review quality at higher cost.
- Cost per full run is roughly: 2 calls for the CV + 4–5 calls for scoring 24
  roles.

## Layout

```
src/app/                 pages and API routes
src/app/api/cv/parse     PDF → text → profile + review
src/app/api/jobs/search  companies → open roles
src/app/api/match        profile + roles → fit scores
src/lib/ats.ts           public ATS board providers
src/lib/search.ts        careers-page discovery + LLM extraction
src/lib/match.ts         pre-score + LLM scoring
src/lib/cv.ts            profile extraction + review prompts
src/lib/ai.ts            OpenAI client, JSON-with-retry helper
src/lib/pdf.ts           pdf.js text extraction
src/components/          UI
```
