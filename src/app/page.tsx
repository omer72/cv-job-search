"use client";

import { useEffect, useState } from "react";
import { CvUpload, type CvResult } from "@/components/CvUpload";
import { CvReviewPanel } from "@/components/CvReviewPanel";
import { CompanyManager } from "@/components/CompanyManager";
import { MatchResults } from "@/components/MatchResults";
import { Card } from "@/components/ui";
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
        setError("No openings could be read for those companies. See the notes under each company.");
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

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M4 12l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold tracking-tight">CV → Job Match</h1>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-ink-600 dark:text-ink-200">
          Upload your CV to get a blunt review and specific fixes. Then list the companies you want to
          work at — the app pulls their real open roles and scores how well your CV fits each one.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="space-y-6">
          <CvUpload
            current={state.cv}
            onParsed={(cv) =>
              setState((s) => ({
                ...s,
                cv,
                companies: s.companies.length ? s.companies : cv.profile.industries.slice(0, 0),
              }))
            }
            onReset={() => setState((s) => ({ ...s, cv: null, scored: [] }))}
          />

          {state.cv ? (
            <CvReviewPanel review={state.cv.review} profile={state.cv.profile} />
          ) : (
            <Card className="p-6">
              <p className="text-sm font-medium text-ink-600 dark:text-ink-200">What you get</p>
              <ul className="mt-3 grid gap-2.5 text-sm text-ink-600 sm:grid-cols-3 dark:text-ink-200">
                {[
                  ["A graded review", "Score out of 100 with high/medium/low priority fixes, ATS problems and bullet rewrites."],
                  ["Real openings", "Live roles pulled from company job boards — Greenhouse, Lever, Ashby, Workable and more."],
                  ["Honest fit scores", "Per-role percentage with matched skills, gaps, and the CV edits that would close them."],
                ].map(([title, body]) => (
                  <li key={title} className="rounded-xl border border-black/5 p-3.5 dark:border-white/8">
                    <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">{title}</p>
                    <p className="mt-1 text-xs text-ink-400">{body}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <MatchResults jobs={state.scored} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          <CompanyManager
            companies={state.companies}
            setCompanies={(companies) => setState((s) => ({ ...s, companies }))}
            results={state.results}
            busy={busy}
            disabled={!state.cv}
            onSearch={runSearch}
          />
          {error ? (
            <div className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </div>
          ) : null}
          <p className="px-1 text-[11px] leading-relaxed text-ink-400">
            Everything stays in this browser — your CV text, profile and results are kept in local
            storage and are only sent to your own OpenAI key for analysis. LinkedIn blocks automated
            access, so each company links out to a LinkedIn jobs search you can check by hand.
          </p>
        </aside>
      </div>
    </main>
  );
}
