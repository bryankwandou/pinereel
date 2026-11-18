export type SourcePlatform =
  | 'youtube'
  | 'x'
  | 'instagram'
  | 'tiktok'
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

const AD_UNWRAP_PARAMS = ['adurl', 'url', 'u', 'dest', 'destination', 'target', 'redirect', 'q'];

const PHISHING_LURE_HOSTS_OR_TOKENS = [
  'seed-phrase',
  'recovery-phrase',
  'verify-wallet',
  'wallet-sync',
  'connect-claim',
  'login-verify',
  'account-suspended',
  'slot-gacor',
  'judol',
  'togel-online',
  'sbobet',
  'pragmaticplay',
];

const EXPLICIT_ADULT_HOSTS = [
  'pornhub.com',
  'xvideos.com',
  'xnxx.com',
  'onlyfans.com',
  'chaturbate.com',
  'redtube.com',
  'youporn.com',
  'xhamster.com',
];

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

function isAdNetworkHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^www\./, '');
  return AD_TRACKER_HOSTS.some((d) => h === d || h.endsWith(`.${d}`));
}

function isExplicitAdultHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^www\./, '');
  return EXPLICIT_ADULT_HOSTS.some((d) => h === d || h.endsWith(`.${d}`));
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

  // If the link is wrapped inside an ad-tracker domain (e.g. doubleclick.net?adurl=https://youtube.com/...),
  // strip the ad wrapper and recover the clean target video URL rather than rejecting the video!
  if (isAdNetworkHost(parsed.hostname)) {
    let extractedTarget: string | null = null;
    for (const p of AD_UNWRAP_PARAMS) {
      const candidate = parsed.searchParams.get(p);
      if (candidate && /^https?:\/\//i.test(candidate)) {
        extractedTarget = candidate;
        break;
      }
    }
    if (extractedTarget && !redirectChain.includes(extractedTarget)) {
      const unwrapped = sanitizeAndInspectUrl(extractedTarget, [...redirectChain, parsed.href]);
      return {
        ...unwrapped,
        originalUrl: rawInput,
        reasons: [
          {
            code: 'AD_WRAPPER_STRIPPED',
            severity: 'pass',
            detail: `Bypassed ad redirect host "${parsed.hostname}" and extracted the clean video link.`,
          },
          ...unwrapped.reasons,
        ],
      };
    }
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
    score -= 25;
    reasons.push({
      code: 'PUNYCODE_IDN',
      severity: 'warn',
      detail: 'Internationalized punycode domain detected; verify domain spelling.',
    });
  }

  // Block executable malware binaries rather than video streams
  if (EXECUTABLE_EXT_RE.test(lowerFull)) {
    score -= 90;
    reasons.push({
      code: 'EXECUTABLE_PAYLOAD',
      severity: 'block',
      detail: 'Link points to an executable/installer binary rather than a video stream.',
    });
  }

  // Block dedicated phishing/gambling-ad lure slugs & explicit adult hosts only (never block general video platforms)
  const sourceType = detectSourcePlatform(parsed);
  const isKnownVideoPlatform = sourceType !== 'other' && sourceType !== 'direct';

  if (!isKnownVideoPlatform) {
    const lureHit = PHISHING_LURE_HOSTS_OR_TOKENS.find((kw) => lowerFull.includes(kw));
    if (lureHit) {
      score -= 85;
      reasons.push({
        code: 'AD_LURE_BLOCKED',
        severity: 'block',
        detail: `Blocked gambling-ad or phishing lure pattern matching "${lureHit}".`,
      });
    }
  }

  if (isExplicitAdultHost(hostLower)) {
    score -= 80;
    reasons.push({
      code: 'ADULT_DOMAIN',
      severity: 'block',
      detail: 'Blocked explicit adult host incompatible with Kid-Safe viewing.',
    });
  }

  if (/(youtube\.com|instagram\.com|twitter\.com|x\.com)\.[^/]+/i.test(hostLower)) {
    score -= 80;
    reasons.push({
      code: 'DOMAIN_SPOOFING',
      severity: 'block',
      detail: 'Subdomain impersonates a video platform on an unrelated root domain.',
    });
  }

  if (parsed.protocol === 'http:') {
    score -= 10;
    reasons.push({
      code: 'INSECURE_HTTP',
      severity: 'warn',
      detail: 'Unencrypted HTTP link; media loads cleanly via server proxy.',
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

// Metadata screening adjusts Kid-Safe advisory status ONLY for explicit upstream age limits (>= 18)
// or explicit non-family-safe flags; it NEVER blocks normal public videos on keywords.
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
  let score = report.score;
  let kidSafe = report.kidSafe;

  if (meta.ageLimit !== undefined && meta.ageLimit >= 18) {
    score = Math.min(score, 65);
    kidSafe = false;
    reasons.push({
      code: 'AGE_RESTRICTED',
      severity: 'warn',
      detail: `Origin age limit (${meta.ageLimit}+) requires Guardian PIN in Kid-Safe Mode.`,
    });
  }

  if (meta.isFamilySafe === false || meta.possiblySensitive === true) {
    score = Math.min(score, 70);
    kidSafe = false;
    reasons.push({
      code: 'SENSITIVE_FLAG',
      severity: 'warn',
      detail: 'Origin flagged this video as sensitive or non-family-safe.',
    });
  }

  const hasBlock = reasons.some((r) => r.severity === 'block');
  const hasWarn = reasons.some((r) => r.severity === 'warn');
  const verdict: SafetyVerdict = hasBlock || score < 50 ? 'BLOCKED' : hasWarn || score < 80 ? 'CAUTION' : 'SAFE';

  return {
    ...report,
    score: Math.max(0, Math.min(100, score)),
    verdict,
    kidSafe: verdict === 'SAFE' && kidSafe,
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
