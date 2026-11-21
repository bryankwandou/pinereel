'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { VideoWorkbench } from '@/components/VideoWorkbench';

declare global {
  interface Window {
    __demoDone?: boolean;
  }
}

const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export default function DemoRecordPage() {
  const targetsRef = useRef(new Map<string, HTMLElement>());
  const startedRef = useRef(false);

  const [cursorPos, setCursorPos] = useState({ x: 320, y: 220 });
  const [clicking, setClicking] = useState(false);
  const [ripple, setRipple] = useState<{ x: number; y: number; key: number } | null>(null);
  const [caption, setCaption] = useState('PineReel: Ad-Free Link Safety & Offline Mountain Vault');

  const registerTarget = useCallback((name: string, el: HTMLElement | null) => {
    if (el) targetsRef.current.set(name, el);
    else targetsRef.current.delete(name);
  }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    window.__demoDone = false;

    const posRef = { x: 320, y: 220 };

    const moveTo = (name: string, dur = 680) =>
      new Promise<void>((resolve) => {
        const el = targetsRef.current.get(name);
        if (!el) {
          resolve();
          return;
        }
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const rect = el.getBoundingClientRect();
        const toX = rect.left + rect.width * 0.5;
        const toY = rect.top + rect.height * 0.5;
        const fromX = posRef.x;
        const fromY = posRef.y;
        const start = performance.now();

        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / dur);
          const e = easeInOut(p);
          const cx = fromX + (toX - fromX) * e;
          const cy = fromY + (toY - fromY) * e;
          posRef.x = cx;
          posRef.y = cy;
          setCursorPos({ x: cx, y: cy });
          if (p < 1) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      });

    const clickTarget = async (name: string) => {
      await moveTo(name, 700);
      setClicking(true);
      setRipple({ x: posRef.x, y: posRef.y, key: Date.now() });
      await wait(110);
      setClicking(false);
      await wait(240);
    };

    const run = async () => {
      try {
        await wait(800);
        setCaption('Step 1: Inspecting a YouTube link with tracking params stripped');
        await clickTarget('sample-youtube-bunny');
        targetsRef.current.get('sample-youtube-bunny')?.click();
        await wait(3400);

        setCaption('Step 2: Resolving direct MP4 stream for ad-free playback');
        await clickTarget('sample-flower-mp4');
        targetsRef.current.get('sample-flower-mp4')?.click();
        await wait(3400);

        setCaption('Step 3: Caching verified MP4 into IndexedDB Mountain Vault');
        await clickTarget('save-vault-btn');
        targetsRef.current.get('save-vault-btn')?.click();
        await wait(3800);

        setCaption('Step 4: Stripping DoubleClick ad wrapper while playing the underlying video');
        await clickTarget('sample-ad-wrapped-yt');
        targetsRef.current.get('sample-ad-wrapped-yt')?.click();
        await wait(2400);
      } finally {
        window.__demoDone = true;
      }
    };

    void run();
  }, []);

  return (
    <div className="pr-wrap py-10 space-y-6 relative">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--pr-rule)] pb-4">
        <div>
          <span className="pr-kicker">LIVE PRODUCT WALKTHROUGH</span>
          <h1 className="pr-h2 mt-1">{caption}</h1>
        </div>
        <span className="pr-badge pr-badge--good">AUTOMATED CAPTURE</span>
      </div>

      <VideoWorkbench registerTarget={registerTarget} />

      {/* Synthetic DOM Cursor (literal colors per Handbook 15.8) */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: cursorPos.x,
          top: cursorPos.y,
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: '#0E5A3E',
          border: '2.5px solid #FFFFFF',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
          transform: `translate(-50%, -50%) scale(${clicking ? 0.82 : 1})`,
          transition: 'transform 90ms ease',
          pointerEvents: 'none',
          zIndex: 99999,
        }}
      />

      {ripple && (
        <div
          key={ripple.key}
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: ripple.x,
            top: ripple.y,
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: '2px solid rgba(14, 90, 62, 0.7)',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 99998,
          }}
        />
      )}
    </div>
  );
}

