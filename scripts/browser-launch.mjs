import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const SWIFTSHADER_ARGS = [
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
];

export function resolveInstalledChromiumPath() {
  const localApp = process.env.LOCALAPPDATA;
  if (localApp) {
    const pwDir = path.join(localApp, 'ms-playwright');
    if (fs.existsSync(pwDir)) {
      const dirs = fs
        .readdirSync(pwDir)
        .filter((d) => d.startsWith('chromium-'))
        .sort()
        .reverse();
      for (const dir of dirs) {
        const win64 = path.join(pwDir, dir, 'chrome-win64', 'chrome.exe');
        if (fs.existsSync(win64)) return win64;
        const win = path.join(pwDir, dir, 'chrome-win', 'chrome.exe');
        if (fs.existsSync(win)) return win;
      }
    }
  }
  const sysChrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (fs.existsSync(sysChrome)) return sysChrome;
  return undefined;
}

export async function launchAuditBrowser() {
  const executablePath = resolveInstalledChromiumPath();
  return chromium.launch({
    ...(executablePath ? { executablePath } : {}),
    args: SWIFTSHADER_ARGS,
  });
}

