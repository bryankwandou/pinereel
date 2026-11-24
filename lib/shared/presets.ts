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
    id: 'youtube-bunny',
    label: 'YouTube 4K (MP4)',
    sourceLabel: 'YouTube MP4',
    url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ&utm_source=test&fbclid=stripme',
    description: 'Extracts direct YouTube MP4 with audio + strips ad trackers for instant playback and download.',
    expectedKind: 'youtube',
  },
  {
    id: 'instagram-reel',
    label: 'Instagram Reel (MP4)',
    sourceLabel: 'Instagram MP4',
    url: 'https://www.instagram.com/reel/Df7ICLZNPyp/',
    description: 'Extracts direct Instagram CDN MP4 with audio without login walls or popups.',
    expectedKind: 'web',
  },
  {
    id: 'x-sample',
    label: 'X / Twitter Video (MP4)',
    sourceLabel: 'X MP4',
    url: 'https://x.com/OpenAI/status/1758192957386342435',
    description: 'Extracts direct X / Twitter MP4 video streams without login walls or promoted feed ads.',
    expectedKind: 'x',
  },
  {
    id: 'tiktok-sample',
    label: 'TikTok (No-Watermark MP4)',
    sourceLabel: 'TikTok MP4',
    url: 'https://www.tiktok.com/@scout2015/video/6718335390845095173',
    description: 'Extracts clean no-watermark TikTok MP4 stream without page trackers.',
    expectedKind: 'tiktok',
  },
  {
    id: 'facebook-sample',
    label: 'Facebook Video (HD MP4)',
    sourceLabel: 'Facebook MP4',
    url: 'https://www.facebook.com/facebook/videos/10153231379946729/',
    description: 'Extracts isolated Facebook HD/SD MP4 streams without login popups or feed ads.',
    expectedKind: 'web',
  },
  {
    id: 'linkedin-sample',
    label: 'LinkedIn Video (HD MP4)',
    sourceLabel: 'LinkedIn MP4',
    url: 'https://www.linkedin.com/posts/nasa_over-500000-people-have-signed-up-to-send-activity-7529638646191263744-qxWa',
    description: 'Extracts direct LinkedIn video MP4 streams without sign-in modal walls or tracking scripts.',
    expectedKind: 'web',
  },
  {
    id: 'ted-external-web',
    label: 'TED External Site (MP4)',
    sourceLabel: 'External Web MP4',
    url: 'https://www.ted.com/talks/sir_ken_robinson_do_schools_kill_creativity',
    description: 'Extracts direct MP4 stream from external publisher web pages with all page scripts stripped.',
    expectedKind: 'web',
  },
  {
    id: 'flower-mp4',
    label: 'Direct MP4 (Offline Vault)',
    sourceLabel: 'Direct MP4',
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    description: 'Fast 1.1 MB CC0 MP4 for instant playback and IndexedDB Mountain Vault verification.',
    expectedKind: 'direct',
  },
  {
    id: 'ad-wrapped-yt',
    label: 'Ad-Wrapped Link -> MP4',
    sourceLabel: 'Ad Stripper',
    url: 'https://ads.doubleclick.net/clk?adurl=https://www.youtube.com/watch?v=aqz-KE-bpKQ&fbclid=ad99',
    description: 'Strips the DoubleClick ad server wrapper and resolves the underlying clean YouTube MP4.',
    expectedKind: 'youtube',
  },
];
