'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import '@solana/wallet-adapter-react-ui/styles.css';
import {
  DEFAULT_LOCALE,
  LOCALES,
  interpolate,
  isLocale,
  resolveBrowserLocale,
  type Locale,
  type TranslationKey,
} from '@/lib/locales';
import {
  readGuardianState,
  writeGuardianState,
  type GuardianState,
} from '@/lib/client/guardian-lock';
import { SOLANA_RPC_URL } from '@/lib/solana/config';

export type ThemeMode = 'system' | 'light' | 'dark';

interface AppContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  theme: ThemeMode;
  setTheme: (next: ThemeMode) => void;
  online: boolean;
  guardian: GuardianState;
  setGuardian: (next: GuardianState) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const THEME_STORAGE_KEY = 'pinereel.theme';
const LOCALE_STORAGE_KEY = 'pinereel.locale';

export function AppProvider({ children }: { children: ReactNode }) {
  // Server and first client paint stay identical ('en', 'system') to avoid React #418 hydration mismatch.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [online, setOnline] = useState(true);
  const [guardian, setGuardianState] = useState<GuardianState>({
    pinSet: false,
    kidModeLocked: true,
    mountainVaultOnly: false,
  });

  useEffect(() => {
    try {
      const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (isLocale(savedLocale)) {
        setLocaleState(savedLocale);
      } else if (navigator.languages?.length) {
        setLocaleState(resolveBrowserLocale(navigator.languages));
      }

      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemeState(savedTheme);
        document.documentElement.dataset.theme = savedTheme;
      }
    } catch {
      /* Storage blocked */
    }

    setGuardianState(readGuardianState());
    setOnline(navigator.onLine);

    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    const onStorage = (e: StorageEvent) => {
      if (e.key === LOCALE_STORAGE_KEY && isLocale(e.newValue)) {
        setLocaleState(e.newValue);
      }
      if (e.key === THEME_STORAGE_KEY) {
        if (e.newValue === 'light' || e.newValue === 'dark') {
          setThemeState(e.newValue);
          document.documentElement.dataset.theme = e.newValue;
        } else {
          setThemeState('system');
          delete document.documentElement.dataset.theme;
        }
      }
    };
    window.addEventListener('storage', onStorage);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = LOCALES[locale].htmlLang;
    delete document.documentElement.dataset.localePending;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    const root = document.documentElement;
    try {
      if (next === 'system') {
        delete root.dataset.theme;
        window.localStorage.removeItem(THEME_STORAGE_KEY);
      } else {
        root.dataset.theme = next;
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setGuardian = useCallback((next: GuardianState) => {
    setGuardianState(next);
    writeGuardianState(next);
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const dict = LOCALES[locale].dict;
      const raw = dict[key] ?? LOCALES.en.dict[key] ?? key;
      return vars ? interpolate(raw, vars) : raw;
    },
    [locale]
  );

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  const value = useMemo<AppContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      theme,
      setTheme,
      online,
      guardian,
      setGuardian,
    }),
    [locale, setLocale, t, theme, setTheme, online, guardian, setGuardian]
  );

  return (
    <ConnectionProvider endpoint={SOLANA_RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <AppContext.Provider value={value}>{children}</AppContext.Provider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}
