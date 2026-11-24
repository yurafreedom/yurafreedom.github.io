// Typography for locales/ru.json and locales/uk.json, without rewording. Idempotent; run it after editing those files:
//   node scripts/typograph-locales.mjs && node scripts/sync-locales.mjs
// U+00A0 after short prepositions/conjunctions, before a dash and between a number and its unit;
// spaced em dash, «ёлочки», one-character ellipsis. U+00A0 is the only non-breaking space used:
// Oswald, Golos Text and JetBrains Mono lack U+2011, U+202F, U+200A and U+2010.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SHORT = {
  ru: ['в','к','с','у','о','и','а','во','ко','со','об','от','до','на','за','из','по','не','ни','но','да'],
  uk: ['в','у','з','і','й','та','а','до','на','за','по','від','про','без'],
};
const NB = ' ';
const UNITS = 'px|мс|с|мин|ч|кб|мб|гб|тб|%|₽|₴|\\$|€|грн|руб|млн|млрд|тыс|тис|км|м|см|мм|кг|г|шт';
export function typographText(text, lang) {
  let t = text;
  t = t.replace(/\.\.\./g, '…');
  t = t.replace(/(^|\s)[-–](?=\s)/g, '$1—');                       // spaced hyphen / en dash → em dash
  t = t.replace(/ +—/g, NB + '—');                                   // no break before a dash
  t = t.replace(/(^|[\s(\[>])"(?=\S)/g, '$1«').replace(/(\S)"/g, '$1»'); // straight quotes → «ёлочки»
  t = t.replace(/[“„]/g, '«').replace(/”/g, '»');
  t = t.replace(new RegExp(`(\\d) (?=(?:${UNITS})(?![\\p{L}]))`, 'giu'), '$1' + NB);
  const words = SHORT[lang].join('|');
  const re = new RegExp(`(^|[\\s(«${NB}])(${words}) (?=\\S)`, 'giu');
  let prev;
  do { prev = t; t = t.replace(re, `$1$2${NB}`); } while (t !== prev); // "и в" → both bound
  return t;
}
// Apply to text between tags only, so attribute values and markup stay untouched.
export function typographValue(value, lang) {
  if (Array.isArray(value)) return value.map(v => typographValue(v, lang));
  return value.split(/(<[^>]*>)/).map(part => part.startsWith('<') ? part : typographText(part, lang)).join('');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const lang of ['ru', 'uk']) {
    const file = path.join(root, 'locales', `${lang}.json`);
    const dict = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const key of Object.keys(dict)) dict[key] = typographValue(dict[key], lang);
    fs.writeFileSync(file, JSON.stringify(dict, null, 2) + '\n');
    console.log(`typographed ${file}`);
  }
}
