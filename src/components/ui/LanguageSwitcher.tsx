"use client";
import { useLocale } from '@/contexts/LocaleContext';
import { type Locale } from '@/lib/i18n';

const locales: Locale[] = ['az', 'ru', 'en'];

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="flex items-center gap-0.5 text-xs font-semibold">
      {locales.map((l, i) => (
        <span key={l} className="flex items-center gap-0.5">
          {i > 0 && <span className="text-gray-300 dark:text-gray-600 mx-0.5">|</span>}
          <button
            onClick={() => setLocale(l)}
            className={
              locale === l
                ? 'text-padel-green font-bold'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
            }
          >
            {l.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}
