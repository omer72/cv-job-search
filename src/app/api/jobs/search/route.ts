import { NextResponse } from "next/server";
import { findBoard } from "@/lib/ats";
import { extractJobsFromPage, findCareersUrl } from "@/lib/search";
import { linkedinJobsUrl } from "@/lib/slug";
import type { CompanyResult } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 180;

async function searchCompany(company: string): Promise<CompanyResult> {
  const base = { company, linkedinUrl: linkedinJobsUrl(company) };

  const board = await findBoard(company);
  if (board) {
    return { ...base, source: board.source, careersUrl: board.careersUrl, jobs: board.jobs, note: "" };
  }

  const careersUrl = await findCareersUrl(company);
  if (!careersUrl) {
    return {
      ...base,
      source: "none",
      careersUrl: "",
      jobs: [],
      note: "No public job board or careers page found. Check LinkedIn manually, or add the careers URL by using the company's exact board name.",
    };
  }

  const jobs = await extractJobsFromPage(company, careersUrl);
  return {
    ...base,
    source: "careers-page",
    careersUrl,
    jobs,
    note: jobs.length ? "" : "Careers page found but no openings could be read from it (often a JavaScript-only listing).",
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { companies?: unknown };
    const companies = Array.isArray(body.companies)
      ? body.companies.map(String).map((c) => c.trim()).filter(Boolean).slice(0, 15)
      : [];
    if (!companies.length) {
      return NextResponse.json({ error: "Add at least one company." }, { status: 400 });
    }

    const results = await Promise.all(
      companies.map((c) =>
        searchCompany(c).catch(
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
