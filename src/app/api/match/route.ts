import { NextResponse } from "next/server";
import { z } from "zod";
import { preScore, scoreJobs } from "@/lib/match";
import { CvProfileSchema, JobSchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 180;

const Body = z.object({
  profile: CvProfileSchema,
  jobs: z.array(JobSchema),
  deep: z.number().min(1).max(60).optional(),
});

export async function POST(req: Request) {
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Bad request." }, { status: 400 });
    }
    const { profile, jobs, deep } = parsed.data;
    if (!jobs.length) return NextResponse.json({ scored: [] });

    // Too many openings to score is not an error: keep the best-ranked 300 and drop the tail.
    const capped =
      jobs.length > 300
        ? [...jobs].sort((a, b) => preScore(profile, b) - preScore(profile, a)).slice(0, 300)
        : jobs;

    const scored = await scoreJobs(profile, capped, deep ?? 24);
    return NextResponse.json({ scored });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Matching failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
