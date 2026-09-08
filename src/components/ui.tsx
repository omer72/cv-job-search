"use client";

import type { ReactNode } from "react";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/** A hairline-bordered surface. Panels carry structure; shadow is kept to a whisper. */
export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "rounded-md border border-line bg-surface shadow-[0_1px_0_rgba(19,29,26,0.03)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
  type = "button",
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "danger";
  type?: "button" | "submit";
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";
  const styles = {
    primary: "bg-brand text-white hover:bg-brand-ink",
    ghost: "border border-line-firm bg-surface text-ink-700 hover:bg-sunk",
    danger: "border border-bad/30 bg-bad-soft text-bad hover:border-bad/60",
  }[variant];
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cx(base, styles, className)}>
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad" | "info";
}) {
  const tones = {
    neutral: "bg-sunk text-ink-500 ring-line",
    good: "bg-good-soft text-good ring-good/20",
    warn: "bg-warn-soft text-warn ring-warn/20",
    bad: "bg-bad-soft text-bad ring-bad/20",
    info: "bg-info-soft text-info ring-info/20",
  }[tone];
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-sm px-1.5 py-0.5 text-[11px] font-medium leading-snug ring-1 ring-inset",
        tones
      )}
    >
      {children}
    </span>
  );
}

export function scoreTone(score: number): "good" | "info" | "warn" | "bad" {
  if (score >= 85) return "good";
  if (score >= 65) return "info";
  if (score >= 40) return "warn";
  return "bad";
}

export function fitLabel(score: number): string {
  if (score >= 85) return "strong fit";
  if (score >= 65) return "worth applying";
  if (score >= 40) return "a stretch";
  return "poor fit";
}

const BAR = {
  good: "bg-good",
  info: "bg-info",
  warn: "bg-warn",
  bad: "bg-bad",
} as const;

const TEXT = {
  good: "text-good",
  info: "text-info",
  warn: "text-warn",
  bad: "text-bad",
} as const;

/** Thin horizontal meter — reads as a measurement, and lines up across rows. */
export function Meter({ score, className }: { score: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div
      className={cx("h-[3px] w-full overflow-hidden rounded-full bg-line", className)}
      role="meter"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={cx("h-full rounded-full transition-[width]", BAR[scoreTone(score)])} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** A score as a display numeral with its own meter beneath. */
export function ScoreStat({
  score,
  label,
  size = "md",
}: {
  score: number;
  label?: string;
  size?: "md" | "lg";
}) {
  const tone = scoreTone(score);
  return (
    <div className={cx("shrink-0", size === "lg" ? "w-24" : "w-14")}>
      <div className="flex items-baseline gap-0.5">
        <span
          className={cx(
            "font-display font-medium leading-none",
            TEXT[tone],
            size === "lg" ? "text-6xl" : "text-3xl"
          )}
        >
          {Math.round(score)}
        </span>
        <span className={cx("font-display", TEXT[tone], size === "lg" ? "text-xl" : "text-sm")}>%</span>
      </div>
      <Meter score={score} className={size === "lg" ? "mt-3" : "mt-2"} />
      {label ? <p className="mt-1.5 text-[11px] text-ink-500">{label}</p> : null}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cx("h-4 w-4 animate-spin", className)} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="font-display text-lg font-medium leading-tight tracking-tight text-ink-900">{children}</h2>
      {hint ? <span className="shrink-0 text-xs text-ink-500">{hint}</span> : null}
    </div>
  );
}

/** Small sentence-case heading for a group of values — no all-caps eyebrows. */
export function GroupLabel({ children }: { children: ReactNode }) {
  return <p className="mb-2 text-xs font-semibold text-ink-500">{children}</p>;
}

export function Bullets({
  items,
  dot = "bg-ink-300",
}: {
  items: string[];
  dot?: string;
}) {
  return (
    <ul className="space-y-1.5 text-sm text-ink-700">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className={cx("mt-[7px] h-1 w-1 shrink-0 rounded-full", dot)} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
