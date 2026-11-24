'use client';

/**
 * Dual counter-scrolling progressive edge-masked source & defense ribbon (adapted from skiper41 mask pattern).
 * Pauses cleanly on hover and collapses duplicates automatically under prefers-reduced-motion.
 */

const PLATFORM_ITEMS = [
  { label: 'YouTube', tag: 'Direct MP4 + InnerTube/Piped' },
  { label: 'Instagram Reels', tag: 'Direct CDN MP4 (Audio+Video)' },
  { label: 'X (Twitter)', tag: 'Multi-bitrate MP4 variants' },
  { label: 'TikTok', tag: 'No-watermark HD MP4' },
  { label: 'Facebook', tag: 'Isolated HD/SD MP4' },
  { label: 'LinkedIn', tag: 'Login-free dms.licdn MP4' },
  { label: 'Threads', tag: 'Login-free MP4 & Embed' },
  { label: 'Vimeo', tag: 'HLS-to-MP4 + DNT Player' },
  { label: 'Reddit', tag: 'v.redd.it MP4 + HLS' },
  { label: 'Dailymotion', tag: 'Pre-roll ad bypass' },
  { label: 'Archive.org', tag: 'Direct MP4 Vault Cache' },
  { label: 'External Websites', tag: 'TED / HTML5 / Player Config MP4' },
];

const DEFENSE_ITEMS = [
  { label: 'Ad-Wrapper Stripper', tag: 'Keeps target video URL' },
  { label: 'SSRF DNS Firewall', tag: 'Private & loopback guard' },
  { label: '5-Hop Redirect Shield', tag: 'Non-executing unwrap' },
  { label: 'Malware Binary Block', tag: 'Blocks .apk / .exe lures' },
  { label: 'Kid-Safe Guardian PIN', tag: 'PBKDF2-SHA256 lock' },
  { label: 'IndexedDB Mountain Vault', tag: '0-Signal local cache' },
  { label: 'Service Worker Shell', tag: 'Offline reload support' },
  { label: 'Solana Devnet Ledger', tag: 'Memo SHA-256 attestation' },
];

export function SourceMarquee() {
  return (
    <div className="border-y border-[var(--pr-rule)] bg-[var(--pr-sunken)] py-3.5 space-y-2.5 overflow-hidden">
      <div className="pr-marquee-wrap">
        <div className="pr-marquee-track" role="list" aria-label="Supported video sources">
          {PLATFORM_ITEMS.map((item) => (
            <div
              key={item.label}
              role="listitem"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[var(--pr-r-pill)] border border-[var(--pr-rule)] bg-[var(--pr-raised)] shrink-0"
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--pr-signal)]" aria-hidden="true" />
              <span className="text-xs font-semibold text-[var(--pr-ink)]">{item.label}</span>
              <span className="pr-mono text-[11px] text-[var(--pr-ink-3)]">{item.tag}</span>
            </div>
          ))}
          {PLATFORM_ITEMS.map((item) => (
            <div
              key={`clone-p-${item.label}`}
              aria-hidden="true"
              className="pr-marquee-clone inline-flex items-center gap-2 px-3 py-1.5 rounded-[var(--pr-r-pill)] border border-[var(--pr-rule)] bg-[var(--pr-raised)] shrink-0"
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--pr-signal)]" aria-hidden="true" />
              <span className="text-xs font-semibold text-[var(--pr-ink)]">{item.label}</span>
              <span className="pr-mono text-[11px] text-[var(--pr-ink-3)]">{item.tag}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pr-marquee-wrap">
        <div
          className="pr-marquee-track pr-marquee-track--reverse"
          role="list"
          aria-label="Ad blocking and offline safety layers"
        >
          {DEFENSE_ITEMS.map((item) => (
            <div
              key={item.label}
              role="listitem"
              className="inline-flex items-center gap-2 px-3 py-1 rounded-[var(--pr-r-pill)] border border-[var(--pr-rule-2)] bg-[var(--pr-paper)] shrink-0"
            >
              <span className="text-xs font-medium text-[var(--pr-ink-2)]">{item.label}</span>
              <span className="pr-mono text-[11px] text-[var(--pr-ink-3)]">{item.tag}</span>
            </div>
          ))}
          {DEFENSE_ITEMS.map((item) => (
            <div
              key={`clone-d-${item.label}`}
              aria-hidden="true"
              className="pr-marquee-clone inline-flex items-center gap-2 px-3 py-1 rounded-[var(--pr-r-pill)] border border-[var(--pr-rule-2)] bg-[var(--pr-paper)] shrink-0"
            >
              <span className="text-xs font-medium text-[var(--pr-ink-2)]">{item.label}</span>
              <span className="pr-mono text-[11px] text-[var(--pr-ink-3)]">{item.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
