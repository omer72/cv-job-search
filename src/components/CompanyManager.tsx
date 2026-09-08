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
  none: "No board found",
  error: "Search failed",
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
  const notes = results.filter((r) => r.note);

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <SectionTitle hint={`${companies.length} of 15`}>Where you want to work</SectionTitle>
      </div>

      <div className="px-5 py-4">
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
            placeholder="Monday.com, Wix, Riskified"
            aria-label="Company name"
            className="min-w-0 flex-1 rounded-sm border border-line-firm bg-surface px-3 py-2 text-sm text-ink-900 outline-none placeholder:text-ink-300 focus:border-brand"
          />
          <Button variant="ghost" onClick={add} disabled={!draft.trim()}>
            Add
          </Button>
        </div>
        <p className="mt-2 text-xs text-ink-500">
          Press Enter to add one, or separate several with commas.
        </p>

        {companies.length ? (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {companies.map((c) => {
              const r = byName.get(c.toLowerCase());
              return (
                <li key={c} className="flex items-center gap-2 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900">{c}</p>
                    {r ? (
                      <p className="mt-0.5 flex items-center gap-1.5">
                        {r.jobs.length ? (
                          <Badge tone="good">{r.jobs.length} open</Badge>
                        ) : (
                          <Badge tone="warn">nothing found</Badge>
                        )}
                        <span className="truncate text-[11px] text-ink-500">
                          {SOURCE_LABEL[r.source] ?? r.source}
                        </span>
                      </p>
                    ) : null}
                  </div>
                  <a
                    href={
                      r?.careersUrl ||
                      r?.linkedinUrl ||
                      `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(c)}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-brand hover:underline"
                  >
                    Open board
                  </a>
                  <button
                    onClick={() => setCompanies(companies.filter((x) => x !== c))}
                    aria-label={`Remove ${c}`}
                    className="grid h-6 w-6 place-items-center rounded-sm text-ink-300 transition-colors hover:bg-bad-soft hover:text-bad"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        <Button onClick={onSearch} disabled={busy || disabled || !companies.length} className="mt-4 w-full">
          {busy ? <Spinner /> : null}
          {busy ? "Searching and scoring" : "Find openings and score my fit"}
        </Button>
        {disabled && !busy ? (
          <p className="mt-2 text-center text-xs text-ink-500">Upload your CV first.</p>
        ) : null}
      </div>

      {notes.length ? (
        <ul className="divide-y divide-line border-t border-line bg-sunk">
          {notes.map((r) => (
            <li key={r.company} className="px-5 py-2.5 text-xs text-ink-700">
              <span className="font-semibold text-ink-900">{r.company}</span> {r.note}
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
