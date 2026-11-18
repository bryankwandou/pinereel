import { en, type Dictionary, type TranslationKey } from './en';
import { id } from './id';
import { de } from './de';
import { es } from './es';
import { ja } from './ja';

export const LOCALES = {
  en: { label: 'English', short: 'EN', dict: en as Dictionary, htmlLang: 'en' },
  id: { label: 'Indonesia', short: 'ID', dict: id, htmlLang: 'id' },
  de: { label: 'Deutsch', short: 'DE', dict: de, htmlLang: 'de' },
  es: { label: 'Espanol', short: 'ES', dict: es, htmlLang: 'es' },
  ja: { label: '日本語', short: 'JA', dict: ja, htmlLang: 'ja' },
} as const;

export type Locale = keyof typeof LOCALES;
export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && value in LOCALES;
}

export function resolveBrowserLocale(candidates: readonly string[]): Locale {
  for (const raw of candidates) {
    const tag = raw.toLowerCase();
    if (isLocale(tag)) return tag;
    const base = tag.split('-')[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] !== undefined ? String(vars[k]) : `{${k}}`
  );
}

export type { Dictionary, TranslationKey };

