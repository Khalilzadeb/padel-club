"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import az from '../../messages/az.json';
import ru from '../../messages/ru.json';
import en from '../../messages/en.json';
import { type Locale, type Messages, VALID_LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE } from '@/lib/i18n';

const messages: Record<Locale, Messages> = { az, ru, en };

interface LocaleContextValue {
  locale: Locale;
  t: Messages;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

interface LocaleProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
}

export function LocaleProvider({ children, initialLocale = DEFAULT_LOCALE }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    // Sync from cookie on client mount
    const match = document.cookie.match(/padel_locale=([^;]+)/);
    const saved = match?.[1] as Locale;
    if (saved && (VALID_LOCALES as string[]).includes(saved)) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    window.location.reload();
  };

  return (
    <LocaleContext.Provider value={{ locale, t: messages[locale], setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
