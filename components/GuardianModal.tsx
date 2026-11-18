'use client';

import { useEffect, useRef, useState } from 'react';
import { Lock, ShieldAlert, Unlock } from 'lucide-react';
import { useApp } from './AppProvider';
import {
  createGuardianPin,
  verifyGuardianPin,
} from '@/lib/client/guardian-lock';

export function GuardianModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { guardian, setGuardian, t } = useApp();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      setPin('');
      setError(null);
      dlg.showModal();
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open]);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const handleClose = () => onClose();
    dlg.addEventListener('close', handleClose);
    return () => dlg.removeEventListener('close', handleClose);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (!guardian.pinSet) {
        const next = await createGuardianPin(pin.trim());
        setGuardian(next);
        onClose();
      } else {
        const ok = await verifyGuardianPin(pin.trim(), guardian);
        if (!ok) {
          setError('Incorrect Guardian PIN. Try again.');
        } else {
          setGuardian({
            ...guardian,
            kidModeLocked: !guardian.kidModeLocked,
            mountainVaultOnly: guardian.kidModeLocked ? false : guardian.mountainVaultOnly,
          });
          onClose();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process Guardian PIN.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="pr-dialog"
      aria-labelledby="guardian-dlg-title"
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current?.close();
      }}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-[var(--pr-r)] bg-[var(--pr-signal-wash)] text-[var(--pr-signal)]">
            {guardian.kidModeLocked ? <Lock size={18} /> : <Unlock size={18} />}
          </div>
          <div>
            <h2 id="guardian-dlg-title" className="pr-h3">
              {t('vault.guardianTitle')}
            </h2>
            <p className="text-sm text-[var(--pr-ink-2)] mt-1 m-0">
              {!guardian.pinSet
                ? 'Create a local 4-to-8 digit PIN (PBKDF2-SHA256 hashed on this device) to lock Kid-Safe filtering.'
                : guardian.kidModeLocked
                ? 'Enter your Guardian PIN to toggle Kid-Safe Lock or Mountain Offline-Only mode.'
                : 'Enter your PIN to re-enable strict Kid-Safe filtering.'}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="guardian-pin-input" className="text-sm font-medium text-[var(--pr-ink-2)] block">
            {t('vault.pinLabel')}
          </label>
          <div className="pr-input-wrap">
            <input
              id="guardian-pin-input"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              pattern="\d{4,8}"
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="pr-input pr-mono tracking-widest"
              required
            />
          </div>
          {error && (
            <p role="alert" className="text-xs text-[var(--pr-bad)] flex items-center gap-1.5 mt-1 m-0">
              <ShieldAlert size={13} aria-hidden="true" />
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            className="pr-btn pr-btn--ghost pr-btn--sm"
            onClick={() => dialogRef.current?.close()}
          >
            {t('nav.close')}
          </button>
          <button
            type="submit"
            disabled={busy || pin.length < 4}
            className="pr-btn pr-btn--primary pr-btn--sm"
          >
            {!guardian.pinSet
              ? t('vault.pinSave')
              : guardian.kidModeLocked
              ? t('vault.pinUnlock')
              : t('vault.pinLock')}
          </button>
        </div>
      </form>
    </dialog>
  );
}

