'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Hls from 'hls.js';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  HardDriveDownload,
  Loader2,
  Lock,
  Play,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Sparkles,
} from 'lucide-react';
import { useApp } from './AppProvider';
import { GuardianModal } from './GuardianModal';
import { Magnetic } from './MotionKit';
import type { MediaStreamVariant, ResolvedMedia } from '@/lib/server/media-resolver';
import { CURATED_SAMPLES } from '@/lib/shared/presets';
import { cacheStreamIntoVault, formatBytes } from '@/lib/client/offline-vault';
import { explorerUrl } from '@/lib/solana/config';
import { submitWalletAttestation, type TxPhase } from '@/lib/solana/attestation';

function formatDuration(sec: number | null): string {
  if (!sec || !Number.isFinite(sec)) return '--:--';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function VideoWorkbench({
  initialUrl = '',
  registerTarget,
  externalUrlOverride,
  externalTriggerCount = 0,
}: {
  initialUrl?: string;
  registerTarget?: (name: string, el: HTMLElement | null) => void;
  externalUrlOverride?: string;
  externalTriggerCount?: number;
}) {
  const { t, locale, guardian } = useApp();
  const { connection } = useConnection();
  const wallet = useWallet();
  const { setVisible: setWalletModalOpen } = useWalletModal();

  const [urlInput, setUrlInput] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resolved, setResolved] = useState<ResolvedMedia | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState<number>(1);

  const [savingVault, setSavingVault] = useState(false);
  const [saveProgress, setSaveProgress] = useState<string>('0%');
  const [savedVaultId, setSavedVaultId] = useState<string | null>(null);
  const [vaultError, setVaultError] = useState<string | null>(null);

  const [txPhase, setTxPhase] = useState<TxPhase>({ kind: 'idle' });
  const [guardianOpen, setGuardianOpen] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [ytdlpReady, setYtdlpReady] = useState<boolean | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { ytdlpAvailable?: boolean } | null) => {
        if (d && typeof d.ytdlpAvailable === 'boolean') {
          setYtdlpReady(d.ytdlpAvailable);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!loading) {
      setScanStep(0);
      return;
    }
    const timer = setInterval(() => {
      setScanStep((s) => Math.min(4, s + 1));
    }, 320);
    return () => clearInterval(timer);
  }, [loading]);

  const inspectUrl = useCallback(async (targetUrl: string) => {
    const clean = targetUrl.trim();
    if (!clean) {
      setErrorMsg('Enter a valid http or https video URL.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSavedVaultId(null);
    setVaultError(null);
    setTxPhase({ kind: 'idle' });

    try {
      const res = await fetch('/api/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: clean }),
      });
      const data = (await res.json()) as ResolvedMedia & { error?: string };
      if (!data?.safety) {
        setErrorMsg(data?.error || 'Could not inspect this URL.');
        setResolved(null);
        return;
      }
      setResolved(data);
      setSelectedVariantId(data.streams?.[0]?.id ?? null);
    } catch {
      setErrorMsg('Network unavailable while reaching link inspector. Open Offline Vault for cached videos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (externalUrlOverride !== undefined && externalTriggerCount > 0) {
      setUrlInput(externalUrlOverride);
      void inspectUrl(externalUrlOverride);
    }
  }, [externalUrlOverride, externalTriggerCount, inspectUrl]);

  useEffect(() => {
    if (initialUrl) {
      void inspectUrl(initialUrl);
    }
  }, [initialUrl, inspectUrl]);

  const activeVariant: MediaStreamVariant | null = useMemo(() => {
    if (!resolved?.streams?.length) return null;
    return resolved.streams.find((s) => s.id === selectedVariantId) ?? resolved.streams[0];
  }, [resolved, selectedVariantId]);

  const streamSrc = activeVariant ? activeVariant.proxyUrl : resolved?.preferredStreamUrl ?? null;

  // Bind HTML5 video + optional HLS.js safely without third-party scripts
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamSrc) return;
    let hls: Hls | null = null;

    if (activeVariant?.isHls && Hls.isSupported() && !video.canPlayType('application/vnd.apple.mpegurl')) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(streamSrc);
      hls.attachMedia(video);
    } else {
      video.src = streamSrc;
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [streamSrc, activeVariant]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const kidRestricted = Boolean(
    resolved &&
      resolved.safety.verdict !== 'BLOCKED' &&
      guardian.kidModeLocked &&
      !resolved.safety.kidSafe
  );

  const handleSaveOffline = async () => {
    if (!resolved || !activeVariant || activeVariant.isHls) return;
    setSavingVault(true);
    setVaultError(null);
    setSaveProgress('0%');
    try {
      const id = resolved.safety.fingerprint.slice(0, 16);
      const summary = await cacheStreamIntoVault({
        id,
        streamUrl: activeVariant.proxyUrl,
        title: resolved.title,
        author: resolved.author,
        sourceUrl: resolved.safety.sanitizedUrl,
        sourceType: resolved.safety.sourceType,
        mimeType: activeVariant.mimeType,
        durationSeconds: resolved.durationSeconds,
        safetyScore: resolved.safety.score,
        kidSafe: resolved.safety.kidSafe,
        onProgress: (loaded, total) => {
          if (total && total > 0) {
            const pct = Math.min(100, Math.round((loaded / total) * 100));
            setSaveProgress(`${pct}%`);
          } else {
            setSaveProgress(formatBytes(loaded, locale));
          }
        },
      });
      setSavedVaultId(summary.id);
    } catch (err) {
      setVaultError(err instanceof Error ? err.message : 'Unable to save video to Offline Vault.');
    } finally {
      setSavingVault(false);
    }
  };

  const handleAnchorDevnet = async () => {
    if (!resolved) return;
    if (!wallet.connected || !wallet.publicKey) {
      setWalletModalOpen(true);
      return;
    }
    await submitWalletAttestation(
      connection,
      wallet,
      {
        v: 1,
        app: 'pinereel',
        verdict: resolved.safety.verdict,
        score: resolved.safety.score,
        kidSafe: resolved.safety.kidSafe,
        source: resolved.safety.sourceType,
        urlHash: resolved.safety.fingerprint.slice(0, 24),
      },
      setTxPhase
    );
  };

  const busyTx =
    txPhase.kind === 'building' || txPhase.kind === 'signing' || txPhase.kind === 'sent';

  return (
    <div className="space-y-6">
      {/* Mountain Offline-Only Guardian Lock */}
      {guardian.mountainVaultOnly ? (
        <div className="pr-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-[var(--pr-r)] bg-[var(--pr-signal-wash)] text-[var(--pr-signal)]">
              <Lock size={20} />
            </div>
            <div>
              <h2 className="pr-h3">Mountain Offline-Only Lock Active</h2>
              <p className="text-sm text-[var(--pr-ink-2)] mt-1 m-0">
                External link inspection is hidden so kids watch only verified offline videos.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/vault" className="pr-btn pr-btn--primary pr-btn--sm">
              {t('hero.ctaVault')}
            </Link>
            <button
              type="button"
              onClick={() => setGuardianOpen(true)}
              className="pr-btn pr-btn--secondary pr-btn--sm"
            >
              {t('vault.pinUnlock')}
            </button>
          </div>
        </div>
      ) : (
        <div className="pr-card p-5 sm:p-6 space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void inspectUrl(urlInput);
            }}
            className="space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="video-url-input"
                className="text-sm font-semibold text-[var(--pr-ink-2)]"
              >
                {t('hero.inputLabel')}
              </label>
              <div className="flex items-center gap-2">
                {ytdlpReady !== null && (
                  <span className={`pr-badge ${ytdlpReady ? 'pr-badge--good' : 'pr-badge--info'}`}>
                    <span className="pr-badge-dot" aria-hidden="true" />
                    {ytdlpReady ? 'Local yt-dlp Engine' : 'Cloud Extractors'}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setGuardianOpen(true)}
                  className="pr-btn pr-btn--ghost pr-btn--sm"
                >
                  <ShieldCheck size={14} aria-hidden="true" />
                  {guardian.kidModeLocked ? t('badge.kidModeOn') : t('badge.kidModeOff')}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <div
                ref={(el) => registerTarget?.('url-input-wrap', el)}
                className="pr-input-wrap flex-1"
              >
                <input
                  id="video-url-input"
                  name="url"
                  type="url"
                  inputMode="url"
                  autoComplete="off"
                  spellCheck={false}
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder={t('hero.inputPlaceholder')}
                  className="pr-input pr-mono text-sm"
                  aria-describedby={errorMsg ? 'url-input-err' : undefined}
                />
              </div>

              <Magnetic>
                <button
                  ref={(el) => registerTarget?.('inspect-submit', el)}
                  type="submit"
                  disabled={loading}
                  aria-busy={loading || undefined}
                  className="pr-btn pr-btn--primary pr-btn--lg w-full sm:w-auto"
                >
                  <Play size={15} aria-hidden="true" />
                  <span>{loading ? t('hero.ctaInspecting') : t('hero.ctaInspect')}</span>
                </button>
              </Magnetic>
            </div>

            {errorMsg && (
              <p
                id="url-input-err"
                role="alert"
                className="text-sm text-[var(--pr-bad)] m-0 flex items-center gap-1.5"
              >
                <ShieldAlert size={15} aria-hidden="true" />
                {errorMsg}
              </p>
            )}
          </form>

          {/* Quick testable real links + threat filter simulation */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-medium text-[var(--pr-ink-3)]">
              {t('hero.samplePrefix')}
            </span>
            {CURATED_SAMPLES.map((sample) => (
              <button
                key={sample.id}
                ref={(el) => registerTarget?.(`sample-${sample.id}`, el)}
                type="button"
                onClick={() => {
                  setUrlInput(sample.url);
                  void inspectUrl(sample.url);
                }}
                className={`px-2.5 py-1 rounded-[var(--pr-r-pill)] text-xs font-medium border cursor-pointer transition-colors ${
                  sample.expectedKind === 'blocked'
                    ? 'border-[var(--pr-bad-rule)] bg-[var(--pr-bad-wash)] text-[var(--pr-bad)]'
                    : 'border-[var(--pr-rule)] bg-[var(--pr-sunken)] text-[var(--pr-ink-2)] hover:text-[var(--pr-ink)] hover:border-[var(--pr-rule-2)]'
                }`}
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results & Isolated Theater */}
      {loading ? (
        <div className="pr-card p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2.5">
            <Loader2 size={18} className="animate-spin text-[var(--pr-signal)]" aria-hidden="true" />
            <span className="pr-kicker">{t('hero.ctaInspecting')}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            {[
              '01 SSRF & DNS Guard',
              '02 Redirect Unwrap',
              '03 Tracker Stripper',
              '04 Anti-Judol & Phish',
              '05 Stream Extraction',
            ].map((stepLabel, idx) => {
              const active = idx <= scanStep;
              return (
                <motion.div
                  key={stepLabel}
                  animate={{ opacity: active ? 1 : 0.45 }}
                  className="p-3 rounded-[var(--pr-r-sm)] border border-[var(--pr-rule)] bg-[var(--pr-sunken)] text-xs pr-mono flex items-center gap-2"
                  style={{
                    borderColor: active ? 'var(--pr-signal-rule)' : 'var(--pr-rule)',
                    background: active ? 'var(--pr-signal-wash)' : 'var(--pr-sunken)',
                    color: active ? 'var(--pr-signal)' : 'var(--pr-ink-3)',
                  }}
                >
                  <CheckCircle2 size={13} aria-hidden="true" />
                  <span>{stepLabel}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : !resolved ? (
        <div className="pr-card p-8 text-center space-y-2 border-dashed">
          <p className="pr-kicker justify-center">{t('player.kicker')}</p>
          <h2 className="pr-h3">{t('player.emptyTitle')}</h2>
          <p className="text-sm text-[var(--pr-ink-3)] max-w-xl mx-auto m-0">
            {t('player.emptyBody')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Player Column */}
          <div className="lg:col-span-7 pr-card overflow-hidden">
            {resolved.safety.verdict === 'BLOCKED' ? (
              <div
                ref={(el) => registerTarget?.('blocked-panel', el)}
                className="p-8 sm:p-10 space-y-4 bg-[var(--pr-bad-wash)]"
              >
                <span className="pr-badge pr-badge--bad">
                  <span className="pr-badge-dot" aria-hidden="true" />
                  {t('shield.verdict.BLOCKED')} · {resolved.safety.score}/100
                </span>
                <h2 className="pr-h2 text-[var(--pr-bad)] flex items-center gap-2">
                  <ShieldOff size={22} aria-hidden="true" />
                  {t('player.blockedTitle')}
                </h2>
                <p className="text-sm text-[var(--pr-ink)] m-0 max-w-lg">
                  {t('player.blockedBody')}
                </p>
                <div className="p-3 rounded-[var(--pr-r)] bg-[var(--pr-raised)] border border-[var(--pr-bad-rule)] pr-mono text-xs break-all text-[var(--pr-ink-2)]">
                  {resolved.safety.originalUrl}
                </div>
              </div>
            ) : kidRestricted ? (
              <div className="p-8 sm:p-10 space-y-4 bg-[var(--pr-warn-wash)]">
                <span className="pr-badge pr-badge--warn">
                  <span className="pr-badge-dot" aria-hidden="true" />
                  {t('shield.kidSafeNo')}
                </span>
                <h2 className="pr-h2 flex items-center gap-2">
                  <Lock size={22} aria-hidden="true" />
                  {t('player.kidBlockedTitle')}
                </h2>
                <p className="text-sm text-[var(--pr-ink)] m-0 max-w-lg">
                  {t('player.kidBlockedBody')}
                </p>
                <button
                  type="button"
                  onClick={() => setGuardianOpen(true)}
                  className="pr-btn pr-btn--primary pr-btn--sm"
                >
                  {t('vault.pinUnlock')}
                </button>
              </div>
            ) : (
              <div>
                <div className="relative aspect-video bg-[#0B0F0E]" data-allow-dark>
                  {streamSrc ? (
                    <video
                      ref={videoRef}
                      controls
                      playsInline
                      preload="metadata"
                      poster={resolved.thumbnailUrl || undefined}
                      className="w-full h-full object-contain block"
                    />
                  ) : resolved.privacyEmbedUrl ? (
                    <iframe
                      src={resolved.privacyEmbedUrl}
                      title={resolved.title}
                      className="w-full h-full border-0 block"
                      sandbox="allow-scripts allow-same-origin allow-presentation"
                      referrerPolicy="no-referrer"
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-6 text-center text-[#F2F1EC]">
                      <div className="space-y-2 max-w-md">
                        <p className="font-semibold text-sm m-0">{resolved.title}</p>
                        <p className="text-xs text-[#C5CCC8] m-0">{resolved.offlineNote}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Controls and Offline Vault Actions */}
                <div className="p-5 space-y-4 border-t border-[var(--pr-rule)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="pr-badge pr-badge--info">
                          {resolved.safety.sourceType}
                        </span>
                        <span className="pr-mono text-xs text-[var(--pr-ink-3)]">
                          {resolved.engine} · {formatDuration(resolved.durationSeconds)}
                        </span>
                      </div>
                      <h2 className="pr-h3 truncate max-w-xl" title={resolved.title}>
                        {resolved.title}
                      </h2>
                      <p className="text-xs text-[var(--pr-ink-3)] mt-0.5 m-0">
                        {resolved.author}
                      </p>
                    </div>

                    {streamSrc && (
                      <div className="flex items-center gap-2">
                        <label htmlFor="speed-select" className="text-xs text-[var(--pr-ink-3)]">
                          {t('player.speed')}
                        </label>
                        <select
                          id="speed-select"
                          value={playbackRate}
                          onChange={(e) => setPlaybackRate(Number(e.target.value))}
                          className="h-8 px-2 rounded-[var(--pr-r-sm)] border border-[var(--pr-rule-2)] bg-[var(--pr-raised)] text-xs pr-mono text-[var(--pr-ink)]"
                        >
                          {[0.75, 1, 1.25, 1.5, 2].map((r) => (
                            <option key={r} value={r}>
                              {r}x
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {resolved.streams.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      {resolved.streams.map((v) => {
                        const active = v.id === activeVariant?.id;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setSelectedVariantId(v.id)}
                            className={`px-2.5 py-1 rounded-[var(--pr-r-sm)] text-xs pr-mono border cursor-pointer ${
                              active
                                ? 'border-[var(--pr-signal)] bg-[var(--pr-signal-wash)] text-[var(--pr-signal)] font-semibold'
                                : 'border-[var(--pr-rule)] bg-[var(--pr-sunken)] text-[var(--pr-ink-2)]'
                            }`}
                          >
                            {v.label}
                            {v.filesizeBytes ? ` · ${formatBytes(v.filesizeBytes, locale)}` : ''}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    {activeVariant && !activeVariant.isHls && (
                      <button
                        ref={(el) => registerTarget?.('save-vault-btn', el)}
                        type="button"
                        disabled={savingVault}
                        onClick={() => void handleSaveOffline()}
                        className="pr-btn pr-btn--primary pr-btn--sm"
                      >
                        <HardDriveDownload size={14} aria-hidden="true" />
                        <span>
                          {savingVault
                            ? t('player.savingVault', { progress: saveProgress })
                            : savedVaultId
                            ? t('player.savedVault')
                            : t('player.saveVault')}
                        </span>
                      </button>
                    )}

                    {(activeVariant || resolved.ytdlpAvailable) && (
                      <a
                        href={
                          activeVariant
                            ? activeVariant.downloadUrl
                            : `/api/download?source=${encodeURIComponent(resolved.safety.sanitizedUrl)}&filename=${encodeURIComponent(
                                `${resolved.title.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 48)}.mp4`
                              )}`
                        }
                        download
                        className="pr-btn pr-btn--secondary pr-btn--sm"
                      >
                        <Download size={14} aria-hidden="true" />
                        <span>{t('player.downloadMp4')}</span>
                      </a>
                    )}

                    <Link
                      href={`/watch?url=${encodeURIComponent(resolved.safety.sanitizedUrl)}`}
                      className="pr-btn pr-btn--ghost pr-btn--sm"
                    >
                      {t('player.openWatch')}
                    </Link>

                    {savedVaultId && (
                      <Link
                        href="/vault"
                        className="text-xs font-semibold text-[var(--pr-signal)] underline ml-auto"
                      >
                        {t('hero.ctaVault')}
                      </Link>
                    )}
                  </div>

                  {vaultError && (
                    <p role="alert" className="text-xs text-[var(--pr-bad)] m-0">
                      {vaultError}
                    </p>
                  )}

                  <p className="text-xs text-[var(--pr-ink-3)] m-0">{resolved.offlineNote}</p>
                </div>
              </div>
            )}
          </div>

          {/* 5-Layer Safety Audit & Devnet Attestation Column */}
          <div className="lg:col-span-5 pr-card p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="pr-kicker">{t('shield.kicker')}</span>
              <span
                className={`pr-badge ${
                  resolved.safety.verdict === 'SAFE'
                    ? 'pr-badge--good'
                    : resolved.safety.verdict === 'CAUTION'
                    ? 'pr-badge--warn'
                    : 'pr-badge--bad'
                }`}
              >
                <span className="pr-badge-dot" aria-hidden="true" />
                {t(`shield.verdict.${resolved.safety.verdict}`)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="pr-sunken p-3">
                <span className="text-xs text-[var(--pr-ink-3)] block">
                  {t('shield.scoreLabel')}
                </span>
                <span className="text-2xl font-semibold pr-mono text-[var(--pr-ink)]">
                  {resolved.safety.score}
                  <span className="text-xs text-[var(--pr-ink-3)]">/100</span>
                </span>
              </div>
              <div className="pr-sunken p-3">
                <span className="text-xs text-[var(--pr-ink-3)] block">Kid-Safe</span>
                <span className="text-sm font-semibold text-[var(--pr-ink)] inline-flex items-center gap-1.5 mt-1">
                  {resolved.safety.kidSafe ? (
                    <>
                      <CheckCircle2 size={15} className="text-[var(--pr-good)]" aria-hidden="true" />
                      {t('shield.kidSafeYes')}
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={15} className="text-[var(--pr-bad)]" aria-hidden="true" />
                      {t('shield.kidSafeNo')}
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Sanitized URL + Digest */}
            {resolved.safety.sanitizedUrl && (
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[var(--pr-ink-3)] block mb-1">Clean canonical URL</span>
                  <code className="block p-2.5 rounded-[var(--pr-r-sm)] bg-[var(--pr-sunken)] border border-[var(--pr-rule)] pr-mono text-[11px] break-all text-[var(--pr-ink-2)]">
                    {resolved.safety.sanitizedUrl}
                  </code>
                </div>
                <div>
                  <span className="text-[var(--pr-ink-3)] block mb-1">
                    {t('shield.fingerprint')} (SHA-256)
                  </span>
                  <code className="block p-2 rounded-[var(--pr-r-sm)] bg-[var(--pr-sunken)] border border-[var(--pr-rule)] pr-mono text-[11px] break-all text-[var(--pr-ink-3)]">
                    {resolved.safety.fingerprint}
                  </code>
                </div>
              </div>
            )}

            {/* Rule Breakdown */}
            <ul className="space-y-2 list-none p-0 m-0">
              {resolved.safety.reasons.map((r, i) => (
                <li
                  key={`${r.code}-${i}`}
                  className="p-2.5 rounded-[var(--pr-r-sm)] border border-[var(--pr-rule)] bg-[var(--pr-paper)] flex items-start gap-2.5 text-xs"
                >
                  <span
                    className={`pr-badge shrink-0 ${
                      r.severity === 'pass'
                        ? 'pr-badge--good'
                        : r.severity === 'warn'
                        ? 'pr-badge--warn'
                        : 'pr-badge--bad'
                    }`}
                  >
                    {r.severity}
                  </span>
                  <div>
                    <span className="pr-mono font-semibold text-[var(--pr-ink)] block">
                      {r.code}
                    </span>
                    <span className="text-[var(--pr-ink-2)]">{r.detail}</span>
                  </div>
                </li>
              ))}
            </ul>

            {/* Solana Devnet On-Chain Attestation */}
            <div className="pt-3 border-t border-[var(--pr-rule)] space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--pr-ink-2)] flex items-center gap-1.5">
                  <Sparkles size={13} className="text-[var(--pr-signal)]" aria-hidden="true" />
                  Solana Devnet Memo Proof
                </span>
                <Link href="/ledger" className="text-xs text-[var(--pr-signal)] font-medium">
                  {t('nav.ledger')}
                </Link>
              </div>

              <button
                type="button"
                disabled={busyTx}
                onClick={() => void handleAnchorDevnet()}
                className="pr-btn pr-btn--secondary pr-btn--sm w-full"
              >
                {txPhase.kind === 'building'
                  ? t('ledger.txBuilding')
                  : txPhase.kind === 'signing'
                  ? t('ledger.txSigning')
                  : txPhase.kind === 'sent'
                  ? t('ledger.txSent')
                  : wallet.connected
                  ? t('player.anchorChain')
                  : `${t('ledger.walletConnect')} -> ${t('player.anchorChain')}`}
              </button>

              {txPhase.kind !== 'idle' && (
                <div
                  role={txPhase.kind === 'failed' && !txPhase.cancelled ? 'alert' : 'status'}
                  className="p-2.5 rounded-[var(--pr-r-sm)] border border-[var(--pr-rule)] bg-[var(--pr-sunken)] text-xs space-y-1"
                >
                  <p className="m-0 font-medium text-[var(--pr-ink)]">
                    {txPhase.kind === 'confirmed'
                      ? t('ledger.txConfirmed')
                      : txPhase.kind === 'finalized'
                      ? t('ledger.txFinalized')
                      : txPhase.kind === 'failed'
                      ? txPhase.message
                      : t('ledger.txSent')}
                  </p>
                  {'signature' in txPhase && txPhase.signature && (
                    <a
                      href={explorerUrl('tx', txPhase.signature)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[var(--pr-signal)] font-medium pr-mono"
                    >
                      {t('ledger.viewExplorer')}
                      <ExternalLink size={12} aria-hidden="true" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <GuardianModal open={guardianOpen} onClose={() => setGuardianOpen(false)} />
    </div>
  );
}

