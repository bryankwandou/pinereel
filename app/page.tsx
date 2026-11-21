'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, HardDrive, Shield, Terminal } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import { InteractiveMotionDeck } from '@/components/InteractiveMotionDeck';
import {
  CountUpMetric,
  KineticLine,
  LiveSourceFlipper,
  Magnetic,
  PerspectiveTiltCard,
  ScrollRise,
  StrikeThroughSweep,
  useSafeReducedMotion,
} from '@/components/MotionKit';
import { MountainSimulator } from '@/components/MountainSimulator';
import { ShieldStack } from '@/components/ShieldStack';
import { SourceMarquee } from '@/components/SourceMarquee';
import { ThreatSimulator } from '@/components/ThreatSimulator';
import { VaultShieldScene } from '@/components/VaultShieldScene';
import { VideoWorkbench } from '@/components/VideoWorkbench';

const SOURCE_MATRIX = [
  {
    platform: 'Direct MP4 / WebM / HLS',
    cloud: 'Native stream + HTTPS proxy',
    local: 'Native stream + proxy',
    offline: 'IndexedDB Vault + MP4',
    shield: 'SSRF + MIME + SHA-256',
  },
  {
    platform: 'Archive.org / Open Media',
    cloud: 'JSON metadata + MP4',
    local: 'JSON metadata + MP4',
    offline: 'IndexedDB Vault + MP4',
    shield: 'SSRF + Host screening',
  },
  {
    platform: 'X (Twitter) / Reddit',
    cloud: 'Syndication / JSON MP4 + HLS',
    local: 'yt-dlp + MP4 variants',
    offline: 'IndexedDB Vault + MP4',
    shield: 'Sensitivity + Tracker strip',
  },
  {
    platform: 'YouTube / Vimeo / Dailymotion',
    cloud: 'Isolated nocookie / DNT',
    local: 'yt-dlp + ffmpeg MP4 merge',
    offline: 'Local yt-dlp -> Vault',
    shield: 'isFamilySafe + Age check',
  },
  {
    platform: 'Instagram / TikTok / General Web',
    cloud: 'Outlink unwrap + OG/HTML5 video',
    local: 'yt-dlp full extraction',
    offline: 'Direct / yt-dlp -> Vault',
    shield: '5-hop ad & binary block only',
  },
];

export default function HomePage() {
  const { t, locale } = useApp();
  const reduce = useSafeReducedMotion();
  const [selectedUrl, setSelectedUrl] = useState<string | undefined>(undefined);
  const [triggerCount, setTriggerCount] = useState(0);

  const handleSelectUrl = (url: string) => {
    setSelectedUrl(url);
    setTriggerCount((c) => c + 1);
  };

  return (
    <div className="pb-20">
      {/* Editorial Asymmetric Hero with Kinetic Typography & Interactive 3D Signal Shield */}
      <section className="border-b border-[var(--pr-rule)]">
        <div className="pr-wrap py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="flex flex-wrap items-center gap-2.5 pr-enter" style={{ ['--pr-i' as string]: 0 }}>
              <span className="pr-kicker">
                <span className="inline-block w-2 h-2 rounded-full bg-[var(--pr-signal)]" aria-hidden="true" />
                {t('hero.kicker')}
              </span>
              <LiveSourceFlipper />
            </div>

            <h1 className="pr-display">
              <KineticLine text={t('hero.title.a')} locale={locale} />
              <br />
              <KineticLine text={t('hero.title.b')} locale={locale} accent baseDelayMs={200} />
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-xs pr-mono">
              <span className="px-2.5 py-1 rounded-[var(--pr-r-sm)] bg-[var(--pr-bad-wash)] border border-[var(--pr-bad-rule)] text-[var(--pr-bad)] font-semibold">
                <StrikeThroughSweep>Popups, Ad Wrappers &amp; Malware APK</StrikeThroughSweep>
              </span>
              <span className="px-2.5 py-1 rounded-[var(--pr-r-sm)] bg-[var(--pr-good-wash)] border border-[var(--pr-good-rule)] text-[var(--pr-good)] font-semibold">
                All Public Video &amp; Web Links Allowed
              </span>
            </div>

            <p className="pr-lead pr-enter" style={{ ['--pr-i' as string]: 2 }}>
              {t('hero.lead')}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 pr-enter" style={{ ['--pr-i' as string]: 3 }}>
              <Magnetic>
                <a href="#workbench" className="pr-btn pr-btn--primary pr-btn--lg">
                  <span>{t('hero.ctaInspect')}</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </a>
              </Magnetic>
              <Link href="/vault" className="pr-btn pr-btn--secondary pr-btn--lg">
                <HardDrive size={16} aria-hidden="true" />
                <span>{t('hero.ctaVault')}</span>
              </Link>
            </div>

            <dl
              className="grid grid-cols-2 sm:grid-cols-4 gap-5 pt-4 border-t border-[var(--pr-rule)] pr-enter"
              style={{ ['--pr-i' as string]: 4 }}
            >
              <div>
                <dt className="text-[11px] pr-mono text-[var(--pr-ink-3)] uppercase">Shield Gates</dt>
                <dd className="text-2xl font-semibold text-[var(--pr-ink)] m-0 mt-0.5">
                  <CountUpMetric value={5} />
                </dd>
              </div>
              <div>
                <dt className="text-[11px] pr-mono text-[var(--pr-ink-3)] uppercase">Ad Scripts</dt>
                <dd className="text-2xl font-semibold text-[var(--pr-ink)] m-0 mt-0.5">
                  <CountUpMetric value={0} />
                </dd>
              </div>
              <div>
                <dt className="text-[11px] pr-mono text-[var(--pr-ink-3)] uppercase">Source Engines</dt>
                <dd className="text-2xl font-semibold text-[var(--pr-ink)] m-0 mt-0.5">
                  <CountUpMetric value={9} suffix="+" />
                </dd>
              </div>
              <div>
                <dt className="text-[11px] pr-mono text-[var(--pr-ink-3)] uppercase">Offline Seek</dt>
                <dd className="text-2xl font-semibold text-[var(--pr-ink)] m-0 mt-0.5">
                  <CountUpMetric value={0} suffix=" ms" />
                </dd>
              </div>
            </dl>
          </div>

          <div className="lg:col-span-5">
            <PerspectiveTiltCard>
              <VaultShieldScene />
            </PerspectiveTiltCard>
          </div>
        </div>
      </section>

      {/* Progressive Dual Edge-Masked Source & Security Ribbon */}
      <SourceMarquee />

      {/* Primary Interactive Link Inspector & Isolated Player */}
      <section id="workbench" className="pr-wrap pt-10 sm:pt-12">
        <ScrollRise>
          <VideoWorkbench
            externalUrlOverride={selectedUrl}
            externalTriggerCount={triggerCount}
          />
        </ScrollRise>
      </section>

      {/* Interactive 0-100 Ad-Shield & 3D Motion Choreography Studio */}
      <section className="pr-wrap pt-14 sm:pt-16">
        <ScrollRise>
          <InteractiveMotionDeck onSelectUrl={handleSelectUrl} />
        </ScrollRise>
      </section>

      {/* Live URL Anatomy & Ad-Only Block Sandbox */}
      <section className="pr-wrap pt-14 sm:pt-16">
        <ScrollRise>
          <ThreatSimulator />
        </ScrollRise>
      </section>

      {/* Interactive Mountain Zero-Signal Resilience Simulator */}
      <section className="pr-wrap pt-12 sm:pt-14">
        <ScrollRise>
          <MountainSimulator />
        </ScrollRise>
      </section>

      {/* Sticky Stacking 5-Layer Defense Architecture (skiper16 pattern) */}
      <section className="pr-wrap pt-16 sm:pt-20 space-y-6">
        <div className="border-t border-[var(--pr-rule)] pt-10 space-y-2">
          <span className="pr-kicker">{t('shield.kicker')}</span>
          <h2 className="pr-h2 max-w-2xl">{t('shield.title')}</h2>
        </div>
        <ShieldStack />
      </section>

      {/* Production Walkthrough Video */}
      <section className="pr-wrap pt-16 sm:pt-20 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-t border-[var(--pr-rule)] pt-10">
          <div className="space-y-2">
            <span className="pr-kicker">{t('walkthrough.kicker')}</span>
            <h2 className="pr-h2">{t('walkthrough.title')}</h2>
            <p className="pr-lead text-sm sm:text-base">{t('walkthrough.lead')}</p>
          </div>
          <Link href="/deck" className="pr-btn pr-btn--secondary pr-btn--sm shrink-0">
            {t('nav.deck')}
          </Link>
        </div>

        <div className="pr-card overflow-hidden">
          <video
            src="/walkthrough.mp4"
            poster="/walkthrough-poster.jpg"
            width={1920}
            height={1080}
            muted
            playsInline
            loop
            autoPlay={!reduce}
            preload="metadata"
            controls
            aria-label="PineReel automated product walkthrough"
            style={{ width: '100%', height: 'auto', aspectRatio: '16 / 9', display: 'block' }}
          />
        </div>
      </section>

      {/* Architecture Overview */}
      <section className="pr-wrap pt-16 sm:pt-20 space-y-6">
        <div className="border-t border-[var(--pr-rule)] pt-10 space-y-2">
          <span className="pr-kicker">{t('how.kicker')}</span>
          <h2 className="pr-h2 max-w-2xl">{t('how.title')}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <article className="pr-card p-6 space-y-2.5">
            <Shield size={18} className="text-[var(--pr-signal)]" aria-hidden="true" />
            <h3 className="pr-h3">{t('how.step1Title')}</h3>
            <p className="text-sm text-[var(--pr-ink-2)] m-0">{t('how.step1Body')}</p>
          </article>

          <article className="pr-card p-6 space-y-2.5">
            <Terminal size={18} className="text-[var(--pr-signal)]" aria-hidden="true" />
            <h3 className="pr-h3">{t('how.step2Title')}</h3>
            <p className="text-sm text-[var(--pr-ink-2)] m-0">{t('how.step2Body')}</p>
          </article>

          <article className="pr-card p-6 space-y-2.5">
            <HardDrive size={18} className="text-[var(--pr-signal)]" aria-hidden="true" />
            <h3 className="pr-h3">{t('how.step3Title')}</h3>
            <p className="text-sm text-[var(--pr-ink-2)] m-0">{t('how.step3Body')}</p>
          </article>
        </div>
      </section>

      {/* Source Capability Comparison Table */}
      <section className="pr-wrap pt-16 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <span className="pr-kicker">SOURCE ENGINE MATRIX</span>
          <Link href="/ledger" className="text-xs font-semibold text-[var(--pr-signal)]">
            {t('nav.ledger')}
          </Link>
        </div>
        <div className="pr-table-wrap">
          <table className="pr-table">
            <thead>
              <tr>
                <th>Source Platform</th>
                <th>Cloud Serverless</th>
                <th>Local yt-dlp Runtime</th>
                <th>Offline Storage</th>
                <th>Active Shield</th>
              </tr>
            </thead>
            <tbody>
              {SOURCE_MATRIX.map((row) => (
                <tr key={row.platform}>
                  <td className="font-semibold">{row.platform}</td>
                  <td className="pr-mono text-xs">{row.cloud}</td>
                  <td className="pr-mono text-xs">{row.local}</td>
                  <td className="pr-mono text-xs">{row.offline}</td>
                  <td className="text-xs text-[var(--pr-ink-2)]">{row.shield}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
