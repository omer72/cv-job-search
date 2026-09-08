"use client";

import { useMemo, useState } from "react";
import { Badge, Bullets, Card, GroupLabel, Meter, SectionTitle, cx, fitLabel, scoreTone } from "./ui";
import type { ScoredJob } from "@/lib/schemas";

const FIT_LABEL = { under: "below your level", match: "level match", over: "above your level" } as const;
const LOC_TONE = { good: "good", unclear: "neutral", poor: "bad" } as const;
// Written out rather than interpolated so Tailwind sees every class it must generate.
const FIT_TEXT = { good: "text-good", info: "text-info", warn: "text-warn", bad: "text-bad" } as const;

export function MatchResults({ jobs }: { jobs: ScoredJob[] }) {
  const [minScore, setMinScore] = useState(0);
  const [company, setCompany] = useState("all");
  const [open, setOpen] = useState<string | null>(null);

  const companies = useMemo(() => [...new Set(jobs.map((j) => j.company))].sort(), [jobs]);

  const visible = jobs.filter(
    (j) => j.match.score >= minScore && (company === "all" || j.company === company)
  );

  if (!jobs.length) {
    return (
      <Card className="px-6 py-12 text-center">
        <p className="font-display text-xl font-medium text-ink-900">Your ranked roles land here</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500">
          Name the companies you want to work at and run the search. Every opening they have gets a
          fit score, best first.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line px-6 py-5">
        <SectionTitle hint={visible.length === jobs.length ? undefined : `${visible.length} of ${jobs.length}`}>
          {jobs.length} roles scored
        </SectionTitle>
        <div className="flex flex-wrap items-center gap-5">
          <label className="flex items-center gap-2 text-xs text-ink-500">
            Fit at least
            <input
              type="range"
              min={0}
              max={90}
              step={5}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-24 accent-[var(--color-brand)]"
            />
            <span className="tnum w-8 font-medium text-ink-900">{minScore}%</span>
          </label>
          <select
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="rounded-sm border border-line-firm bg-surface px-2 py-1 text-xs text-ink-700"
          >
            <option value="all">All companies</option>
            {companies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ul className="divide-y divide-line">
        {visible.map((job, rank) => {
          const expanded = open === job.id;
          const tone = scoreTone(job.match.score);
          return (
            <li key={job.id} className={cx(expanded && "bg-sunk")}>
              <button
                onClick={() => setOpen(expanded ? null : job.id)}
                aria-expanded={expanded}
                className="flex w-full items-center gap-5 px-6 py-4 text-left transition-colors hover:bg-sunk"
              >
                <span className="font-display w-6 shrink-0 text-sm text-ink-300">{rank + 1}</span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink-900">{job.title}</span>
                  <span className="block truncate text-xs text-ink-500">
                    {[job.company, job.location, job.department].filter(Boolean).join(" · ")}
                  </span>
                  <span className="mt-1 line-clamp-1 block text-xs text-ink-700">{job.match.verdict}</span>
                </span>

                <span className="hidden w-40 shrink-0 sm:block">
                  <Meter score={job.match.score} />
                  <span className="mt-1.5 flex items-baseline justify-between">
                    <span className={cx("text-[11px]", FIT_TEXT[tone])}>{fitLabel(job.match.score)}</span>
                    <span className="tnum font-display text-lg leading-none text-ink-900">
                      {job.match.score}
                    </span>
                  </span>
                </span>

                <span className={cx("tnum font-display shrink-0 text-lg sm:hidden", FIT_TEXT[tone])}>
                  {job.match.score}
                </span>

                <svg
                  viewBox="0 0 24 24"
                  className={cx("h-4 w-4 shrink-0 text-ink-300 transition-transform", expanded && "rotate-180")}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" />
                </svg>
              </button>

              {expanded ? (
                <div className="space-y-5 border-t border-line px-6 py-5 pl-[3.6rem]">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <ChipList
                      label="Lines up with your CV"
                      tone="good"
                      values={job.match.matchedSkills}
                      empty="Nothing lines up directly."
                    />
                    <ChipList
                      label="Not in your CV"
                      tone="bad"
                      values={job.match.missingSkills}
                      empty="No obvious gaps."
                    />
                  </div>

                  {job.match.reasons.length ? (
                    <div>
                      <GroupLabel>Why this score</GroupLabel>
                      <Bullets items={job.match.reasons} />
                    </div>
                  ) : null}

                  {job.match.cvTweaks.length ? (
                    <div className="border-l-2 border-brand pl-4">
                      <GroupLabel>Change this to improve your odds here</GroupLabel>
                      <Bullets items={job.match.cvTweaks} dot="bg-brand" />
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-ink-500">
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-sm bg-brand px-3 py-1.5 font-medium text-white transition-colors hover:bg-brand-ink"
                    >
                      Read the posting
                    </a>
                    <Badge>{FIT_LABEL[job.match.seniorityFit]}</Badge>
                    <Badge tone={LOC_TONE[job.match.locationFit]}>location {job.match.locationFit}</Badge>
                    {job.remote ? <Badge tone="info">remote</Badge> : null}
                    <span>from {job.source}</span>
                    {job.postedAt ? <span>posted {new Date(job.postedAt).toLocaleDateString()}</span> : null}
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {!visible.length ? (
        <p className="px-6 py-10 text-center text-sm text-ink-500">
          Nothing at {minScore}% fit or above. Lower the threshold to see more.
        </p>
      ) : null}
    </Card>
  );
}

function ChipList({
  label,
  values,
  tone,
  empty,
}: {
  label: string;
  values: string[];
  tone: "good" | "bad";
  empty: string;
}) {
  return (
    <div>
      <GroupLabel>{label}</GroupLabel>
      {values.length ? (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <Badge key={v} tone={tone}>
              {v}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink-500">{empty}</p>
      )}
    </div>
  );
}
