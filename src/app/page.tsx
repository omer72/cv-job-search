"use client";

import { useEffect, useState } from "react";
import { CvUpload, type CvResult } from "@/components/CvUpload";
import { CvReviewPanel } from "@/components/CvReviewPanel";
import { CompanyManager } from "@/components/CompanyManager";
import { MatchResults } from "@/components/MatchResults";
import { Card, cx } from "@/components/ui";
import type { CompanyResult, ScoredJob } from "@/lib/schemas";

const STORAGE_KEY = "cv-job-match:v1";

type Persisted = {
  cv: CvResult | null;
  companies: string[];
  results: CompanyResult[];
  scored: ScoredJob[];
};

const EMPTY: Persisted = { cv: null, companies: [], results: [], scored: [] };

export default function Home() {
  const [state, setState] = useState<Persisted>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...EMPTY, ...(JSON.parse(raw) as Partial<Persisted>) });
    } catch {
      /* ignore unreadable storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked — session still works */
    }
  }, [state, hydrated]);

  async function runSearch() {
    if (!state.cv) return;
    setBusy(true);
    setError(null);
    try {
      const searchRes = await fetch("/api/jobs/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ companies: state.companies }),
      });
      const searchData = await searchRes.json();
      if (!searchRes.ok) throw new Error(searchData.error || "Job search failed.");
      const results = searchData.results as CompanyResult[];
      const jobs = results.flatMap((r) => r.jobs);

      if (!jobs.length) {
        setState((s) => ({ ...s, results, scored: [] }));
        setError("No openings could be read for those companies. The notes under each company say why.");
        return;
      }

      const matchRes = await fetch("/api/match", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profile: state.cv.profile, jobs }),
      });
      const matchData = await matchRes.json();
      if (!matchRes.ok) throw new Error(matchData.error || "Matching failed.");

      setState((s) => ({ ...s, results, scored: matchData.scored as ScoredJob[] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const steps: [string, string, boolean][] = [
    ["1", state.cv ? "CV read" : "Upload a CV", Boolean(state.cv)],
    ["2", state.companies.length ? `${state.companies.length} companies` : "Add companies", state.companies.length > 0],
    ["3", state.scored.length ? `${state.scored.length} roles scored` : "Score my fit", state.scored.length > 0],
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <p className="font-display text-lg font-medium tracking-tight text-ink-900">
            CV <span className="text-brand">→</span> Job Match
          </p>
          <ol className="ml-auto flex items-center gap-1 text-xs">
            {steps.map(([n, label, done], i) => (
              <li key={n} className="flex items-center gap-1">
                {i > 0 ? <span className="mx-1 h-px w-4 bg-line-firm" aria-hidden /> : null}
                <span
                  className={cx(
                    "tnum grid h-4 w-4 place-items-center rounded-full text-[10px] font-medium",
                    done ? "bg-brand text-white" : "bg-sunk text-ink-300 ring-1 ring-inset ring-line"
                  )}
                >
                  {n}
                </span>
                <span className={cx("hidden sm:inline", done ? "text-ink-900" : "text-ink-500")}>{label}</span>
              </li>
            ))}
          </ol>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {!state.cv ? (
          <div className="mb-10 max-w-2xl">
            <h1 className="font-display text-4xl font-medium leading-[1.15] tracking-tight text-ink-900 sm:text-5xl">
              Find out what your CV is worth before a recruiter does.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-700">
              Your CV comes back graded, with the exact lines to change. Then name the companies you
              want to work at: their real openings get pulled straight from the job boards they post
              on, and each one is scored against what your CV actually says.
            </p>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 space-y-6">
            <CvUpload
              current={state.cv}
              onParsed={(cv) => setState((s) => ({ ...s, cv }))}
              onReset={() => setState((s) => ({ ...s, cv: null, scored: [] }))}
            />

            {state.cv ? <CvReviewPanel review={state.cv.review} profile={state.cv.profile} /> : null}

            {state.cv ? <MatchResults jobs={state.scored} /> : null}
          </div>

          <aside className="min-w-0 space-y-4 lg:sticky lg:top-20 lg:self-start">
            <CompanyManager
              companies={state.companies}
              setCompanies={(companies) => setState((s) => ({ ...s, companies }))}
              results={state.results}
              busy={busy}
              disabled={!state.cv}
              onSearch={runSearch}
            />
            {error ? (
              <Card className="border-bad/30 bg-bad-soft px-4 py-3 text-xs text-bad">{error}</Card>
            ) : null}
            <p className="px-1 text-[11px] leading-relaxed text-ink-500">
              Everything stays in this browser. Your CV text, profile and results are kept in local
              storage and sent only to your own OpenAI key for analysis. LinkedIn blocks automated
              access, so each company links to its own board instead.
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}
