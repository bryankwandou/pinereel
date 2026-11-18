'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Layers, Shield, Sparkles } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import { SpringTabs } from '@/components/MotionKit';

type SlideKey = 'problem' | 'shield' | 'hybrid' | 'solana' | 'market';

const SLIDES: {
  key: SlideKey;
  label: string;
  title: string;
  summary: string;
  points: { head: string; body: string }[];
}[] = [
  {
    key: 'problem',
    label: '01 Problem',
    title: 'Web video tools expose families to adware, gambling traps, and dead zones.',
    summary:
      'Existing link downloaders rely on popunder ad networks, phishing fake-download buttons, and drop working streams when users travel into mountain regions with zero cellular connectivity.',
    points: [
      {
        head: 'Gambling & Phishing Redirects',
        body: 'Shortened links and free converter portals inject slot/betting overlays and malicious APK lures before playback.',
      },
      {
        head: 'No Kid-Safe Boundary',
        body: 'Raw social platforms surface algorithmic autoplay, tracker beacons, and unvetted comments to children.',
      },
      {
        head: 'Mountain Zero-Signal Gap',
        body: 'Streaming breaks completely in highland villages and rural schools unless videos are cached locally with offline routing.',
      },
    ],
  },
  {
    key: 'shield',
    label: '02 5-Layer Shield',
    title: 'Server-enforced isolation before a single media byte touches the screen.',
    summary:
      'Every submitted URL crosses five independent validation stages that sanitize trackers, unwrap shorteners, and score safety.',
    points: [
      {
        head: 'SSRF & Protocol Sandbox',
        body: 'Blocks private IP ranges, loopback hosts, DNS rebinding targets, and non-web URI schemes.',
      },
      {
        head: 'Redirect Unwrapper + Tracker Stripper',
        body: 'Follows up to 5 non-executing HTTP hops and strips utm_*, fbclid, gclid, si, and affiliate tags.',
      },
      {
        head: 'Gambling, Phishing & Age Filter',
        body: 'Halts executable binaries, punycode spoofing, gambling promotions, and age-restricted metadata under Guardian PIN Lock.',
      },
    ],
  },
  {
    key: 'hybrid',
    label: '03 Hybrid Engine',
    title: 'Local yt-dlp power meets zero-binary Vercel serverless extractors.',
    summary:
      'Naive wrappers crash in serverless clouds. PineReel splits extraction into three interoperable tiers so every deployment stays reliable.',
    points: [
      {
        head: 'Tier 1: Local / Companion yt-dlp + ffmpeg',
        body: 'Automatically activates when running locally to extract and merge 1,000+ platforms into clean MP4 files.',
      },
      {
        head: 'Tier 2: Pure TypeScript Cloud Extractors',
        body: 'Handles Direct MP4/HLS, Archive.org, X/Twitter syndication streams, Vimeo DNT, and privacy-isolated YouTube playback in cloud lambdas.',
      },
      {
        head: 'Tier 3: IndexedDB Mountain Vault + PWA',
        body: 'Streams video blobs straight into local IndexedDB storage with SHA-256 verification and Service Worker offline playback.',
      },
    ],
  },
  {
    key: 'solana',
    label: '04 Solana Devnet',
    title: 'Verifiable SHA-256 safety receipts without gating playback.',
    summary:
      'Families and educators watch or cache videos with zero friction, while optional Solana Devnet Memo transactions create permanent, publicly auditable safety proofs.',
    points: [
      {
        head: 'Content & Safety Fingerprint',
        body: 'Combines sanitized canonical URL, safety verdict, and media SHA-256 checksum into a deterministic digest.',
      },
      {
        head: 'Memo Program Attestation',
        body: 'Anchors compact JSON safety records on Solana Devnet with explicit transaction lifecycle feedback and Explorer links.',
      },
      {
        head: 'Community Safe-List Verification',
        body: 'Anyone can inspect an address or signature live on Devnet RPC to confirm media integrity prior to offline distribution.',
      },
    ],
  },
  {
    key: 'market',
    label: '05 Comparison',
    title: 'Built for safety, offline resilience, and transparent verification.',
    summary:
      'PineReel turns an ad-ridden utility category into a trustworthy family and school media preparation platform.',
    points: [
      {
        head: 'vs. Generic Web Converters',
        body: 'Zero popups, zero gambling redirects, real SSRF/DNS defense, and browser-native offline IndexedDB library.',
      },
      {
        head: 'vs. Desktop CLI Tools',
        body: 'Accessible cross-platform UI with 5 languages, Guardian PIN lock, and one-click offline theater.',
      },
      {
        head: 'Scale Path',
        body: 'Free consumer offline vault + Guardian shared school packs + hosted extraction workers for rural education networks.',
      },
    ],
  },
];

export default function DeckPage() {
  const { t } = useApp();
  const [active, setActive] = useState<SlideKey>('problem');
  const slide = SLIDES.find((s) => s.key === active) ?? SLIDES[0];

  return (
    <div className="pr-wrap py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--pr-rule)] pb-6">
        <div className="space-y-2">
          <span className="pr-kicker">{t('deck.kicker')}</span>
          <h1 className="pr-h1">{t('deck.title')}</h1>
          <p className="pr-lead text-sm sm:text-base">{t('deck.lead')}</p>
        </div>

        <Link href="/" className="pr-btn pr-btn--primary pr-btn--sm shrink-0">
          <span>{t('nav.inspect')}</span>
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>

      <SpringTabs
        id="deck-slides"
        label="Deck sections"
        options={SLIDES.map((s) => ({ value: s.key, label: s.label }))}
        value={active}
        onChange={setActive}
      />

      <article className="pr-card p-6 sm:p-10 space-y-8">
        <div className="space-y-3 max-w-3xl">
          <span className="pr-badge pr-badge--info">{slide.label}</span>
          <h2 className="pr-h1">{slide.title}</h2>
          <p className="pr-lead">{slide.summary}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {slide.points.map((pt, i) => (
            <div key={pt.head} className="pr-sunken p-5 space-y-2">
              <div className="flex items-center gap-2 text-[var(--pr-signal)]">
                {i === 0 ? (
                  <Shield size={16} aria-hidden="true" />
                ) : i === 1 ? (
                  <Layers size={16} aria-hidden="true" />
                ) : (
                  <Sparkles size={16} aria-hidden="true" />
                )}
                <span className="pr-mono text-xs font-semibold">0{i + 1}</span>
              </div>
              <h3 className="pr-h3">{pt.head}</h3>
              <p className="text-sm text-[var(--pr-ink-2)] m-0">{pt.body}</p>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-[var(--pr-rule)] flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--pr-ink-3)]">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-[var(--pr-good)]" aria-hidden="true" />
            Live Solana Devnet RPC + Hybrid Media Pipeline + IndexedDB Offline Vault
          </span>
          <span className="pr-mono">PineReel Architecture Deck</span>
        </div>
      </article>
    </div>
  );
}

