'use client';

import { BrandMark } from './BrandMark';
import { CssLink } from './MotionKit';
import { useApp } from './AppProvider';
import { SOLANA_CLUSTER } from '@/lib/solana/config';

export function SiteFooter() {
  const { t } = useApp();

  return (
    <footer className="mt-auto border-t border-[var(--pr-rule)] bg-[var(--pr-sunken)]">
      <div className="pr-wrap py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <BrandMark size={24} />
          <div>
            <p className="text-sm font-semibold text-[var(--pr-ink)] m-0">
              {t('brand.name')}
            </p>
            <p className="text-xs text-[var(--pr-ink-3)] m-0 mt-0.5">
              {t('footer.note')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <CssLink href="/vault">{t('nav.vault')}</CssLink>
          <CssLink href="/ledger">{t('nav.ledger')}</CssLink>
          <CssLink href="/deck">{t('nav.deck')}</CssLink>
          <span className="pr-mono text-xs text-[var(--pr-ink-3)]">
            {SOLANA_CLUSTER.toUpperCase()} · v1.0.0
          </span>
        </div>
      </div>
    </footer>
  );
}

