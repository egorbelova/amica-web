import { createContext, useContext } from 'react';
import { getLastUserId } from '@/utils/chatStateStorage';
import { getLangStorageKey } from './langStorageKey';

const localeModules = import.meta.glob('/src/locales/*.ts', {
  eager: true,
  import: 'default',
});

type NestedMessages = { [k: string]: string | NestedMessages };

export const locales = Object.fromEntries(
  Object.entries(localeModules).map(([path, mod]) => {
    const lang = path.split('/').pop()?.replace('.ts', '') ?? 'en';
    return [lang, mod as NestedMessages];
  }),
) as Record<string, NestedMessages>;

export type Locale = keyof typeof locales;
export type Messages = NestedMessages;

export type LocaleKeys<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? K | `${K}.${LocaleKeys<T[K]>}`
        : K;
    }[keyof T & string]
  : never;

export type LanguageContextType = {
  locale: Locale;
  messages: Messages;
  t: (path: LocaleKeys<Messages>) => string;
  changeLanguage: (lang: Locale) => void;
};

export const LanguageContext = createContext<LanguageContextType | null>(null);

export { getLangStorageKey } from './langStorageKey';

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

/**
 * Resolve a message using the same locale storage rules as LanguageProvider.
 * For copy used outside the React language tree (e.g. UserContext handlers).
 */
export function tSync(
  path: LocaleKeys<Messages>,
  options?: { userId?: number | null },
): string {
  if (typeof window === 'undefined') {
    return path;
  }
  try {
    const uid = options?.userId ?? getLastUserId();
    const storageKey = getLangStorageKey(uid);
    const savedLang = localStorage.getItem(storageKey) as string | null;
    const localeKey: Locale =
      savedLang && savedLang in locales ? (savedLang as Locale) : 'en';
    const messages = locales[localeKey] ?? locales.en;
    const keys = path.split('.');
    const current = getNested(messages, keys);
    if (typeof current === 'string') return current;
    const fallback = getNested(locales.en, keys);
    if (typeof fallback === 'string') return fallback;
  } catch {
    /* ignore */
  }
  return path;
}

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context)
    throw new Error('useTranslation must be used within LanguageProvider');
  return context;
};

export const availableLanguages: {
  code: Locale;
  country: string;
  name: string;
}[] = [
  { code: 'en', country: 'gb', name: 'English' },
  { code: 'ru', country: 'ru', name: 'Русский' },
  // { code: 'ar', country: 'sa', name: 'العربية' },
  { code: 'es', country: 'es', name: 'Español' },
  { code: 'fr', country: 'fr', name: 'Français' },
  { code: 'de', country: 'de', name: 'Deutsch' },
  { code: 'it', country: 'it', name: 'Italiano' },
  { code: 'zh', country: 'cn', name: '中文' },
  { code: 'ja', country: 'jp', name: '日本語' },
  { code: 'ko', country: 'kr', name: '한국어' },
  { code: 'ua', country: 'ua', name: 'Українська' },
];
