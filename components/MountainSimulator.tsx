'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, HardDrive, Mountain, Wifi, WifiOff } from 'lucide-react';
import { useSafeReducedMotion } from './MotionKit';

export function MountainSimulator() {
  const reduce = useSafeReducedMotion();
  const [signalPct, setSignalPct] = useState(0);

  const isDeadZone = signalPct < 15;
  const isWeak = signalPct >= 15 && signalPct < 55;
  const zoneLabel = isDeadZone
    ? 'Highland Ridge · 0 Bars (No Cellular Signal)'
    : isWeak
      ? 'Foothill Trail · Weak Edge Signal'
      : 'Town Basecamp · Full 4G / Fiber';

  const bars = signalPct === 0 ? 0 : signalPct < 25 ? 1 : signalPct < 55 ? 2 : signalPct < 80 ? 3 : 4;

  return (
    <div className="pr-card p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      <div className="lg:col-span-6 space-y-5">
        <div className="space-y-2">
          <span className="pr-kicker">
            <Mountain size={13} aria-hidden="true" />
            MOUNTAIN ZERO-SIGNAL SIMULATOR
          </span>
          <h2 className="pr-h2">Drag signal down to zero. Cached lessons keep playing.</h2>
          <p className="text-sm text-[var(--pr-ink-2)] m-0">
            When kids head back up to remote mountain communities with zero reception, cached MP4s in the IndexedDB Vault bypass the network layer completely via Service Worker and Blob storage.
          </p>
        </div>

        <div className="pr-sunken p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="signal-slider" className="text-xs font-semibold text-[var(--pr-ink)]">
              Cellular Signal Strength
            </label>
            <span className="pr-mono text-sm font-semibold text-[var(--pr-signal)]">
              {signalPct}%
            </span>
          </div>

          <input
            id="signal-slider"
            type="range"
            min={0}
            max={100}
            value={signalPct}
            onChange={(e) => setSignalPct(Number(e.target.value))}
            className="w-full accent-[var(--pr-signal)] cursor-pointer"
          />

          <div className="flex items-center justify-between text-xs text-[var(--pr-ink-3)] pr-mono">
            <span>0% Mountain Ridge</span>
            <span>50% Foothills</span>
            <span>100% City</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/vault" className="pr-btn pr-btn--primary pr-btn--sm">
            <HardDrive size={14} aria-hidden="true" />
            <span>Open Offline Vault</span>
          </Link>
          <span className="pr-mono text-xs text-[var(--pr-ink-3)]">{zoneLabel}</span>
        </div>
      </div>

      {/* Interactive Live Status Telemetry Panel */}
      <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div
          animate={{ opacity: isDeadZone ? 0.65 : 1 }}
          transition={reduce ? { duration: 0.01 } : { duration: 0.25 }}
          className="p-5 rounded-[var(--pr-r-lg)] border border-[var(--pr-rule)] bg-[var(--pr-sunken)] space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="pr-mono text-xs text-[var(--pr-ink-3)]">CLOUD STREAMING</span>
            {isDeadZone ? (
              <WifiOff size={16} className="text-[var(--pr-bad)]" aria-hidden="true" />
            ) : (
              <Wifi size={16} className="text-[var(--pr-good)]" aria-hidden="true" />
            )}
          </div>

          <div className="flex items-end gap-1.5 h-8" aria-hidden="true">
            {[1, 2, 3, 4].map((level) => (
              <motion.span
                key={level}
                className="w-2.5 rounded-sm"
                animate={{
                  height: `${level * 7}px`,
                  backgroundColor: level <= bars ? 'var(--pr-signal)' : 'var(--pr-rule-2)',
                }}
              />
            ))}
          </div>

          <p className="text-sm font-semibold text-[var(--pr-ink)] m-0">
            {isDeadZone
              ? 'External Embed Unreachable'
              : isWeak
                ? 'Buffering / High Latency'
                : 'Live Resolution Active'}
          </p>
          <p className="text-xs text-[var(--pr-ink-3)] pr-mono m-0">
            {isDeadZone ? 'Packet Loss: 100%' : `Downlink: ${(signalPct * 0.48).toFixed(1)} Mbps`}
          </p>
        </motion.div>

        <motion.div
          data-allow-dark="true"
          animate={{ scale: isDeadZone && !reduce ? 1.02 : 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="p-5 pr-stage-dark space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="pr-mono text-xs font-semibold text-[#5fe09e]">
              INDEXEDDB VAULT
            </span>
            <CheckCircle2 size={16} className="text-[#5fe09e]" aria-hidden="true" />
          </div>

          <div className="text-3xl font-semibold pr-mono text-[#f2f1ec]">
            0.0 ms <span className="text-xs text-[#929e98]">seek</span>
          </div>

          <p className="text-sm font-semibold text-[#f2f1ec] m-0">
            Local Blob Playback Ready
          </p>
          <p className="text-xs text-[#c5ccc8] pr-mono m-0">
            SHA-256 Verified · SW Shell Active
          </p>
        </motion.div>
      </div>
    </div>
  );
}

