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

function buildUpstreamHeaders(
  targetUrl: string,
  rangeHeader: string | null,
  sourcePageUrl?: string | null,
  omitReferer = false
): Record<string, string> {
  let ua =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
  let sendReferer = !omitReferer;

  try {
    const parsed = new URL(targetUrl);
    const host = parsed.hostname.toLowerCase();
    if (host.endsWith('googlevideo.com')) {
      const clientParam = parsed.searchParams.get('c');
      if (clientParam === 'ANDROID') {
        ua = 'com.google.android.youtube/20.10.38 (Linux; U; Android 15) gzip';
        sendReferer = false;
      } else if (clientParam === 'IOS') {
        ua = 'com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)';
        sendReferer = false;
      }
    } else if (
      host.includes('cdninstagram.com') ||
      host.includes('fbcdn.net') ||
      host.includes('vimeocdn.com') ||
      host.includes('pipedproxy') ||
      host.includes('eeinstagram.com')
    ) {
      sendReferer = false;
    }
  } catch {
    // ignore
  }

  const headers: Record<string, string> = {
    'User-Agent': ua,
    Accept: '*/*',
  };

  if (sendReferer) {
    try {
      const refUrl = sourcePageUrl ? new URL(sourcePageUrl) : new URL(targetUrl);
      headers.Referer = `${refUrl.origin}/`;
    } catch {
      // Ignore malformed referer origin
    }
  }
  if (rangeHeader) {
    headers.Range = rangeHeader;
  }
  return headers;
}

async function proxyHlsAsDownloadableVideo(
  playlistUrl: string,
  filename: string,
  sourcePageUrl?: string | null
): Promise<Response> {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]+/g, '-');
  const fetchPlaylist = async (u: string): Promise<string | null> => {
    await assertSafeRemoteUrl(u);
    let r = await fetch(u, { headers: buildUpstreamHeaders(u, null, sourcePageUrl, false) });
    if (r.status === 403) {
      r = await fetch(u, { headers: buildUpstreamHeaders(u, null, sourcePageUrl, true) });
    }
    if (!r.ok) return null;
    return r.text();
  };

  let mediaUrl = playlistUrl;
  let text = await fetchPlaylist(mediaUrl);
  if (!text || !text.includes('#EXTM3U')) {
    return Response.json({ error: 'Unable to read HLS playlist for download' }, { status: 502 });
  }

  // If master playlist, pick the best bandwidth stream variant
  if (text.includes('#EXT-X-STREAM-INF')) {
    const lines = text.split(/\r?\n/).map((l) => l.trim());
    let bestBw = -1;
    let bestUri: string | null = null;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#EXT-X-STREAM-INF')) {
        const bwMatch = lines[i].match(/BANDWIDTH=(\d+)/i);
        const bw = bwMatch ? Number(bwMatch[1]) : 0;
        const nextLine = lines[i + 1];
        if (nextLine && !nextLine.startsWith('#') && bw >= bestBw) {
          bestBw = bw;
          bestUri = nextLine;
        }
      }
    }
    if (bestUri) {
      mediaUrl = new URL(bestUri, mediaUrl).toString();
      const childText = await fetchPlaylist(mediaUrl);
      if (childText) text = childText;
    }
  }

  const segmentUrls: string[] = [];
  let isFmp4 = false;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('#EXT-X-MAP:')) {
      const mapUri = line.match(/URI="([^"]+)"/i)?.[1];
      if (mapUri) {
        segmentUrls.push(new URL(mapUri, mediaUrl).toString());
        isFmp4 = true;
      }
    } else if (!line.startsWith('#')) {
      const seg = new URL(line, mediaUrl).toString();
      if (/\.m4s(\?|$)|\.mp4(\?|$)/i.test(seg)) isFmp4 = true;
      segmentUrls.push(seg);
    }
  }

  if (segmentUrls.length === 0) {
    return Response.json({ error: 'No downloadable video segments found in HLS playlist' }, { status: 502 });
  }

  const maxSegments = Math.min(segmentUrls.length, 60);
  const targetSegments = segmentUrls.slice(0, maxSegments);
  const outExt = isFmp4 ? 'mp4' : 'ts';
  const finalFilename = safeName.replace(/\.(m3u8|mp4|ts)$/i, '') + `.${outExt}`;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (const segUrl of targetSegments) {
          await assertSafeRemoteUrl(segUrl);
          let segRes = await fetch(segUrl, { headers: buildUpstreamHeaders(segUrl, null, sourcePageUrl, false) });
          if (segRes.status === 403) {
            segRes = await fetch(segUrl, { headers: buildUpstreamHeaders(segUrl, null, sourcePageUrl, true) });
          }
          if (!segRes.ok || !segRes.body) continue;
          const reader = segRes.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) controller.enqueue(value);
          }
        }
        controller.close();
      } catch (err) {
        try {
          controller.error(err);
        } catch { }
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': isFmp4 ? 'video/mp4' : 'video/mp2t',
      'Content-Disposition': `attachment; filename="${finalFilename}"`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    },
  });
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
            } catch { }
          });
          child.on('error', (err) => {
            try {
              controller.error(err);
            } catch { }
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

  // If user requested a file download of an HLS .m3u8 playlist, stitch segments into a real playable video stream
  if (asAttachmentFilename && /\.m3u8(\?|#|$)/i.test(safety.sanitizedUrl)) {
    return proxyHlsAsDownloadableVideo(safety.sanitizedUrl, asAttachmentFilename, sourcePageUrl);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);

  let currentUrl = safety.sanitizedUrl;
  let upstream: globalThis.Response | null = null;
  try {
    for (let hop = 0; hop < 5; hop++) {
      await assertSafeRemoteUrl(currentUrl);
      let res = await fetch(currentUrl, {
        headers: buildUpstreamHeaders(currentUrl, rangeHeader, sourcePageUrl, false),
        redirect: 'manual',
        signal: controller.signal,
      });
      if (res.status === 403) {
        res = await fetch(currentUrl, {
          headers: buildUpstreamHeaders(currentUrl, rangeHeader, sourcePageUrl, true),
          redirect: 'manual',
          signal: controller.signal,
        });
      }
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
