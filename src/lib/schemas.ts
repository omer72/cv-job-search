import { z } from "zod";

export const seniorityLevels = [
  "intern",
  "junior",
  "mid",
  "senior",
  "staff",
  "lead",
  "manager",
  "director",
  "executive",
] as const;

export const CvProfileSchema = z.object({
  name: z.string().default(""),
  headline: z.string().default(""),
  location: z.string().default(""),
  yearsExperience: z.number().min(0).max(60).default(0),
  seniority: z.enum(seniorityLevels).default("mid"),
  summary: z.string().default(""),
  skills: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  titles: z.array(z.string()).default([]),
  industries: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  education: z.array(z.string()).default([]),
  targetRoles: z.array(z.string()).default([]),
});
export type CvProfile = z.infer<typeof CvProfileSchema>;

export const CvIssueSchema = z.object({
  severity: z.enum(["high", "medium", "low"]),
  area: z.string(),
  problem: z.string(),
  fix: z.string(),
});
export type CvIssue = z.infer<typeof CvIssueSchema>;

export const CvReviewSchema = z.object({
  score: z.number().min(0).max(100),
  verdict: z.string(),
  strengths: z.array(z.string()).default([]),
  issues: z.array(CvIssueSchema).default([]),
  atsNotes: z.array(z.string()).default([]),
  missingSections: z.array(z.string()).default([]),
  keywordSuggestions: z.array(z.string()).default([]),
  rewrites: z
    .array(z.object({ before: z.string(), after: z.string() }))
    .default([]),
});
export type CvReview = z.infer<typeof CvReviewSchema>;

export const UpgradedCvSchema = z.object({
  name: z.string().default(""),
  headline: z.string().default(""),
  contact: z.string().default(""),
  summary: z.string().default(""),
  /** One entry per role, newest first; the heading carries company, title and dates. */
  experience: z
    .array(z.object({ heading: z.string(), bullets: z.array(z.string()).default([]) }))
    .default([]),
  /** Everything else — skills, education, projects — as a title and its lines. */
  sections: z
    .array(z.object({ title: z.string(), lines: z.array(z.string()).default([]) }))
    .default([]),
  changes: z.array(z.string()).default([]),
});
export type UpgradedCv = z.infer<typeof UpgradedCvSchema>;

/** Flatten a rewrite into plain text — what the user copies, and what we re-score. */
export function upgradedCvToText(cv: UpgradedCv): string {
  const lines: string[] = [];
  if (cv.name) lines.push(cv.name);
  if (cv.headline) lines.push(cv.headline);
  if (cv.contact) lines.push(cv.contact);
  if (cv.summary) lines.push("", cv.summary);
  if (cv.experience.length) {
    lines.push("", "EXPERIENCE");
    for (const role of cv.experience) {
      lines.push(role.heading);
      for (const bullet of role.bullets) lines.push(`\u2022 ${bullet}`);
      lines.push("");
    }
  }
  for (const section of cv.sections) {
    lines.push("", section.title.toUpperCase());
    for (const line of section.lines) lines.push(line);
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** True when the rewrite left a bracket for the candidate to fill, e.g. "[X%]". */
export function hasPlaceholders(cv: UpgradedCv): boolean {
  const text = [
    cv.summary,
    ...cv.experience.flatMap((e) => [e.heading, ...e.bullets]),
    ...cv.sections.flatMap((s) => [s.title, ...s.lines]),
  ].join(" ");
  return /\[[^\]]+\]/.test(text);
}

/** A rewrite, the score it actually earns, and the review of it to iterate on. */
export type UpgradeResult = {
  cv: UpgradedCv;
  score: number;
  remainingIssues: number;
  review: CvReview;
};

export const JobSchema = z.object({
  id: z.string(),
  company: z.string(),
  title: z.string(),
  location: z.string().default(""),
  remote: z.boolean().default(false),
  url: z.string(),
  department: z.string().default(""),
  description: z.string().default(""),
  postedAt: z.string().default(""),
  source: z.string().default(""),
});
export type Job = z.infer<typeof JobSchema>;

export const CompanyResultSchema = z.object({
  company: z.string(),
  source: z.string(),
  careersUrl: z.string().default(""),
  linkedinUrl: z.string().default(""),
  jobs: z.array(JobSchema).default([]),
  note: z.string().default(""),
});
export type CompanyResult = z.infer<typeof CompanyResultSchema>;

export const MatchSchema = z.object({
  jobId: z.string(),
  score: z.number().min(0).max(100),
  verdict: z.string(),
  matchedSkills: z.array(z.string()).default([]),
  missingSkills: z.array(z.string()).default([]),
  seniorityFit: z.enum(["under", "match", "over"]).default("match"),
  locationFit: z.enum(["good", "unclear", "poor"]).default("unclear"),
  reasons: z.array(z.string()).default([]),
  cvTweaks: z.array(z.string()).default([]),
});
export type Match = z.infer<typeof MatchSchema>;

export type ScoredJob = Job & { match: Match };
