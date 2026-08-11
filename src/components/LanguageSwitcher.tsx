"use client";

import { useLocale } from "@/hooks/useLocale";
import type { Locale } from "@/lib/i18n";

interface LanguageSwitcherProps {
  className?: string;
}

const locales: Locale[] = ["es", "en"];

export function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale();

  return (
    <div
      role="group"
      aria-label={locale === "es" ? "Seleccionar idioma" : "Select language"}
      className={`h-8 px-1.5 flex items-center gap-1 rounded-lg bg-[#1c1830] border border-[#2e2950] text-[10px] font-syne font-bold ${className}`}
    >
      <svg
        aria-hidden="true"
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="ml-0.5 text-[#7a6d94]"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>

      {locales.map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={locale === item}
          onClick={() => setLocale(item)}
          className={`h-6 min-w-7 rounded-md px-1.5 transition-colors ${
            locale === item
              ? "bg-[#9d5bf4]/20 text-[#d8b4fe]"
              : "text-[#7a6d94] hover:text-[#c084fc]"
          }`}
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
