"use client";

import { useRef, useState } from "react";
import { Button, Card, Spinner, cx } from "./ui";
import { useLang } from "./lang";
import type { CvProfile, CvReview } from "@/lib/schemas";

export type CvResult = {
  fileName: string;
  text: string;
  profile: CvProfile;
  review: CvReview;
};

export function CvUpload({
  current,
  onParsed,
  onReset,
}: {
  current: CvResult | null;
  onParsed: (r: CvResult) => void;
  onReset: () => void;
}) {
  const { lang, t } = useLang();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("lang", lang);
      const res = await fetch("/api/cv/parse", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.uploadFailed);
      onParsed(data as CvResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.uploadFailed);
    } finally {
      setBusy(false);
    }
  }

  if (current && !busy) {
    const { profile } = current;
    const meta = [
      profile.yearsExperience ? t.years(profile.yearsExperience) : "",
      t.seniority[profile.seniority] ?? profile.seniority,
      profile.location,
    ].filter(Boolean);
    return (
      <Card className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div className="flex min-w-0 flex-1 items-start gap-3.5">
          <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-brand" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M14 3v5h5M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
            <path d="M8.5 13h7M8.5 16.5h4.5" strokeLinecap="round" />
          </svg>
          <div dir="auto" className="min-w-0">
            <p className="truncate text-sm font-medium text-ink-900">{current.fileName}</p>
            <p className="truncate text-xs text-ink-500">
              {profile.headline || t.cvRead}
              {meta.length ? ` — ${meta.join(", ")}` : ""}
            </p>
          </div>
        </div>
        <Button variant="ghost" onClick={onReset}>
          {t.replaceCv}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-1.5">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void upload(file);
        }}
        onClick={() => !busy && inputRef.current?.click()}
        className={cx(
          "cursor-pointer rounded border border-dashed px-6 py-12 text-center transition-colors",
          dragging ? "border-brand bg-brand-soft" : "border-line-firm hover:border-brand hover:bg-sunk"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = "";
          }}
        />
        {busy ? (
          <div className="flex flex-col items-center gap-3">
            <Spinner className="h-5 w-5 text-brand" />
            <p className="font-display text-xl font-medium text-ink-900">{t.reading}</p>
            <p className="text-xs text-ink-500">{t.readingHint}</p>
          </div>
        ) : (
          <>
            <p className="font-display text-2xl font-medium leading-snug text-ink-900">
              {t.dropTitle}
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500">{t.dropBody}</p>
          </>
        )}
      </div>
      {error ? (
        <p className="m-1.5 rounded-sm bg-bad-soft px-3 py-2 text-xs text-bad">{error}</p>
      ) : null}
    </Card>
  );
}
