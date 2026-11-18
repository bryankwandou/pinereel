import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { launchAuditBrowser } from './browser-launch.mjs';

const BASE = process.env.BASE ?? 'http://localhost:3000';
const TMP_DIR = path.resolve('tmp-recordings');
fs.mkdirSync(TMP_DIR, { recursive: true });

const browser = await launchAuditBrowser();

const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  colorScheme: 'light',
  recordVideo: { dir: TMP_DIR, size: { width: 1920, height: 1080 } },
});

await context.addInitScript(() => {
  try {
    localStorage.setItem('pinereel.theme', 'light');
    localStorage.setItem('pinereel.locale', 'en');
  } catch {}
});

const page = await context.newPage();
page.on('console', (m) => {
  if (m.type() === 'error') console.error('[demo page]', m.text());
});
page.on('pageerror', (e) => console.error('[demo pageerror]', e.message));

await page.goto(`${BASE}/demo-record`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
await page.waitForFunction(() => window.__demoDone === true, null, {
  timeout: 180_000,
  polling: 400,
});
await page.waitForTimeout(1400);

const video = page.video();
await context.close();
await browser.close();

if (!video) {
  throw new Error('Playwright failed to produce a recorded video file.');
}

const rawWebm = await video.path();
const outMp4 = path.resolve('public/walkthrough.mp4');
const outPoster = path.resolve('public/walkthrough-poster.jpg');

execFileSync(
  'ffmpeg',
  [
    '-y',
    '-ss',
    '1.0',
    '-i',
    rawWebm,
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    '20',
    '-pix_fmt',
    'yuv420p',
    '-r',
    '30',
    '-movflags',
    '+faststart',
    '-an',
    outMp4,
  ],
  { stdio: 'inherit' }
);

execFileSync(
  'ffmpeg',
  ['-y', '-ss', '9.0', '-i', outMp4, '-frames:v', '1', '-q:v', '3', outPoster],
  { stdio: 'inherit' }
);

fs.rmSync(TMP_DIR, { recursive: true, force: true });
console.log('Generated walkthrough:', outMp4, 'and poster:', outPoster);

