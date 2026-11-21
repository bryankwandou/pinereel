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

  const isSocialWallHost =
    /linkedin\.com|lnkd\.in|facebook\.com|fb\.watch|threads\.net|threads\.com|quora\.com|medium\.com/i.test(
      parsed.hostname
    );

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9500);
  try {
    let upstream = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': isSocialWallHost
          ? 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
          : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
      },
    });

    if (
      !upstream.ok ||
      upstream.status === 999 ||
      upstream.url.includes('/login') ||
      upstream.url.includes('/authwall')
    ) {
      upstream = await fetch(parsed.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
    }
    clearTimeout(timer);

    const ct = (upstream.headers.get('content-type') || 'text/html').toLowerCase();
    if (!ct.includes('text/html') && !ct.includes('application/xhtml')) {
      return Response.redirect(parsed.toString(), 302);
    }

    const rawHtml = await upstream.text();
    const baseHref = `${parsed.origin}${parsed.pathname.replace(/[^/]*$/, '')}`;
    const shieldInjection = `<base href="${baseHref}" /><meta name="referrer" content="no-referrer" /><style>
      html, body { overflow: auto !important; position: static !important; height: auto !important; }
      [class*="authwall"], [class*="login-modal"], [id*="authwall"], .contextual-sign-in-modal,
      [class*="paywall"], [id*="popads"], [class*="ad-banner"], [class*="popup-overlay"] {
        display: none !important; opacity: 0 !important; pointer-events: none !important;
      }
    </style>`;

    let cleaned = rawHtml
      .replace(AD_SCRIPT_OR_FRAME_RE, '<!-- [PineReel: stripped ad network element] -->')
      .replace(INLINE_POPUP_AD_RE, '<!-- [PineReel: stripped inline popup script] -->');

    if (/<head[^>]*>/i.test(cleaned)) {
      cleaned = cleaned.replace(/<head([^>]*)>/i, `<head$1>${shieldInjection}`);
    } else {
      cleaned = `${shieldInjection}${cleaned}`;
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
      `<!doctype html><html><head><meta charset="utf-8"><title>PineReel Clean Reader</title></head><body style="margin:0;background:#0b0f0e;color:#f2f1ec;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;text-align:center"><div><p style="font-size:16px;font-weight:600;margin:0 0 8px">${parsed.hostname} — Clean Ad-Free Access</p><p style="font-size:13px;color:#c5ccc8;margin:0 0 16px">Ad trackers and popups stripped. Click below to open the clean destination:</p><a href="${parsed.toString()}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:10px 18px;border-radius:6px;background:#33c288;color:#08140f;font-weight:600;text-decoration:none">Open ${parsed.hostname}</a></div></body></html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }
}
