# PineReel

Ad-free, tracker-stripped, kid-safe universal video link inspector, offline mountain media vault, and Solana Devnet safety attestation platform.

## Architecture

- **5-Layer Security & Kid-Safe Shield (`lib/shared/safety.ts`, `lib/server/redirect-inspector.ts`)**
  - SSRF and DNS-rebinding guard blocking localhost, loopback, private LAN, and link-local addresses.
  - Non-executing multi-hop redirect unwrapper (up to 5 hops) and query tracker stripper (`utm_*`, `fbclid`, `gclid`, `si`, `igsh`, `ref_*`).
  - Classifier blocking gambling promotions, punycode lookalikes, credential phishing lures, and executable payloads before playback.
  - PBKDF2-SHA256 salted Guardian PIN lock (`lib/client/guardian-lock.ts`) enforcing Strict Kid Mode and Mountain Offline-Only mode.
- **3-Tier Hybrid Extraction Engine (`lib/server/media-resolver.ts`, `lib/server/stream-proxy.ts`)**
  - Automatically runs local `yt-dlp` + `ffmpeg` when available on host or configured worker.
  - Uses pure TypeScript extractors in serverless environments for Direct MP4/WebM/HLS, Internet Archive, X/Twitter public video variants, Vimeo DNT, and privacy-isolated YouTube playback.
  - Proxies byte-range requests (`206 Partial Content`) with strict media `Content-Type` allowlisting.
- **Offline Mountain Vault (`lib/client/offline-vault.ts`, `public/sw.js`)**
  - Saves resolved video streams into browser IndexedDB with Web Crypto SHA-256 integrity checksums and Service Worker offline route caching.
- **Solana Devnet Trust Ledger (`lib/solana/attestation.ts`, `/ledger`)**
  - Connects optional Solana wallets without auto-popup friction and records deterministic safety receipts on Solana Devnet via the Memo program (`MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`).

## Development & Verification

```bash
npm install
npm run check:locales
npm run test:unit
npm run typecheck
npm run build
npm run start
npm run audit:design
npm run test:e2e
```

