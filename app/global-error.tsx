'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: '#FAF8F4',
          color: '#0E1311',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          lineHeight: 1.5,
        }}
      >
        <main style={{ maxWidth: 520, margin: '18vh auto', padding: 24 }}>
          <h1 style={{ fontSize: 28, margin: '0 0 10px' }}>Unable to render view</h1>
          <p style={{ color: '#4F5A55', margin: '0 0 24px', fontSize: 15 }}>
            Your offline Mountain Vault media and Solana Devnet records are unaffected. Reload the view to recover.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: '#0E5A3E',
              color: '#FFFFFF',
              border: 0,
              padding: '10px 18px',
              borderRadius: 6,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reload view
          </button>
        </main>
      </body>
    </html>
  );
}

