import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="pr-wrap py-20 max-w-xl">
      <div className="pr-card p-8 space-y-4">
        <span className="pr-kicker">404 · NOT FOUND</span>
        <h1 className="pr-h1">Route unavailable</h1>
        <p className="text-sm text-[var(--pr-ink-2)] m-0">
          This path does not exist in PineReel. Return to the link inspector or open your offline Mountain Vault.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/" className="pr-btn pr-btn--primary pr-btn--sm">
            Inspect Link
          </Link>
          <Link href="/vault" className="pr-btn pr-btn--secondary pr-btn--sm">
            Offline Vault
          </Link>
        </div>
      </div>
    </div>
  );
}

