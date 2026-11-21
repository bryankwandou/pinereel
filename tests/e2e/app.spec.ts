import { expect, test } from '@playwright/test';

test.describe('PineReel Core E2E', () => {
  test('renders hero and primary CTA without JavaScript', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open Offline Vault' }).first()).toBeVisible();
    await ctx.close();
  });

  test('allows general video links across platforms while blocking ads and malware lures', async ({ request }) => {
    const safeRes = await request.post('/api/resolve', {
      data: {
        url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ&utm_source=test&fbclid=stripme',
      },
    });
    expect(safeRes.status()).toBe(200);
    const safeBody = await safeRes.json();
    expect(safeBody.ok).toBe(true);
    expect(safeBody.safety.verdict).toBe('SAFE');
    expect(safeBody.safety.sanitizedUrl).toBe('https://www.youtube.com/watch?v=aqz-KE-bpKQ');
    expect(safeBody.safety.strippedParams).toContain('fbclid');

    // General video URL without https:// and containing common query terms must NOT be rejected
    const noSchemeRes = await request.post('/api/resolve', {
      data: { url: 'youtube.com/watch?v=aqz-KE-bpKQ&slot=1' },
    });
    expect(noSchemeRes.status()).toBe(200);
    const noSchemeBody = await noSchemeRes.json();
    expect(noSchemeBody.ok).toBe(true);
    expect(noSchemeBody.safety.verdict).toBe('SAFE');

    // Ad wrapper around video URL strips ad server and keeps clean video
    const adWrapRes = await request.post('/api/resolve', {
      data: { url: 'https://ads.doubleclick.net/clk?adurl=https://www.youtube.com/watch?v=aqz-KE-bpKQ' },
    });
    expect(adWrapRes.status()).toBe(200);
    const adWrapBody = await adWrapRes.json();
    expect(adWrapBody.ok).toBe(true);
    expect(adWrapBody.safety.verdict).toBe('SAFE');

    // Social outlink wrapper unwraps directly to target video
    const igOutlinkRes = await request.post('/api/resolve', {
      data: { url: 'https://l.instagram.com/?u=https%3A%2F%2Fyoutu.be%2Faqz-KE-bpKQ' },
    });
    expect(igOutlinkRes.status()).toBe(200);
    const igOutlinkBody = await igOutlinkRes.json();
    expect(igOutlinkBody.ok).toBe(true);
    expect(igOutlinkBody.safety.verdict).toBe('SAFE');

    // Public HTTP educational path (even containing sensitive discussion words) is never false-blocked
    const eduRes = await request.post('/api/resolve', {
      data: { url: 'http://media.example.org/videos/stop-judol-edukasi.mp4' },
    });
    expect(eduRes.status()).toBe(200);
    const eduBody = await eduRes.json();
    expect(eduBody.safety.verdict).toBe('SAFE');
    expect(eduBody.safety.kidSafe).toBe(true);

    // General web streaming apps (e.g. Sonacast on Vercel) resolve with ok: true and sandboxed embed URL
    const sonaRes = await request.post('/api/resolve', {
      data: { url: 'https://sonacast-ten.vercel.app/favorites' },
    });
    expect(sonaRes.status()).toBe(200);
    const sonaBody = await sonaRes.json();
    expect(sonaBody.ok).toBe(true);
    expect(sonaBody.safety.verdict).toBe('SAFE');
    expect(sonaBody.safety.score).toBe(100);
    expect(sonaBody.privacyEmbedUrl).toBe('https://sonacast-ten.vercel.app/favorites');

    // Bing Videos search URL unwraps to ad-free direct stream or isolated player (bypassing Bing/Shopee pre-roll ads)
    const bingRes = await request.post('/api/resolve', {
      data: { url: 'https://www.bing.com/videos/search?q=eh+hijau' },
    });
    expect(bingRes.status()).toBe(200);
    const bingBody = await bingRes.json();
    expect(bingBody.ok).toBe(true);
    expect(bingBody.safety.verdict).toBe('SAFE');
    expect(Boolean(bingBody.preferredStreamUrl || bingBody.privacyEmbedUrl)).toBe(true);
    expect(bingBody.privacyEmbedUrl || '').not.toContain('bing.com');

    // TikTok direct MP4 extraction
    const ttRes = await request.post('/api/resolve', {
      data: { url: 'https://www.tiktok.com/@scout2015/video/6718335390845095173' },
    });
    expect(ttRes.status()).toBe(200);
    const ttBody = await ttRes.json();
    expect(ttBody.ok).toBe(true);
    expect(ttBody.safety.verdict).toBe('SAFE');

    // Instagram Reel resolution
    const igRes = await request.post('/api/resolve', {
      data: { url: 'https://www.instagram.com/reel/C8x1234abcd/?igsh=track' },
    });
    expect(igRes.status()).toBe(200);
    const igBody = await igRes.json();
    expect(igBody.ok).toBe(true);
    expect(igBody.safety.verdict).toBe('SAFE');

    // Standalone ad malware APK remains blocked
    const badRes = await request.post('/api/resolve', {
      data: {
        url: 'https://ads.doubleclick.net/slot-gacor-bonus.apk',
      },
    });
    expect(badRes.status()).toBe(403);
    const badBody = await badRes.json();
    expect(badBody.safety.verdict).toBe('BLOCKED');
  });

  test('caches direct MP4 into Offline Mountain Vault and switches languages cleanly', async ({ page }) => {
    test.setTimeout(150_000);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('header[data-hydrated="true"]')).toBeVisible({ timeout: 20_000 });

    // Verify language switcher sits above hero content and updates <html lang>
    const langBtn = page.getByRole('button', { name: /Language/i });
    await langBtn.click();
    await expect(langBtn).toHaveAttribute('aria-expanded', 'true');
    const jaItem = page.getByRole('radio', { name: /日本語/ });
    const box = await jaItem.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      const hitText = await page.evaluate(
        ([x, y]) => document.elementFromPoint(x, y)?.closest('[role="radio"]')?.textContent,
        [box.x + box.width / 2, box.y + box.height / 2]
      );
      expect(hitText).toContain('日本語');
    }
    await jaItem.click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ja');

    // Switch back to English and test inspecting + saving direct MP4 into Vault
    await page.getByRole('button', { name: /言語/ }).click();
    await page.getByRole('radio', { name: /English/ }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await page.getByRole('button', { name: /Nature Short \(Direct MP4\)/i }).click();
    await expect(page.getByText(/Verified Safe/i)).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /Save to Offline Vault/i }).click();
    await expect(page.getByRole('button', { name: /Saved in Offline Vault/i })).toBeVisible({
      timeout: 110_000,
    });

    await page.goto('/vault', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/flower|Direct Video Stream/i)).toBeVisible({
      timeout: 10_000,
    });
    await page.getByRole('button', { name: /Verify SHA-256/i }).first().click();
    await expect(page.getByText(/Integrity verified/i)).toBeVisible();
  });

  test('loads live Solana Devnet ledger RPC telemetry', async ({ page }) => {
    await page.goto('/ledger', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /On-Chain Safety Ledger/i })).toBeVisible();
    await expect(page.getByText(/Confirmed slot/i)).toBeVisible();
  });
});

