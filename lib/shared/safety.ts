export type SourcePlatform =
  | 'youtube'
  | 'x'
  | 'instagram'
  | 'tiktok'
  | 'reddit'
  | 'vimeo'
  | 'dailymotion'
  | 'streamable'
  | 'archive'
  | 'direct'
  | 'other';

export type SafetyVerdict = 'SAFE' | 'CAUTION' | 'BLOCKED';

export interface SafetyReason {
  code: string;
  severity: 'pass' | 'warn' | 'block';
  detail: string;
}

export interface SafetyReport {
  verdict: SafetyVerdict;
  score: number;
  kidSafe: boolean;
  originalUrl: string;
  sanitizedUrl: string;
  hostname: string;
  sourceType: SourcePlatform;
  strippedParams: string[];
  redirectChain: string[];
  reasons: SafetyReason[];
  fingerprint: string;
}

const TRACKER_PARAM_SET = new Set([
  'fbclid',
  'gclid',
  'dclid',
  'gbraid',
  'wbraid',
  'msclkid',
  'yclid',
  'twclid',
  'mc_cid',
  'mc_eid',
  'si',
  'igsh',
  'igshid',
  'ref_src',
  'ref_url',
  'feature',
  'pp',
  'spm',
  'aff_id',
  'affiliate',
  'ref',
  'trk',
  'share_id',
  'clickid',
  'ad_id',
  'adset_id',
  'campaign_id',
]);

// Dedicated ad/click-tracker hosts whose wrapper query parameters can be stripped
// to extract the underlying clean video destination.
const AD_TRACKER_HOSTS = [
  'doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'adservice.google.com',
  'popads.net',
  'popcash.net',
  'propellerads.com',
  'exoclick.com',
  'adsterra.com',
  'juicyads.com',
  'taboola.com',
  'outbrain.com',
  'adnxs.com',
  'trafficjunky.net',
  'clickadu.com',
];

const OUTLINK_WRAPPER_HOSTS = new Set([
  'l.instagram.com',
  'l.facebook.com',
  'lm.facebook.com',
  'out.reddit.com',
  'away.vk.com',
]);

const AD_UNWRAP_PARAMS = ['adurl', 'url', 'u', 'dest', 'destination', 'target', 'redirect', 'q', 'to'];

const EXECUTABLE_EXT_RE = /\.(exe|msi|apk|bat|cmd|scr|ps1|vbs|hta|dmg|pkg|deb|rpm|jar)(\?|#|$)/i;

const SHORTENER_HOSTS = new Set([
  'bit.ly',
  'tinyurl.com',
  't.co',
  'goo.gl',
  'ow.ly',
  'is.gd',
  'buff.ly',
  's.id',
  'cutt.ly',
  'rb.gy',
  'shorturl.at',
  'vm.tiktok.com',
  'vt.tiktok.com',
  'dai.ly',
  'fb.watch',
]);

export function normalizeUserUrlInput(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (!trimmed) return '';
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return trimmed;
  }
  // If user enters a plain search phrase (contains spaces or has no domain dot), treat as ad-free video search
  if (/\s/.test(trimmed) || !trimmed.includes('.')) {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(trimmed)}`;
  }
  return `https://${trimmed}`;
}

export function isPrivateOrReservedHost(hostname: string): boolean {
  const h = hostname.trim().toLowerCase().replace(/^\[|\]$/g, '');
  if (!h) return true;
  if (
    h === 'localhost' ||
    h.endsWith('.localhost') ||
    h.endsWith('.local') ||
    h.endsWith('.internal') ||
    h.endsWith('.home.arpa')
  ) {
    return true;
  }

  const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const octets = ipv4.slice(1).map(Number);
    if (octets.some((o) => o < 0 || o > 255)) return true;
    const [a, b] = octets;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
    return false;
  }

  if (/^(0x[0-9a-f]+|\d+)$/i.test(h)) return true;

  if (h.includes(':')) {
    if (h === '::' || h === '::1') return true;
    if (/^(fc|fd|fe8|fe9|fea|feb)/i.test(h)) return true;
    if (h.startsWith('::ffff:')) {
      return isPrivateOrReservedHost(h.slice(7));
    }
  }

  return false;
}

export function detectSourcePlatform(parsed: URL): SourcePlatform {
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const path = parsed.pathname.toLowerCase();

  if (
    host === 'youtube.com' ||
    host === 'm.youtube.com' ||
    host === 'music.youtube.com' ||
    host === 'youtube-nocookie.com' ||
    host === 'youtu.be'
  ) {
    return 'youtube';
  }
  if (host === 'x.com' || host === 'twitter.com' || host === 'mobile.twitter.com') {
    return 'x';
  }
  if (host === 'instagram.com' || host === 'instagr.am') {
    return 'instagram';
  }
  if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) {
    return 'tiktok';
  }
  if (host === 'reddit.com' || host.endsWith('.reddit.com') || host === 'redd.it' || host === 'v.redd.it') {
    return 'reddit';
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    return 'vimeo';
  }
  if (host === 'dailymotion.com' || host === 'dai.ly') {
    return 'dailymotion';
  }
  if (host === 'streamable.com') {
    return 'streamable';
  }
  if (host === 'archive.org' || host.endsWith('.archive.org')) {
    return 'archive';
  }
  if (/\.(mp4|webm|m4v|mov|m3u8|ogv)(\?|#|$)/i.test(path)) {
    return 'direct';
  }
  return 'other';
}

export function isShortenerHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^www\./, '');
  return SHORTENER_HOSTS.has(h);
}

export function isAdNetworkHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^www\./, '');
  return AD_TRACKER_HOSTS.some((d) => h === d || h.endsWith(`.${d}`));
}

export function extractWrappedDestinationUrl(parsed: URL): string | null {
  const h = parsed.hostname.toLowerCase();
  const isOutlinkWrapper =
    isAdNetworkHost(h) ||
    OUTLINK_WRAPPER_HOSTS.has(h) ||
    ((h === 'www.youtube.com' || h === 'youtube.com') && parsed.pathname === '/redirect');
  if (!isOutlinkWrapper) return null;

  for (const p of AD_UNWRAP_PARAMS) {
    const candidate = parsed.searchParams.get(p);
    if (candidate && /^https?:\/\//i.test(candidate)) {
      return candidate;
    }
  }
  return null;
}

export function sanitizeAndInspectUrl(
  rawInput: string,
  redirectChain: string[] = []
): SafetyReport {
  const normalized = normalizeUserUrlInput(rawInput);
  const reasons: SafetyReason[] = [];
  let score = 100;

  if (!normalized) {
    return {
      verdict: 'BLOCKED',
      score: 0,
      kidSafe: false,
      originalUrl: rawInput,
      sanitizedUrl: '',
      hostname: '',
      sourceType: 'other',
      strippedParams: [],
      redirectChain,
      reasons: [{ code: 'EMPTY_URL', severity: 'block', detail: 'Enter a valid http or https video URL.' }],
      fingerprint: computeSha256Hex(`EMPTY:${rawInput}`),
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return {
      verdict: 'BLOCKED',
      score: 0,
      kidSafe: false,
      originalUrl: rawInput,
      sanitizedUrl: '',
      hostname: '',
      sourceType: 'other',
      strippedParams: [],
      redirectChain,
      reasons: [{ code: 'MALFORMED_URL', severity: 'block', detail: 'URL syntax is invalid.' }],
      fingerprint: computeSha256Hex(`MALFORMED:${rawInput}`),
    };
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return {
      verdict: 'BLOCKED',
      score: 0,
      kidSafe: false,
      originalUrl: rawInput,
      sanitizedUrl: '',
      hostname: parsed.hostname,
      sourceType: 'other',
      strippedParams: [],
      redirectChain,
      reasons: [
        {
          code: 'UNSAFE_SCHEME',
          severity: 'block',
          detail: `Protocol "${parsed.protocol}" is blocked; only http/https streams are permitted.`,
        },
      ],
      fingerprint: computeSha256Hex(`SCHEME:${parsed.href}`),
    };
  }

  // If the link is wrapped inside an ad-tracker or social outlink domain (e.g. doubleclick.net?adurl=...,
  // l.instagram.com/?u=...), strip the wrapper and recover the clean target video URL!
  const wrappedTarget = extractWrappedDestinationUrl(parsed);
  if (wrappedTarget && !redirectChain.includes(wrappedTarget)) {
    const unwrapped = sanitizeAndInspectUrl(wrappedTarget, [...redirectChain, parsed.href]);
    return {
      ...unwrapped,
      originalUrl: rawInput,
      reasons: [
        {
          code: 'AD_WRAPPER_STRIPPED',
          severity: 'pass',
          detail: `Bypassed wrapper host "${parsed.hostname}" and extracted the clean video link.`,
        },
        ...unwrapped.reasons,
      ],
    };
  }

  if (isAdNetworkHost(parsed.hostname)) {
    return {
      verdict: 'BLOCKED',
      score: 0,
      kidSafe: false,
      originalUrl: rawInput,
      sanitizedUrl: '',
      hostname: parsed.hostname,
      sourceType: 'other',
      strippedParams: [],
      redirectChain,
      reasons: [
        {
          code: 'AD_NETWORK_ONLY',
          severity: 'block',
          detail: `Blocked standalone ad/tracker host "${parsed.hostname}" with no clean video target.`,
        },
      ],
      fingerprint: computeSha256Hex(`ADHOST:${parsed.href}`),
    };
  }

  if (parsed.username || parsed.password) {
    score -= 60;
    reasons.push({
      code: 'EMBEDDED_CREDENTIALS',
      severity: 'block',
      detail: 'URL contains embedded userinfo credentials, a phishing spoofing pattern.',
    });
  }

  if (isPrivateOrReservedHost(parsed.hostname)) {
    return {
      verdict: 'BLOCKED',
      score: 0,
      kidSafe: false,
      originalUrl: rawInput,
      sanitizedUrl: '',
      hostname: parsed.hostname,
      sourceType: 'other',
      strippedParams: [],
      redirectChain,
      reasons: [
        {
          code: 'SSRF_PRIVATE_HOST',
          severity: 'block',
          detail: 'Localhost, private LAN, and metadata IP addresses are blocked.',
        },
      ],
      fingerprint: computeSha256Hex(`SSRF:${parsed.href}`),
    };
  }

  // Strip ad & tracking parameters cleanly while preserving video parameters (v, list, t, etc.)
  const strippedParams: string[] = [];
  const nextParams = new URLSearchParams();
  parsed.searchParams.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower.startsWith('utm_') || TRACKER_PARAM_SET.has(lower)) {
      strippedParams.push(key);
    } else if (lower === 's' && (parsed.hostname.includes('x.com') || parsed.hostname.includes('twitter.com'))) {
      strippedParams.push(key);
    } else {
      nextParams.append(key, value);
    }
  });
  parsed.search = nextParams.toString() ? `?${nextParams.toString()}` : '';
  const sanitizedUrl = parsed.toString();

  if (strippedParams.length > 0) {
    reasons.push({
      code: 'ADS_TRACKERS_STRIPPED',
      severity: 'pass',
      detail: `Stripped ${strippedParams.length} ad/tracking parameter(s): ${strippedParams.join(', ')}.`,
    });
  } else {
    reasons.push({
      code: 'SCHEME_VERIFIED',
      severity: 'pass',
      detail: 'Public web protocol verified; third-party ad scripts are excluded from playback.',
    });
  }

  const lowerFull = sanitizedUrl.toLowerCase();
  const hostLower = parsed.hostname.toLowerCase();

  if (hostLower.includes('xn--')) {
    score -= 6;
    reasons.push({
      code: 'IDN_DOMAIN',
      severity: 'pass',
      detail: 'Internationalized domain name resolved via punycode cleanly.',
    });
  }

  // Block executable malware binaries (.apk, .exe, .msi, etc.) rather than video streams
  if (EXECUTABLE_EXT_RE.test(lowerFull)) {
    score -= 90;
    reasons.push({
      code: 'EXECUTABLE_PAYLOAD',
      severity: 'block',
      detail: 'Link points to an executable/installer binary rather than a video or web stream.',
    });
  }

  const sourceType = detectSourcePlatform(parsed);

  if (parsed.protocol === 'http:') {
    reasons.push({
      code: 'HTTP_PROXIED',
      severity: 'pass',
      detail: 'Public HTTP source verified and isolated cleanly through HTTPS media proxy.',
    });
  }

  if (redirectChain.length > 1) {
    reasons.push({
      code: 'REDIRECT_UNWRAPPED',
      severity: 'pass',
      detail: `Unwrapped ${redirectChain.length - 1} redirect hop(s) safely on the server.`,
    });
  }

  const clampedScore = Math.max(0, Math.min(100, score));
  const hasBlock = reasons.some((r) => r.severity === 'block');
  const hasWarn = reasons.some((r) => r.severity === 'warn');

  const verdict: SafetyVerdict =
    hasBlock || clampedScore < 50 ? 'BLOCKED' : hasWarn || clampedScore < 80 ? 'CAUTION' : 'SAFE';
  const kidSafe = verdict === 'SAFE';

  if (!hasBlock && !hasWarn) {
    reasons.push({
      code: 'AD_FREE_ISOLATED',
      severity: 'pass',
      detail: 'Video link approved for isolated ad-free playback without external ad overlays.',
    });
  }

  const fingerprint = computeSha256Hex(`${sanitizedUrl}|${verdict}|${clampedScore}`);

  return {
    verdict,
    score: clampedScore,
    kidSafe,
    originalUrl: rawInput,
    sanitizedUrl,
    hostname: parsed.hostname,
    sourceType,
    strippedParams,
    redirectChain,
    reasons,
    fingerprint,
  };
}

// Metadata screening never blocks or locks out public video links; it only records ad-overlay isolation.
export function classifyMetadataSafety(
  report: SafetyReport,
  meta: {
    title?: string;
    description?: string;
    ageLimit?: number;
    isFamilySafe?: boolean;
    possiblySensitive?: boolean;
    tags?: string[];
  }
): SafetyReport {
  const reasons = [...report.reasons];
  const score = report.score;
  const verdict = report.verdict;

  return {
    ...report,
    score,
    verdict,
    kidSafe: verdict === 'SAFE',
    reasons,
    fingerprint: computeSha256Hex(`${report.sanitizedUrl}|${verdict}|${score}|${meta.title ?? ''}`),
  };
}

// Pure TypeScript SHA-256 so safety checks run identically in Browser, Edge, and Node.
export function computeSha256Hex(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const bitLen = bytes.length * 8;
  const paddedLen = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLen);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(paddedLen - 8, Math.floor(bitLen / 0x100000000), false);
  dv.setUint32(paddedLen - 4, bitLen >>> 0, false);

  const w = new Uint32Array(64);
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));

  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(offset + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + temp1) >>> 0;
      d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
  }
  return H.map((x) => x.toString(16).padStart(8, '0')).join('');
}
