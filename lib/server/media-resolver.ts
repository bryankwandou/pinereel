import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  classifyMetadataSafety,
  type SafetyReport,
  type SourcePlatform,
} from '@/lib/shared/safety';
import { assertSafeRemoteUrl, inspectAndUnwrapUrl } from './redirect-inspector';

const execFileAsync = promisify(execFile);

export interface MediaStreamVariant {
  id: string;
  label: string;
  ext: string;
  url: string;
  proxyUrl: string;
  downloadUrl: string;
  qualityHeight: number | null;
  hasAudio: boolean;
  hasVideo: boolean;
  filesizeBytes: number | null;
  mimeType: string;
  isHls: boolean;
}

export interface ResolvedMedia {
  ok: boolean;
  engine: 'local-ytdlp' | 'worker-ytdlp' | 'cloud-direct' | 'cloud-extractor' | 'blocked';
  safety: SafetyReport;
  title: string;
  author: string;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
  streams: MediaStreamVariant[];
  preferredStreamUrl: string | null;
  privacyEmbedUrl: string | null;
  offlineCapable: boolean;
  offlineNote: string;
  ytdlpAvailable: boolean;
}

let cachedYtdlpAvailable: boolean | null = null;

export async function isYtdlpAvailable(): Promise<boolean> {
  if (cachedYtdlpAvailable !== null) return cachedYtdlpAvailable;
  try {
    await execFileAsync('yt-dlp', ['--version'], { timeout: 3000 });
    cachedYtdlpAvailable = true;
  } catch {
    cachedYtdlpAvailable = false;
  }
  return cachedYtdlpAvailable;
}

function buildProxyUrl(directUrl: string): string {
  return `/api/stream?url=${encodeURIComponent(directUrl)}`;
}

function buildDownloadUrl(
  directUrl: string,
  title: string,
  ext: string,
  sourcePageUrl?: string
): string {
  const safeBase = title
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'pinereel-video';
  const params = new URLSearchParams({
    url: directUrl,
    filename: `${safeBase}.${ext || 'mp4'}`,
  });
  if (sourcePageUrl) params.set('source', sourcePageUrl);
  return `/api/download?${params.toString()}`;
}

export function extractYouTubeId(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl);
    const host = u.hostname.toLowerCase().replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (
      host === 'youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'music.youtube.com' ||
      host === 'youtube-nocookie.com'
    ) {
      const v = u.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      const parts = u.pathname.split('/').filter(Boolean);
      if (['shorts', 'embed', 'live', 'v'].includes(parts[0]) && parts[1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[1])) {
        return parts[1];
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function extractTweetInfo(rawUrl: string): { user?: string; id: string } | null {
  try {
    const u = new URL(rawUrl);
    const m = u.pathname.match(/^\/(?:([^/]+)\/)?status(?:es)?\/(\d+)/i);
    if (!m) return null;
    return { user: m[1] || 'i', id: m[2] };
  } catch {
    return null;
  }
}

export function extractVimeoId(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl);
    const m = u.pathname.match(/\/(?:video\/)?(\d+)/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

export function extractArchiveId(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl);
    const m = u.pathname.match(/^\/details\/([^/?#]+)/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = 6500): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PineReelMediaResolver/1.0)',
        Accept: 'application/json, text/plain, */*',
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchTextBounded(url: string, maxBytes = 600_000, timeoutMs = 7000): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!res.ok || !res.body) return null;
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > maxBytes) {
          chunks.push(value.subarray(0, Math.max(0, value.byteLength - (total - maxBytes))));
          await reader.cancel();
          break;
        }
        chunks.push(value);
      }
    }
    const merged = new Uint8Array(Math.min(total, maxBytes));
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.byteLength;
    }
    return new TextDecoder().decode(merged);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

interface YtDlpFormat {
  format_id?: string;
  ext?: string;
  url?: string;
  height?: number | null;
  vcodec?: string;
  acodec?: string;
  filesize?: number | null;
  filesize_approx?: number | null;
  protocol?: string;
}

interface YtDlpPayload {
  title?: string;
  uploader?: string;
  channel?: string;
  duration?: number | null;
  thumbnail?: string | null;
  age_limit?: number;
  description?: string;
  tags?: string[];
  formats?: YtDlpFormat[];
  url?: string;
}

async function resolveWithLocalYtdlp(
  url: string,
  safety: SafetyReport
): Promise<ResolvedMedia | null> {
  const available = await isYtdlpAvailable();
  if (!available) return null;

  try {
    const { stdout } = await execFileAsync(
      'yt-dlp',
      [
        '--dump-single-json',
        '--no-warnings',
        '--no-playlist',
        '--skip-download',
        '--socket-timeout',
        '12',
        url,
      ],
      { timeout: 20_000, maxBuffer: 12 * 1024 * 1024 }
    );
    const info = JSON.parse(stdout) as YtDlpPayload;
    const title = info.title?.trim() || 'Untitled Media';
    const author = info.uploader || info.channel || safety.hostname;

    const updatedSafety = classifyMetadataSafety(safety, {
      title,
      description: info.description,
      ageLimit: info.age_limit,
      tags: info.tags,
    });

    if (updatedSafety.verdict === 'BLOCKED') {
      return {
        ok: false,
        engine: 'blocked',
        safety: updatedSafety,
        title,
        author,
        durationSeconds: info.duration ?? null,
        thumbnailUrl: info.thumbnail ?? null,
        streams: [],
        preferredStreamUrl: null,
        privacyEmbedUrl: null,
        offlineCapable: false,
        offlineNote: 'Blocked by safety policy after metadata inspection.',
        ytdlpAvailable: true,
      };
    }

    const formats = Array.isArray(info.formats) ? info.formats : [];
    const muxedMp4 = formats
      .filter(
        (f) =>
          Boolean(f.url) &&
          f.vcodec &&
          f.vcodec !== 'none' &&
          f.acodec &&
          f.acodec !== 'none' &&
          (f.ext === 'mp4' || f.ext === 'webm') &&
          /^https?:/i.test(f.url!)
      )
      .sort((a, b) => (b.height ?? 0) - (a.height ?? 0));

    const hlsFallback = formats
      .filter(
        (f) =>
          Boolean(f.url) &&
          f.vcodec !== 'none' &&
          (f.protocol?.includes('m3u8') || f.ext === 'm3u8') &&
          /^https?:/i.test(f.url!)
      )
      .sort((a, b) => (b.height ?? 0) - (a.height ?? 0));

    const chosen = [...muxedMp4, ...hlsFallback].slice(0, 6);
    const variants: MediaStreamVariant[] = chosen.map((f, idx) => {
      const ext = f.ext || 'mp4';
      const isHls = Boolean(f.protocol?.includes('m3u8') || ext === 'm3u8');
      return {
        id: f.format_id || `fmt-${idx}`,
        label: `${f.height ? `${f.height}p` : 'Adaptive'} ${ext.toUpperCase()}`,
        ext,
        url: f.url!,
        proxyUrl: buildProxyUrl(f.url!),
        downloadUrl: `/api/download?source=${encodeURIComponent(url)}&filename=${encodeURIComponent(
          `${title.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 48)}.mp4`
        )}&url=${encodeURIComponent(f.url!)}`,
        qualityHeight: f.height ?? null,
        hasAudio: f.acodec !== 'none',
        hasVideo: f.vcodec !== 'none',
        filesizeBytes: f.filesize ?? f.filesize_approx ?? null,
        mimeType: isHls ? 'application/vnd.apple.mpegurl' : `video/${ext}`,
        isHls,
      };
    });

    // If yt-dlp only exposed adaptive audio/video separately on YouTube, offer a local yt-dlp merged stream!
    if (variants.length === 0 && info.url && /^https?:/i.test(info.url)) {
      variants.push({
        id: 'ytdlp-direct',
        label: 'Direct MP4',
        ext: 'mp4',
        url: info.url,
        proxyUrl: buildProxyUrl(info.url),
        downloadUrl: buildDownloadUrl(info.url, title, 'mp4', url),
        qualityHeight: null,
        hasAudio: true,
        hasVideo: true,
        filesizeBytes: null,
        mimeType: 'video/mp4',
        isHls: false,
      });
    }

    const ytId = safety.sourceType === 'youtube' ? extractYouTubeId(url) : null;
    const preferred = variants.find((v) => !v.isHls) ?? variants[0] ?? null;

    return {
      ok: true,
      engine: 'local-ytdlp',
      safety: updatedSafety,
      title,
      author,
      durationSeconds: info.duration ?? null,
      thumbnailUrl: info.thumbnail ?? null,
      streams: variants,
      preferredStreamUrl: preferred ? preferred.proxyUrl : null,
      privacyEmbedUrl: ytId
        ? `https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1&iv_load_policy=3`
        : null,
      offlineCapable: variants.some((v) => !v.isHls),
      offlineNote:
        variants.some((v) => !v.isHls)
          ? 'Direct ad-free stream resolved locally via yt-dlp; ready for offline Mountain Vault caching and MP4 download.'
          : 'Merged MP4 download available via local yt-dlp + ffmpeg pipeline.',
      ytdlpAvailable: true,
    };
  } catch {
    return null;
  }
}

async function resolveDirectMedia(url: string, safety: SafetyReport): Promise<ResolvedMedia | null> {
  try {
    await assertSafeRemoteUrl(url);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6500);
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': 'PineReelMediaInspector/1.0' },
    }).finally(() => clearTimeout(timer));

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const contentLengthRaw = res.headers.get('content-length');
    const size = contentLengthRaw ? Number(contentLengthRaw) : null;
    const isHls = /\.m3u8(\?|#|$)/i.test(url) || contentType.includes('mpegurl');
    const isVideo = contentType.startsWith('video/') || /\.(mp4|webm|m4v|mov|ogv)(\?|#|$)/i.test(url);

    if (!isVideo && !isHls) return null;

    const ext = isHls ? 'm3u8' : url.match(/\.(webm|mov|ogv|m4v)/i)?.[1]?.toLowerCase() ?? 'mp4';
    const rawName = decodeURIComponent(new URL(url).pathname.split('/').pop() || 'Direct Video Stream');
    const title = rawName.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ') || 'Direct Video Stream';

    const variant: MediaStreamVariant = {
      id: 'direct-source',
      label: isHls ? 'HLS Stream' : `Direct ${ext.toUpperCase()}`,
      ext,
      url,
      proxyUrl: buildProxyUrl(url),
      downloadUrl: buildDownloadUrl(url, title, ext),
      qualityHeight: null,
      hasAudio: true,
      hasVideo: true,
      filesizeBytes: Number.isFinite(size) ? size : null,
      mimeType: isHls ? 'application/vnd.apple.mpegurl' : `video/${ext}`,
      isHls,
    };

    return {
      ok: true,
      engine: 'cloud-direct',
      safety,
      title,
      author: safety.hostname,
      durationSeconds: null,
      thumbnailUrl: null,
      streams: [variant],
      preferredStreamUrl: variant.proxyUrl,
      privacyEmbedUrl: null,
      offlineCapable: !isHls,
      offlineNote: isHls
        ? 'HLS adaptive stream ready for ad-free playback.'
        : 'Direct stream verified; ready for offline Mountain Vault caching and device download.',
      ytdlpAvailable: await isYtdlpAvailable(),
    };
  } catch {
    return null;
  }
}

async function resolveArchiveOrg(url: string, safety: SafetyReport): Promise<ResolvedMedia | null> {
  const itemId = extractArchiveId(url);
  if (!itemId) return null;
  const meta = await fetchJsonWithTimeout<{
    metadata?: { title?: string; creator?: string | string[] };
    files?: { name?: string; format?: string; size?: string; length?: string }[];
  }>(`https://archive.org/metadata/${encodeURIComponent(itemId)}`);

  if (!meta?.files) return null;
  const title = meta.metadata?.title || itemId;
  const creatorRaw = meta.metadata?.creator;
  const author = Array.isArray(creatorRaw) ? creatorRaw[0] : creatorRaw || 'Internet Archive';

  const mp4Files = meta.files
    .filter((f) => f.name && /\.(mp4|webm)$/i.test(f.name) && !f.name.endsWith('.thumbs'))
    .sort((a, b) => Number(a.size || 0) - Number(b.size || 0));

  if (mp4Files.length === 0) return null;

  const variants: MediaStreamVariant[] = mp4Files.slice(0, 4).map((f, idx) => {
    const ext = f.name!.endsWith('.webm') ? 'webm' : 'mp4';
    const directUrl = `https://archive.org/download/${encodeURIComponent(itemId)}/${f.name!
      .split('/')
      .map(encodeURIComponent)
      .join('/')}`;
    return {
      id: `archive-${idx}`,
      label: `${f.format || ext.toUpperCase()}`,
      ext,
      url: directUrl,
      proxyUrl: buildProxyUrl(directUrl),
      downloadUrl: buildDownloadUrl(directUrl, title, ext),
      qualityHeight: null,
      hasAudio: true,
      hasVideo: true,
      filesizeBytes: f.size ? Number(f.size) : null,
      mimeType: `video/${ext}`,
      isHls: false,
    };
  });

  const thumbFile = meta.files.find((f) => f.name && /\.(jpg|jpeg|png)$/i.test(f.name));
  const thumbUrl = thumbFile
    ? `https://archive.org/download/${encodeURIComponent(itemId)}/${encodeURIComponent(thumbFile.name!)}`
    : null;

  const updatedSafety = classifyMetadataSafety(safety, { title });
  const preferred = variants[0];

  return {
    ok: updatedSafety.verdict !== 'BLOCKED',
    engine: updatedSafety.verdict === 'BLOCKED' ? 'blocked' : 'cloud-extractor',
    safety: updatedSafety,
    title,
    author,
    durationSeconds: mp4Files[0]?.length ? Math.round(Number(mp4Files[0].length)) : null,
    thumbnailUrl: thumbUrl,
    streams: updatedSafety.verdict === 'BLOCKED' ? [] : variants,
    preferredStreamUrl: updatedSafety.verdict === 'BLOCKED' ? null : preferred.proxyUrl,
    privacyEmbedUrl: null,
    offlineCapable: updatedSafety.verdict !== 'BLOCKED',
    offlineNote: 'Public Archive direct MP4 resolved; ready for Mountain Vault offline storage.',
    ytdlpAvailable: await isYtdlpAvailable(),
  };
}

async function resolveYouTubeCloud(url: string, safety: SafetyReport): Promise<ResolvedMedia | null> {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;

  const [oembed, watchHtml] = await Promise.all([
    fetchJsonWithTimeout<{ title?: string; author_name?: string; thumbnail_url?: string }>(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`
    ),
    fetchTextBounded(`https://www.youtube.com/watch?v=${videoId}`),
  ]);

  let title = oembed?.title || `YouTube Video (${videoId})`;
  let author = oembed?.author_name || 'YouTube Creator';
  const thumbnailUrl = oembed?.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  let durationSeconds: number | null = null;
  let isFamilySafe: boolean | undefined;
  let description: string | undefined;
  let keywords: string[] | undefined;
  const variants: MediaStreamVariant[] = [];

  if (watchHtml) {
    const m = watchHtml.match(/ytInitialPlayerResponse\s*=\s*(\{[\s\S]+?\});\s*(?:var|const|let|<\/script>)/);
    if (m) {
      try {
        const pr = JSON.parse(m[1]) as {
          videoDetails?: {
            title?: string;
            author?: string;
            lengthSeconds?: string;
            shortDescription?: string;
            keywords?: string[];
          };
          microformat?: { playerMicroformatRenderer?: { isFamilySafe?: boolean } };
          streamingData?: {
            formats?: {
              itag?: number;
              url?: string;
              mimeType?: string;
              height?: number;
              contentLength?: string;
            }[];
          };
        };

        if (pr.videoDetails?.title) title = pr.videoDetails.title;
        if (pr.videoDetails?.author) author = pr.videoDetails.author;
        if (pr.videoDetails?.lengthSeconds) durationSeconds = Number(pr.videoDetails.lengthSeconds);
        description = pr.videoDetails?.shortDescription;
        keywords = pr.videoDetails?.keywords;
        isFamilySafe = pr.microformat?.playerMicroformatRenderer?.isFamilySafe;

        for (const f of pr.streamingData?.formats ?? []) {
          if (f.url && /^https?:/i.test(f.url)) {
            const ext = f.mimeType?.includes('webm') ? 'webm' : 'mp4';
            variants.push({
              id: `yt-${f.itag ?? variants.length}`,
              label: `${f.height ?? 360}p ${ext.toUpperCase()}`,
              ext,
              url: f.url,
              proxyUrl: buildProxyUrl(f.url),
              downloadUrl: buildDownloadUrl(f.url, title, ext, url),
              qualityHeight: f.height ?? null,
              hasAudio: true,
              hasVideo: true,
              filesizeBytes: f.contentLength ? Number(f.contentLength) : null,
              mimeType: `video/${ext}`,
              isHls: false,
            });
          }
        }
      } catch {
        // Metadata regex parse fallback safely continues with oEmbed + privacy embed.
      }
    }
  }

  const updatedSafety = classifyMetadataSafety(safety, {
    title,
    description,
    isFamilySafe,
    tags: keywords,
  });

  if (updatedSafety.verdict === 'BLOCKED') {
    return {
      ok: false,
      engine: 'blocked',
      safety: updatedSafety,
      title,
      author,
      durationSeconds,
      thumbnailUrl,
      streams: [],
      preferredStreamUrl: null,
      privacyEmbedUrl: null,
      offlineCapable: false,
      offlineNote: 'Blocked by Kid-Safe and Threat Shield policy.',
      ytdlpAvailable: await isYtdlpAvailable(),
    };
  }

  const preferred = variants[0] ?? null;
  const ytdlpAvail = await isYtdlpAvailable();

  return {
    ok: true,
    engine: 'cloud-extractor',
    safety: updatedSafety,
    title,
    author,
    durationSeconds,
    thumbnailUrl,
    streams: variants,
    preferredStreamUrl: preferred ? preferred.proxyUrl : null,
    privacyEmbedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&iv_load_policy=3`,
    offlineCapable: variants.length > 0 || ytdlpAvail,
    offlineNote:
      variants.length > 0
        ? 'Direct ad-free YouTube stream resolved for offline Mountain Vault caching.'
        : 'Privacy-isolated youtube-nocookie playback active in cloud mode. Run PineReel locally with yt-dlp or paste direct Archive/X/MP4 URLs for offline file storage.',
    ytdlpAvailable: ytdlpAvail,
  };
}

async function resolveXCloud(url: string, safety: SafetyReport): Promise<ResolvedMedia | null> {
  const tweet = extractTweetInfo(url);
  if (!tweet) return null;

  const token = ((Number(tweet.id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, '');
  const syn = await fetchJsonWithTimeout<{
    text?: string;
    possibly_sensitive?: boolean;
    user?: { name?: string; screen_name?: string };
    mediaDetails?: {
      type?: string;
      media_url_https?: string;
      video_info?: {
        duration_millis?: number;
        variants?: { content_type?: string; bitrate?: number; url?: string }[];
      };
    }[];
  }>(`https://cdn.syndication.twimg.com/tweet-result?id=${tweet.id}&token=${token}`);

  let title = syn?.text?.slice(0, 96) || `X Post ${tweet.id}`;
  let author = syn?.user?.name || `@${tweet.user || 'x'}`;
  let sensitive = syn?.possibly_sensitive;
  let thumb: string | null = syn?.mediaDetails?.[0]?.media_url_https ?? null;
  let durationSeconds: number | null = null;
  const variants: MediaStreamVariant[] = [];

  for (const m of syn?.mediaDetails ?? []) {
    if (m.video_info?.duration_millis) {
      durationSeconds = Math.round(m.video_info.duration_millis / 1000);
    }
    const mp4s = (m.video_info?.variants ?? [])
      .filter((v) => v.url && v.content_type === 'video/mp4')
      .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0));
    mp4s.forEach((v, idx) => {
      const kbps = v.bitrate ? `${Math.round(v.bitrate / 1000)}kbps` : 'Stream';
      variants.push({
        id: `x-mp4-${idx}`,
        label: `MP4 (${kbps})`,
        ext: 'mp4',
        url: v.url!,
        proxyUrl: buildProxyUrl(v.url!),
        downloadUrl: buildDownloadUrl(v.url!, title, 'mp4', url),
        qualityHeight: null,
        hasAudio: true,
        hasVideo: true,
        filesizeBytes: null,
        mimeType: 'video/mp4',
        isHls: false,
      });
    });
  }

  // Secondary public fxtwitter JSON fallback if syndication returned empty
  if (variants.length === 0) {
    const fx = await fetchJsonWithTimeout<{
      tweet?: {
        text?: string;
        possibly_sensitive?: boolean;
        author?: { name?: string; screen_name?: string };
        media?: {
          videos?: { url?: string; thumbnail_url?: string; duration?: number; width?: number; height?: number }[];
        };
      };
    }>(`https://api.fxtwitter.com/${encodeURIComponent(tweet.user || 'i')}/status/${tweet.id}`);

    if (fx?.tweet) {
      title = fx.tweet.text?.slice(0, 96) || title;
      author = fx.tweet.author?.name || author;
      sensitive = fx.tweet.possibly_sensitive;
      const fxVideos = fx.tweet.media?.videos ?? [];
      for (let idx = 0; idx < fxVideos.length; idx++) {
        const v = fxVideos[idx];
        if (v.thumbnail_url && !thumb) thumb = v.thumbnail_url;
        if (v.duration && !durationSeconds) durationSeconds = Math.round(v.duration);
        if (v.url) {
          variants.push({
            id: `fx-mp4-${idx}`,
            label: v.height ? `${v.height}p MP4` : 'MP4 Stream',
            ext: 'mp4',
            url: v.url,
            proxyUrl: buildProxyUrl(v.url),
            downloadUrl: buildDownloadUrl(v.url, title, 'mp4', url),
            qualityHeight: v.height ?? null,
            hasAudio: true,
            hasVideo: true,
            filesizeBytes: null,
            mimeType: 'video/mp4',
            isHls: false,
          });
        }
      }
    }
  }

  if (variants.length === 0 && !syn) return null;

  const updatedSafety = classifyMetadataSafety(safety, {
    title,
    possiblySensitive: sensitive,
  });

  if (updatedSafety.verdict === 'BLOCKED') {
    return {
      ok: false,
      engine: 'blocked',
      safety: updatedSafety,
      title,
      author,
      durationSeconds,
      thumbnailUrl: thumb,
      streams: [],
      preferredStreamUrl: null,
      privacyEmbedUrl: null,
      offlineCapable: false,
      offlineNote: 'Blocked by Kid-Safe and Threat Shield policy.',
      ytdlpAvailable: await isYtdlpAvailable(),
    };
  }

  const preferred = variants[0] ?? null;

  return {
    ok: true,
    engine: 'cloud-extractor',
    safety: updatedSafety,
    title,
    author,
    durationSeconds,
    thumbnailUrl: thumb,
    streams: variants,
    preferredStreamUrl: preferred ? preferred.proxyUrl : null,
    privacyEmbedUrl: null,
    offlineCapable: variants.length > 0,
    offlineNote:
      variants.length > 0
        ? 'Direct X MP4 stream resolved without login or ads; ready for Mountain Vault offline storage.'
        : 'Post resolved, but no public video stream was attached to this status.',
    ytdlpAvailable: await isYtdlpAvailable(),
  };
}

async function resolveVimeoCloud(url: string, safety: SafetyReport): Promise<ResolvedMedia | null> {
  const id = extractVimeoId(url);
  if (!id) return null;
  const oembed = await fetchJsonWithTimeout<{
    title?: string;
    author_name?: string;
    duration?: number;
    thumbnail_url?: string;
  }>(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`);

  if (!oembed) return null;
  const title = oembed.title || `Vimeo Video (${id})`;
  const updatedSafety = classifyMetadataSafety(safety, { title });

  return {
    ok: updatedSafety.verdict !== 'BLOCKED',
    engine: updatedSafety.verdict === 'BLOCKED' ? 'blocked' : 'cloud-extractor',
    safety: updatedSafety,
    title,
    author: oembed.author_name || 'Vimeo Creator',
    durationSeconds: oembed.duration ?? null,
    thumbnailUrl: oembed.thumbnail_url ?? null,
    streams: [],
    preferredStreamUrl: null,
    privacyEmbedUrl:
      updatedSafety.verdict === 'BLOCKED'
        ? null
        : `https://player.vimeo.com/video/${id}?dnt=1&title=0&byline=0&portrait=0`,
    offlineCapable: await isYtdlpAvailable(),
    offlineNote: 'DNT-isolated Vimeo playback active; run local yt-dlp engine for direct MP4 downloads.',
    ytdlpAvailable: await isYtdlpAvailable(),
  };
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extractMetaTag(html: string, nameOrProp: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${nameOrProp}["'][^>]+content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${nameOrProp}["']`,
    'i'
  );
  const m = html.match(re);
  return m ? decodeHtmlEntities(m[1] || m[2] || '') : null;
}

async function resolveOpenGraphMedia(
  url: string,
  safety: SafetyReport,
  _platform: SourcePlatform
): Promise<ResolvedMedia | null> {
  try {
    await assertSafeRemoteUrl(url);
  } catch {
    return null;
  }

  const html = await fetchTextBounded(url);
  if (!html) return null;

  const videoUrl =
    extractMetaTag(html, 'og:video:secure_url') ||
    extractMetaTag(html, 'og:video:url') ||
    extractMetaTag(html, 'og:video') ||
    extractMetaTag(html, 'twitter:player:stream');

  const title =
    extractMetaTag(html, 'og:title') ||
    extractMetaTag(html, 'twitter:title') ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ||
    safety.hostname;

  const description = extractMetaTag(html, 'og:description') || undefined;
  const thumb = extractMetaTag(html, 'og:image') || extractMetaTag(html, 'twitter:image') || null;
  const updatedSafety = classifyMetadataSafety(safety, { title, description });

  if (updatedSafety.verdict === 'BLOCKED') {
    return {
      ok: false,
      engine: 'blocked',
      safety: updatedSafety,
      title,
      author: safety.hostname,
      durationSeconds: null,
      thumbnailUrl: thumb,
      streams: [],
      preferredStreamUrl: null,
      privacyEmbedUrl: null,
      offlineCapable: false,
      offlineNote: 'Blocked by Threat Shield after HTML metadata analysis.',
      ytdlpAvailable: await isYtdlpAvailable(),
    };
  }

  if (!videoUrl || !/^https?:/i.test(videoUrl)) return null;

  const isHls = /\.m3u8(\?|#|$)/i.test(videoUrl);
  const ext = isHls ? 'm3u8' : 'mp4';
  const variant: MediaStreamVariant = {
    id: 'og-stream',
    label: isHls ? 'HLS Stream' : 'Direct MP4',
    ext,
    url: videoUrl,
    proxyUrl: buildProxyUrl(videoUrl),
    downloadUrl: buildDownloadUrl(videoUrl, title, ext, url),
    qualityHeight: null,
    hasAudio: true,
    hasVideo: true,
    filesizeBytes: null,
    mimeType: isHls ? 'application/vnd.apple.mpegurl' : 'video/mp4',
    isHls,
  };

  return {
    ok: true,
    engine: 'cloud-extractor',
    safety: updatedSafety,
    title,
    author: safety.hostname,
    durationSeconds: null,
    thumbnailUrl: thumb,
    streams: [variant],
    preferredStreamUrl: variant.proxyUrl,
    privacyEmbedUrl: null,
    offlineCapable: !isHls,
    offlineNote: isHls
      ? 'Clean HLS stream extracted without page ad scripts.'
      : 'Direct MP4 stream extracted without page scripts; ready for Mountain Vault offline storage.',
    ytdlpAvailable: await isYtdlpAvailable(),
  };
}

export async function resolveVideoSource(rawUrl: string): Promise<ResolvedMedia> {
  const safety = await inspectAndUnwrapUrl(rawUrl);

  if (safety.verdict === 'BLOCKED' || !safety.sanitizedUrl) {
    return {
      ok: false,
      engine: 'blocked',
      safety,
      title: 'Blocked Destination',
      author: safety.hostname || 'Untrusted Host',
      durationSeconds: null,
      thumbnailUrl: null,
      streams: [],
      preferredStreamUrl: null,
      privacyEmbedUrl: null,
      offlineCapable: false,
      offlineNote: 'Blocked before any remote media stream was requested.',
      ytdlpAvailable: await isYtdlpAvailable(),
    };
  }

  const cleanUrl = safety.sanitizedUrl;

  // 1. Direct video file / HLS stream check
  if (safety.sourceType === 'direct') {
    const direct = await resolveDirectMedia(cleanUrl, safety);
    if (direct) return direct;
  }

  // 2. Local yt-dlp engine (1,000+ platforms including YouTube, X, Instagram, TikTok, Vimeo)
  if (await isYtdlpAvailable()) {
    const ytdlpResult = await resolveWithLocalYtdlp(cleanUrl, safety);
    if (ytdlpResult) return ytdlpResult;
  }

  // 3. Optional remote companion yt-dlp worker (for cloud deployments)
  const workerUrl = process.env.PINEREEL_YTDLP_WORKER_URL;
  if (workerUrl) {
    try {
      const res = await fetch(`${workerUrl.replace(/\/$/, '')}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.PINEREEL_YTDLP_WORKER_TOKEN
            ? { Authorization: `Bearer ${process.env.PINEREEL_YTDLP_WORKER_TOKEN}` }
            : {}),
        },
        body: JSON.stringify({ url: cleanUrl }),
      });
      if (res.ok) {
        const data = (await res.json()) as ResolvedMedia;
        if (data?.ok) return { ...data, engine: 'worker-ytdlp' };
      }
    } catch {
      // Fall through cleanly to built-in cloud extractors.
    }
  }

  // 4. Built-in serverless pure-TS extractors
  if (safety.sourceType === 'archive') {
    const arch = await resolveArchiveOrg(cleanUrl, safety);
    if (arch) return arch;
  }
  if (safety.sourceType === 'youtube') {
    const yt = await resolveYouTubeCloud(cleanUrl, safety);
    if (yt) return yt;
  }
  if (safety.sourceType === 'x') {
    const tw = await resolveXCloud(cleanUrl, safety);
    if (tw) return tw;
  }
  if (safety.sourceType === 'vimeo') {
    const vm = await resolveVimeoCloud(cleanUrl, safety);
    if (vm) return vm;
  }

  // 5. Fallback: check direct content-type or OpenGraph video tags (e.g. Instagram / independent hosts)
  const directProbe = await resolveDirectMedia(cleanUrl, safety);
  if (directProbe) return directProbe;

  const ogProbe = await resolveOpenGraphMedia(cleanUrl, safety, safety.sourceType);
  if (ogProbe) return ogProbe;

  return {
    ok: false,
    engine: 'cloud-extractor',
    safety,
    title: 'No Public Stream Detected',
    author: safety.hostname,
    durationSeconds: null,
    thumbnailUrl: null,
    streams: [],
    preferredStreamUrl: null,
    privacyEmbedUrl: null,
    offlineCapable: false,
    offlineNote:
      'This URL passed safety screening, but the origin requires authentication or a local yt-dlp runtime to extract a playable video stream.',
    ytdlpAvailable: await isYtdlpAvailable(),
  };
}

