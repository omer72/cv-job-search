import { getJson } from "./http";
import { htmlToText } from "./http";
import { candidateSlugs, jobId } from "./slug";
import type { Job } from "./schemas";

export type BoardHit = { source: string; careersUrl: string; jobs: Job[] };

const clip = (s: unknown, n = 4000) =>
  typeof s === "string" ? htmlToText(s).slice(0, n) : "";

type Provider = (slug: string, company: string) => Promise<BoardHit | null>;

const greenhouse: Provider = async (slug, company) => {
  type R = {
    jobs?: {
      id: number;
      title: string;
      absolute_url: string;
      content?: string;
      updated_at?: string;
      location?: { name?: string };
      departments?: { name?: string }[];
    }[];
  };
  const data = await getJson<R>(
    `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`
  );
  if (!data?.jobs?.length) return null;
  return {
    source: "greenhouse",
    careersUrl: `https://boards.greenhouse.io/${slug}`,
    jobs: data.jobs.map((j) => ({
      id: jobId("greenhouse", company, j.id),
      company,
      title: j.title,
      location: j.location?.name ?? "",
      remote: /remote/i.test(j.location?.name ?? ""),
      url: j.absolute_url,
      department: j.departments?.[0]?.name ?? "",
      description: clip(j.content),
      postedAt: j.updated_at ?? "",
      source: "greenhouse",
    })),
  };
};

const lever: Provider = async (slug, company) => {
  type R = {
    id: string;
    text: string;
    hostedUrl: string;
    descriptionPlain?: string;
    createdAt?: number;
    workplaceType?: string;
    categories?: { location?: string; team?: string };
  }[];
  const data = await getJson<R>(`https://api.lever.co/v0/postings/${slug}?mode=json`);
  if (!Array.isArray(data) || !data.length) return null;
  return {
    source: "lever",
    careersUrl: `https://jobs.lever.co/${slug}`,
    jobs: data.map((j) => ({
      id: jobId("lever", company, j.id),
      company,
      title: j.text,
      location: j.categories?.location ?? "",
      remote: j.workplaceType === "remote" || /remote/i.test(j.categories?.location ?? ""),
      url: j.hostedUrl,
      department: j.categories?.team ?? "",
      description: clip(j.descriptionPlain),
      postedAt: j.createdAt ? new Date(j.createdAt).toISOString() : "",
      source: "lever",
    })),
  };
};

const ashby: Provider = async (slug, company) => {
  type R = {
    jobs?: {
      id: string;
      title: string;
      location?: string;
      department?: string;
      jobUrl: string;
      isRemote?: boolean;
      publishedAt?: string;
      descriptionPlain?: string;
      descriptionHtml?: string;
    }[];
  };
  const data = await getJson<R>(
    `https://api.ashbyhq.com/posting-api/job-board/${slug}?includeCompensation=false`
  );
  if (!data?.jobs?.length) return null;
  return {
    source: "ashby",
    careersUrl: `https://jobs.ashbyhq.com/${slug}`,
    jobs: data.jobs.map((j) => ({
      id: jobId("ashby", company, j.id),
      company,
      title: j.title,
      location: j.location ?? "",
      remote: Boolean(j.isRemote),
      url: j.jobUrl,
      department: j.department ?? "",
      description: clip(j.descriptionPlain || j.descriptionHtml),
      postedAt: j.publishedAt ?? "",
      source: "ashby",
    })),
  };
};

const smartrecruiters: Provider = async (slug, company) => {
  type R = {
    content?: {
      id: string;
      name: string;
      department?: { label?: string };
      releasedDate?: string;
      location?: { city?: string; country?: string; remote?: boolean };
    }[];
  };
  const data = await getJson<R>(
    `https://api.smartrecruiters.com/v1/companies/${slug}/postings?limit=100`
  );
  if (!data?.content?.length) return null;
  return {
    source: "smartrecruiters",
    careersUrl: `https://jobs.smartrecruiters.com/${slug}`,
    jobs: data.content.map((j) => ({
      id: jobId("smartrecruiters", company, j.id),
      company,
      title: j.name,
      location: [j.location?.city, j.location?.country].filter(Boolean).join(", "),
      remote: Boolean(j.location?.remote),
      url: `https://jobs.smartrecruiters.com/${slug}/${j.id}`,
      department: j.department?.label ?? "",
      description: "",
      postedAt: j.releasedDate ?? "",
      source: "smartrecruiters",
    })),
  };
};

const recruitee: Provider = async (slug, company) => {
  type R = {
    offers?: {
      id: number;
      title: string;
      location?: string;
      department?: string;
      careers_url?: string;
      careers_apply_url?: string;
      description?: string;
      published_at?: string;
      remote?: boolean;
    }[];
  };
  const data = await getJson<R>(`https://${slug}.recruitee.com/api/offers/`);
  if (!data?.offers?.length) return null;
  return {
    source: "recruitee",
    careersUrl: `https://${slug}.recruitee.com/`,
    jobs: data.offers.map((j) => ({
      id: jobId("recruitee", company, j.id),
      company,
      title: j.title,
      location: j.location ?? "",
      remote: Boolean(j.remote),
      url: j.careers_url || j.careers_apply_url || `https://${slug}.recruitee.com/`,
      department: j.department ?? "",
      description: clip(j.description),
      postedAt: j.published_at ?? "",
      source: "recruitee",
    })),
  };
};

const workable: Provider = async (slug, company) => {
  type R = {
    jobs?: {
      id: string;
      shortcode?: string;
      title: string;
      department?: string;
      url?: string;
      application_url?: string;
      published_on?: string;
      location?: { city?: string; country?: string; telecommuting?: boolean };
    }[];
  };
  const data = await getJson<R>(
    `https://apply.workable.com/api/v1/widget/accounts/${slug}?details=true`
  );
  if (!data?.jobs?.length) return null;
  return {
    source: "workable",
    careersUrl: `https://apply.workable.com/${slug}/`,
    jobs: data.jobs.map((j) => ({
      id: jobId("workable", company, j.shortcode || j.id),
      company,
      title: j.title,
      location: [j.location?.city, j.location?.country].filter(Boolean).join(", "),
      remote: Boolean(j.location?.telecommuting),
      url:
        j.url ||
        j.application_url ||
        `https://apply.workable.com/${slug}/j/${j.shortcode ?? ""}/`,
      department: j.department ?? "",
      description: "",
      postedAt: j.published_on ?? "",
      source: "workable",
    })),
  };
};

const PROVIDERS: Provider[] = [
  greenhouse,
  lever,
  ashby,
  smartrecruiters,
  recruitee,
  workable,
];

/**
 * Try every known public ATS board API against every plausible slug for the
 * company. Returns the board with the most postings, or null if none matched.
 */
export async function findBoard(company: string, extraSlugs: string[] = []): Promise<BoardHit | null> {
  const slugs = [...new Set([...extraSlugs, ...candidateSlugs(company)])].slice(0, 4);
  const attempts: Promise<BoardHit | null>[] = [];
  for (const slug of slugs) for (const p of PROVIDERS) attempts.push(p(slug, company).catch(() => null));
  const results = (await Promise.all(attempts)).filter(Boolean) as BoardHit[];
  if (!results.length) return null;
  results.sort((a, b) => b.jobs.length - a.jobs.length);
  return results[0];
}
