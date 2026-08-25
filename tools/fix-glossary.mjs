/**
 * Content fixes applied to the extracted pack.
 *
 * `book/book.json` is generated from `build/the-raven.html`, so a fix
 * typed straight into it survives exactly until the next extraction —
 * which is how this file came to exist, after a hand-edit was silently
 * undone by re-running the extractor.
 *
 * The shipped build is not edited: it is the record of what went out.
 * So corrections live here, run after extraction, and each one says what
 * was wrong.
 *
 *   node tools/fix-glossary.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const path = join(root, 'book', 'book.json');
const book = JSON.parse(readFileSync(path, 'utf8'));

const FIXES = [
  {
    unit: 's9',
    word: 'linking fancy unto fancy',
    why: [
      'The poem breaks the phrase across a line:',
      '    "...I betook myself to linking',
      '     Fancy unto fancy, thinking what this ominous bird of yore—"',
      'so the key matched nothing. The trainer searches one line at a',
      'time, so it could never have found it either. The half that sits',
      'on a single line carries the same sense.',
    ],
    to: ['Fancy unto fancy', 'letting one idea lead to another'],
  },
];

let applied = 0;
for (const fix of FIXES) {
  const unit = book.units.find((u) => u.id === fix.unit);
  if (!unit) throw new Error(`unit ${fix.unit} is not in the pack any more`);
  const entry = (unit.gloss || []).find(([w]) => w === fix.word);
  if (!entry) {
    console.log(`already fixed: ${fix.unit} "${fix.word}"`);
    continue;
  }
  [entry[0], entry[1]] = fix.to;
  applied++;
  console.log(`${fix.unit}: "${fix.word}" -> "${fix.to[0]}"`);
  for (const line of fix.why) console.log(`    ${line}`);
}

if (applied) {
  writeFileSync(path, JSON.stringify(book, null, 1), 'utf8');
  console.log(`\n${applied} fix(es) written to book/book.json`);
} else {
  console.log('\nnothing to do');
}
