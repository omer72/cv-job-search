"use client";

import { Card, Meter, cx, scoreTone } from "./ui";
import { useLang } from "./lang";
import type { CompanyResult, CvReview, ScoredJob } from "@/lib/schemas";

const TONE_TEXT = {
  good: "text-good",
  info: "text-info",
  warn: "text-warn",
  bad: "text-bad",
} as const;

/** At-a-glance row: where the CV stands, and where the search got to. */
export function StatStrip({
  review,
  companies,
  results,
  scored,
}: {
  review: CvReview;
  companies: string[];
  results: CompanyResult[];
  scored: ScoredJob[];
}) {
  const { t } = useLang();
  const high = review.issues.filter((i) => i.severity === "high").length;
  const openRoles = results.reduce((sum, r) => sum + r.jobs.length, 0);
  const best = scored[0];

  return (
    <Card className="mb-6 grid grid-cols-2 divide-x divide-y divide-line lg:grid-cols-4 lg:divide-y-0 rtl:divide-x-reverse">
      <Stat
        label={t.statScore}
        value={review.score}
        suffix="%"
        tone={scoreTone(review.score)}
        meter={review.score}
      />
      <Stat
        label={t.statFixes}
        value={review.issues.length}
        note={high ? t.highPriority(high) : t.statFixesNone}
        noteTone={high ? "text-bad" : undefined}
      />
      <Stat
        label={t.statCompanies}
        value={companies.length}
        note={t.statOpenRoles(openRoles)}
      />
      <Stat
        label={t.statBest}
        value={best ? best.match.score : "—"}
        suffix={best ? "%" : ""}
        tone={best ? scoreTone(best.match.score) : undefined}
        meter={best ? best.match.score : undefined}
        note={best ? t.statBestAt(best.company) : t.statPending}
      />
    </Card>
  );
}

function Stat({
  label,
  value,
  suffix = "",
  tone,
  meter,
  note,
  noteTone,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  tone?: keyof typeof TONE_TEXT;
  meter?: number;
  note?: string;
  noteTone?: string;
}) {
  return (
    <div className="px-5 py-4">
      <p className="text-xs font-semibold text-ink-500">{label}</p>
      <p className="mt-1.5 flex items-baseline gap-0.5">
        <span
          className={cx(
            "font-display tnum text-4xl font-medium leading-none",
            tone ? TONE_TEXT[tone] : "text-ink-900"
          )}
        >
          {value}
        </span>
        {suffix ? (
          <span className={cx("font-display text-base", tone ? TONE_TEXT[tone] : "text-ink-500")}>
            {suffix}
          </span>
        ) : null}
      </p>
      {meter !== undefined ? <Meter score={meter} className="mt-2.5" /> : null}
      {note ? (
        <p dir="auto" className={cx("mt-2 truncate text-[11px]", noteTone ?? "text-ink-500")}>
          {note}
        </p>
      ) : null}
    </div>
  );
}
