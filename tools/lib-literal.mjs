/**
 * Find a top-level `var NAME = {...}` literal and return its exact span.
 *
 * Lifted from the engine's tools/extract-book.mjs, which reads these
 * builds. A regex cannot do it: the stanzas are full of braces and the
 * data URIs are full of everything. Brackets have to be balanced with
 * string and comment awareness.
 *
 * The name must be followed by whitespace or '=' to match, or
 * `var CAST` finds `var CAST_ART` -- declared first -- and silently
 * returns the wrong object.
 */
export function literalSpan(src, name, open = '{', close = '}') {
  const re = new RegExp(`\\bvar\\s+${name}\\s*=`, 'g');
  const m = re.exec(src);
  if (!m) throw new Error(`could not find var ${name}`);

  let i = src.indexOf(open, m.index + m[0].length - 1);
  if (i < 0) throw new Error(`no ${open} after var ${name}`);

  const from = i;
  let depth = 0;
  let inStr = null;
  let escaped = false;

  for (; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === inStr) inStr = null;
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
    else if (ch === close) {
      depth--;
      if (depth === 0) return { from, to: i + 1, text: src.slice(from, i + 1) };
    }
  }
  throw new Error(`unbalanced ${open} after var ${name}`);
}
