"use client";

import { useState } from "react";
import { Badge, Card, ScoreRing, SectionTitle, cx } from "./ui";
import type { CvProfile, CvReview } from "@/lib/schemas";

const SEVERITY_TONE = { high: "bad", medium: "warn", low: "neutral" } as const;

export function CvReviewPanel({
  review,
  profile,
}: {
  review: CvReview;
  profile: CvProfile;
}) {
  const [tab, setTab] = useState<"fixes" | "rewrites" | "profile">("fixes");
  const highCount = review.issues.filter((i) => i.severity === "high").length;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-4 border-b border-black/5 p-5 dark:border-white/8">
        <ScoreRing score={review.score} size={64} />
        <div className="min-w-0 flex-1">
          <SectionTitle hint={`${review.issues.length} suggestions`}>CV review</SectionTitle>
          <p className="text-sm text-ink-600 dark:text-ink-200">{review.verdict}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {highCount ? <Badge tone="bad">{highCount} high priority</Badge> : null}
            {review.missingSections.slice(0, 3).map((s) => (
              <Badge key={s} tone="warn">
                missing: {s}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-black/5 px-3 pt-3 dark:border-white/8">
        {(
          [
            ["fixes", `Fixes (${review.issues.length})`],
            ["rewrites", `Rewrites (${review.rewrites.length})`],
            ["profile", "Extracted profile"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cx(
              "rounded-t-lg px-3 py-2 text-xs font-medium transition",
              tab === key
                ? "bg-black/[0.04] text-ink-800 dark:bg-white/8 dark:text-ink-100"
                : "text-ink-400 hover:text-ink-600 dark:hover:text-ink-200"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="max-h-[26rem] overflow-y-auto p-5 scrollbar-thin">
        {tab === "fixes" ? (
          <div className="space-y-4">
            {review.strengths.length ? (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Working well
                </p>
                <ul className="space-y-1 text-sm text-ink-600 dark:text-ink-200">
                  {review.strengths.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="space-y-2.5">
              {review.issues.map((issue, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-black/5 bg-black/[0.015] p-3.5 dark:border-white/8 dark:bg-white/[0.02]"
                >
                  <div className="mb-1.5 flex items-center gap-2">
                    <Badge tone={SEVERITY_TONE[issue.severity]}>{issue.severity}</Badge>
                    <span className="text-xs font-semibold text-ink-600 dark:text-ink-200">{issue.area}</span>
                  </div>
                  <p className="text-sm text-ink-800 dark:text-ink-100">{issue.problem}</p>
                  <p className="mt-1.5 text-sm text-indigo-700 dark:text-indigo-300">→ {issue.fix}</p>
                </div>
              ))}
            </div>

            {review.atsNotes.length ? (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
                  ATS notes
                </p>
                <ul className="space-y-1 text-sm text-ink-600 dark:text-ink-200">
                  {review.atsNotes.map((n, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      {n}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {review.keywordSuggestions.length ? (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Keywords to add (only where true)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {review.keywordSuggestions.map((k) => (
                    <Badge key={k} tone="info">
                      {k}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {tab === "rewrites" ? (
          <div className="space-y-3">
            {review.rewrites.length ? (
              review.rewrites.map((r, i) => (
                <div key={i} className="rounded-xl border border-black/5 p-3.5 dark:border-white/8">
                  <p className="text-sm text-ink-400 line-through decoration-rose-400/60">{r.before}</p>
                  <p className="mt-2 text-sm font-medium text-ink-800 dark:text-ink-100">{r.after}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink-400">No bullet rewrites were suggested.</p>
            )}
          </div>
        ) : null}

        {tab === "profile" ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" value={profile.name} />
            <Field label="Headline" value={profile.headline} />
            <Field label="Location" value={profile.location} />
            <Field
              label="Experience"
              value={`${profile.yearsExperience} yrs · ${profile.seniority}`}
            />
            <ChipField label="Skills" values={profile.skills} />
            <ChipField label="Tools" values={profile.tools} />
            <ChipField label="Past titles" values={profile.titles} />
            <ChipField label="Target roles" values={profile.targetRoles} />
            <ChipField label="Industries" values={profile.industries} />
            <ChipField label="Languages" values={profile.languages} />
          </dl>
        ) : null}
      </div>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink-800 dark:text-ink-100">{value}</dd>
    </div>
  );
}

function ChipField({ label, values }: { label: string; values: string[] }) {
  if (!values.length) return null;
  return (
    <div className="sm:col-span-2">
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="mt-1 flex flex-wrap gap-1.5">
        {values.map((v) => (
          <Badge key={v}>{v}</Badge>
        ))}
      </dd>
    </div>
  );
}
