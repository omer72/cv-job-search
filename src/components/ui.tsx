"use client";

import type { ReactNode } from "react";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

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
        "rounded-2xl border border-black/5 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05),0_8px_24px_-16px_rgba(16,24,40,0.18)]",
        "dark:border-white/8 dark:bg-white/[0.035] dark:shadow-none",
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
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45";
  const styles = {
    primary:
      "bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 shadow-sm shadow-indigo-600/25",
    ghost:
      "border border-black/10 bg-white text-ink-800 hover:bg-ink-50 dark:border-white/12 dark:bg-white/5 dark:text-ink-100 dark:hover:bg-white/10",
    danger:
      "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300",
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
    neutral: "bg-ink-100 text-ink-600 dark:bg-white/8 dark:text-ink-200",
    good: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-300",
    warn: "bg-amber-50 text-amber-700 dark:bg-amber-500/12 dark:text-amber-300",
    bad: "bg-rose-50 text-rose-700 dark:bg-rose-500/12 dark:text-rose-300",
    info: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/12 dark:text-indigo-300",
  }[tone];
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-tight",
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

const TONE_HEX = {
  good: "#059669",
  info: "#4f46e5",
  warn: "#d97706",
  bad: "#e11d48",
} as const;

export function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const stroke = size >= 56 ? 5 : 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = TONE_HEX[scoreTone(score)];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-black/8 dark:text-white/12"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${(c * Math.max(0, Math.min(100, score))) / 100} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize={size * 0.3}
        fontWeight={600}
      >
        {Math.round(score)}
      </text>
    </svg>
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
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-sm font-semibold tracking-tight text-ink-800 dark:text-ink-100">{children}</h2>
      {hint ? <span className="text-xs text-ink-400">{hint}</span> : null}
    </div>
  );
}
