# The Raven — Magi Reader pack

> **Product scope, 5 September 2026:** this repository preserves book content, media, and earlier reader/pack work. [Magi Reader](https://github.com/dancockrell/magi-reader-engine) now targets solo literary reading; retained questions, classroom interfaces, and old packaging instructions are historical compatibility material, not current product requirements. Validate actual assets against the engine branch you use; the historical notes below are not a fresh release certification.

Poe, 1845. Eighteen stanzas in twelve segments. Picture and recording per
segment, comprehension questions, a glossary of the words that stop a learner.

This is a book. The engine is
[Magi Reader](https://github.com/dancockrell/magi-reader-engine).

```
book/book.json        extractor output. Art still as data URIs in this file.
build/the-raven.html  single-file reader as shipped on itch.io. 6 MB, inlined.
pack/                 what the engine loads
  index.js            pack entry
  book.json           same book with data URIs stripped
  art/                139 WebP files, generated, not committed
  audio/              recovered narration recordings
  cues/raven.vtt      recovered word-level timings
  AUDIO-RECOVERED.md  recovery provenance and validation history
tools/fix-glossary.mjs
tools/extract-media.mjs
```

`book/book.json` was lifted out of the shipped HTML and left as produced.
Corrections go in `tools/fix-glossary.mjs`. Neither source file is hand-edited.

```
node <engine>/tools/extract-book.mjs build/the-raven.html book/book.json raven
node tools/fix-glossary.mjs
node tools/extract-media.mjs
```

Art paths live in `pack/index.js`. The comment at the top of that file says why.

## State

This book is behind the engine. It was built before vocabulary training and
translations existed, so it has neither. `book/book.json` now passes the book
contract. It did not at first. Four complaints, three of them not this book's
fault:

Two were an engine bug. `bosom` and `demon` were reported as glossed words that
do not appear in the poem. They appear as "my bosom's core" and "a demon's that
is dreaming". The word-boundary rule treated an apostrophe as part of the word.
Fixed in the engine, with these lines as the test.

One was a rule that was too strict. `still` is glossed twice — verb in one
stanza, adjective four stanzas later, both correct. That is now a warning. The
reading shows both. The trainer skips the word.

One was real. `linking fancy unto fancy` was glossed as a phrase the poem breaks
across a line. The key is now `Fancy unto fancy`, which sits on one line.

The build declares four units in an array and then `TEXT_UNITS.push()` the other
eight further down. Anything that only reads the array gets a third of the poem
and no warning. The extractor handles this now.

The shipped HTML in `build/` is untouched, including the old gloss. It is the
record of what went out, not something to patch.

## Remaining media and compatibility work

1. Art extracted. 139 WebP in `pack/art/`.
2. Pack ships.
3. Narration was recovered and committed, with word-level timing data. See
   [the recovery record](pack/AUDIO-RECOVERED.md); do not regenerate recordings
   on the basis of the superseded missing-audio claim. Validate playback and
   cue coverage against the engine version used for release.
4. Vocabulary swaps and translations the engine now supports.
5. A decision on 120 per-line plates. The old build changed picture every line.
   The earlier engine used one picture per segment; the solo redesign supports
   per-line storyboard media. Check its current contract before authoring more art.

## Licence

MIT for the software and generated assets. The poem is public domain.
