'use client';

import { useCallback, useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import {
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import {
  explorerUrl,
  PINEREEL_LEDGER_ADDRESS,
  shortAddr,
  SOLANA_CLUSTER,
} from '@/lib/solana/config';
import {
  submitWalletAttestation,
  type OnChainAttestation,
  type TxPhase,
} from '@/lib/solana/attestation';
import { computeSha256Hex } from '@/lib/shared/safety';

export default function LedgerPage() {
  const { t, locale } = useApp();
  const { connection } = useConnection();
  const wallet = useWallet();
  const { setVisible: setWalletModalOpen } = useWalletModal();

  const [inspectAddress, setInspectAddress] = useState(PINEREEL_LEDGER_ADDRESS);
  const [slot, setSlot] = useState<number | null>(null);
  const [blockHeight, setBlockHeight] = useState<number | null>(null);
  const [records, setRecords] = useState<OnChainAttestation[]>([]);
  const [loading, setLoading] = useState(true);
  const [rpcError, setRpcError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [customUrl, setCustomUrl] = useState('https://archive.org/details/BigBuckBunny_124');
  const [txPhase, setTxPhase] = useState<TxPhase>({ kind: 'idle' });

  const loadLedger = useCallback(async (addr: string, refresh = false) => {
    setLoading(true);
    setRpcError(null);
    try {
      const res = await fetch(
        `/api/ledger?address=${encodeURIComponent(addr)}${refresh ? '&refresh=1' : ''}`
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || 'Could not reach Solana Devnet RPC.');
      }
      const data = (await res.json()) as {
        slot: number;
        blockHeight: number;
        records: OnChainAttestation[];
      };
      setSlot(data.slot);
      setBlockHeight(data.blockHeight);
      setRecords(data.records);
    } catch (err) {
      setRpcError(
        err instanceof Error
          ? err.message
          : 'Could not reach Solana Devnet RPC. Your offline vault remains unaffected.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLedger(inspectAddress);
  }, [inspectAddress, loadLedger]);

  const handleCopy = (val: string) => {
    navigator.clipboard?.writeText(val).catch(() => undefined);
    setCopiedKey(val);
    setTimeout(() => setCopiedKey((c) => (c === val ? null : c)), 1600);
  };

  const handleRecordSample = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.connected || !wallet.publicKey) {
      setWalletModalOpen(true);
      return;
    }
    const urlHash = computeSha256Hex(customUrl.trim()).slice(0, 24);
    await submitWalletAttestation(
      connection,
      wallet,
      {
        v: 1,
        app: 'pinereel',
        verdict: 'SAFE',
        score: 100,
        kidSafe: true,
        source: 'verified-link',
        urlHash,
      },
      (p) => {
        setTxPhase(p);
        if (p.kind === 'confirmed') {
          setInspectAddress(wallet.publicKey!.toBase58());
          void loadLedger(wallet.publicKey!.toBase58());
        }
      }
    );
  };

  const busyTx =
    txPhase.kind === 'building' || txPhase.kind === 'signing' || txPhase.kind === 'sent';

  return (
    <div className="pr-wrap py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--pr-rule)] pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="pr-kicker">{t('ledger.kicker')}</span>
            <span className="pr-badge pr-badge--warn">{SOLANA_CLUSTER}</span>
          </div>
          <h1 className="pr-h1">{t('ledger.title')}</h1>
          <p className="pr-lead text-sm sm:text-base">{t('ledger.lead')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {wallet.connected && wallet.publicKey ? (
            <>
              <button
                type="button"
                onClick={() => handleCopy(wallet.publicKey!.toBase58())}
                className="pr-btn pr-btn--secondary pr-btn--sm"
                aria-label={`${t('ledger.copyAddr')} ${wallet.publicKey.toBase58()}`}
              >
                <code translate="no" className="pr-mono">
                  {shortAddr(wallet.publicKey.toBase58())}
                </code>
                {copiedKey === wallet.publicKey.toBase58() ? (
                  <Check size={13} aria-hidden="true" />
                ) : (
                  <Copy size={13} aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                onClick={() => void wallet.disconnect()}
                className="pr-btn pr-btn--ghost pr-btn--sm"
              >
                {t('ledger.walletDisconnect')}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setWalletModalOpen(true)}
              disabled={wallet.connecting}
              className="pr-btn pr-btn--primary pr-btn--sm"
            >
              <Wallet size={14} aria-hidden="true" />
              <span>
                {wallet.connecting ? t('ledger.walletConnecting') : t('ledger.walletConnect')}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Live Devnet Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="pr-card p-4 space-y-1">
          <span className="text-xs text-[var(--pr-ink-3)] block">{t('ledger.slotLabel')}</span>
          <span className="text-xl font-semibold pr-mono text-[var(--pr-ink)]">
            {slot !== null ? new Intl.NumberFormat(locale).format(slot) : '—'}
          </span>
        </div>
        <div className="pr-card p-4 space-y-1">
          <span className="text-xs text-[var(--pr-ink-3)] block">Block Height</span>
          <span className="text-xl font-semibold pr-mono text-[var(--pr-ink)]">
            {blockHeight !== null ? new Intl.NumberFormat(locale).format(blockHeight) : '—'}
          </span>
        </div>
        <div className="pr-card p-4 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-xs text-[var(--pr-ink-3)] block">Registry Account</span>
            <a
              href={explorerUrl('address', inspectAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="pr-mono text-xs text-[var(--pr-signal)] font-medium inline-flex items-center gap-1"
            >
              {shortAddr(inspectAddress, 6, 6)}
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          </div>
          <button
            type="button"
            onClick={() => void loadLedger(inspectAddress, true)}
            disabled={loading}
            className="pr-btn pr-btn--secondary pr-btn--sm"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
            <span>{t('ledger.refresh')}</span>
          </button>
        </div>
      </div>

      {/* Record New Attestation Form */}
      <div className="pr-card p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="pr-h3 flex items-center gap-2">
            <ShieldCheck size={17} className="text-[var(--pr-signal)]" aria-hidden="true" />
            Anchor Safety Digest via Solana Memo
          </h2>
          <span className="pr-mono text-xs text-[var(--pr-ink-3)]">
            Devnet test transaction only
          </span>
        </div>

        <form onSubmit={handleRecordSample} className="flex flex-col sm:flex-row gap-2.5">
          <div className="pr-input-wrap flex-1">
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              aria-label="Verified link to attest"
              className="pr-input pr-mono text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={busyTx}
            aria-busy={busyTx || undefined}
            className="pr-btn pr-btn--primary pr-btn--md"
          >
            {txPhase.kind === 'building'
              ? t('ledger.txBuilding')
              : txPhase.kind === 'signing'
              ? t('ledger.txSigning')
              : txPhase.kind === 'sent'
              ? t('ledger.txSent')
              : wallet.connected
              ? t('player.anchorChain')
              : t('ledger.walletConnect')}
          </button>
        </form>

        {txPhase.kind !== 'idle' && (
          <div
            role={txPhase.kind === 'failed' && !txPhase.cancelled ? 'alert' : 'status'}
            className="p-3 rounded-[var(--pr-r-sm)] border border-[var(--pr-rule)] bg-[var(--pr-sunken)] text-xs flex flex-wrap items-center justify-between gap-2"
          >
            <span className="font-medium text-[var(--pr-ink)]">
              {txPhase.kind === 'confirmed'
                ? t('ledger.txConfirmed')
                : txPhase.kind === 'finalized'
                ? t('ledger.txFinalized')
                : txPhase.kind === 'failed'
                ? txPhase.message
                : t('ledger.txSent')}
            </span>
            {'signature' in txPhase && txPhase.signature && (
              <a
                href={explorerUrl('tx', txPhase.signature)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 pr-mono text-[var(--pr-signal)] font-semibold"
              >
                {t('ledger.viewExplorer')}
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Live RPC Transaction Table */}
      {rpcError && (
        <div role="alert" className="pr-card p-5 bg-[var(--pr-warn-wash)] border-[var(--pr-warn-rule)]">
          <p className="text-sm font-medium text-[var(--pr-warn)] m-0">{rpcError}</p>
        </div>
      )}

      {loading ? (
        <div className="pr-table-wrap">
          <table className="pr-table" aria-busy="true" aria-label="Loading Solana Devnet records">
            <thead>
              <tr>
                <th>Signature</th>
                <th>Signer</th>
                <th>Safety Payload</th>
                <th className="num">Slot</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2].map((row) => (
                <tr key={row}>
                  <td><span className="inline-block h-3.5 w-28 rounded bg-[var(--pr-sunken)] animate-pulse" /></td>
                  <td><span className="inline-block h-3.5 w-24 rounded bg-[var(--pr-sunken)] animate-pulse" /></td>
                  <td><span className="inline-block h-4 w-48 rounded bg-[var(--pr-sunken)] animate-pulse" /></td>
                  <td className="num"><span className="inline-block h-3.5 w-20 rounded bg-[var(--pr-sunken)] animate-pulse" /></td>
                  <td><span className="inline-block h-3.5 w-28 rounded bg-[var(--pr-sunken)] animate-pulse" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : records.length === 0 ? (
        <div className="pr-card p-8 text-center space-y-2">
          <h2 className="pr-h3">{t('ledger.emptyTitle')}</h2>
          <p className="text-sm text-[var(--pr-ink-3)] m-0">{t('ledger.emptyBody')}</p>
        </div>
      ) : (
        <div className="pr-table-wrap">
          <table className="pr-table">
            <thead>
              <tr>
                <th>Signature</th>
                <th>Signer</th>
                <th>Safety Payload</th>
                <th className="num">Slot</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => (
                <tr key={rec.signature}>
                  <td>
                    <a
                      href={explorerUrl('tx', rec.signature)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pr-mono text-xs text-[var(--pr-signal)] inline-flex items-center gap-1 font-medium"
                    >
                      {shortAddr(rec.signature, 6, 6)}
                      <ExternalLink size={11} aria-hidden="true" />
                    </a>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleCopy(rec.signer)}
                      className="inline-flex items-center gap-1 text-xs pr-mono text-[var(--pr-ink-2)] bg-transparent border-0 cursor-pointer p-0"
                    >
                      <code translate="no">{shortAddr(rec.signer)}</code>
                      {copiedKey === rec.signer ? (
                        <Check size={11} aria-hidden="true" />
                      ) : (
                        <Copy size={11} aria-hidden="true" />
                      )}
                    </button>
                  </td>
                  <td>
                    {rec.payload ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`pr-badge ${
                            rec.payload.verdict === 'SAFE'
                              ? 'pr-badge--good'
                              : rec.payload.verdict === 'CAUTION'
                              ? 'pr-badge--warn'
                              : 'pr-badge--bad'
                          }`}
                        >
                          {rec.payload.verdict} · {rec.payload.score}
                        </span>
                        <span className="pr-mono text-xs text-[var(--pr-ink-2)]">
                          {rec.payload.source} · {rec.payload.urlHash.slice(0, 12)}…
                        </span>
                      </div>
                    ) : (
                      <span className="pr-mono text-xs text-[var(--pr-ink-3)]">
                        {rec.rawMemo.slice(0, 72)}
                      </span>
                    )}
                  </td>
                  <td className="num">{new Intl.NumberFormat(locale).format(rec.slot)}</td>
                  <td className="pr-mono text-xs text-[var(--pr-ink-3)]">
                    {rec.blockTime
                      ? `${new Intl.DateTimeFormat(locale, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                          timeZone: 'UTC',
                        }).format(new Date(rec.blockTime * 1000))} UTC`
                      : 'Confirmed'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

