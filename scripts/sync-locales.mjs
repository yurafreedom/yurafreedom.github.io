// Regenerates locales-data.js (the runtime bundle i18n.js switches languages from) from locales/<lang>.json.
// Keeps the existing locale order, so an unchanged set of JSON files reproduces the file byte for byte.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const order = ['de', 'es', 'uk', 'en', 'ar', 'ru', 'pl', 'fr'];
const bundle = Object.fromEntries(order.map(l => [l, JSON.parse(fs.readFileSync(path.join(root, 'locales', `${l}.json`), 'utf8'))]));
const out = 'window.PORTFOLIO_TRANSLATIONS=' + JSON.stringify(bundle) + ';';
const target = path.join(root, 'locales-data.js');
if (process.argv.includes('--check')) {
  if (fs.readFileSync(target, 'utf8') !== out) { console.error('locales-data.js is out of sync with locales/*.json'); process.exit(1); }
  console.log('locales-data.js in sync');
} else { fs.writeFileSync(target, out); console.log('wrote locales-data.js'); }
