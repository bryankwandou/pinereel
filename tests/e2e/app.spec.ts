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

  test('resolves YouTube URL cleanly, strips trackers, and blocks gambling APK lure', async ({ request }) => {
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

    const badRes = await request.post('/api/resolve', {
      data: {
        url: 'https://bit.ly/slot-gacor-maxwin-verify-wallet.apk',
      },
    });
    expect(badRes.status()).toBe(403);
    const badBody = await badRes.json();
    expect(badBody.safety.verdict).toBe('BLOCKED');
  });

  test('caches direct MP4 into Offline Mountain Vault and switches languages cleanly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);

    // Verify language switcher sits above hero content and updates <html lang>
    await page.getByRole('button', { name: /Language/i }).click();
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
      timeout: 30_000,
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

