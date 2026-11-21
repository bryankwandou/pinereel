import { NextRequest } from 'next/server';
import { sanitizeAndInspectUrl } from '@/lib/shared/safety';
import { assertSafeRemoteUrl } from '@/lib/server/redirect-inspector';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AD_SCRIPT_OR_FRAME_RE =
  /<(script|iframe)\b[^>]*\bsrc=["'][^"']*(?:doubleclick\.net|googlesyndication\.com|googleadservices\.com|adservice\.google\.com|popads\.net|popcash\.net|propellerads\.com|exoclick\.com|adsterra\.com|juicyads\.com|taboola\.com|outbrain\.com|adnxs\.com|trafficjunky\.net|clickadu\.com)[^"']*["'][^>]*>[\s\S]*?<\/\1>/gi;

const INLINE_POPUP_AD_RE =
  /<script\b[^>]*>[\s\S]*?(?:popunder|popads|adsterra|propellerads|exoclick|clickadu)[\s\S]*?<\/script>/gi;

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get('url');
  if (!rawUrl || rawUrl.length > 2048) {
    return Response.json({ error: 'Missing or invalid target url' }, { status: 400 });
  }

  const safety = sanitizeAndInspectUrl(rawUrl);
  if (safety.verdict === 'BLOCKED' || !safety.sanitizedUrl) {
    return Response.json(
      { error: 'Target blocked by PineReel ad and malware shield.', safety },
      { status: 403 }
    );
  }

  let parsed: URL;
  try {
    parsed = await assertSafeRemoteUrl(safety.sanitizedUrl);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Blocked host' },
      { status: 403 }
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const upstream = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timer);

    const ct = (upstream.headers.get('content-type') || 'text/html').toLowerCase();
    if (!ct.includes('text/html') && !ct.includes('application/xhtml')) {
      return Response.redirect(parsed.toString(), 302);
    }

    const rawHtml = await upstream.text();
    const baseHref = `${parsed.origin}${parsed.pathname.replace(/[^/]*$/, '')}`;
    const baseTag = `<base href="${baseHref}" /><meta name="referrer" content="no-referrer" />`;

    let cleaned = rawHtml
      .replace(AD_SCRIPT_OR_FRAME_RE, '<!-- [PineReel: stripped ad network element] -->')
      .replace(INLINE_POPUP_AD_RE, '<!-- [PineReel: stripped inline popup script] -->');

    if (/<head[^>]*>/i.test(cleaned)) {
      cleaned = cleaned.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`);
    } else {
      cleaned = `${baseTag}${cleaned}`;
    }

    return new Response(cleaned, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-PineReel-Ad-Shield': 'active',
      },
    });
  } catch {
    clearTimeout(timer);
    return new Response(
      `<!doctype html><html><head><meta charset="utf-8"><title>PineReel Clean Fallback</title></head><body style="margin:0;background:#0b0f0e;color:#f2f1ec;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;text-align:center"><div><p style="font-size:15px;font-weight:600;margin:0 0 8px">Direct source ready</p><p style="font-size:13px;color:#c5ccc8;margin:0 0 16px">Open the verified clean destination directly in a new tab:</p><a href="${parsed.toString()}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:10px 18px;border-radius:6px;background:#33c288;color:#08140f;font-weight:600;text-decoration:none">Open ${parsed.hostname}</a></div></body></html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }
}

