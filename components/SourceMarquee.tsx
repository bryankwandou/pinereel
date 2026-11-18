'use client';

/**
 * Progressive edge-masked source capability marquee (adapted from skiper41 mask pattern).
 * Pauses cleanly on hover and hides cloned items under prefers-reduced-motion.
 */

const ITEMS = [
  { label: 'YouTube', tag: 'Ad-free isolation' },
  { label: 'X (Twitter)', tag: 'Direct MP4 variants' },
  { label: 'Instagram', tag: 'OpenGraph + yt-dlp' },
  { label: 'Vimeo', tag: 'DNT clean playback' },
  { label: 'Archive.org', tag: 'Direct MP4 cache' },
  { label: 'HLS .m3u8', tag: 'Adaptive stream' },
  { label: 'SSRF Firewall', tag: 'Private IP guard' },
  { label: '5-Hop Unwrapper', tag: 'Shortener shield' },
  { label: 'Anti-Gambling Filter', tag: 'Zero slot redirects' },
  { label: 'Guardian PIN', tag: 'PBKDF2-SHA256' },
  { label: 'IndexedDB Vault', tag: '0-Signal playback' },
  { label: 'Solana Devnet', tag: 'Memo SHA-256 proof' },
];

export function SourceMarquee() {
  return (
    <div className="border-y border-[var(--pr-rule)] bg-[var(--pr-sunken)] py-3 overflow-hidden">
      <div className="pr-marquee-wrap">
        <div className="pr-marquee-track" role="list" aria-label="Supported sources and security modules">
          {ITEMS.map((item) => (
            <div
              key={item.label}
              role="listitem"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[var(--pr-r-pill)] border border-[var(--pr-rule)] bg-[var(--pr-raised)] shrink-0"
            >
              <span className="text-xs font-semibold text-[var(--pr-ink)]">{item.label}</span>
              <span className="pr-mono text-[11px] text-[var(--pr-ink-3)]">{item.tag}</span>
            </div>
          ))}
          {ITEMS.map((item) => (
            <div
              key={`clone-${item.label}`}
              aria-hidden="true"
              className="pr-marquee-clone inline-flex items-center gap-2 px-3 py-1.5 rounded-[var(--pr-r-pill)] border border-[var(--pr-rule)] bg-[var(--pr-raised)] shrink-0"
            >
              <span className="text-xs font-semibold text-[var(--pr-ink)]">{item.label}</span>
              <span className="pr-mono text-[11px] text-[var(--pr-ink-3)]">{item.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
