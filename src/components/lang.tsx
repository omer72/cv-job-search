"use client";

import { createContext, useContext, type ReactNode } from "react";
import { STRINGS, type Dict, type Lang } from "@/lib/i18n";

const LangContext = createContext<Lang>("en");

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang(): { lang: Lang; t: Dict } {
  const lang = useContext(LangContext);
  return { lang, t: STRINGS[lang] };
}
