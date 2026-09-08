"use client";

import { useMemo, useState } from "react";
import { Badge, Card, ScoreRing, SectionTitle, cx, scoreTone } from "./ui";
import type { ScoredJob } from "@/lib/schemas";

const FIT_LABEL = { under: "below your level", match: "level match", over: "above your level" } as const;
const LOC_TONE = { good: "good", unclear: "neutral", poor: "bad" } as const;

export function MatchResults({ jobs }: { jobs: ScoredJob[] }) {
  const [minScore, setMinScore] = useState(0);
  const [company, setCompany] = useState("all");
  const [open, setOpen] = useState<string | null>(null);

  const companies = useMemo(
    () => [...new Set(jobs.map((j) => j.company))].sort(),
    [jobs]
  );

  const visible = jobs.filter(
    (j) => j.match.score >= minScore && (company === "all" || j.company === company)
  );

  if (!jobs.length) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm font-medium text-ink-600 dark:text-ink-200">No openings scored yet</p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-ink-400">
          Add the companies you care about and run the search. Roles appear here ranked by how well
          your CV actually fits them.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <SectionTitle hint={`${visible.length} of ${jobs.length} roles`}>Matches</SectionTitle>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-ink-400">
            min fit
            <input
              type="range"
              min={0}
              max={90}
              step={5}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-28 accent-indigo-600"
            />
            <span className="w-8 tabular-nums font-medium text-ink-600 dark:text-ink-200">{minScore}%</span>
          </label>
          <select
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-xs dark:border-white/12 dark:bg-white/5"
          >
            <option value="all">All companies</option>
            {companies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {visible.map((job) => {
        const expanded = open === job.id;
        return (
          <Card key={job.id} className="overflow-hidden">
            <button
              onClick={() => setOpen(expanded ? null : job.id)}
              className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-black/[0.015] dark:hover:bg-white/[0.02]"
            >
              <ScoreRing score={job.match.score} size={52} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-800 dark:text-ink-100">{job.title}</p>
                <p className="truncate text-xs text-ink-400">
                  {job.company}
                  {job.location ? ` · ${job.location}` : ""}
                  {job.department ? ` · ${job.department}` : ""}
                </p>
                <p className="mt-1 line-clamp-1 text-xs text-ink-600 dark:text-ink-200">{job.match.verdict}</p>
              </div>
              <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                <Badge tone={scoreTone(job.match.score)}>
                  {job.match.score >= 85
                    ? "strong fit"
                    : job.match.score >= 65
                      ? "worth applying"
                      : job.match.score >= 40
                        ? "a stretch"
                        : "poor fit"}
                </Badge>
                <Badge>{FIT_LABEL[job.match.seniorityFit]}</Badge>
              </div>
              <svg
                viewBox="0 0 24 24"
                className={cx("h-4 w-4 shrink-0 text-ink-400 transition", expanded && "rotate-180")}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" />
              </svg>
            </button>

            {expanded ? (
              <div className="space-y-4 border-t border-black/5 p-5 dark:border-white/8">
                <div className="grid gap-4 sm:grid-cols-2">
                  <ChipList
                    label="Matched"
                    tone="good"
                    values={job.match.matchedSkills}
                    empty="Nothing in your CV lines up directly."
                  />
                  <ChipList
                    label="Missing"
                    tone="bad"
                    values={job.match.missingSkills}
                    empty="No obvious gaps."
                  />
                </div>

                {job.match.reasons.length ? (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">Why this score</p>
                    <ul className="space-y-1 text-sm text-ink-600 dark:text-ink-200">
                      {job.match.reasons.map((r, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-400" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {job.match.cvTweaks.length ? (
                  <div className="rounded-xl bg-indigo-50/70 p-3.5 dark:bg-indigo-500/8">
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                      To improve your odds here
                    </p>
                    <ul className="space-y-1 text-sm text-indigo-900 dark:text-indigo-100">
                      {job.match.cvTweaks.map((t, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-500"
                  >
                    View &amp; apply
                  </a>
                  <Badge tone={LOC_TONE[job.match.locationFit]}>location: {job.match.locationFit}</Badge>
                  {job.remote ? <Badge tone="info">remote</Badge> : null}
                  <span className="text-ink-400">source: {job.source}</span>
                  {job.postedAt ? (
                    <span className="text-ink-400">
                      posted {new Date(job.postedAt).toLocaleDateString()}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}
          </Card>
        );
      })}

      {!visible.length ? (
        <Card className="p-8 text-center text-sm text-ink-400">
          No roles above {minScore}% fit. Lower the threshold to see more.
        </Card>
      ) : null}
    </div>
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
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
      {values.length ? (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <Badge key={v} tone={tone}>
              {v}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink-400">{empty}</p>
      )}
    </div>
  );
}
