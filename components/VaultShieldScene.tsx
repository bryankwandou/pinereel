'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { SimMode } from './VaultShieldCanvas';

const VaultShieldCanvas = dynamic(() => import('./VaultShieldCanvas'), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden="true"
      className="w-full h-full rounded-[var(--pr-r-lg)] border border-[var(--pr-rule)] bg-[var(--pr-sunken)]"
    />
  ),
});

const MODES: { id: SimMode; label: string }[] = [
  { id: 'intercept', label: 'Threat Intercept' },
  { id: 'clean', label: 'Verified Stream' },
  { id: 'vault', label: 'Mountain Vault' },
];

export function VaultShieldScene() {
  const [mode, setMode] = useState<SimMode>('intercept');

  return (
    <div className="space-y-2.5">
      <div className="w-full aspect-[16/11] min-h-[280px]">
        <VaultShieldCanvas mode={mode} />
      </div>
      <div
        role="tablist"
        aria-label="3D pipeline simulation mode"
        className="flex flex-wrap items-center justify-between gap-2 p-1.5 rounded-[var(--pr-r)] border border-[var(--pr-rule)] bg-[var(--pr-sunken)]"
      >
        {MODES.map((m) => {
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setMode(m.id)}
              className="flex-1 px-2.5 py-1.5 rounded-[var(--pr-r-sm)] text-xs font-semibold border-0 cursor-pointer transition-colors"
              style={{
                background: active ? 'var(--pr-raised)' : 'transparent',
                color: active ? 'var(--pr-ink)' : 'var(--pr-ink-3)',
                boxShadow: active ? 'var(--pr-e1)' : 'none',
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
