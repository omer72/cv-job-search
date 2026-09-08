"use client";

import { useRef, useState } from "react";
import { Button, Card, Spinner, cx } from "./ui";
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
      const res = await fetch("/api/cv/parse", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      onParsed(data as CvResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  if (current && !busy) {
    return (
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/12 dark:text-indigo-300">
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M14 3v5h5M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{current.fileName}</p>
            <p className="truncate text-xs text-ink-400">
              {current.profile.headline || "CV parsed"}
              {current.profile.yearsExperience
                ? ` · ${current.profile.yearsExperience} yrs · ${current.profile.seniority}`
                : ""}
            </p>
          </div>
        </div>
        <Button variant="ghost" onClick={onReset}>
          Replace CV
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-2">
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
          "cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition",
          dragging
            ? "border-indigo-400 bg-indigo-50/60 dark:bg-indigo-500/8"
            : "border-black/10 hover:border-indigo-300 hover:bg-ink-50/60 dark:border-white/12 dark:hover:bg-white/[0.04]"
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
          <div className="flex flex-col items-center gap-3 text-sm text-ink-600 dark:text-ink-200">
            <Spinner className="h-6 w-6 text-indigo-600" />
            <p className="font-medium">Reading and reviewing your CV…</p>
            <p className="text-xs text-ink-400">Extraction and review run together — usually 10–25 seconds.</p>
          </div>
        ) : (
          <>
            <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/12 dark:text-indigo-300">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 16V4m0 0L8 8m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm font-medium">Drop your CV here, or click to choose a file</p>
            <p className="mt-1 text-xs text-ink-400">
              PDF only — your own CV or LinkedIn&apos;s &ldquo;Save to PDF&rdquo; export. Max 12 MB.
            </p>
          </>
        )}
      </div>
      {error ? (
        <p className="mx-2 mb-2 mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </p>
      ) : null}
    </Card>
  );
}
