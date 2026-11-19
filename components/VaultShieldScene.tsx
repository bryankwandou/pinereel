'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { SpringTabs } from './MotionKit';
import type { SimMode } from './VaultShieldCanvas';

const VaultShieldCanvas = dynamic(() => import('./VaultShieldCanvas'), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden="true"
      data-allow-dark="true"
      className="w-full h-full pr-stage-dark"
    />
  ),
});

const MODES: { value: SimMode; label: string }[] = [
  { value: 'intercept', label: 'Threat Intercept' },
  { value: 'clean', label: 'Verified Stream' },
  { value: 'vault', label: 'Mountain Vault' },
];

export function VaultShieldScene() {
  const [mode, setMode] = useState<SimMode>('intercept');

  return (
    <div className="space-y-3">
      <div className="w-full aspect-[16/12] min-h-[320px]">
        <VaultShieldCanvas mode={mode} />
      </div>
      <div className="flex justify-center">
        <SpringTabs
          id="hero-shield-mode"
          label="3D pipeline simulation mode"
          options={MODES}
          value={mode}
          onChange={setMode}
        />
      </div>
    </div>
  );
}
