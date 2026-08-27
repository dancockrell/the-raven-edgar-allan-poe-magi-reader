/**
 * Put the pack's book back INTO the shipped reader.
 *
 * Every other tool here runs the other way: the build is extracted into
 * book/book.json and corrected into pack/book.json. Nothing wrote back,
 * so an edit to the pack could not be shipped -- and the only
 * distributable, build/the-raven.html, quietly stayed at whatever it was
 * when it was last hand-made.
 *
 * That is not a theoretical gap. On 27 Aug 2026 the book's questions were
 * fixed (answer position evened out, the longest-option tell removed, a
 * circular gloss rewritten) and the build still contained every one of
 * the old versions. Pushing it to itch would have restored all of them
 * while looking like a normal release, because the artifact's date says
 * nothing about the content inside it.
 *
 * WHAT THIS TOUCHES, and nothing else:
 *
 *   var TEACHING = {...}   replaced wholesale. Verified first to have the
 *                          same units and the same question counts as the
 *                          pack, so a replacement cannot silently drop a
 *                          unit that only the build had.
 *   gloss definitions      replaced individually, by exact string, and
 *                          only when that string occurs exactly once.
 *
 * The art and audio are data URIs elsewhere in the file and are never
 * read, rewritten or re-encoded. Splicing a span leaves every other byte
 * where it was, which is why the size check below is a floor on
 * correctness: a 6 MB file whose size moved by more than the edit
 * explains has had something else happen to it.
 *
 *   node tools/build-reader.mjs            report what would change
 *   node tools/build-reader.mjs --write    write build/the-raven.html
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { literalSpan } from './lib-literal.mjs';

const HTML = 'build/the-raven.html';
const PACK = 'pack/book.json';
const write = process.argv.includes('--write');

const original = readFileSync(HTML, 'utf8');
const pack = JSON.parse(readFileSync(PACK, 'utf8'));

/* ---------------- the questions ---------------- */

const span = literalSpan(original, 'TEACHING');
const inBuild = new Function(`return ${span.text}`)();
const inPack = pack.teaching || {};

const bk = Object.keys(inBuild);
const pk = Object.keys(inPack);
console.log(`teaching units: ${bk.length} in build, ${pk.length} in pack`);

if (!bk.length || !pk.length) {
  console.error('REFUSING: one side has no teaching at all.');
  process.exit(2);
}

/* A replacement is only safe if the pack is a superset in structure.
   Refusing on a mismatch is the difference between shipping the pack and
   silently deleting whatever the build had that the pack does not. */
const missing = bk.filter((k) => !pk.includes(k));
if (missing.length) {
  console.error(`REFUSING: the pack has no teaching for: ${missing.join(', ')}`);
  console.error('Replacing wholesale would delete those questions from the build.');
  process.exit(1);
}
for (const k of bk) {
  const b = (inBuild[k].mc || []).length;
  const p = (inPack[k].mc || []).length;
  if (p < b) {
    console.error(`REFUSING: ${k} has ${b} question(s) in the build, only ${p} in the pack.`);
    process.exit(1);
  }
}

let questionsChanged = 0;
for (const k of bk) {
  const b = JSON.stringify(inBuild[k]);
  const p = JSON.stringify(inPack[k]);
  if (b !== p) questionsChanged++;
}
console.log(`units whose teaching differs: ${questionsChanged}`);

const replacement = JSON.stringify(inPack, null, 1);
let out = original.slice(0, span.from) + replacement + original.slice(span.to);

/* ---------------- the glosses ---------------- */

const packGloss = new Map();
for (const u of pack.units || []) {
  for (const g of u.gloss || []) {
    const [w, d] = Array.isArray(g) ? g : [g?.w, g?.d];
    if (w) packGloss.set(String(w), String(d || ''));
  }
}
console.log(`glossed words in pack: ${packGloss.size}`);
if (!packGloss.size) {
  console.error('REFUSING: the pack has no glosses, which cannot be right.');
  process.exit(2);
}

/* The build keeps its glosses inside TEXT_UNITS, which is declared once
   and appended to twice. Rather than rebuild three spans, each changed
   definition is swapped by exact string -- and only when that string
   appears exactly once, so a common phrase can never be replaced in the
   wrong place. */
let glossChanged = 0;
const glossRefused = [];
for (const [word, want] of packGloss) {
  const esc = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = out.match(new RegExp(`"${esc}"\\s*,\\s*"((?:[^"\\\\]|\\\\.)*)"`));
  if (!m) continue;
  const have = JSON.parse(`"${m[1]}"`);
  if (have === want) continue;

  const needle = m[0];
  const first = out.indexOf(needle);
  if (first !== out.lastIndexOf(needle)) {
    glossRefused.push(`${word}: its entry appears more than once`);
    continue;
  }
  out = out.slice(0, first) + JSON.stringify(word) + ', ' + JSON.stringify(want) +
        out.slice(first + needle.length);
  glossChanged++;
  console.log(`  gloss "${word}": ${JSON.stringify(have)} -> ${JSON.stringify(want)}`);
}
for (const r of glossRefused) console.log(`  SKIPPED ${r}`);

/* ---------------- did anything happen, and only that? ---------------- */

console.log(`\nteaching units rewritten: ${questionsChanged}   glosses rewritten: ${glossChanged}`);

if (!questionsChanged && !glossChanged) {
  console.log('The build already matches the pack. Nothing to do.');
  process.exit(0);
}

const drift = Math.abs(out.length - original.length);
const budget = Math.max(4096, replacement.length + span.text.length);
console.log(`size: ${original.length} -> ${out.length} chars (moved ${drift}, budget ${budget})`);
if (drift > budget) {
  console.error('REFUSING: the file moved by more than the edit can explain.');
  console.error('Something outside TEACHING and the glosses has changed. Nothing written.');
  process.exit(1);
}

/* Read the new literal back out of the new text and compare it to the
   pack. Writing it is not evidence that it can be read. */
const check = literalSpan(out, 'TEACHING');
const roundTripped = new Function(`return ${check.text}`)();
if (JSON.stringify(roundTripped) !== JSON.stringify(inPack)) {
  console.error('REFUSING: the rewritten TEACHING does not read back as the pack.');
  process.exit(1);
}
console.log('rewritten TEACHING reads back identical to the pack.');

if (!write) {
  console.log('\ndry run. pass --write to update the build.');
  process.exit(0);
}

writeFileSync(HTML, out, 'utf8');
console.log(`\nwritten: ${HTML}`);
