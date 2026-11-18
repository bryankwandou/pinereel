import { spawn } from 'node:child_process';
import { sanitizeAndInspectUrl } from '@/lib/shared/safety';
import { assertSafeRemoteUrl } from './redirect-inspector';
import { isYtdlpAvailable } from './media-resolver';

const ALLOWED_MEDIA_CT = [
  'video/',
  'audio/',
  'application/vnd.apple.mpegurl',
  'application/x-mpegurl',
  'application/octet-stream',
];

function isAllowedContentType(ct: string | null): boolean {
  if (!ct) return true;
  const lower = ct.toLowerCase();
  if (lower.includes('text/html') || lower.includes('javascript') || lower.includes('application/x-msdownload')) {
    return false;
  }
  return ALLOWED_MEDIA_CT.some((prefix) => lower.startsWith(prefix));
}

export async function proxyMediaStream(
  rawUrl: string,
  rangeHeader: string | null,
  asAttachmentFilename?: string | null,
  sourcePageUrl?: string | null
): Promise<Response> {
  // If downloading via local yt-dlp + ffmpeg is requested and binary is available for a page URL
  if (asAttachmentFilename && sourcePageUrl && (await isYtdlpAvailable())) {
    const sourceReport = sanitizeAndInspectUrl(sourcePageUrl);
    if (sourceReport.verdict !== 'BLOCKED' && sourceReport.sanitizedUrl) {
      const safeName = asAttachmentFilename.replace(/[^a-zA-Z0-9._-]+/g, '-');
      const child = spawn('yt-dlp', [
        '--no-warnings',
        '--no-playlist',
        '-f',
        'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b',
        '--merge-output-format',
        'mp4',
        '-o',
        '-',
        sourceReport.sanitizedUrl,
      ]);

      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          child.stdout.on('data', (chunk: Buffer) => {
            controller.enqueue(new Uint8Array(chunk));
          });
          child.stdout.on('end', () => {
            try {
              controller.close();
            } catch {}
          });
          child.on('error', (err) => {
            try {
              controller.error(err);
            } catch {}
          });
        },
        cancel() {
          child.kill('SIGTERM');
        },
      });

      return new Response(stream, {
        status: 200,
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Disposition': `attachment; filename="${safeName.endsWith('.mp4') ? safeName : `${safeName}.mp4`}"`,
          'X-PineReel-Engine': 'local-ytdlp',
          'Cache-Control': 'no-store',
        },
      });
    }
  }

  const safety = sanitizeAndInspectUrl(rawUrl);
  if (safety.verdict === 'BLOCKED' || !safety.sanitizedUrl) {
    return Response.json(
      { error: 'Destination blocked by PineReel safety shield.', safety },
      { status: 403 }
    );
  }

  try {
    await assertSafeRemoteUrl(safety.sanitizedUrl);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Blocked host' },
      { status: 403 }
    );
  }

  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };
  if (rangeHeader) {
    headers.Range = rangeHeader;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);

  let currentUrl = safety.sanitizedUrl;
  let upstream: globalThis.Response | null = null;
  try {
    for (let hop = 0; hop < 5; hop++) {
      await assertSafeRemoteUrl(currentUrl);
      const res = await fetch(currentUrl, {
        headers,
        redirect: 'manual',
        signal: controller.signal,
      });
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location');
        if (!loc) {
          upstream = res;
          break;
        }
        const nextUrl = new URL(loc, currentUrl).toString();
        const hopSafety = sanitizeAndInspectUrl(nextUrl);
        if (hopSafety.verdict === 'BLOCKED' || !hopSafety.sanitizedUrl) {
          clearTimeout(timer);
          return Response.json(
            { error: 'Redirect target blocked by PineReel safety shield.' },
            { status: 403 }
          );
        }
        currentUrl = hopSafety.sanitizedUrl;
        continue;
      }
      upstream = res;
      break;
    }
  } catch (err) {
    clearTimeout(timer);
    return Response.json(
      { error: err instanceof Error ? err.message : 'Upstream stream unavailable' },
      { status: 502 }
    );
  }
  clearTimeout(timer);

  if (!upstream) {
    return Response.json({ error: 'Too many media redirects' }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return Response.json(
      { error: `Upstream responded with status ${upstream.status}` },
      { status: upstream.status >= 400 ? upstream.status : 502 }
    );
  }

  const ct = upstream.headers.get('content-type');
  if (!isAllowedContentType(ct)) {
    return Response.json(
      { error: `Blocked non-media content type (${ct || 'unknown'}).` },
      { status: 415 }
    );
  }

  const outHeaders = new Headers();
  outHeaders.set('Content-Type', ct || 'video/mp4');
  outHeaders.set('Accept-Ranges', upstream.headers.get('accept-ranges') || 'bytes');
  const len = upstream.headers.get('content-length');
  if (len) outHeaders.set('Content-Length', len);
  const contentRange = upstream.headers.get('content-range');
  if (contentRange) outHeaders.set('Content-Range', contentRange);
  outHeaders.set('X-Content-Type-Options', 'nosniff');

  if (asAttachmentFilename) {
    const safeName = asAttachmentFilename.replace(/[^a-zA-Z0-9._-]+/g, '-');
    outHeaders.set('Content-Disposition', `attachment; filename="${safeName}"`);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: outHeaders,
  });
}
