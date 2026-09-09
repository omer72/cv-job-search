import { NextResponse } from "next/server";
import { z } from "zod";
import { STRINGS } from "@/lib/i18n";
import { rateLimit } from "@/lib/ratelimit";
import { TECHMAP_TYPES, fetchTechmapJobs } from "@/lib/techmap";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  types: z.array(z.enum(TECHMAP_TYPES)).min(1).max(TECHMAP_TYPES.length),
  query: z.string().max(200).optional(),
  city: z.string().max(80).optional(),
  level: z.string().max(40).optional(),
  limit: z.number().min(1).max(300).optional(),
  lang: z.enum(["en", "he"]).default("en"),
});

export async function POST(req: Request) {
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Bad request." },
        { status: 400 }
      );
    }
    const { lang, ...filter } = parsed.data;

    const limited = rateLimit(req, {
      name: "techmap",
      max: 40,
      windowMs: 60 * 60 * 1000,
      message: STRINGS[lang].errRateLimited,
    });
    if (limited) return limited;

    const jobs = await fetchTechmapJobs(filter);
    return NextResponse.json({ jobs });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Job feed unavailable.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
