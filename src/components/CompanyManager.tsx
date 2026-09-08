"use client";

import { useState } from "react";
import { Badge, Button, Card, SectionTitle, Spinner } from "./ui";
import type { CompanyResult } from "@/lib/schemas";

const SOURCE_LABEL: Record<string, string> = {
  greenhouse: "Greenhouse",
  lever: "Lever",
  ashby: "Ashby",
  smartrecruiters: "SmartRecruiters",
  recruitee: "Recruitee",
  workable: "Workable",
  "careers-page": "Careers page",
  none: "Not found",
  error: "Error",
};

export function CompanyManager({
  companies,
  setCompanies,
  results,
  busy,
  disabled,
  onSearch,
}: {
  companies: string[];
  setCompanies: (next: string[]) => void;
  results: CompanyResult[];
  busy: boolean;
  disabled: boolean;
  onSearch: () => void;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const parts = draft
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...companies];
    for (const p of parts) {
      if (!next.some((c) => c.toLowerCase() === p.toLowerCase())) next.push(p);
    }
    setCompanies(next.slice(0, 15));
    setDraft("");
  }

  const byName = new Map(results.map((r) => [r.company.toLowerCase(), r]));

  return (
    <Card className="p-5">
      <SectionTitle hint={`${companies.length}/15`}>Target companies</SectionTitle>

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Monday.com, Wix, Riskified…"
          className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3.5 py-2 text-sm outline-none placeholder:text-ink-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-white/12 dark:bg-white/5 dark:focus:ring-indigo-500/20"
        />
        <Button variant="ghost" onClick={add} disabled={!draft.trim()}>
          Add
        </Button>
      </div>
      <p className="mt-1.5 text-xs text-ink-400">
        Comma-separate to add several at once. Press Enter to add.
      </p>

      {companies.length ? (
        <ul className="mt-4 space-y-1.5">
          {companies.map((c) => {
            const r = byName.get(c.toLowerCase());
            return (
              <li
                key={c}
                className="flex items-center gap-2 rounded-xl border border-black/5 px-3 py-2 dark:border-white/8"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{c}</span>
                {r ? (
                  <>
                    {r.jobs.length ? (
                      <Badge tone="good">{r.jobs.length} open</Badge>
                    ) : (
                      <Badge tone="warn">0 found</Badge>
                    )}
                    <Badge>{SOURCE_LABEL[r.source] ?? r.source}</Badge>
                  </>
                ) : null}
                <a
                  href={r?.careersUrl || r?.linkedinUrl || `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(c)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-600 hover:underline dark:text-indigo-300"
                >
                  open
                </a>
                <button
                  onClick={() => setCompanies(companies.filter((x) => x !== c))}
                  aria-label={`Remove ${c}`}
                  className="grid h-6 w-6 place-items-center rounded-md text-ink-400 hover:bg-black/5 hover:text-rose-600 dark:hover:bg-white/8"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {results.some((r) => r.note) ? (
        <ul className="mt-3 space-y-1">
          {results
            .filter((r) => r.note)
            .map((r) => (
              <li key={r.company} className="text-xs text-amber-700 dark:text-amber-300">
                <strong className="font-semibold">{r.company}:</strong> {r.note}
              </li>
            ))}
        </ul>
      ) : null}

      <Button
        onClick={onSearch}
        disabled={busy || disabled || !companies.length}
        className="mt-4 w-full"
      >
        {busy ? <Spinner /> : null}
        {busy ? "Searching and scoring…" : "Find openings and score my fit"}
      </Button>
      {disabled && !busy ? (
        <p className="mt-2 text-center text-xs text-ink-400">Upload your CV first.</p>
      ) : null}
    </Card>
  );
}
