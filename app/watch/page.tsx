'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/components/AppProvider';
import { VideoWorkbench } from '@/components/VideoWorkbench';

function WatchInner() {
  const params = useSearchParams();
  const initialUrl = params.get('url') || '';
  const { t } = useApp();

  return (
    <div className="pr-wrap py-10 space-y-6">
      <div className="space-y-1.5">
        <span className="pr-kicker">{t('player.kicker')}</span>
        <h1 className="pr-h1">{t('nav.watch')}</h1>
      </div>
      <VideoWorkbench initialUrl={initialUrl} />
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense
      fallback={
        <div className="pr-wrap py-10">
          <div className="pr-card p-8 h-64 animate-pulse bg-[var(--pr-sunken)]" />
        </div>
      }
    >
      <WatchInner />
    </Suspense>
  );
}

