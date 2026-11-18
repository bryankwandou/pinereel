import fs from 'node:fs';
import path from 'node:path';
import { launchAuditBrowser } from './browser-launch.mjs';

const BASE = process.env.BASE ?? 'http://localhost:3000';
const OUT = path.resolve('audit-out');
const ROUTES = (process.env.ROUTES ?? '/,/watch,/vault,/ledger,/deck').split(',');
const THEMES = ['light', 'dark'];
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];
const IGNORE_CONSOLE = [
  /Download the React DevTools/,
  /WalletNotReadyError/,
  /Failed to load resource.*favicon/,
];

fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });

function auditInPage() {
  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const ch = (v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const lum = (c) => 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b);
  const ratio = (a, b) => {
    const x = lum(a);
    const y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  const blend = (top, under) => ({
    r: top.r * top.a + under.r * (1 - top.a),
    g: top.g * top.a + under.g * (1 - top.a),
    b: top.b * top.a + under.b * (1 - top.a),
    a: 1,
  });

  const resolveBg = (el) => {
    const layers = [];
    let uncertain = false;
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') uncertain = true;
      if (cs.backdropFilter && cs.backdropFilter !== 'none') uncertain = true;
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) {
        layers.push(c);
        if (c.a >= 1) break;
      }
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) base = blend(layers[i], base);
    return { bg: base, uncertain };
  };

  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    let o = 1;
    for (let n = el; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
    return o > 0.05;
  };

  const describe = (el) => {
    const id = el.id ? `#${el.id}` : '';
    const cls =
      typeof el.className === 'string' && el.className.trim()
        ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
        : '';
    return `${el.tagName.toLowerCase()}${id}${cls}`;
  };

  const contrast = [];
  const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let t = walker.nextNode(); t; t = walker.nextNode()) {
    const text = t.textContent?.trim();
    if (!text) continue;
    const el = t.parentElement;
    if (
      !el ||
      seen.has(el) ||
      el.closest('[aria-hidden="true"], script, style, noscript, .sr-only, :disabled, [aria-disabled="true"]')
    ) {
      continue;
    }
    seen.add(el);
    if (!visible(el)) continue;
    const cs = getComputedStyle(el);
    const fg = parse(cs.color);
    if (!fg) continue;
    const { bg, uncertain } = resolveBg(el);
    const fgFlat = blend(fg, bg);
    const size = parseFloat(cs.fontSize);
    const bold = Number(cs.fontWeight) >= 700;
    const large = size >= 24 || (bold && size >= 18.66);
    const need = large ? 3 : 4.5;
    const r = ratio(fgFlat, bg);
    if (r < need) {
      contrast.push({
        el: describe(el),
        text: text.slice(0, 60),
        ratio: Number(r.toFixed(2)),
        need,
        color: cs.color,
        bg: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
        uncertain,
      });
    }
  }

  const slabs = [];
  const vw = window.innerWidth;
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width < vw * 0.5 || r.height < 120) continue;
    const c = parse(getComputedStyle(el).backgroundColor);
    if (!c || c.a < 0.9) continue;
    if (lum(c) < 0.08 && !el.closest('[data-allow-dark]')) {
      slabs.push({
        el: describe(el),
        bg: getComputedStyle(el).backgroundColor,
        w: Math.round(r.width),
        h: Math.round(r.height),
      });
    }
  }

  const overflowX = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  return { contrast, slabs, overflowX };
}

const browser = await launchAuditBrowser();

const report = [];
let hardFailures = 0;

for (const vp of VIEWPORTS) {
  for (const theme of THEMES) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      colorScheme: theme,
      reducedMotion: 'reduce',
    });
    await context.addInitScript((t) => {
      window.__audit = true;
      try {
        localStorage.setItem('pinereel.theme', t);
      } catch {}
    }, theme);

    for (const route of ROUTES) {
      const page = await context.newPage();
      const errors = [];
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
      });
      page.on('response', (res) => {
        if (res.status() >= 400 && !res.url().includes('favicon')) {
          errors.push(`HTTP ${res.status()} ${res.url()}`);
        }
      });
      page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
      const entry = { route, theme, viewport: vp.name };

      try {
        const res = await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 45_000 });
        entry.status = res?.status();
        await page.locator('main').waitFor();
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(1000);
        Object.assign(entry, await page.evaluate(auditInPage));

        const slug = `${vp.name}-${theme}-${route.replace(/\W+/g, '_') || 'root'}`;
        await page
          .screenshot({
            path: path.join(OUT, 'shots', `${slug}.png`),
            fullPage: true,
            timeout: 30_000,
            animations: 'disabled',
          })
          .catch((e) => {
            entry.screenshotError = e.message;
          });
      } catch (e) {
        entry.fatal = e instanceof Error ? e.message : String(e);
      }

      entry.consoleErrors = errors.filter((t) => !IGNORE_CONSOLE.some((r) => r.test(t)));
      const certain = (entry.contrast ?? []).filter((c) => !c.uncertain);
      const slabFail = theme === 'light' ? entry.slabs ?? [] : [];
      const fail =
        entry.fatal ||
        (entry.status ?? 200) >= 400 ||
        certain.length > 0 ||
        slabFail.length > 0 ||
        entry.consoleErrors.length > 0 ||
        (entry.overflowX ?? 0) > 1;

      if (fail) hardFailures++;
      entry.pass = !fail;
      report.push(entry);
      console.log(
        `${fail ? 'FAIL' : 'ok  '} ${vp.name.padEnd(7)} ${theme.padEnd(5)} ${route.padEnd(10)} contrast=${certain.length}(+${(entry.contrast ?? []).length - certain.length}?) slabs=${slabFail.length} overflowX=${entry.overflowX ?? '-'} console=${entry.consoleErrors.length}`
      );
      await page.close();
    }
    await context.close();
  }
}

await browser.close();
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
console.log(`\n${report.length} audit runs, ${hardFailures} failing. Report: ${path.join(OUT, 'report.json')}`);
process.exit(hardFailures ? 1 : 0);

