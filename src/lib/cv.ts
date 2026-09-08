import { jsonCompletion } from "./ai";
import { CvProfileSchema, CvReviewSchema, type CvProfile, type CvReview } from "./schemas";

export async function extractProfile(cvText: string): Promise<CvProfile> {
  return jsonCompletion({
    schema: CvProfileSchema,
    system:
      "You extract a structured profile from a CV. Use only what the CV states — never invent skills, employers or dates. `skills` are capabilities (e.g. React, distributed systems, product analytics); `tools` are named technologies and platforms. `titles` are job titles the person has held. `targetRoles` are the roles they are plausibly applying for next. `seniority` reflects their current level.",
    shape:
      '{"name":string,"headline":string,"location":string,"yearsExperience":number,"seniority":"intern"|"junior"|"mid"|"senior"|"staff"|"lead"|"manager"|"director"|"executive","summary":string,"skills":string[],"tools":string[],"titles":string[],"industries":string[],"languages":string[],"education":string[],"targetRoles":string[]}',
    user: `CV TEXT:\n${cvText.slice(0, 24000)}`,
    maxTokens: 1800,
  });
}

export async function reviewCv(cvText: string): Promise<CvReview> {
  return jsonCompletion({
    schema: CvReviewSchema,
    system:
      "You are a blunt, experienced CV reviewer. Grade the CV out of 100 and give concrete, specific improvements — never generic advice like 'add more detail'. Every issue must name the exact section and the exact fix. Flag ATS problems (tables, columns, graphics, headers, missing keywords, non-standard section names), missing quantified impact, weak verbs, and length problems. In `rewrites`, take up to 4 real bullet points from the CV verbatim as `before` and give a stronger `after` for each.",
    shape:
      '{"score":number,"verdict":string,"strengths":string[],"issues":[{"severity":"high"|"medium"|"low","area":string,"problem":string,"fix":string}],"atsNotes":string[],"missingSections":string[],"keywordSuggestions":string[],"rewrites":[{"before":string,"after":string}]}',
    user: `CV TEXT:\n${cvText.slice(0, 24000)}`,
    temperature: 0.3,
    maxTokens: 2800,
  });
}
