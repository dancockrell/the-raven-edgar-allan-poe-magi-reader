/* Compare the TEACHING literal inside the build against pack/book.json,
   before anything writes to the build. If the shapes disagree, a
   wholesale replacement is the wrong tool.

     node tools/inspect-teaching.mjs                                     */
import { readFileSync } from 'node:fs';
import { literalSpan } from './lib-literal.mjs';

const html = readFileSync('build/the-raven.html', 'utf8');
const pack = JSON.parse(readFileSync('pack/book.json', 'utf8'));

const span = literalSpan(html, 'TEACHING');
console.log(`TEACHING literal: ${span.to - span.from} chars at ${span.from}`);

const inBuild = new Function(`return ${span.text}`)();
const inPack = pack.teaching || {};

const bk = Object.keys(inBuild).sort();
const pk = Object.keys(inPack).sort();

console.log(`units in build: ${bk.length}   units in pack: ${pk.length}`);
if (!bk.length || !pk.length) {
  console.error('one side is empty -- comparison is meaningless');
  process.exit(2);
}

const onlyBuild = bk.filter((k) => !pk.includes(k));
const onlyPack = pk.filter((k) => !bk.includes(k));
console.log(`only in build: ${onlyBuild.join(', ') || 'none'}`);
console.log(`only in pack : ${onlyPack.join(', ') || 'none'}`);

let same = 0;
const differ = [];
for (const k of bk.filter((x) => pk.includes(x))) {
  const b = (inBuild[k]?.mc || []).length;
  const p = (inPack[k]?.mc || []).length;
  const br = inBuild[k]?.recap ? 1 : 0;
  const pr = inPack[k]?.recap ? 1 : 0;
  if (b === p && br === pr) same++;
  else differ.push(`${k}: build ${b}mc+${br}recap vs pack ${p}mc+${pr}recap`);
}
console.log(`units with matching question counts: ${same}`);
for (const d of differ) console.log(`  DIFFERS ${d}`);

console.log('\nkeys present on a build question:',
  Object.keys(inBuild[bk[0]]?.mc?.[0] || {}).join(', '));
console.log('keys present on a pack  question:',
  Object.keys(inPack[pk[0]]?.mc?.[0] || {}).join(', '));
