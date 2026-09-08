"use client";

import { useState } from "react";
import { Badge, Button, Card, SectionTitle, Spinner } from "./ui";
import { useLang } from "./lang";
import type { CompanyResult } from "@/lib/schemas";

export function CompanyManager({
  companies,
  setCompanies,
  urls,
  setUrls,
  results,
  busy,
  disabled,
  onSearch,
}: {
  companies: string[];
  setCompanies: (next: string[]) => void;
  urls: Record<string, string>;
  setUrls: (next: Record<string, string>) => void;
  results: CompanyResult[];
  busy: boolean;
  disabled: boolean;
  onSearch: () => void;
}) {
  const { t } = useLang();
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
      <div className="border-b border-line bg-sunk/60 px-5 py-4">
        <SectionTitle hint={t.companiesCount(companies.length)}>{t.companiesTitle}</SectionTitle>
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
            placeholder={t.companiesPlaceholder}
            aria-label={t.companyLabel}
            className="min-w-0 flex-1 rounded-sm border border-line-firm bg-surface px-3 py-2 text-sm text-ink-900 outline-none placeholder:text-ink-300 focus:border-brand"
          />
          <Button variant="ghost" onClick={add} disabled={!draft.trim()}>
            {t.add}
          </Button>
        </div>
        <p className="mt-2 text-xs text-ink-500">{t.addHint}</p>

        {companies.length ? (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {companies.map((c) => {
              const r = byName.get(c.toLowerCase());
              const needsUrl = r ? r.jobs.length === 0 : false;
              return (
                <li key={c} className="py-2.5">
                  <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p dir="auto" className="truncate text-sm font-medium text-ink-900">{c}</p>
                    {r ? (
                      <p className="mt-0.5 flex items-center gap-1.5">
                        {r.jobs.length ? (
                          <Badge tone="good">{t.openCount(r.jobs.length)}</Badge>
                        ) : (
                          <Badge tone="warn">{t.nothingFound}</Badge>
                        )}
                        <span className="truncate text-[11px] text-ink-500">
                          {t.source[r.source] ?? r.source}
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
                    {t.openBoard}
                  </a>
                  <button
                    onClick={() => {
                      setCompanies(companies.filter((x) => x !== c));
                      if (urls[c]) {
                        const next = { ...urls };
                        delete next[c];
                        setUrls(next);
                      }
                    }}
                    aria-label={t.remove(c)}
                    className="grid h-6 w-6 place-items-center rounded-sm text-ink-300 transition-colors hover:bg-bad-soft hover:text-bad"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                {needsUrl ? (
                  <UrlField
                    company={c}
                    value={urls[c] ?? ""}
                    onSave={(url) => setUrls({ ...urls, [c]: url })}
                    onClear={() => {
                      const next = { ...urls };
                      delete next[c];
                      setUrls(next);
                    }}
                  />
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}

        <Button onClick={onSearch} disabled={busy || disabled || !companies.length} className="mt-4 w-full">
          {busy ? <Spinner /> : null}
          {busy ? t.searching : t.findAndScore}
        </Button>
        {disabled && !busy ? (
          <p className="mt-2 text-center text-xs text-ink-500">{t.uploadFirst}</p>
        ) : null}
      </div>

      {notes.length ? (
        <ul className="divide-y divide-line border-t border-line bg-sunk">
          {notes.map((r) => (
            <li key={r.company} dir="auto" className="px-5 py-2.5 text-xs text-ink-700">
              <span className="font-semibold text-ink-900">{r.company}</span> {r.note}
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}

/** Shown for a company whose openings we could not read, so the user can point us at the right page. */
function UrlField({
  company,
  value,
  onSave,
  onClear,
}: {
  company: string;
  value: string;
  onSave: (url: string) => void;
  onClear: () => void;
}) {
  const { t } = useLang();
  const [draft, setDraft] = useState(value);

  if (value) {
    return (
      <p className="mt-2 flex items-center gap-2 text-[11px] text-ink-500">
        <span className="min-w-0 flex-1 truncate">{t.urlSaved(value)}</span>
        <button onClick={onClear} className="shrink-0 text-brand hover:underline">
          {t.urlClear}
        </button>
      </p>
    );
  }

  return (
    <div className="mt-2 rounded-sm bg-sunk p-2.5">
      <p className="text-[11px] leading-relaxed text-ink-700">{t.urlPrompt}</p>
      <div className="mt-1.5 flex gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              e.preventDefault();
              onSave(draft.trim());
            }
          }}
          placeholder={t.urlPlaceholder}
          aria-label={`${t.urlPrompt} ${company}`}
          className="min-w-0 flex-1 rounded-sm border border-line-firm bg-surface px-2 py-1 text-xs text-ink-900 outline-none placeholder:text-ink-300 focus:border-brand"
        />
        <button
          onClick={() => draft.trim() && onSave(draft.trim())}
          disabled={!draft.trim()}
          className="shrink-0 rounded-sm bg-brand px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-brand-ink disabled:opacity-40"
        >
          {t.urlSave}
        </button>
      </div>
    </div>
  );
}
