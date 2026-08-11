"use client";

import { createContext, useContext, useState, useEffect, useCallback, createElement, type ReactNode } from "react";
import { translations, type Locale, type TranslationKey } from "@/lib/i18n";

interface LocaleContextValue {
  locale: Locale;
  t: (key: TranslationKey) => string;
  setLocale: (locale: Locale) => void;
  toggle: () => void;
}

const STORAGE_KEY = "callm_locale";

const defaultCtx: LocaleContextValue = {
  locale: "en",
  t: (key) => translations.en[key],
  setLocale: () => {},
  toggle: () => {},
};

export const LocaleContext = createContext<LocaleContextValue>(defaultCtx);

export function useLocale() {
  return useContext(LocaleContext);
}

/** Wrap your app (or a subtree) with this to enable language switching */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved === "en" || saved === "es") setLocale(saved);
    else if (navigator.language.toLowerCase().startsWith("es")) setLocale("es");
    setHydrated(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const selectLocale = useCallback((next: Locale) => {
    localStorage.setItem(STORAGE_KEY, next);
    setLocale(next);
  }, []);

  const toggle = useCallback(() => {
    setLocale((prev) => {
      const next: Locale = prev === "en" ? "es" : "en";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => translations[locale][key],
    [locale]
  );

  // Suppress SSR mismatch — render with default locale until hydrated
  const value: LocaleContextValue = hydrated
    ? { locale, t, setLocale: selectLocale, toggle }
    : defaultCtx;

  return createElement(LocaleContext.Provider, { value }, children);
}
