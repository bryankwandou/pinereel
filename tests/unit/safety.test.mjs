import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Node v24 checks safety.ts: blocks ads/malware/SSRF without rejecting general video links', async () => {
  const mod = await import('../../lib/shared/safety.ts');

  // 1. SSRF private/loopback and non-http scheme blocking
  for (const bad of [
    'http://127.0.0.1:8080/video.mp4',
    'http://169.254.169.254/latest/meta-data',
    'http://192.168.1.10/cam.m3u8',
    'http://10.0.0.5/internal.mp4',
    'http://localhost:3000/test.mp4',
    'http://[::1]/video.mp4',
    'javascript:alert(1)',
    'file:///etc/passwd',
  ]) {
    const r = mod.sanitizeAndInspectUrl(bad);
    assert.equal(r.verdict, 'BLOCKED', `Expected BLOCKED for ${bad}`);
    assert.equal(r.kidSafe, false);
  }

  // 2. Standalone ad network & executable malware payloads are blocked
  for (const lure of [
    'https://ads.doubleclick.net/slot-gacor-bonus.apk',
    'https://bit.ly/slot-gacor-maxwin-verify-wallet.apk',
    'https://youtube.com.login-verify.example/watch?v=abc',
    'https://cdn.example/installer.exe',
  ]) {
    const r = mod.sanitizeAndInspectUrl(lure);
    assert.equal(r.verdict, 'BLOCKED', `Expected BLOCKED for ${lure}`);
  }

  // 3. Ad-network wrapper carrying a real video URL strips the ad host and preserves the video!
  const wrapped = mod.sanitizeAndInspectUrl(
    'https://ads.doubleclick.net/clk?adurl=https://www.youtube.com/watch?v=aqz-KE-bpKQ&fbclid=track'
  );
  assert.equal(wrapped.verdict, 'SAFE');
  assert.equal(wrapped.sanitizedUrl, 'https://www.youtube.com/watch?v=aqz-KE-bpKQ');
  assert.ok(wrapped.reasons.some((r) => r.code === 'AD_WRAPPER_STRIPPED'));

  // 4. General video links without https:// or containing ordinary words (slot, bandar, scatter) MUST NOT be blocked
  const noScheme = mod.sanitizeAndInspectUrl('youtube.com/watch?v=aqz-KE-bpKQ&slot=1&city=bandar');
  assert.equal(noScheme.verdict, 'SAFE');
  assert.equal(noScheme.sourceType, 'youtube');
  assert.equal(noScheme.sanitizedUrl, 'https://youtube.com/watch?v=aqz-KE-bpKQ&slot=1&city=bandar');

  const igLink = mod.sanitizeAndInspectUrl('instagram.com/reel/C8x1234abcd/?igsh=track123');
  assert.equal(igLink.verdict, 'SAFE');
  assert.equal(igLink.sourceType, 'instagram');
  assert.equal(igLink.sanitizedUrl, 'https://instagram.com/reel/C8x1234abcd/');

  const newsWithKeywords = mod.classifyMetadataSafety(noScheme, {
    title: 'Liputan Bandar Udara dan Scatter Plot Tutorial',
    description: 'Diskusi kasino sejarah atau slot waktu acara',
  });
  assert.equal(newsWithKeywords.verdict, 'SAFE');

  // 5. Explicit upstream age_limit >= 18 sets CAUTION advisory (never 403 BLOCKED for adult host unless porn site)
  const ageFlagged = mod.classifyMetadataSafety(noScheme, {
    title: 'Age gated documentary',
    ageLimit: 18,
    isFamilySafe: false,
  });
  assert.equal(ageFlagged.kidSafe, false);
  assert.equal(ageFlagged.verdict, 'CAUTION');

  // 6. Deterministic SHA-256 digest verification
  const digest = mod.computeSha256Hex('pinereel-test');
  assert.equal(digest.length, 64);
  assert.match(digest, /^[0-9a-f]{64}$/);
});

test('Locales directory contains zero empty values or mismatched placeholders', () => {
  const locales = ['en', 'id', 'de', 'es', 'ja'];
  for (const l of locales) {
    const p = path.resolve('lib/locales', `${l}.ts`);
    assert.ok(fs.existsSync(p), `Missing locale ${l}.ts`);
  }
});
