import { useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import {
  LanguageContext,
  locales,
  type Locale,
  type Messages,
  type LocaleKeys,
} from './languageCore';

function getNested(obj: Messages, keys: string[]): unknown {
  let acc: unknown = obj;
  for (const key of keys) {
    if (
      acc &&
      typeof acc === 'object' &&
      key in (acc as Record<string, unknown>)
    ) {
      acc = (acc as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return acc;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const browserLang = navigator.language.split('-')[0] as Locale;
  const savedLang = localStorage.getItem('app-lang') as Locale | null;
  const defaultLang =
    (savedLang && locales[savedLang]) || locales[browserLang] || locales.en;

  const [locale, setLocale] = useState<Locale>(
    (savedLang && savedLang in locales
      ? savedLang
      : browserLang in locales
        ? browserLang
        : 'en') as Locale,
  );
  const [messages, setMessages] = useState<Messages>(defaultLang);

  useEffect(() => {
    localStorage.setItem('app-lang', locale);
  }, [locale]);

  useEffect(() => {
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  const changeLanguage = useCallback((lang: Locale) => {
    if (!locales[lang]) {
      console.warn(` Language "${lang}" not found `);
      return;
    }
    setLocale(lang);
    setMessages(locales[lang]);
  }, []);

  const t = useCallback(
    (path: LocaleKeys<Messages>): string => {
      const keys = path.split('.');
      const current = getNested(messages, keys);
      if (typeof current === 'string') return current;

      const fallback = getNested(locales.en, keys);
      if (typeof fallback === 'string') return fallback;

      if (import.meta.env.DEV) {
        console.warn(`[i18n] Missing key "${path}" for locale "${locale}"`);
      }

      return path;
    },
    [messages, locale],
  );

  const value = useMemo(
    () => ({ locale, messages, t, changeLanguage }),
    [locale, messages, t, changeLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
 
