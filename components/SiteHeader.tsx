'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Check,
  Globe,
  Menu,
  Monitor,
  Moon,
  ShieldCheck,
  Sun,
  WifiOff,
  X,
} from 'lucide-react';
import { BrandMark } from './BrandMark';
import { CssLink } from './MotionKit';
import { useApp, type ThemeMode } from './AppProvider';
import { LOCALES, type Locale } from '@/lib/locales';
import { SOLANA_CLUSTER } from '@/lib/solana/config';

export function SiteHeader() {
  const pathname = usePathname();
  const { locale, setLocale, t, theme, setTheme, online, guardian } = useApp();

  const [langOpen, setLangOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navOverflow, setNavOverflow] = useState(false);

  const langWrapRef = useRef<HTMLDivElement>(null);
  const langBtnRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const links = [
    { href: '/', label: t('nav.inspect') },
    { href: '/watch', label: t('nav.watch') },
    { href: '/vault', label: t('nav.vault') },
    { href: '/ledger', label: t('nav.ledger') },
    { href: '/deck', label: t('nav.deck') },
  ];

  // Auto-collapse desktop nav if expanded German/Spanish labels overflow
  useLayoutEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const check = () => setNavOverflow(el.scrollWidth > el.clientWidth + 2);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [locale]);

  useEffect(() => {
    if (!langOpen) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!langWrapRef.current?.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLangOpen(false);
        langBtnRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [langOpen]);

  useEffect(() => {
    if (!langOpen) return;
    const items = langWrapRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    const current = Array.from(items ?? []).find(
      (b) => b.getAttribute('aria-checked') === 'true'
    );
    (current ?? items?.[0])?.focus();
  }, [langOpen]);

  const onMenuKey = (e: KeyboardEvent<HTMLUListElement>) => {
    const items = Array.from(
      e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]')
    );
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[(i + 1) % items.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[(i - 1 + items.length) % items.length]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      items[items.length - 1]?.focus();
    }
  };

  return (
    <header className="pr-header">
      <div className="pr-wrap pr-header-inner">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 text-[var(--pr-ink)] no-underline shrink-0"
          >
            <BrandMark size={28} />
            <span className="font-semibold tracking-tight text-base">
              {t('brand.name')}
            </span>
          </Link>

          {SOLANA_CLUSTER !== 'mainnet-beta' && (
            <span
              className="pr-badge pr-badge--warn hidden sm:inline-flex"
              title="Solana Devnet test receipts"
            >
              <span className="pr-badge-dot" aria-hidden="true" />
              {t('badge.devnet')}
            </span>
          )}

          {!online && (
            <span className="pr-badge pr-badge--info">
              <WifiOff size={12} aria-hidden="true" />
              {t('badge.offline')}
            </span>
          )}
        </div>

        <nav
          ref={navRef}
          aria-label="Primary"
          className={`hidden md:flex items-center gap-5 min-w-0 ${navOverflow ? 'md:hidden' : ''}`}
        >
          {links.map((item) => (
            <CssLink
              key={item.href}
              href={item.href}
              active={pathname === item.href}
              className="shrink-0"
            >
              {item.label}
            </CssLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`hidden lg:inline-flex pr-badge ${
              guardian.kidModeLocked ? 'pr-badge--good' : ''
            }`}
          >
            <ShieldCheck size={12} aria-hidden="true" />
            {guardian.kidModeLocked ? t('badge.kidModeOn') : t('badge.kidModeOff')}
          </span>

          {/* Theme 3-state radio group */}
          <div
            role="radiogroup"
            aria-label={t('nav.theme')}
            className="pr-seg hidden sm:inline-grid"
          >
            {(['system', 'light', 'dark'] as ThemeMode[]).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={theme === m}
                aria-label={t(`nav.theme.${m}`)}
                className="pr-seg-item inline-flex items-center justify-center"
                onClick={() => setTheme(m)}
                title={t(`nav.theme.${m}`)}
              >
                {m === 'system' ? (
                  <Monitor size={13} aria-hidden="true" />
                ) : m === 'light' ? (
                  <Sun size={13} aria-hidden="true" />
                ) : (
                  <Moon size={13} aria-hidden="true" />
                )}
              </button>
            ))}
          </div>

          {/* Locale dropdown with top-aligned z-index and full keyboard navigation */}
          <div
            ref={langWrapRef}
            className="relative"
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setLangOpen(false);
              }
            }}
          >
            <button
              ref={langBtnRef}
              type="button"
              aria-haspopup="true"
              aria-expanded={langOpen}
              aria-label={t('nav.language')}
              onClick={() => setLangOpen((o) => !o)}
              className="pr-btn pr-btn--secondary pr-btn--sm"
            >
              <Globe size={14} aria-hidden="true" />
              <span className="pr-mono">{LOCALES[locale].short}</span>
            </button>

            {langOpen && (
              <ul
                role="radiogroup"
                aria-label={t('nav.language')}
                onKeyDown={onMenuKey}
                className="absolute end-0 mt-2 min-w-[172px] p-1.5 rounded-[var(--pr-r-lg)] border border-[var(--pr-rule-2)] bg-[var(--pr-raised)] list-none m-0"
                style={{ zIndex: 'var(--z-dropdown)', boxShadow: 'var(--pr-e3)' }}
              >
                {(Object.keys(LOCALES) as Locale[]).map((code) => {
                  const meta = LOCALES[code];
                  const active = code === locale;
                  return (
                    <li key={code}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={active}
                        lang={meta.htmlLang}
                        onClick={() => {
                          setLocale(code);
                          setLangOpen(false);
                          langBtnRef.current?.focus();
                        }}
                        className="w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-[var(--pr-r-sm)] text-sm border-0 cursor-pointer text-start"
                        style={{
                          background: active ? 'var(--pr-sunken)' : 'transparent',
                          color: active ? 'var(--pr-ink)' : 'var(--pr-ink-2)',
                          fontWeight: active ? 600 : 400,
                        }}
                      >
                        <span>{meta.label}</span>
                        <span className="inline-flex items-center gap-1 pr-mono text-xs text-[var(--pr-ink-3)]">
                          {meta.short}
                          {active && <Check size={13} aria-hidden="true" />}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <button
            type="button"
            aria-label={mobileOpen ? t('nav.close') : t('nav.menu')}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="pr-btn pr-btn--secondary pr-btn--sm md:hidden"
          >
            {mobileOpen ? <X size={16} aria-hidden="true" /> : <Menu size={16} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="md:hidden border-b border-[var(--pr-rule)] bg-[var(--pr-raised)] px-4 py-4 space-y-3"
          style={{ zIndex: 'var(--z-dropdown)', boxShadow: 'var(--pr-e2)' }}
        >
          <nav aria-label="Mobile" className="flex flex-col gap-2">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 rounded-[var(--pr-r)] text-sm font-medium no-underline"
                style={{
                  background: pathname === item.href ? 'var(--pr-sunken)' : 'transparent',
                  color: pathname === item.href ? 'var(--pr-ink)' : 'var(--pr-ink-2)',
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="pt-2 border-t border-[var(--pr-rule)] flex items-center justify-between">
            <span className="text-xs text-[var(--pr-ink-3)]">{t('nav.theme')}</span>
            <div role="radiogroup" aria-label={t('nav.theme')} className="pr-seg">
              {(['system', 'light', 'dark'] as ThemeMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={theme === m}
                  className="pr-seg-item"
                  onClick={() => setTheme(m)}
                >
                  {t(`nav.theme.${m}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

