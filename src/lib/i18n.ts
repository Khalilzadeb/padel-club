import az from '../../messages/az.json';
import ru from '../../messages/ru.json';
import en from '../../messages/en.json';

const messages = { az, ru, en } as const;

export type Locale = 'az' | 'ru' | 'en';
export type Messages = typeof az;

export const VALID_LOCALES: Locale[] = ['az', 'ru', 'en'];
export const DEFAULT_LOCALE: Locale = 'az';
export const LOCALE_COOKIE = 'padel_locale';

export function getTranslations(locale: string): Messages {
  return messages[(locale as Locale) in messages ? (locale as Locale) : DEFAULT_LOCALE];
}

export function getLocaleFromCookieString(cookieHeader: string | null | undefined): Locale {
  if (!cookieHeader) return DEFAULT_LOCALE;
  const match = cookieHeader.match(/padel_locale=([^;]+)/);
  const locale = match?.[1];
  return (VALID_LOCALES as string[]).includes(locale ?? '') ? (locale as Locale) : DEFAULT_LOCALE;
}
