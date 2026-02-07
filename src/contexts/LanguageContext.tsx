import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

const localeModules = import.meta.glob('/src/locales/*.ts', {
  eager: true,
  import: 'default',
});

const locales = Object.fromEntries(
  Object.entries(localeModules).map(([path, mod]) => {
    const lang = path.split('/').pop()?.replace('.ts', '') ?? 'en';
    return [lang, mod];
  }),
) as Record<string, Record<string, any>>;

export type Locale = keyof typeof locales;
type Messages = (typeof locales)[Locale];

type LocaleKeys<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? K | `${K}.${LocaleKeys<T[K]>}`
        : K;
    }[keyof T & string]
  : never;

type LanguageContextType = {
  locale: Locale;
  messages: Messages;
  t: (path: LocaleKeys<Messages>) => string;
  changeLanguage: (lang: Locale) => void;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

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

  const changeLanguage = (lang: Locale) => {
    if (!locales[lang]) {
      console.warn(` Language "${lang}" not found `);
      return;
    }
    setLocale(lang);
    setMessages(locales[lang]);
  };

  const t = (path: LocaleKeys<Messages>): string => {
    const current = path
      .split('.')
      .reduce((acc: any, key) => acc?.[key], messages);
    if (current) return current as string;

    const fallback = path
      .split('.')
      .reduce((acc: any, key) => acc?.[key], locales.en);
    if (fallback) return fallback as string;

    if (import.meta.env.DEV) {
      console.warn(`[i18n] Missing key "${path}" for locale "${locale}"`);
    }

    return path;
  };

  return (
    <LanguageContext.Provider value={{ locale, messages, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
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
  { code: 'ar', country: 'sa', name: 'العربية' },
  { code: 'es', country: 'es', name: 'Español' },
  { code: 'fr', country: 'fr', name: 'Français' },
  { code: 'de', country: 'de', name: 'Deutsch' },
  { code: 'it', country: 'it', name: 'Italiano' },
  { code: 'zh', country: 'cn', name: '中文' },
  { code: 'ja', country: 'jp', name: '日本語' },
  { code: 'ko', country: 'kr', name: '한국어' },
  { code: 'ua', country: 'ua', name: 'Українська' },
];
