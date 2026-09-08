import { z } from "zod";
import { jsonCompletion } from "./ai";
import { fetchWithTimeout, getPageText } from "./http";
import { candidateDomains, candidateSlugs, jobId } from "./slug";
import type { Job } from "./schemas";

const CAREER_PATHS = ["/careers", "/jobs", "/careers/", "/jobs/", "/about/careers", "/company/careers", "/join-us"];

async function head(url: string): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(url, { method: "GET" }, 6000);
    return res.ok;
  } catch {
    return false;
  }
}

type SerperResult = { organic?: { title: string; link: string; snippet?: string }[] };

export async function webSearch(query: string): Promise<{ title: string; link: string; snippet: string }[]> {
  const key = process.env.SERPER_API_KEY;
  if (!key) return [];
  try {
    const res = await fetchWithTimeout(
      "https://google.serper.dev/search",
      {
        method: "POST",
        headers: { "X-API-KEY": key, "content-type": "application/json" },
        body: JSON.stringify({ q: query, num: 10 }),
      },
      10000
    );
    if (!res.ok) return [];
    const data = (await res.json()) as SerperResult;
    return (data.organic ?? []).map((o) => ({
      title: o.title,
      link: o.link,
      snippet: o.snippet ?? "",
    }));
  } catch {
    return [];
  }
}

/** Locate a company's careers page: web search first (if configured), then domain probing. */
export async function findCareersUrl(company: string): Promise<string | null> {
  const hits = await webSearch(`${company} careers open positions jobs`);
  const scored = hits
    .filter((h) => /career|job|position|hiring|greenhouse|lever|ashby|workable|smartrecruiters|comeet/i.test(h.link))
    .sort((a, b) => (/career|job/i.test(a.link) ? -1 : 1));
  if (scored[0]) return scored[0].link;

  const probes: string[] = [];
  for (const domain of candidateDomains(company).slice(0, 6)) {
    for (const path of CAREER_PATHS.slice(0, 2)) probes.push(`https://${domain}${path}`);
  }
  for (const slug of candidateSlugs(company).slice(0, 2)) {
    probes.push(`https://careers.${slug}.com`);
  }
  const checks = await Promise.all(probes.map(async (u) => ((await head(u)) ? u : null)));
  return checks.find(Boolean) ?? null;
}

/** Slug candidates taken from a URL the user supplied (site domain or LinkedIn page). */
export function slugsFromUrl(raw: string): string[] {
  const url = normaliseUrl(raw);
  if (!url) return [];
  const out: string[] = [];
  const linkedin = url.pathname.match(/\/company\/([^/]+)/i);
  if (/linkedin\./i.test(url.hostname) && linkedin) out.push(linkedin[1].toLowerCase());
  const host = url.hostname.replace(/^www\./, "");
  const label = host.split(".")[0];
  if (label && label.length >= 2) out.push(label.toLowerCase());
  return [...new Set(out)];
}

export function normaliseUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
}

/**
 * Read openings from a URL the user gave us for a company. LinkedIn cannot be
 * scraped, so a LinkedIn page is used only for the company slug; anything else
 * is probed for a careers page and then read directly.
 */
export async function jobsFromCompanyUrl(company: string, raw: string): Promise<Job[]> {
  const url = normaliseUrl(raw);
  if (!url) return [];
  if (/linkedin\./i.test(url.hostname)) return [];

  const origin = url.origin;
  const candidates = [
    url.toString(),
    ...CAREER_PATHS.map((path) => `${origin}${path}`),
  ];
  for (const candidate of [...new Set(candidates)]) {
    const jobs = await extractJobsFromPage(company, candidate);
    if (jobs.length) return jobs;
  }
  return [];
}

const ExtractedJobs = z.object({
  jobs: z
    .array(
      z.object({
        title: z.string(),
        location: z.string().default(""),
        url: z.string().default(""),
        department: z.string().default(""),
        summary: z.string().default(""),
      })
    )
    .default([]),
});

/** Read a careers page and let the model pull out the individual openings. */
export async function extractJobsFromPage(company: string, url: string): Promise<Job[]> {
  const text = await getPageText(url);
  if (!text || text.length < 120) return [];

  const parsed = await jsonCompletion({
    schema: ExtractedJobs,
    system:
      "You extract job openings from the text of a company careers page. Links appear as `label [href]`. Only list real, distinct, currently-open roles. Never invent roles. If the page lists no concrete openings, return an empty array.",
    shape:
      '{"jobs":[{"title":string,"location":string,"url":string (absolute, or the href shown next to the title, else ""),"department":string,"summary":string}]}',
    user: `Company: ${company}\nCareers page: ${url}\n\nPAGE TEXT:\n${text}`,
    maxTokens: 2500,
  });

  return parsed.jobs
    .filter((j) => j.title.trim().length > 1)
    .slice(0, 60)
    .map((j, i) => ({
      id: jobId("careers-page", company, i),
      company,
      title: j.title.trim(),
      location: j.location,
      remote: /remote|hybrid/i.test(j.location),
      url: absolutize(j.url, url),
      department: j.department,
      description: j.summary,
      postedAt: "",
      source: "careers-page",
    }));
}

function absolutize(href: string, base: string): string {
  if (!href) return base;
  try {
    return new URL(href, base).toString();
  } catch {
    return base;
  }
}
