import { jobId } from "./slug.ts";
import type { Job } from "./schemas";

/**
 * Israeli Tech Map (github.com/mluggy/techmap) publishes one CSV per job type,
 * refreshed daily, under the Open Database License. Fetched straight from the
 * raw files — no key, no scraping.
 */
const BASE = "https://raw.githubusercontent.com/mluggy/techmap/main/jobs";

export const TECHMAP_TYPES = [
  "software",
  "frontend",
  "data-science",
  "devops",
  "qa",
  "security",
  "hardware",
  "product",
  "design",
  "project-management",
  "marketing",
  "sales",
  "business",
  "finance",
  "hr",
  "legal",
  "support",
  "admin",
  "procurement-operations",
] as const;

export type TechmapType = (typeof TECHMAP_TYPES)[number];

export const TECHMAP_SOURCE = "techmap";
export const TECHMAP_CREDIT_URL = "https://github.com/mluggy/techmap";

/** Minimal RFC 4180 reader: quoted fields, escaped quotes, CRLF, BOM. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  for (let i = 0; i < src.length; i++) {
    const char = src[i];
    if (quoted) {
      if (char === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  row.push(field);
  if (row.some((c) => c !== "")) rows.push(row);
  return rows;
}

export type TechmapRow = {
  company: string;
  category: string;
  size: string;
  title: string;
  level: string;
  city: string;
  url: string;
  updated: string;
};

export function rowsToRecords(rows: string[][]): TechmapRow[] {
  if (!rows.length) return [];
  const header = rows[0]!.map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((row) => {
    const record: Record<string, string> = {};
    header.forEach((key, i) => (record[key] = (row[i] ?? "").trim()));
    return record as TechmapRow;
  });
}

export type TechmapFilter = {
  types: TechmapType[];
  /** Free text matched against the title, company and industry. */
  query?: string;
  city?: string;
  level?: string;
  limit?: number;
};

const norm = (s: string) => s.toLowerCase().trim();

export function filterRows(records: TechmapRow[], filter: TechmapFilter): TechmapRow[] {
  const terms = (filter.query ?? "")
    .split(/[,\s]+/)
    .map(norm)
    .filter(Boolean);
  const city = norm(filter.city ?? "");
  const level = norm(filter.level ?? "");

  return records.filter((r) => {
    if (city && !norm(r.city).includes(city)) return false;
    if (level && norm(r.level) !== level) return false;
    if (!terms.length) return true;
    const haystack = norm(`${r.title} ${r.company} ${r.category} ${r.level}`);
    return terms.some((term) => haystack.includes(term));
  });
}

export function rowToJob(row: TechmapRow, type: TechmapType, index: number): Job {
  const detail = [row.level, row.category].filter(Boolean).join(", ");
  return {
    id: jobId(TECHMAP_SOURCE, row.company, `${type}-${index}`),
    company: row.company,
    title: row.title,
    location: row.city,
    remote: /remote|היברידי|מרחוק/i.test(`${row.city} ${row.title}`),
    url: row.url,
    department: type,
    // The feed carries no job description, so the scorer gets what there is.
    description: detail ? `${row.title} — ${detail}. ${row.city}` : row.title,
    postedAt: row.updated,
    source: TECHMAP_SOURCE,
  };
}

/** Fetch and filter the selected job types. Files are cached for an hour. */
export async function fetchTechmapJobs(filter: TechmapFilter): Promise<Job[]> {
  const types = filter.types.length ? filter.types : (["software"] as TechmapType[]);
  const perType = await Promise.all(
    types.map(async (type) => {
      try {
        const res = await fetch(`${BASE}/${type}.csv`, { next: { revalidate: 3600 } });
        if (!res.ok) return [];
        const records = rowsToRecords(parseCsv(await res.text()));
        return filterRows(records, filter).map((row, i) => rowToJob(row, type, i));
      } catch {
        return [];
      }
    })
  );

  const seen = new Set<string>();
  const jobs: Job[] = [];
  for (const job of perType.flat()) {
    if (!job.title || !job.url || seen.has(job.url)) continue;
    seen.add(job.url);
    jobs.push(job);
  }
  // Newest first, so a capped list keeps the freshest postings.
  jobs.sort((a, b) => (a.postedAt < b.postedAt ? 1 : a.postedAt > b.postedAt ? -1 : 0));
  return jobs.slice(0, filter.limit ?? 200);
}
