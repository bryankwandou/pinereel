export const en = {
  'brand.name': 'PineReel',
  'brand.tagline': 'Ad-free link inspector and offline mountain vault',

  'nav.skip': 'Skip to content',
  'nav.inspect': 'Inspect Link',
  'nav.watch': 'Player',
  'nav.vault': 'Offline Vault',
  'nav.ledger': 'Safety Ledger',
  'nav.deck': 'Deck',
  'nav.language': 'Language',
  'nav.theme': 'Appearance',
  'nav.theme.system': 'System',
  'nav.theme.light': 'Light',
  'nav.theme.dark': 'Dark',
  'nav.menu': 'Menu',
  'nav.close': 'Close',

  'badge.devnet': 'Devnet',
  'badge.kidModeOn': 'Kid-Safe Lock Active',
  'badge.kidModeOff': 'Standard Filter',
  'badge.offline': 'Offline Signal Mode',
  'badge.online': 'Online',

  'hero.kicker': 'SOLANA DEVNET · LOCAL + CLOUD HYBRID',
  'hero.title.a': 'Watch any video link',
  'hero.title.b': 'without ads or traps.',
  'hero.lead':
    'Paste a link from YouTube, X, Instagram, Vimeo, or a direct stream. PineReel strips tracking redirects, blocks gambling and phishing lures, plays cleanly, and caches videos offline for zero-signal mountain trips.',
  'hero.inputLabel': 'Video link to inspect and play',
  'hero.inputPlaceholder': 'https://www.youtube.com/watch?v=... or https://x.com/.../status/...',
  'hero.ctaInspect': 'Inspect & Play',
  'hero.ctaInspecting': 'Inspecting link…',
  'hero.ctaVault': 'Open Offline Vault',
  'hero.samplePrefix': 'Quick test links:',

  'shield.kicker': 'FIVE-LAYER LINK ISOLATION',
  'shield.title': 'Every link passes inspection before a single video byte loads.',
  'shield.scoreLabel': 'Safety score',
  'shield.verdict.SAFE': 'Verified Safe',
  'shield.verdict.CAUTION': 'Caution Advised',
  'shield.verdict.BLOCKED': 'Threat Blocked',
  'shield.kidSafeYes': 'Kid-Safe Approved',
  'shield.kidSafeNo': 'Restricted in Kid Mode',
  'shield.trackersRemoved': '{count} tracker parameter(s) stripped',
  'shield.hopsUnwrapped': '{count} redirect hop(s) unwrapped on server',
  'shield.fingerprint': 'Safety digest',

  'player.kicker': 'ISOLATED PLAYBACK AND ARCHIVE',
  'player.emptyTitle': 'Paste a link above to inspect and watch',
  'player.emptyBody':
    'Every link runs through SSRF validation, redirect unwrapping, and gambling or phishing pattern filtering before rendering.',
  'player.blockedTitle': 'Blocked before playback',
  'player.blockedBody':
    'PineReel halted this destination before any media stream or external script could load.',
  'player.kidBlockedTitle': 'Restricted by Kid-Safe Lock',
  'player.kidBlockedBody':
    'This video triggered a caution or age-restricted flag while Guardian Kid Mode is active. Unlock with your Guardian PIN to override.',
  'player.saveVault': 'Save to Offline Vault',
  'player.savingVault': 'Caching to Vault ({progress})…',
  'player.savedVault': 'Saved in Offline Vault',
  'player.downloadMp4': 'Download MP4',
  'player.openWatch': 'Theater View',
  'player.speed': 'Playback speed',
  'player.anchorChain': 'Anchor Attestation on Devnet',

  'vault.kicker': 'ZERO-SIGNAL MOUNTAIN STORAGE',
  'vault.title': 'Offline Media Vault',
  'vault.lead':
    'Videos cached here stay inside browser IndexedDB with SHA-256 verification and Service Worker offline routing, ready to watch where cellular signal drops to zero.',
  'vault.emptyTitle': 'Your Offline Vault is empty',
  'vault.emptyBody':
    'Inspect a direct MP4, Archive.org, X video, or local yt-dlp stream and click Save to Offline Vault.',
  'vault.emptyCta': 'Inspect a sample video',
  'vault.storageUsed': 'Cached storage',
  'vault.itemCount': '{count} offline video(s)',
  'vault.playOffline': 'Play Offline',
  'vault.verifyHash': 'Verify SHA-256',
  'vault.hashVerified': 'Integrity verified',
  'vault.hashMismatch': 'Checksum mismatch',
  'vault.remove': 'Remove',
  'vault.guardianTitle': 'Guardian Controls',
  'vault.pinLabel': 'Set 4 to 8 digit Guardian PIN',
  'vault.pinSave': 'Enable Guardian PIN',
  'vault.pinUnlock': 'Unlock with PIN',
  'vault.pinLock': 'Lock Kid Mode',
  'vault.mountainOnly': 'Mountain Offline-Only Lock (hide external links)',

  'ledger.kicker': 'SOLANA DEVNET VERIFICATION',
  'ledger.title': 'On-Chain Safety Ledger',
  'ledger.lead':
    'Every verified link or offline archive receipt can be anchored to Solana Devnet via the Memo program so families and schools can verify clean media hashes independently.',
  'ledger.walletConnect': 'Connect Wallet',
  'ledger.walletConnecting': 'Connecting…',
  'ledger.walletDisconnect': 'Disconnect',
  'ledger.walletNoExt': 'Browser wallet optional',
  'ledger.slotLabel': 'Confirmed slot',
  'ledger.refresh': 'Refresh Devnet',
  'ledger.txIdle': 'Ready to record attestation',
  'ledger.txBuilding': 'Preparing transaction…',
  'ledger.txSigning': 'Approve in your wallet…',
  'ledger.txSent': 'Submitted to Devnet',
  'ledger.txConfirmed': 'Confirmed on Devnet',
  'ledger.txFinalized': 'Finalized on Devnet',
  'ledger.viewExplorer': 'View on Explorer',
  'ledger.copyAddr': 'Copy address',
  'ledger.copied': 'Copied',
  'ledger.emptyTitle': 'No Devnet attestations loaded yet',
  'ledger.emptyBody': 'Refresh or connect a Devnet wallet to inspect live on-chain Memo receipts.',

  'walkthrough.kicker': 'AUTOMATED PRODUCT DEMO',
  'walkthrough.title': 'See the end-to-end safety and offline flow in 40 seconds.',
  'walkthrough.lead':
    'Recorded directly from the production build: inspecting a tracker-laden link, stripping trackers, blocking a gambling lure, caching offline video, and verifying Devnet receipts.',

  'how.kicker': 'SYSTEM ARCHITECTURE',
  'how.title': 'Built to work both locally with yt-dlp and across serverless cloud deployments.',
  'how.step1Title': '1. Server-side redirect and SSRF guard',
  'how.step1Body':
    'Shorteners are unwrapped across up to 5 hops with private IP, punycode, gambling, and executable payload checks before a player mounts.',
  'how.step2Title': '2. Dual extraction pipeline',
  'how.step2Body':
    'Uses local yt-dlp and ffmpeg automatically when installed, and switches smoothly to pure TypeScript extractors for YouTube, X, Vimeo, Archive, and direct streams in the cloud.',
  'how.step3Title': '3. IndexedDB Vault and Devnet receipts',
  'how.step3Body':
    'Direct streams write straight into IndexedDB with SHA-256 digests for zero-signal playback, optionally anchored to Solana Devnet Memo logs.',

  'deck.kicker': 'ARCHITECTURE AND ROADMAP',
  'deck.title': 'PineReel Product Deck',
  'deck.lead': 'Problem diagnosis, 5-layer threat architecture, 3-tier media engine, and Solana Devnet trust model.',

  'footer.note': 'PineReel runs without ads, behavioral analytics, or third-party tracking beacons.',
} as const;

export type Dictionary = Record<keyof typeof en, string>;
export type TranslationKey = keyof typeof en;

