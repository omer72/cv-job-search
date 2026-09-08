import { jsonCompletion } from "./ai";
import { languageInstruction, type Lang } from "./i18n";
import {
  CvProfileSchema,
  CvReviewSchema,
  UpgradedCvSchema,
  type CvProfile,
  type CvReview,
  type UpgradedCv,
} from "./schemas";

export async function extractProfile(cvText: string, lang: Lang = "en"): Promise<CvProfile> {
  return jsonCompletion({
    schema: CvProfileSchema,
    system:
      "You extract a structured profile from a CV. Use only what the CV states — never invent skills, employers or dates. `skills` are capabilities (e.g. React, distributed systems, product analytics); `tools` are named technologies and platforms. `titles` are job titles the person has held. `targetRoles` are the roles they are plausibly applying for next. `seniority` reflects their current level." +
      languageInstruction(lang),
    shape:
      '{"name":string,"headline":string,"location":string,"yearsExperience":number,"seniority":"intern"|"junior"|"mid"|"senior"|"staff"|"lead"|"manager"|"director"|"executive","summary":string,"skills":string[],"tools":string[],"titles":string[],"industries":string[],"languages":string[],"education":string[],"targetRoles":string[]}',
    user: `CV TEXT:\n${cvText.slice(0, 24000)}`,
    maxTokens: 1800,
  });
}

export async function reviewCv(cvText: string, lang: Lang = "en"): Promise<CvReview> {
  return jsonCompletion({
    schema: CvReviewSchema,
    system:
      "You are a blunt, experienced CV reviewer. Grade the CV out of 100 and give concrete, specific improvements — never generic advice like 'add more detail'. Every issue must name the exact section and the exact fix. Flag ATS problems (tables, columns, graphics, headers, missing keywords, non-standard section names), missing quantified impact, weak verbs, and length problems. In `rewrites`, take up to 4 real bullet points from the CV verbatim as `before` and give a stronger `after` for each. Keep each `before` exactly as it appears in the CV, in its original language." +
      languageInstruction(lang),
    shape:
      '{"score":number,"verdict":string,"strengths":string[],"issues":[{"severity":"high"|"medium"|"low","area":string,"problem":string,"fix":string}],"atsNotes":string[],"missingSections":string[],"keywordSuggestions":string[],"rewrites":[{"before":string,"after":string}]}',
    user: `CV TEXT:\n${cvText.slice(0, 24000)}`,
    temperature: 0.3,
    frequencyPenalty: 0.3,
    maxTokens: 2800,
  });
}

/**
 * Rewrite the CV with every issue from the review applied — the version that
 * would score 100. Facts are never invented: where a number is missing, the
 * model leaves a bracketed placeholder for the candidate to fill in.
 */
export async function upgradeCv(
  cvText: string,
  review: CvReview,
  lang: Lang = "en"
): Promise<UpgradedCv> {
  return jsonCompletion({
    schema: UpgradedCvSchema,
    system:
      "You rewrite a CV so that it scores as high as possible on the review you are given: every issue fixed, every bullet led by a result, strong verbs, standard section names, ATS-safe structure, no filler. " +
      "Work only from facts already in the CV — never invent an employer, a date, a technology or a metric. " +
      "Carry over every fact the CV states: every job, every date, every named skill, tool, language, degree and school. Never drop a role and never merge two roles. " +
      "A bracketed placeholder is only ever for a number that is genuinely absent, like [X%] or [N transactions/day]. Never put a placeholder where the CV already gives you the answer — no [List relevant databases], no [Your Degree]. If a section has no numbers to add, keep its real content as it is. " +
      "Keep the candidate's real name, contact line, employers, titles and dates exactly as they appear. Put every job under experience, newest first, with company, title and dates in the heading. Put skills, education and anything else under sections. " +
      "The changes array lists what you improved, one short line each. Keep bullets tight: at most 4 per role, one line each, never repeated. Never emit code fences or markdown — only the JSON object." +
      languageInstruction(lang),
    shape:
      '{"name":string,"headline":string,"contact":string,"summary":string,"experience":[{"heading":string,"bullets":string[]}],"sections":[{"title":string,"lines":string[]}],"changes":string[]}',
    user: `REVIEW TO SATISFY:\n${JSON.stringify({
      score: review.score,
      issues: review.issues,
      atsNotes: review.atsNotes,
      missingSections: review.missingSections,
      keywordSuggestions: review.keywordSuggestions,
    })}\n\nCURRENT CV TEXT:\n${cvText.slice(0, 16000)}`,
    temperature: 0.3,
    frequencyPenalty: 0.3,
    // A full CV rewrite is the longest response the app asks for.
    maxTokens: 4500,
  });
}
