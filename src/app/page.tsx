"use client";

import { useEffect, useState } from "react";
import { CvUpload, type CvResult } from "@/components/CvUpload";
import { CvReviewPanel } from "@/components/CvReviewPanel";
import { CompanyManager } from "@/components/CompanyManager";
import { MatchResults } from "@/components/MatchResults";
import { Card, cx } from "@/components/ui";
import { LangProvider } from "@/components/lang";
import { STRINGS, type Lang } from "@/lib/i18n";
import type { CompanyResult, ScoredJob } from "@/lib/schemas";

const STORAGE_KEY = "cv-job-match:v1";
const LANG_KEY = "cv-job-match:lang";

type Persisted = {
  cv: CvResult | null;
  companies: string[];
  /** Careers-page or LinkedIn URLs the user supplied, keyed by company name. */
  urls: Record<string, string>;
  results: CompanyResult[];
  scored: ScoredJob[];
};

const EMPTY: Persisted = { cv: null, companies: [], urls: {}, results: [], scored: [] };

export default function Home() {
  const [state, setState] = useState<Persisted>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>("en");
  const t = STRINGS[lang];

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...EMPTY, ...(JSON.parse(raw) as Partial<Persisted>) });
    } catch {
      /* ignore unreadable storage */
    }
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === "he" || saved === "en") setLang(saved);
    } catch {
      /* ignore unreadable storage */
    }
    setHydrated(true);
  }, []);

  // <html> is server-rendered as English; the toggle updates it on the client.
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = t.dir;
    if (!hydrated) return; // don't write "en" over a saved choice before it is read back
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* ignore unwritable storage */
    }
  }, [lang, t.dir, hydrated]);

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
        body: JSON.stringify({ companies: state.companies, urls: state.urls, lang }),
      });
      const searchData = await searchRes.json();
      if (!searchRes.ok) throw new Error(searchData.error || t.errSearch);
      const results = searchData.results as CompanyResult[];
      const jobs = results.flatMap((r) => r.jobs);

      if (!jobs.length) {
        setState((s) => ({ ...s, results, scored: [] }));
        setError(t.errNoOpenings);
        return;
      }

      const matchRes = await fetch("/api/match", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profile: state.cv.profile, jobs, lang }),
      });
      const matchData = await matchRes.json();
      if (!matchRes.ok) throw new Error(matchData.error || t.errMatch);

      setState((s) => ({ ...s, results, scored: matchData.scored as ScoredJob[] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errGeneric);
    } finally {
      setBusy(false);
    }
  }

  const steps: [string, string, boolean][] = [
    ["1", state.cv ? t.stepUploaded : t.stepUpload, Boolean(state.cv)],
    [
      "2",
      state.companies.length ? t.stepCompaniesDone(state.companies.length) : t.stepCompanies,
      state.companies.length > 0,
    ],
    ["3", state.scored.length ? t.stepScored(state.scored.length) : t.stepScore, state.scored.length > 0],
  ];

  return (
    <LangProvider lang={lang}>
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <p className="font-display text-lg font-medium tracking-tight text-ink-900">
            {t.productName}
          </p>
          <ol className="ms-auto flex items-center gap-1 text-xs">
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
          <button
            onClick={() => setLang(lang === "en" ? "he" : "en")}
            className="rounded-sm border border-line-firm px-2 py-1 text-xs text-ink-700 transition-colors hover:bg-sunk"
          >
            {t.otherLangName}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {!state.cv ? (
          <div className="mb-10 max-w-2xl">
            <h1 className="font-display text-4xl font-medium leading-[1.15] tracking-tight text-ink-900 sm:text-5xl">
              {t.heroTitle}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-700">{t.heroBody}</p>

            <Card className="mt-8 overflow-hidden">
              <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-2.5">
                <h2 className="font-display text-base font-medium text-ink-900">{t.videoTitle}</h2>
                <span className="text-xs text-ink-500">{t.videoHint}</span>
              </div>
              {/* key forces a reload when the language changes, so the narration matches the UI */}
              <video
                key={lang}
                controls
                preload="metadata"
                poster={`/how-it-works.${lang}.jpg`}
                className="block w-full bg-ink-900"
              >
                <source src={`/how-it-works.${lang}.mp4`} type="video/mp4" />
              </video>
            </Card>
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
              urls={state.urls}
              setUrls={(urls) => setState((s) => ({ ...s, urls }))}
              results={state.results}
              busy={busy}
              disabled={!state.cv}
              onSearch={runSearch}
            />
            {error ? (
              <Card className="border-bad/30 bg-bad-soft px-4 py-3 text-xs text-bad">{error}</Card>
            ) : null}
            <p className="px-1 text-[11px] leading-relaxed text-ink-500">{t.privacy}</p>
          </aside>
        </div>
      </main>
    </div>
    </LangProvider>
  );
}
