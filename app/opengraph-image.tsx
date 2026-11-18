import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'PineReel — Ad-Free Video Inspector and Offline Mountain Vault';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#FAF8F4',
          color: '#0E1311',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          fontFamily: 'sans-serif',
          borderTop: '8px solid #0E5A3E',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              background: '#0E5A3E',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            P
          </div>
          <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em' }}>
            PineReel
          </span>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 16,
              padding: '6px 14px',
              borderRadius: 999,
              background: '#E4F0EA',
              color: '#0E5A3E',
              fontWeight: 600,
            }}
          >
            SOLANA DEVNET · OFFLINE VAULT
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 64, fontWeight: 600, lineHeight: 1.06, letterSpacing: '-0.03em' }}>
            Watch any video link without ads or traps.
          </div>
          <div style={{ fontSize: 26, color: '#313A36', maxWidth: 920 }}>
            Five-layer link isolation, kid-safe PIN lock, IndexedDB offline mountain storage, and verifiable Devnet Memo receipts.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: '1px solid #DFDBD0',
            paddingTop: 22,
            fontSize: 18,
            color: '#4F5A55',
          }}
        >
          <span>YouTube · X · Instagram · Vimeo · Direct MP4/HLS</span>
          <span>pinereel.vercel.app</span>
        </div>
      </div>
    ),
    { ...size }
  );
}

