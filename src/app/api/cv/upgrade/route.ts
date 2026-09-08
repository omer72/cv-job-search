import { NextResponse } from "next/server";
import { z } from "zod";
import { reviewCv, upgradeCv } from "@/lib/cv";
import { STRINGS } from "@/lib/i18n";
import { rateLimit } from "@/lib/ratelimit";
import { CvReviewSchema, upgradedCvToText, type UpgradeResult } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 120;

const Body = z.object({
  text: z.string().min(200),
  review: CvReviewSchema,
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
    const { text, review, lang } = parsed.data;

    const limited = rateLimit(req, {
      name: "cv-upgrade",
      max: 8,
      windowMs: 60 * 60 * 1000,
      message: STRINGS[lang].errRateLimited,
    });
    if (limited) return limited;

    const cv = await upgradeCv(text, review, lang);

    // Score the rewrite the same way the original was scored, so the number
    // shown to the user is measured rather than claimed.
    const rescored = await reviewCv(upgradedCvToText(cv), lang);
    const upgraded: UpgradeResult = {
      cv,
      score: rescored.score,
      remainingIssues: rescored.issues.length,
      review: rescored,
    };
    return NextResponse.json({ upgraded });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Rewrite failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
