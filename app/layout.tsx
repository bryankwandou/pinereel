import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Lora, Plus_Jakarta_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import { AppProvider } from '@/components/AppProvider';
import { PointerGlow, ReadingProgress } from '@/components/MotionKit';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import './globals.css';

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--pr-font-display',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--pr-font-sans',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--pr-font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://pinereel.vercel.app'),
  title: 'PineReel — Ad-Free Video Inspector and Offline Mountain Vault',
  description:
    'Inspect links from YouTube, X, Instagram, Vimeo, and direct streams without ads, gambling redirects, or phishing lures. Save videos offline for zero-signal areas.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF8F4' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0F0E' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${lora.variable} ${jakarta.variable} ${jetbrains.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('pinereel.theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;}var l=localStorage.getItem('pinereel.locale');if(l&&l!=='en'){document.documentElement.dataset.localePending='1';setTimeout(function(){delete document.documentElement.dataset.localePending;},800);}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <AppProvider>
          <div className="pr-shell">
            <ReadingProgress />
            <PointerGlow />
            <a href="#main" className="pr-skip">
              Skip to content
            </a>
            <SiteHeader />
            <main id="main" className="flex-1 relative" style={{ zIndex: 'var(--z-content)' }}>
              {children}
            </main>
            <SiteFooter />
          </div>
        </AppProvider>
      </body>
    </html>
  );
}

