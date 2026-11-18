import fs from 'node:fs';
import path from 'node:path';

const DIR = path.resolve('lib/locales');
const LOCALES = ['en', 'id', 'de', 'es', 'ja'];
const ALLOW_IDENTICAL = new Set(['brand.name', 'badge.devnet', 'nav.menu']);

function parseLocaleFile(locale) {
  const src = fs.readFileSync(path.join(DIR, `${locale}.ts`), 'utf8');
  const map = new Map();
  const dupes = [];
  const singleLineRe = /^\s*'([^']+)'\s*:\s*(['"`])((?:\\.|(?!\2).)*)\2\s*,?\s*$/gm;
  for (const m of src.matchAll(singleLineRe)) {
    if (map.has(m[1])) dupes.push(m[1]);
    map.set(m[1], m[3]);
  }
  // Also catch multiline values where key ends with `:` and string is on next line
  const multiLineRe = /^\s*'([^']+)'\s*:\s*\r?\n\s*(['"`])((?:\\.|(?!\2).)*)\2\s*,?/gm;
  for (const m of src.matchAll(multiLineRe)) {
    if (!map.has(m[1])) {
      map.set(m[1], m[3]);
    }
  }
  return { map, dupes };
}

const getPlaceholders = (s) =>
  [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

const base = parseLocaleFile('en').map;
let errors = 0;
let warnings = 0;

for (const loc of LOCALES.filter((l) => l !== 'en')) {
  const { map, dupes } = parseLocaleFile(loc);
  for (const k of dupes) {
    errors++;
    console.error(`ERROR ${loc}: duplicate key ${k}`);
  }
  for (const [key, enVal] of base) {
    if (!map.has(key)) {
      errors++;
      console.error(`ERROR ${loc}: missing key ${key}`);
      continue;
    }
    const val = map.get(key);
    if (!val.trim()) {
      errors++;
      console.error(`ERROR ${loc}: empty value for ${key}`);
    }
    if (getPlaceholders(val) !== getPlaceholders(enVal)) {
      errors++;
      console.error(
        `ERROR ${loc}: placeholder mismatch in ${key} (en={${getPlaceholders(enVal)}}, ${loc}={${getPlaceholders(val)}})`
      );
    }
    if (val === enVal && enVal.length > 3 && !ALLOW_IDENTICAL.has(key)) {
      warnings++;
      console.warn(`WARN  ${loc}: ${key} identical to English`);
    }
  }
  for (const key of map.keys()) {
    if (!base.has(key)) {
      errors++;
      console.error(`ERROR ${loc}: extra unknown key ${key}`);
    }
  }
}

console.log(`Locale parity check (${base.size} keys x ${LOCALES.length} locales): ${errors} error(s), ${warnings} warning(s)`);
process.exit(errors ? 1 : 0);

