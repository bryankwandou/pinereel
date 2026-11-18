export interface CuratedSample {
  id: string;
  label: string;
  sourceLabel: string;
  url: string;
  description: string;
  expectedKind: 'direct' | 'youtube' | 'x' | 'blocked';
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
    id: 'blocked-lure',
    label: 'Blocked Threat Link (Test Shield)',
    sourceLabel: 'Threat Sim',
    url: 'https://bit.ly/slot-gacor-maxwin-verify-wallet.apk',
    description: 'Demonstrates instant pre-flight blocking of gambling ads and executable phishing lures.',
    expectedKind: 'blocked',
  },
];
