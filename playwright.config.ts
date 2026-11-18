import { defineConfig } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

function findLocalChrome() {
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
        const exe = path.join(pwDir, dir, 'chrome-win64', 'chrome.exe');
        if (fs.existsSync(exe)) return exe;
      }
    }
  }
  const sysChrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (fs.existsSync(sysChrome)) return sysChrome;
  return undefined;
}

const executablePath = findLocalChrome();

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  use: {
    baseURL: process.env.BASE || 'http://localhost:3000',
    launchOptions: {
      ...(executablePath ? { executablePath } : {}),
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
    },
  },
  webServer: process.env.BASE
    ? undefined
    : {
        command: 'npm run start',
        url: 'http://localhost:3000/api/health',
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
