"use client";

import { useEffect, useState } from "react";
import { CvUpload, type CvResult } from "@/components/CvUpload";
import { CvReviewPanel } from "@/components/CvReviewPanel";
import { CompanyManager } from "@/components/CompanyManager";
import { MatchResults } from "@/components/MatchResults";
import { TechmapPanel, type TechmapQuery } from "@/components/TechmapPanel";
import { Card, cx } from "@/components/ui";
import { StatStrip } from "@/components/StatStrip";
import { LangProvider } from "@/components/lang";
import { STRINGS, type Lang } from "@/lib/i18n";
import { upgradedCvToText } from "@/lib/schemas";
import type { CompanyResult, Job, ScoredJob, UpgradeResult } from "@/lib/schemas";

const STORAGE_KEY = "cv-job-match:v1";
const LANG_KEY = "cv-job-match:lang";

type Persisted = {
  cv: CvResult | null;
  /** The rewritten CV and the score it earns, once asked for. */
  upgraded: UpgradeResult | null;
  companies: string[];
  /** Careers-page or LinkedIn URLs the user supplied, keyed by company name. */
  urls: Record<string, string>;
  results: CompanyResult[];
  scored: ScoredJob[];
};

const EMPTY: Persisted = { cv: null, upgraded: null, companies: [], urls: {}, results: [], scored: [] };

export default function Home() {
  const [state, setState] = useState<Persisted>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [feedBusy, setFeedBusy] = useState(false);
  const [upgradeNote, setUpgradeNote] = useState<string | null>(null);
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

  async function scoreJobs(jobs: Job[]): Promise<ScoredJob[]> {
    const res = await fetch("/api/match", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ profile: state.cv!.profile, jobs, lang }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || t.errMatch);
    return data.scored as ScoredJob[];
  }

  async function runFeedSearch(q: TechmapQuery) {
    if (!state.cv) return;
    setFeedBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs/techmap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...q, limit: 200, lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.errSearch);
      const jobs = data.jobs as Job[];
      if (!jobs.length) {
        setError(t.techmapNone);
        return;
      }
      const scored = await scoreJobs(jobs);
      setState((s) => ({ ...s, scored }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errGeneric);
    } finally {
      setFeedBusy(false);
    }
  }

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

      const scored = await scoreJobs(jobs);
      setState((s) => ({ ...s, results, scored }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function runUpgrade() {
    if (!state.cv) return;
    setUpgrading(true);
    setError(null);
    setUpgradeNote(null);
    try {
      // Pressing rewrite again iterates on the newest version and its own
      // review, so each pass works on what is left rather than starting over.
      const base = state.upgraded;
      const res = await fetch("/api/cv/upgrade", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text: base ? upgradedCvToText(base.cv) : state.cv.text,
          review: base ? base.review : state.cv.review,
          lang,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.errGeneric);
      const next = data.upgraded as UpgradeResult;
      // The reviewer is not perfectly consistent, so a further pass can score
      // lower. Keep whichever version actually scores best.
      if (base && next.score <= base.score) {
        setUpgradeNote(t.upgradeNoBetter);
        return;
      }
      setState((s) => ({ ...s, upgraded: next }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errGeneric);
    } finally {
      setUpgrading(false);
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

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {!state.cv ? (
          <div className="mb-10 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-14">
            <div>
              <h1 className="font-display text-4xl font-medium leading-[1.1] tracking-tight text-ink-900 sm:text-5xl lg:text-6xl">
                {t.heroTitle}
              </h1>
              <div className="mt-6 h-1 w-16 bg-brand" />
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-700">{t.heroBody}</p>
            </div>

            <Card className="overflow-hidden">
              <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-2.5">
                <h2 className="font-display text-base font-medium text-ink-900">{t.videoTitle}</h2>
                <span className="text-xs text-ink-500">{t.videoHint}</span>
              </div>
              {/* aspect-video holds the space before metadata arrives; key reloads on language change */}
              <video
                key={lang}
                controls
                preload="metadata"
                poster={`/how-it-works.${lang}.jpg`}
                className="block aspect-video w-full bg-ink-900"
              >
                <source src={`/how-it-works.${lang}.mp4`} type="video/mp4" />
              </video>
            </Card>
          </div>
        ) : (
          <StatStrip
            review={state.cv.review}
            companies={state.companies}
            results={state.results}
            scored={state.scored}
          />
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
          <div className="min-w-0 space-y-6">
            <CvUpload
              current={state.cv}
              onParsed={(cv) => setState((s) => ({ ...s, cv, upgraded: null }))}
              onReset={() => setState((s) => ({ ...s, cv: null, upgraded: null, scored: [] }))}
            />

            {state.cv ? (
              <CvReviewPanel
                review={state.cv.review}
                profile={state.cv.profile}
                upgraded={state.upgraded}
                upgrading={upgrading}
                note={upgradeNote}
                onUpgrade={runUpgrade}
              />
            ) : null}

            {state.cv ? (
              <TechmapPanel busy={feedBusy} disabled={!state.cv} onSearch={runFeedSearch} />
            ) : null}

            {state.cv ? <MatchResults jobs={state.scored} /> : null}
          </div>

          <aside className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
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
