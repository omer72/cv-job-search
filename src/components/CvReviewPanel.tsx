"use client";

import { useState } from "react";
import { Badge, Bullets, Card, GroupLabel, ScoreStat, cx } from "./ui";
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
      <div className="flex flex-wrap items-start gap-6 border-b border-line px-6 py-6">
        <ScoreStat score={review.score} size="lg" label="CV score out of 100" />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-2xl font-medium leading-snug tracking-tight text-ink-900">
            {review.verdict}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {highCount ? <Badge tone="bad">{highCount} high priority</Badge> : null}
            <Badge>{review.issues.length} suggestions</Badge>
            {review.missingSections.slice(0, 3).map((s) => (
              <Badge key={s} tone="warn">
                no {s}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex border-b border-line px-6">
        {(
          [
            ["fixes", `Fixes ${review.issues.length}`],
            ["rewrites", `Rewrites ${review.rewrites.length}`],
            ["profile", "What we read"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cx(
              "-mb-px border-b-2 px-3 py-3 text-xs font-medium transition-colors first:pl-0",
              tab === key
                ? "border-brand text-ink-900"
                : "border-transparent text-ink-500 hover:text-ink-700"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="px-6 py-5">
        {tab === "fixes" ? (
          <div className="space-y-6">
            {review.strengths.length ? (
              <div>
                <GroupLabel>Working well</GroupLabel>
                <Bullets items={review.strengths} dot="bg-good" />
              </div>
            ) : null}

            <ul className="divide-y divide-line border-y border-line">
              {review.issues.map((issue, i) => (
                <li key={i} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <span className="font-display mt-0.5 w-5 shrink-0 text-sm text-ink-300">{i + 1}</span>
                  <div className="min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <Badge tone={SEVERITY_TONE[issue.severity]}>{issue.severity}</Badge>
                      <span className="text-xs font-semibold text-ink-500">{issue.area}</span>
                    </div>
                    <p className="text-sm text-ink-900">{issue.problem}</p>
                    <p className="mt-1.5 border-l-2 border-brand pl-3 text-sm text-brand-ink">{issue.fix}</p>
                  </div>
                </li>
              ))}
            </ul>

            {review.atsNotes.length ? (
              <div>
                <GroupLabel>How applicant tracking systems will read it</GroupLabel>
                <Bullets items={review.atsNotes} dot="bg-warn" />
              </div>
            ) : null}

            {review.keywordSuggestions.length ? (
              <div>
                <GroupLabel>Keywords to add, where they are true of you</GroupLabel>
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
          <div className="divide-y divide-line">
            {review.rewrites.length ? (
              review.rewrites.map((r, i) => (
                <div key={i} className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-2 sm:gap-6">
                  <p className="text-sm text-ink-500">{r.before}</p>
                  <p className="border-l-2 border-brand pl-4 text-sm text-ink-900 sm:border-l sm:border-line">
                    {r.after}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink-500">No bullet rewrites were suggested.</p>
            )}
          </div>
        ) : null}

        {tab === "profile" ? (
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <Field label="Name" value={profile.name} />
            <Field label="Headline" value={profile.headline} />
            <Field label="Location" value={profile.location} />
            <Field label="Experience" value={`${profile.yearsExperience} years, ${profile.seniority}`} />
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
      <dt className="text-xs font-semibold text-ink-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink-900">{value}</dd>
    </div>
  );
}

function ChipField({ label, values }: { label: string; values: string[] }) {
  if (!values.length) return null;
  return (
    <div className="sm:col-span-2">
      <dt className="text-xs font-semibold text-ink-500">{label}</dt>
      <dd className="mt-1.5 flex flex-wrap gap-1.5">
        {values.map((v) => (
          <Badge key={v}>{v}</Badge>
        ))}
      </dd>
    </div>
  );
}
