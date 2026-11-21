export interface CuratedSample {
  id: string;
  label: string;
  sourceLabel: string;
  url: string;
  description: string;
  expectedKind: 'direct' | 'youtube' | 'x' | 'tiktok' | 'web' | 'blocked';
}

export const CURATED_SAMPLES: CuratedSample[] = [
  {
    id: 'blender-archive',
    label: 'Big Buck Bunny (Archive MP4)',
    sourceLabel: 'Archive Direct',
    url: 'https://archive.org/details/BigBuckBunny_124',
    description: 'Open Blender Foundation animated short film, direct MP4 cacheable for offline mountains.',
    expectedKind: 'direct',
  },
  {
    id: 'youtube-bunny',
    label: 'Big Buck Bunny 4K (YouTube)',
    sourceLabel: 'YouTube',
    url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ&utm_source=test&fbclid=stripme',
    description: 'Verifies tracker stripping, family-safe check, and isolated ad-free playback.',
    expectedKind: 'youtube',
  },
  {
    id: 'flower-mp4',
    label: 'Nature Short (Direct MP4)',
    sourceLabel: 'Direct MP4',
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    description: 'Fast 1.1 MB CC0 MP4 for instant playback and IndexedDB Mountain Vault verification.',
    expectedKind: 'direct',
  },
  {
    id: 'tiktok-sample',
    label: 'Short Video (TikTok No-Watermark)',
    sourceLabel: 'TikTok',
    url: 'https://www.tiktok.com/@scout2015/video/6718335390845095173',
    description: 'Extracts clean no-watermark TikTok MP4 stream without page trackers.',
    expectedKind: 'tiktok',
  },
  {
    id: 'ad-wrapped-yt',
    label: 'Ad-Wrapped Link (Strips Ad -> Plays Video)',
    sourceLabel: 'Ad Stripper',
    url: 'https://ads.doubleclick.net/clk?adurl=https://www.youtube.com/watch?v=aqz-KE-bpKQ&fbclid=ad99',
    description: 'Strips the DoubleClick ad server wrapper and plays the underlying clean video without blocking it.',
    expectedKind: 'youtube',
  },
  {
    id: 'sonacast-web',
    label: 'Sonacast Stream (General Web App)',
    sourceLabel: 'Web App Sandbox',
    url: 'https://sonacast-ten.vercel.app/favorites',
    description: 'Loads general web streaming apps inside an ad-shielded, popup-blocked sandbox player.',
    expectedKind: 'web',
  },
];
