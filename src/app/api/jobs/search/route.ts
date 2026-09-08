import { NextResponse } from "next/server";
import { findBoard } from "@/lib/ats";
import { extractJobsFromPage, findCareersUrl, jobsFromCompanyUrl, normaliseUrl, slugsFromUrl } from "@/lib/search";
import { linkedinJobsUrl } from "@/lib/slug";
import { STRINGS, type Lang } from "@/lib/i18n";
import { rateLimit } from "@/lib/ratelimit";
import type { CompanyResult } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 180;

/**
 * Find one company's openings. A URL the user supplied is trusted first: it
 * gives us the real board slug (and, for anything but LinkedIn, a page we can
 * read directly) instead of guessing from the company name.
 */
async function searchCompany(company: string, hintUrl: string, lang: Lang): Promise<CompanyResult> {
  const t = STRINGS[lang];
  const hint = hintUrl ? normaliseUrl(hintUrl) : null;
  const isLinkedinHint = Boolean(hint && /linkedin\./i.test(hint.hostname));
  const base = {
    company,
    linkedinUrl: isLinkedinHint ? `${hint!.toString().replace(/\/$/, "")}/jobs/` : linkedinJobsUrl(company),
  };

  const board = await findBoard(company, hint ? slugsFromUrl(hint.toString()) : []);
  if (board) {
    return { ...base, source: board.source, careersUrl: board.careersUrl, jobs: board.jobs, note: "" };
  }

  if (hint) {
    const jobs = await jobsFromCompanyUrl(company, hint.toString());
    if (jobs.length) {
      return { ...base, source: "careers-page", careersUrl: hint.toString(), jobs, note: "" };
    }
    return {
      ...base,
      source: isLinkedinHint ? "linkedin-only" : "careers-page",
      careersUrl: isLinkedinHint ? "" : hint.toString(),
      jobs: [],
      note: isLinkedinHint ? t.noteLinkedinOnly : t.noteUnreadable,
    };
  }

  const careersUrl = await findCareersUrl(company);
  if (!careersUrl) {
    return { ...base, source: "none", careersUrl: "", jobs: [], note: t.noteNoBoard };
  }

  const jobs = await extractJobsFromPage(company, careersUrl);
  return {
    ...base,
    source: "careers-page",
    careersUrl,
    jobs,
    note: jobs.length ? "" : t.noteUnreadable,
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { companies?: unknown; urls?: unknown; lang?: unknown };
    const companies = Array.isArray(body.companies)
      ? body.companies.map(String).map((c) => c.trim()).filter(Boolean).slice(0, 15)
      : [];
    const urls: Record<string, string> =
      body.urls && typeof body.urls === "object" ? (body.urls as Record<string, string>) : {};
    const lang: Lang = body.lang === "he" ? "he" : "en";
    if (!companies.length) {
      return NextResponse.json({ error: "Add at least one company." }, { status: 400 });
    }

    // Fans out to dozens of third-party boards per request, and can fall back to a model call.
    const limited = rateLimit(req, {
      name: "jobs-search",
      max: 15,
      windowMs: 60 * 60 * 1000,
      message: STRINGS[lang].errRateLimited,
    });
    if (limited) return limited;

    const results = await Promise.all(
      companies.map((c) =>
        searchCompany(c, String(urls[c] ?? "").trim(), lang).catch(
          (err): CompanyResult => ({
            company: c,
            source: "error",
            careersUrl: "",
            linkedinUrl: linkedinJobsUrl(c),
            jobs: [],
            note: err instanceof Error ? err.message : "Search failed.",
          })
        )
      )
    );

    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Job search failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
