import dns from 'node:dns/promises';
import {
  extractWrappedDestinationUrl,
  isPrivateOrReservedHost,
  isShortenerHost,
  sanitizeAndInspectUrl,
  type SafetyReport,
} from '@/lib/shared/safety';

const MAX_REDIRECT_HOPS = 5;
const REQUEST_TIMEOUT_MS = 6500;

export async function assertSafeRemoteUrl(rawUrl: string): Promise<URL> {
  const parsed = new URL(rawUrl);
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Blocked non-web protocol');
  }
  if (parsed.username || parsed.password) {
    throw new Error('Blocked URL credentials');
  }
  if (isPrivateOrReservedHost(parsed.hostname)) {
    throw new Error('Blocked private or reserved destination');
  }

  // Verify resolved DNS records do not point to private/loopback/link-local addresses.
  try {
    const records = await dns.lookup(parsed.hostname, { all: true });
    for (const rec of records) {
      if (isPrivateOrReservedHost(rec.address)) {
        throw new Error(`Blocked DNS resolution to reserved address (${rec.address})`);
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Blocked')) {
      throw err;
    }
    // If DNS lookup transiently fails in restricted sandbox environments,
    // allow public hostname inspection to fail gracefully in the subsequent fetch.
  }

  return parsed;
}

export async function inspectAndUnwrapUrl(rawInput: string): Promise<SafetyReport> {
  const initial = sanitizeAndInspectUrl(rawInput);
  if (initial.verdict === 'BLOCKED' || !initial.sanitizedUrl) {
    return initial;
  }

  const parsedInitial = new URL(initial.sanitizedUrl);
  const chain: string[] = [initial.sanitizedUrl];

  // Unwrap shorteners or ad wrappers without executing HTML/JS.
  const shouldUnwrap =
    isShortenerHost(parsedInitial.hostname) ||
    initial.sourceType === 'other';

  if (!shouldUnwrap) {
    return initial;
  }

  let current = initial.sanitizedUrl;
  for (let hop = 0; hop < MAX_REDIRECT_HOPS; hop++) {
    let target: URL;
    try {
      target = await assertSafeRemoteUrl(current);
    } catch {
      const blocked = sanitizeAndInspectUrl(current, chain);
      return {
        ...blocked,
        verdict: 'BLOCKED',
        score: 0,
        kidSafe: false,
        reasons: [
          ...blocked.reasons,
          {
            code: 'UNSAFE_REDIRECT_TARGET',
            severity: 'block',
            detail: 'Redirect chain targeted a private or unsafe destination.',
          },
        ],
      };
    }

    const wrappedQueryDest = extractWrappedDestinationUrl(target);
    if (wrappedQueryDest && !chain.includes(wrappedQueryDest)) {
      chain.push(wrappedQueryDest);
      current = wrappedQueryDest;
      const hopCheck = sanitizeAndInspectUrl(current, chain);
      if (hopCheck.verdict === 'BLOCKED') {
        return hopCheck;
      }
      continue;
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      let res = await fetch(target.toString(), {
        method: 'HEAD',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': 'PineReelSafetyInspector/1.0',
        },
      });

      if (res.status === 405 || res.status === 403 || res.status === 501) {
        res = await fetch(target.toString(), {
          method: 'GET',
          redirect: 'manual',
          signal: controller.signal,
          headers: {
            'User-Agent': 'PineReelSafetyInspector/1.0',
            Range: 'bytes=0-4095',
          },
        });
      }
      clearTimeout(timer);

      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location');
        if (!loc) break;
        const resolved = new URL(loc, target).toString();
        if (chain.includes(resolved)) break;
        chain.push(resolved);
        current = resolved;
        const hopCheck = sanitizeAndInspectUrl(current, chain);
        if (hopCheck.verdict === 'BLOCKED') {
          return hopCheck;
        }
        continue;
      }

      const ct = (res.headers.get('content-type') || '').toLowerCase();
      if (ct.includes('text/html') && res.body) {
        const snippet = (await res.text()).slice(0, 4096);
        const metaRefresh = snippet.match(
          /<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^"']*url=([^"'\s>]+)/i
        );
        if (metaRefresh?.[1]) {
          const resolved = new URL(metaRefresh[1], target).toString();
          if (!chain.includes(resolved)) {
            chain.push(resolved);
            current = resolved;
            const hopCheck = sanitizeAndInspectUrl(current, chain);
            if (hopCheck.verdict === 'BLOCKED') return hopCheck;
            continue;
          }
        }
      }
      break;
    } catch {
      break;
    }
  }

  return sanitizeAndInspectUrl(current, chain);
}

