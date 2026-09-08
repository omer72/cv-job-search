import { z } from "zod";
import { jsonCompletion } from "./ai";
import { MatchSchema, type CvProfile, type Job, type Match, type ScoredJob } from "./schemas";

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#.]+/g, " ").trim();

/**
 * Cheap deterministic pre-score so we only spend model calls on the jobs that
 * could plausibly fit. Combines skill overlap with title/seniority signals.
 */
export function preScore(profile: CvProfile, job: Job): number {
  const haystack = norm(`${job.title} ${job.department} ${job.description}`);
  const terms = [...profile.skills, ...profile.tools].map(norm).filter((t) => t.length > 1);
  const hits = terms.filter((t) => haystack.includes(t)).length;
  const skillScore = terms.length ? hits / Math.min(terms.length, 18) : 0;

  const titleWords = new Set(norm(job.title).split(" "));
  const titleScore = profile.titles.concat(profile.targetRoles).reduce((best, t) => {
    const words = norm(t).split(" ").filter(Boolean);
    if (!words.length) return best;
    const overlap = words.filter((w) => titleWords.has(w)).length / words.length;
    return Math.max(best, overlap);
  }, 0);

  const order = ["intern", "junior", "mid", "senior", "staff", "lead", "manager", "director", "executive"];
  const jobLevel = order.findIndex((l) => new RegExp(`\\b${l}\\b`, "i").test(job.title));
  const mine = order.indexOf(profile.seniority);
  const levelPenalty = jobLevel === -1 ? 0 : Math.min(Math.abs(jobLevel - mine), 4) * 0.06;

  return Math.max(0, Math.min(1, skillScore * 0.55 + titleScore * 0.45 - levelPenalty));
}

const BatchSchema = z.object({ matches: z.array(MatchSchema) });

function fallbackMatch(job: Job, profile: CvProfile): Match {
  return {
    jobId: job.id,
    score: Math.round(preScore(profile, job) * 100),
    verdict: "Heuristic score only — detailed analysis unavailable.",
    matchedSkills: [],
    missingSkills: [],
    seniorityFit: "match",
    locationFit: "unclear",
    reasons: [],
    cvTweaks: [],
  };
}

/**
 * Score jobs against the CV. Jobs are pre-ranked heuristically, the top
 * `deep` of them get an LLM analysis, the rest keep the heuristic score.
 */
export async function scoreJobs(
  profile: CvProfile,
  jobs: Job[],
  deep = 24
): Promise<ScoredJob[]> {
  const ranked = [...jobs].sort((a, b) => preScore(profile, b) - preScore(profile, a));
  const top = ranked.slice(0, deep);
  const rest = ranked.slice(deep);

  const chunks: Job[][] = [];
  for (let i = 0; i < top.length; i += 6) chunks.push(top.slice(i, i + 6));

  const cvBlob = JSON.stringify({
    headline: profile.headline,
    seniority: profile.seniority,
    yearsExperience: profile.yearsExperience,
    location: profile.location,
    skills: profile.skills,
    tools: profile.tools,
    titles: profile.titles,
    industries: profile.industries,
    summary: profile.summary,
  });

  const analysed = await Promise.all(
    chunks.map(async (chunk) => {
      try {
        const res = await jsonCompletion({
          schema: BatchSchema,
          system:
            "You are a technical recruiter scoring how well a candidate's CV fits specific job openings. Be calibrated and honest: 85-100 strong fit, 65-84 worth applying, 40-64 a stretch, below 40 poor fit. Weight required skills and seniority most, then domain and location. Use only evidence in the CV. Return one entry per job, with jobId copied exactly.",
          shape:
            '{"matches":[{"jobId":string,"score":number,"verdict":string (one sentence),"matchedSkills":string[],"missingSkills":string[],"seniorityFit":"under"|"match"|"over","locationFit":"good"|"unclear"|"poor","reasons":string[],"cvTweaks":string[] (specific edits that would raise this score)}]}',
          user: `CANDIDATE CV PROFILE:\n${cvBlob}\n\nJOBS:\n${JSON.stringify(
            chunk.map((j) => ({
              jobId: j.id,
              company: j.company,
              title: j.title,
              location: j.location,
              remote: j.remote,
              department: j.department,
              description: j.description.slice(0, 2500),
            }))
          )}`,
          maxTokens: 3000,
        });
        const byId = new Map(res.matches.map((m) => [m.jobId, m]));
        return chunk.map((j) => byId.get(j.id) ?? fallbackMatch(j, profile));
      } catch {
        return chunk.map((j) => fallbackMatch(j, profile));
      }
    })
  );

  const matches = new Map<string, Match>();
  for (const m of analysed.flat()) matches.set(m.jobId, m);

  return [...top, ...rest]
    .map((job) => ({ ...job, match: matches.get(job.id) ?? fallbackMatch(job, profile) }))
    .sort((a, b) => b.match.score - a.match.score);
}
