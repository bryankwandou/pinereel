'use client';

/**
 * Sticky scroll stacking defense layers (adapted from skiper16).
 * Degrades cleanly into a standard stacked flow when prefers-reduced-motion is enabled.
 */

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useSafeReducedMotion } from './MotionKit';

const LAYERS = [
  {
    num: '01',
    badge: 'Boundary Guard',
    title: 'SSRF & DNS-Rebinding Firewall',
    body: 'Rejects localhost, loopback, link-local metadata endpoints, private LAN ranges, non-http protocols, and embedded credentials before opening a single socket.',
    spec: 'lib/server/redirect-inspector.ts · dns.lookup({ all: true })',
  },
  {
    num: '02',
    badge: 'Redirect Isolation',
    title: 'Non-Executing 5-Hop Shortener Unwrapper',
    body: 'Follows shortened links server-side with manual redirects so hidden hops to gambling portals or malware landing pages are caught before a browser ever visits them.',
    spec: 'Max 5 hops · zero HTML/JS execution during unwrap',
  },
  {
    num: '03',
    badge: 'Threat Classifier',
    title: 'Anti-Gambling, Phishing & Binary Shield',
    body: 'Strips tracking query params (utm_*, fbclid, gclid, si), flags punycode lookalike domains, and blocks gambling lures and .apk/.exe binary downloads.',
    spec: 'lib/shared/safety.ts · 0-100 deterministic score',
  },
  {
    num: '04',
    badge: 'Family Gate',
    title: 'Kid-Safe Metadata Check & PBKDF2 Guardian PIN',
    body: 'Inspects upstream age_limit, isFamilySafe, and sensitivity flags, letting guardians enforce strict Kid Mode or Mountain Offline-Only mode using a salted device PIN.',
    spec: 'Web Crypto PBKDF2-SHA256 · 120,000 iterations',
  },
  {
    num: '05',
    badge: 'Zero-Signal & On-Chain',
    title: 'IndexedDB Mountain Vault & Solana Devnet Memo',
    body: 'Writes verified MP4 streams locally with SHA-256 digests for mountain playback without cellular signal, with optional Solana Devnet Memo receipts.',
    spec: 'IndexedDB + Service Worker + MemoSq4g...mfcHr',
  },
];

function StackCard({
  layer,
  index,
  total,
}: {
  layer: (typeof LAYERS)[number];
  index: number;
  total: number;
}) {
  const reduce = useSafeReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'start start'],
  });
  const targetScale = 1 - (total - 1 - index) * 0.025;
  const scale = useTransform(scrollYProgress, [0, 1], [1, targetScale]);

  return (
    <div
      ref={ref}
      className={reduce ? '' : 'sticky'}
      style={reduce ? undefined : { top: `${88 + index * 18}px` }}
    >
      <motion.article
        style={reduce ? undefined : { scale }}
        className="pr-card p-6 sm:p-7 grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
      >
        <div className="md:col-span-2 flex md:flex-col items-center md:items-start gap-3">
          <span className="text-3xl font-semibold pr-mono text-[var(--pr-signal)]">
            {layer.num}
          </span>
          <span className="pr-badge">{layer.badge}</span>
        </div>

        <div className="md:col-span-7 space-y-1.5">
          <h3 className="pr-h3 text-lg">{layer.title}</h3>
          <p className="text-sm text-[var(--pr-ink-2)] m-0">{layer.body}</p>
        </div>

        <div className="md:col-span-3 md:text-end">
          <code className="inline-block px-2.5 py-1.5 rounded-[var(--pr-r-sm)] bg-[var(--pr-sunken)] border border-[var(--pr-rule)] pr-mono text-[11px] text-[var(--pr-ink-3)]">
            {layer.spec}
          </code>
        </div>
      </motion.article>
    </div>
  );
}

export function ShieldStack() {
  return (
    <div className="space-y-4">
      {LAYERS.map((layer, idx) => (
        <StackCard key={layer.num} layer={layer} index={idx} total={LAYERS.length} />
      ))}
    </div>
  );
}

