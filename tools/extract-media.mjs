/**
 * Pull the pictures out of the single-file build and into real files.
 *
 * `build/the-raven.html` carries 139 WebP images as base64 data URIs —
 * 4 MB of art welded into a 6 MB script. That is what made the reader a
 * single file you could email to a school, and it is also why the book
 * cannot be loaded as a pack: the engine wants files it can serve, and a
 * bundler wants a book.json that is text.
 *
 * So this decodes every one of them into `pack/art/`, named by the key
 * the build itself used. Named, not numbered: `art/plate-s9.webp` still
 * says which scene it is a year from now, and a hash or an index does
 * not. The five places the build keeps art:
 *
 *   PLATES[key]           the scene plate            -> art/plate-<key>.webp
 *   BEATART[unit][i]      the per-line plate         -> art/beat-<unit>-<i>.webp
 *   CAST_ART[id]          the Professor's portrait   -> art/cast-<id>.webp
 *   WREN_ART              Wren's portrait, a bare
 *                         string rather than a
 *                         CAST_ART entry             -> art/cast-wren.webp
 *   RAVEN_SIT / RAVEN_FLY the bird sprites for the
 *                         cue layer                  -> art/sprite-raven-<x>.webp
 *
 * It also writes `pack/book.json`: the extracted book with those data
 * URIs taken out, because where a file sits is not part of the poem.
 * The map from key to file lives in `pack/index.js` — see the comment
 * there for why.
 *
 * `build/the-raven.html` is never written to. It is the record of what
 * shipped, and the reason this repository can still be checked.
 *
 * Re-runnable: a file whose bytes already match is left alone, so a
 * second run reports "unchanged" for all 139 and touches nothing.
 *
 *   node tools/extract-media.mjs
 *   node tools/extract-media.mjs --prune    also delete art that this
 *                                           run did not produce
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const buildPath = join(root, 'build', 'the-raven.html');
const bookPath = join(root, 'book', 'book.json');
const packDir = join(root, 'pack');
const artDir = join(packDir, 'art');
const prune = process.argv.includes('--prune');

/**
 * The literal assigned to `var NAME`, found by balancing brackets.
 *
 * A regex cannot do this: the stanzas are full of braces and quotes, and
 * a base64 string contains `/` which reads as the start of a comment to
 * anything naive. Lifted from the engine's `tools/extract-book.mjs` and
 * kept here rather than imported, because this repository is a book and
 * must not need the engine checked out beside it to run its own tools.
 *
 * `which` matters for BEATART, which is declared twice: once as an empty
 * guard (`var BEATART = (typeof BEATART !== 'undefined') ? BEATART : {}`)
 * and then again with the 120 images in it. Taking the first would
 * silently produce an empty object and report nothing wrong.
 */
function literalAfter(src, name, open, close, which = 'first') {
  const re = new RegExp(`\\bvar\\s+${name}\\s*=`, 'g');
  const hits = [];
  let m;
  while ((m = re.exec(src))) hits.push(m.index);
  if (!hits.length) throw new Error(`could not find var ${name}`);
  const from = which === 'last' ? hits[hits.length - 1] : hits[0];

  let i = src.indexOf(open, from);
  if (i < 0) throw new Error(`no ${open} after var ${name}`);
  const start = i;
  let depth = 0;
  let inStr = null;
  let escaped = false;

  for (; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inStr = ch;
      continue;
    }
    if (ch === '/' && src[i + 1] === '*') {
      i = src.indexOf('*/', i) + 1;
      continue;
    }
    if (ch === '/' && src[i + 1] === '/') {
      i = src.indexOf('\n', i);
      continue;
    }
    if (ch === open) depth++;
    else if (ch === close && --depth === 0) return src.slice(start, i + 1);
  }
  throw new Error(`unbalanced ${open} for var ${name}`);
}

const evaluate = (text) => Function(`"use strict"; return (${text});`)();

/**
 * A data URI, decoded, with its magic bytes checked.
 *
 * The check is the point. A truncated or mis-sliced URI decodes happily
 * into bytes that are not an image, and the failure only shows up later
 * as a broken frame in front of a class. WebP is a RIFF container:
 * "RIFF" at 0, "WEBP" at 8. Anything else is refused here, loudly.
 */
function decodeWebp(uri, name) {
  const m = /^data:image\/webp;base64,([A-Za-z0-9+/=]+)$/.exec(String(uri).trim());
  if (!m) throw new Error(`${name}: not a base64 WebP data URI`);
  const buf = Buffer.from(m[1], 'base64');
  const riff = buf.subarray(0, 4).toString('latin1');
  const webp = buf.subarray(8, 12).toString('latin1');
  if (riff !== 'RIFF' || webp !== 'WEBP') {
    throw new Error(`${name}: decoded ${buf.length} bytes but they are not WebP ` +
      `(RIFF/WEBP magic reads "${riff}"/"${webp}")`);
  }
  return buf;
}

/* ------------------------------------------------------------------ */

const src = readFileSync(buildPath, 'utf8');

const PLATES = evaluate(literalAfter(src, 'PLATES', '{', '}'));
const BEATART = evaluate(literalAfter(src, 'BEATART', '{', '}', 'last'));
const CAST_ART = evaluate(literalAfter(src, 'CAST_ART', '{', '}'));
const wrenMatch = /var\s+WREN_ART\s*=\s*"([^"]+)"/.exec(src);
if (!wrenMatch) throw new Error('could not find var WREN_ART');
const sprites = {};
for (const id of ['RAVEN_SIT', 'RAVEN_FLY']) {
  const obj = evaluate(literalAfter(src, id, '{', '}'));
  if (obj?.src) sprites[id.replace('RAVEN_', 'raven-').toLowerCase()] = obj.src;
}

/** @type {[string, string][]} name (without extension) -> data URI */
const wanted = [];
for (const [key, uri] of Object.entries(PLATES)) wanted.push([`plate-${key}`, uri]);
for (const [unit, list] of Object.entries(BEATART)) {
  (list || []).forEach((uri, i) => wanted.push([`beat-${unit}-${i}`, uri]));
}
for (const [id, uri] of Object.entries(CAST_ART)) wanted.push([`cast-${id}`, uri]);
wanted.push(['cast-wren', wrenMatch[1]]);
for (const [id, uri] of Object.entries(sprites)) wanted.push([`sprite-${id}`, uri]);

/* Every image in the file has to end up in the list. If the build gains
   a sixth place to keep art, this is where it is noticed — rather than
   in a report that says "139 extracted" from a run that found 120. */
const inlined = (src.match(/data:image\/webp;base64,/g) || []).length;
if (wanted.length !== inlined) {
  throw new Error(
    `the build inlines ${inlined} images but only ${wanted.length} were found by key. ` +
      `Something holds art that this tool does not know about.`
  );
}

mkdirSync(artDir, { recursive: true });

let written = 0;
let unchanged = 0;
let bytes = 0;
const produced = new Set();

for (const [name, uri] of wanted) {
  const buf = decodeWebp(uri, name);
  const file = `${name}.webp`;
  const path = join(artDir, file);
  produced.add(file);
  bytes += buf.length;
  if (existsSync(path) && Buffer.compare(readFileSync(path), buf) === 0) {
    unchanged++;
    continue;
  }
  writeFileSync(path, buf);
  written++;
}

const stale = readdirSync(artDir).filter((f) => !produced.has(f));
for (const f of prune ? stale : []) rmSync(join(artDir, f));

/* ------------------------------------------------------------------
   The pack's book.json

   `book/book.json` is what the engine's extractor produces, and it is
   left exactly as produced — including the data URIs, because that is
   honestly what the build contained. The pack ships a copy with them
   removed: 550 KB of base64 that no longer resolves to anything, in a
   file a bundler inlines whole.

   Generated, not hand-edited, for the same reason tools/fix-glossary.mjs
   exists: a correction typed into a generated file survives until the
   next run of the generator and no longer.
   ------------------------------------------------------------------ */

const book = JSON.parse(readFileSync(bookPath, 'utf8'));
const platesRemoved = Object.keys(book.plates || {}).length;
delete book.plates;
let portraitsRemoved = 0;
for (const member of Object.values(book.cast?.members || {})) {
  if (member.art) {
    delete member.art;
    portraitsRemoved++;
  }
}
writeFileSync(join(packDir, 'book.json'), JSON.stringify(book, null, 1), 'utf8');

/* ------------------------------------------------------------------
   Does the pack point at anything?

   index.js is written by hand, so the map from key to file can drift
   from what is actually on disk. Checked by reading the paths back out
   of it as text rather than by importing it — index.js imports JSON,
   which node will not do without an import attribute Vite does not want.

   Comments are stripped first. The file explains itself by naming
   Magi's hashed filenames and a `beat-<unit>-<i>` placeholder, and the
   first run of this check dutifully reported both as broken paths.
   ------------------------------------------------------------------ */

const indexPath = join(packDir, 'index.js');
const dangling = [];
let referenced = 0;
if (existsSync(indexPath)) {
  const text = readFileSync(indexPath, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
  for (const m of text.matchAll(/['"`](art\/[^'"`]+\.webp)['"`]/g)) {
    referenced++;
    const file = m[1].slice('art/'.length);
    if (!produced.has(file)) dangling.push(m[1]);
  }
}

/* ------------------------------------------------------------------ */

const mb = (n) => `${(n / 1048576).toFixed(2)} MB`;
console.log(`source:      ${buildPath}`);
console.log(`inlined:     ${inlined} WebP images, all found by key`);
console.log(`  plates     ${Object.keys(PLATES).length}`);
console.log(
  `  beat art   ${Object.values(BEATART).reduce((n, a) => n + a.length, 0)} across ${Object.keys(BEATART).length} units`
);
console.log(`  portraits  ${Object.keys(CAST_ART).length + 1} (CAST_ART + WREN_ART)`);
console.log(`  sprites    ${Object.keys(sprites).length}`);
console.log(`\npack/art:    ${written} written, ${unchanged} unchanged, ${mb(bytes)} total`);
if (stale.length) {
  console.log(
    prune
      ? `             ${stale.length} stale file(s) deleted`
      : `             ${stale.length} file(s) here that this run did not produce: ` +
          `${stale.slice(0, 5).join(', ')}${stale.length > 5 ? ', …' : ''}` +
          `\n             re-run with --prune to delete them`
  );
}
console.log(
  `\npack/book.json written from book/book.json, minus ${platesRemoved} plate ` +
    `and ${portraitsRemoved} portrait data URIs.\n` +
    `             Where those files sit is in pack/index.js, not in the book.`
);
if (existsSync(indexPath)) {
  console.log(`\npack/index.js references ${referenced} art file(s).`);
  if (dangling.length) {
    console.log('  these point at nothing:');
    for (const d of dangling) console.log(`    ${d}`);
    process.exitCode = 1;
  } else {
    console.log('  every one of them exists.');
  }
} else {
  console.log('\npack/index.js is not there yet — nothing to check against.');
}
