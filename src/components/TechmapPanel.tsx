"use client";

import { useState } from "react";
import { Button, Card, SectionTitle, Spinner, cx } from "./ui";
import { useLang } from "./lang";
import { TECHMAP_CREDIT_URL, TECHMAP_TYPES, type TechmapType } from "@/lib/techmap";

const LEVELS = ["Engineer", "Manager", "Architect", "Tech Lead", "Student", "Executive"];

export type TechmapQuery = {
  types: TechmapType[];
  query: string;
  city: string;
  level: string;
};

export function TechmapPanel({
  busy,
  disabled,
  onSearch,
}: {
  busy: boolean;
  disabled: boolean;
  onSearch: (q: TechmapQuery) => void;
}) {
  const { t } = useLang();
  const [types, setTypes] = useState<TechmapType[]>(["software"]);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [level, setLevel] = useState("");

  function toggle(type: TechmapType) {
    setTypes((current) =>
      current.includes(type) ? current.filter((x) => x !== type) : [...current, type]
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line bg-sunk/60 px-6 py-4">
        <SectionTitle>{t.techmapTitle}</SectionTitle>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-700">{t.techmapIntro}</p>
      </div>

      <div className="space-y-5 px-6 py-5">
        <fieldset>
          <legend className="mb-2 text-xs font-semibold text-ink-500">{t.techmapPickTypes}</legend>
          <div className="flex flex-wrap gap-1.5">
            {TECHMAP_TYPES.map((type) => {
              const on = types.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => toggle(type)}
                  aria-pressed={on}
                  className={cx(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    on
                      ? "border-brand bg-brand text-white"
                      : "border-line-firm text-ink-700 hover:border-brand hover:text-brand"
                  )}
                >
                  {t.techmapTypes[type] ?? type}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink-500">{t.techmapQuery}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.techmapQueryPlaceholder}
              className="w-full rounded-sm border border-line-firm bg-surface px-3 py-2 text-sm text-ink-900 outline-none placeholder:text-ink-300 focus:border-brand"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink-500">{t.techmapCity}</span>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t.techmapCityPlaceholder}
              className="w-full rounded-sm border border-line-firm bg-surface px-3 py-2 text-sm text-ink-900 outline-none placeholder:text-ink-300 focus:border-brand"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink-500">{t.techmapLevel}</span>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full rounded-sm border border-line-firm bg-surface px-2 py-2 text-sm text-ink-700"
            >
              <option value="">{t.techmapAnyLevel}</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {t.techmapLevels[l] ?? l}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => onSearch({ types, query, city, level })}
            disabled={busy || disabled || !types.length}
          >
            {busy ? <Spinner /> : null}
            {busy ? t.techmapSearching : t.techmapSearch}
          </Button>
          {disabled && !busy ? <span className="text-xs text-ink-500">{t.uploadFirst}</span> : null}
          {!types.length ? <span className="text-xs text-warn">{t.techmapSelectOne}</span> : null}
        </div>

        <p className="text-[11px] text-ink-500">
          <a href={TECHMAP_CREDIT_URL} target="_blank" rel="noreferrer" className="text-brand hover:underline">
            {t.techmapCredit}
          </a>
        </p>
      </div>
    </Card>
  );
}
