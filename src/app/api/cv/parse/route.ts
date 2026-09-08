import { NextResponse } from "next/server";
import { pdfToText } from "@/lib/pdf";
import { extractProfile, reviewCv } from "@/lib/cv";
import { STRINGS, type Lang } from "@/lib/i18n";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }
    if (!/pdf$/i.test(file.type) && !/\.pdf$/i.test(file.name)) {
      return NextResponse.json({ error: "Please upload a PDF." }, { status: 400 });
    }
    if (file.size > 12 * 1024 * 1024) {
      return NextResponse.json({ error: "PDF is larger than 12 MB." }, { status: 400 });
    }

    const lang: Lang = form.get("lang") === "he" ? "he" : "en";

    // Two model calls per upload, so this is the tightest budget of the three.
    const limited = rateLimit(req, {
      name: "cv-parse",
      max: 8,
      windowMs: 60 * 60 * 1000,
      message: STRINGS[lang].errRateLimited,
    });
    if (limited) return limited;

    const text = await pdfToText(await file.arrayBuffer());
    if (text.replace(/\s/g, "").length < 200) {
      return NextResponse.json(
        {
          error:
            "Almost no text could be read from that PDF. It is probably a scan or an image export — upload a text-based PDF (e.g. LinkedIn's 'Save to PDF' or an export from Word/Docs).",
        },
        { status: 422 }
      );
    }

    const [profile, review] = await Promise.all([
      extractProfile(text, lang),
      reviewCv(text, lang),
    ]);
    return NextResponse.json({ fileName: file.name, text, profile, review });
  } catch (err) {
    const message = err instanceof Error ? err.message : "CV parsing failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
