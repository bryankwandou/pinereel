'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Download,
  HardDrive,
  Lock,
  Mountain,
  Play,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Unlock,
} from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import { GuardianModal } from '@/components/GuardianModal';
import {
  formatBytes,
  getVaultItem,
  listVaultSummaries,
  removeVaultItem,
  sha256Blob,
  type VaultSummary,
} from '@/lib/client/offline-vault';

export default function VaultPage() {
  const { t, locale, guardian, setGuardian, online } = useApp();

  const [items, setItems] = useState<VaultSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState<string>('');
  const [verifyState, setVerifyState] = useState<Record<string, 'ok' | 'fail'>>({});
  const [guardianOpen, setGuardianOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listVaultSummaries();
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    return () => {
      if (activeUrl) URL.revokeObjectURL(activeUrl);
    };
  }, [activeUrl]);

  const handlePlay = async (item: VaultSummary) => {
    const full = await getVaultItem(item.id);
    if (!full) return;
    if (activeUrl) URL.revokeObjectURL(activeUrl);
    const objectUrl = URL.createObjectURL(full.blob);
    setActiveId(item.id);
    setActiveUrl(objectUrl);
    setActiveTitle(item.title);
  };

  const handleVerifyHash = async (item: VaultSummary) => {
    const full = await getVaultItem(item.id);
    if (!full) return;
    const digest = await sha256Blob(full.blob);
    setVerifyState((prev) => ({
      ...prev,
      [item.id]: digest === full.mediaSha256 ? 'ok' : 'fail',
    }));
  };

  const handleExportMp4 = async (item: VaultSummary) => {
    const full = await getVaultItem(item.id);
    if (!full) return;
    const url = URL.createObjectURL(full.blob);
    const a = document.createElement('a');
    a.href = url;
    const base = item.title.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 48) || 'pinereel-offline';
    a.download = `${base}.mp4`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleRemove = async (id: string) => {
    await removeVaultItem(id);
    if (activeId === id) {
      if (activeUrl) URL.revokeObjectURL(activeUrl);
      setActiveId(null);
      setActiveUrl(null);
      setActiveTitle('');
    }
    await refresh();
  };

  const totalBytes = items.reduce((acc, x) => acc + x.sizeBytes, 0);

  return (
    <div className="pr-wrap py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--pr-rule)] pb-6">
        <div className="space-y-2">
          <span className="pr-kicker">
            <Mountain size={13} aria-hidden="true" />
            {t('vault.kicker')}
          </span>
          <h1 className="pr-h1">{t('vault.title')}</h1>
          <p className="pr-lead text-sm sm:text-base">{t('vault.lead')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className={`pr-badge ${online ? 'pr-badge--good' : 'pr-badge--info'}`}>
            <span className="pr-badge-dot" aria-hidden="true" />
            {online ? t('badge.online') : t('badge.offline')}
          </span>
          <button
            type="button"
            onClick={() => setGuardianOpen(true)}
            className="pr-btn pr-btn--secondary pr-btn--sm"
          >
            {guardian.kidModeLocked ? <Lock size={14} aria-hidden="true" /> : <Unlock size={14} aria-hidden="true" />}
            <span>{t('vault.guardianTitle')}</span>
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="pr-card p-4 space-y-1">
          <span className="text-xs text-[var(--pr-ink-3)] block">{t('vault.storageUsed')}</span>
          <span className="text-2xl font-semibold pr-mono text-[var(--pr-ink)]">
            {formatBytes(totalBytes, locale)}
          </span>
        </div>
        <div className="pr-card p-4 space-y-1">
          <span className="text-xs text-[var(--pr-ink-3)] block">Offline Library</span>
          <span className="text-2xl font-semibold pr-mono text-[var(--pr-ink)]">
            {t('vault.itemCount', { count: items.length })}
          </span>
        </div>
        <div className="pr-card p-4 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-[var(--pr-ink)] block">
              {t('vault.mountainOnly')}
            </span>
            <span className="text-xs text-[var(--pr-ink-3)]">
              {guardian.mountainVaultOnly ? 'External URL forms hidden' : 'Standard inspection enabled'}
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={guardian.mountainVaultOnly}
            onClick={() => {
              if (guardian.pinSet && guardian.kidModeLocked) {
                setGuardianOpen(true);
              } else {
                setGuardian({ ...guardian, mountainVaultOnly: !guardian.mountainVaultOnly });
              }
            }}
            className={`pr-btn pr-btn--sm ${
              guardian.mountainVaultOnly ? 'pr-btn--primary' : 'pr-btn--secondary'
            }`}
          >
            {guardian.mountainVaultOnly ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Offline Video Theater */}
      {activeUrl && (
        <div className="pr-card overflow-hidden">
          <div className="aspect-video bg-[#0B0F0E]" data-allow-dark>
            <video
              key={activeUrl}
              src={activeUrl}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain block"
            />
          </div>
          <div className="p-4 border-t border-[var(--pr-rule)] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="pr-badge pr-badge--good">OFFLINE PLAYBACK</span>
              <span className="font-semibold text-sm text-[var(--pr-ink)]">{activeTitle}</span>
            </div>
            <span className="pr-mono text-xs text-[var(--pr-ink-3)]">
              Served from local IndexedDB Blob
            </span>
          </div>
        </div>
      )}

      {/* Cached Items Table */}
      {loading ? (
        <div className="pr-card p-8 h-40 animate-pulse bg-[var(--pr-sunken)]" />
      ) : items.length === 0 ? (
        <div className="pr-card p-10 text-center space-y-3 border-dashed">
          <HardDrive size={28} className="mx-auto text-[var(--pr-ink-3)]" aria-hidden="true" />
          <h2 className="pr-h3">{t('vault.emptyTitle')}</h2>
          <p className="text-sm text-[var(--pr-ink-2)] max-w-md mx-auto m-0">
            {t('vault.emptyBody')}
          </p>
          <div className="pt-2">
            <Link href="/watch?url=https://archive.org/details/BigBuckBunny_124" className="pr-btn pr-btn--primary pr-btn--sm">
              {t('vault.emptyCta')}
            </Link>
          </div>
        </div>
      ) : (
        <div className="pr-table-wrap">
          <table className="pr-table">
            <thead>
              <tr>
                <th>Title & Integrity Hash</th>
                <th>Source</th>
                <th>Safety</th>
                <th className="num">Size</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="font-semibold text-[var(--pr-ink)]">{item.title}</div>
                    <div className="pr-mono text-[11px] text-[var(--pr-ink-3)] mt-0.5">
                      SHA-256: {item.mediaSha256.slice(0, 20)}…
                    </div>
                    {verifyState[item.id] === 'ok' && (
                      <span className="inline-flex items-center gap-1 text-xs text-[var(--pr-good)] font-medium mt-1">
                        <CheckCircle2 size={12} aria-hidden="true" />
                        {t('vault.hashVerified')}
                      </span>
                    )}
                    {verifyState[item.id] === 'fail' && (
                      <span className="inline-flex items-center gap-1 text-xs text-[var(--pr-bad)] font-medium mt-1">
                        <ShieldAlert size={12} aria-hidden="true" />
                        {t('vault.hashMismatch')}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="pr-badge">{item.sourceType}</span>
                  </td>
                  <td>
                    <span className={`pr-badge ${item.kidSafe ? 'pr-badge--good' : 'pr-badge--warn'}`}>
                      <ShieldCheck size={11} aria-hidden="true" />
                      {item.safetyScore}/100
                    </span>
                  </td>
                  <td className="num">{formatBytes(item.sizeBytes, locale)}</td>
                  <td>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => void handlePlay(item)}
                        className="pr-btn pr-btn--primary pr-btn--sm"
                      >
                        <Play size={13} aria-hidden="true" />
                        <span>{t('vault.playOffline')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleVerifyHash(item)}
                        className="pr-btn pr-btn--secondary pr-btn--sm"
                      >
                        {t('vault.verifyHash')}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleExportMp4(item)}
                        className="pr-btn pr-btn--ghost pr-btn--sm"
                        aria-label={`${t('player.downloadMp4')}: ${item.title}`}
                      >
                        <Download size={14} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRemove(item.id)}
                        className="pr-btn pr-btn--danger pr-btn--sm"
                        aria-label={`${t('vault.remove')}: ${item.title}`}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <GuardianModal open={guardianOpen} onClose={() => setGuardianOpen(false)} />
    </div>
  );
}

