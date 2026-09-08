const LEGAL = /\b(inc|inc\.|llc|ltd|ltd\.|limited|corp|corporation|co|company|gmbh|bv|ag|sa|plc|group|holdings)\b/gi;

/** Candidate ATS/board slugs for a company name, most likely first. */
export function candidateSlugs(name: string): string[] {
  const base = name.toLowerCase().replace(LEGAL, " ").replace(/&/g, " and ").trim();
  const words = base.split(/[^a-z0-9]+/).filter(Boolean);
  const out = [
    words.join(""),
    words.join("-"),
    words[0] ?? "",
    words.slice(0, 2).join(""),
    words.slice(0, 2).join("-"),
  ];
  return [...new Set(out.filter((s) => s.length >= 2))];
}

/** Candidate own-domain roots for a company name. */
export function candidateDomains(name: string): string[] {
  const slugs = candidateSlugs(name);
  const tlds = [".com", ".co.il", ".io", ".ai", ".co"];
  const out: string[] = [];
  for (const s of slugs.slice(0, 3)) for (const t of tlds) out.push(`${s}${t}`);
  return [...new Set(out)];
}

export function jobId(source: string, company: string, raw: string | number): string {
  return `${source}:${company.toLowerCase().replace(/\s+/g, "-")}:${raw}`;
}

export function linkedinJobsUrl(company: string): string {
  return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(company)}`;
}
