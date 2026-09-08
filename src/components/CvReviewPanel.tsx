"use client";

import { useState } from "react";
import { Badge, Bullets, Card, GroupLabel, ScoreStat, cx } from "./ui";
import { useLang } from "./lang";
import type { Dict } from "@/lib/i18n";
import type { CvProfile, CvReview } from "@/lib/schemas";

const SEVERITY_TONE = { high: "bad", medium: "warn", low: "neutral" } as const;

export function CvReviewPanel({
  review,
  profile,
}: {
  review: CvReview;
  profile: CvProfile;
}) {
  const { t } = useLang();
  const [tab, setTab] = useState<"fixes" | "rewrites" | "profile">("fixes");
  const highCount = review.issues.filter((i) => i.severity === "high").length;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-start gap-6 border-b border-line px-6 py-6">
        <ScoreStat score={review.score} size="lg" label={t.cvScoreLabel} />
        <div className="min-w-0 flex-1">
          <h2
            dir="auto"
            className="font-display text-2xl font-medium leading-snug tracking-tight text-ink-900"
          >
            {review.verdict}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {highCount ? <Badge tone="bad">{t.highPriority(highCount)}</Badge> : null}
            <Badge>{t.suggestions(review.issues.length)}</Badge>
            {review.missingSections.slice(0, 3).map((s) => (
              <Badge key={s} tone="warn">
                {t.missingSection(s)}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex border-b border-line px-6">
        {(
          [
            ["fixes", t.tabFixes(review.issues.length)],
            ["rewrites", t.tabRewrites(review.rewrites.length)],
            ["profile", t.tabProfile],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cx(
              "-mb-px border-b-2 px-3 py-3 text-xs font-medium transition-colors first:ps-0",
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
                <GroupLabel>{t.workingWell}</GroupLabel>
                <Bullets items={review.strengths} dot="bg-good" />
              </div>
            ) : null}

            <ul className="divide-y divide-line border-y border-line">
              {review.issues.map((issue, i) => (
                <li key={i} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <span className="font-display mt-0.5 w-5 shrink-0 text-sm text-ink-300">{i + 1}</span>
                  <div className="min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <Badge tone={SEVERITY_TONE[issue.severity]}>{t.severity[issue.severity]}</Badge>
                      <span dir="auto" className="text-xs font-semibold text-ink-500">{issue.area}</span>
                    </div>
                    <p dir="auto" className="text-sm text-ink-900">{issue.problem}</p>
                    <p dir="auto" className="mt-1.5 border-s-2 border-brand ps-3 text-sm text-brand-ink">
                      {issue.fix}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {review.atsNotes.length ? (
              <div>
                <GroupLabel>{t.atsNotes}</GroupLabel>
                <Bullets items={review.atsNotes} dot="bg-warn" />
              </div>
            ) : null}

            {review.keywordSuggestions.length ? (
              <div>
                <GroupLabel>{t.keywords}</GroupLabel>
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
                  <p dir="auto" className="text-sm text-ink-500">{r.before}</p>
                  <p
                    dir="auto"
                    className="border-s-2 border-brand ps-4 text-sm text-ink-900 sm:border-s sm:border-line"
                  >
                    {r.after}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink-500">{t.noRewrites}</p>
            )}
          </div>
        ) : null}

        {tab === "profile" ? (
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <Field label={t.fieldName} value={profile.name} />
            <Field label={t.fieldHeadline} value={profile.headline} />
            <Field label={t.fieldLocation} value={profile.location} />
            <Field
              label={t.fieldExperience}
              value={t.experienceValue(
                profile.yearsExperience,
                t.seniority[profile.seniority] ?? profile.seniority
              )}
            />
            <ChipField label={t.fieldSkills} values={profile.skills} />
            <ChipField label={t.fieldTools} values={profile.tools} />
            <ChipField label={t.fieldTitles} values={profile.titles} />
            <ChipField label={t.fieldTargetRoles} values={profile.targetRoles} />
            <ChipField label={t.fieldIndustries} values={profile.industries} />
            <ChipField label={t.fieldLanguages} values={profile.languages} />
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
      <dd dir="auto" className="mt-0.5 text-sm text-ink-900">{value}</dd>
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
