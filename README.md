# The Raven — Edgar Allan Poe — Magi Reader

Poe's 1845 poem as an illustrated, narrated reading for language
classrooms. Eighteen stanzas across twelve segments, with a picture and a
recording for each, comprehension questions, and a glossary of the words
that stop a learner.

**This is a book, not the engine.** The engine is
[Magi Reader](https://github.com/dancockrell/magi-reader-engine), named
after _The Gift of the Magi_, which is the other book it reads.

## What is here

```
book/book.json        the extractor's output: text, glossary, questions,
                      characters — and the art still as data URIs, because
                      that is what the build contained
build/the-raven.html  the single-file reader, as shipped on itch.io.
                      6 MB, art and audio inlined as data URIs.
pack/                 the book as the engine loads it
  index.js            the pack entry: where the art and audio sit
  book.json           the same book with the data URIs taken out
  art/                139 WebP files, generated, not committed
  AUDIO-NEEDED.md     the 178 recordings this book does not have
tools/fix-glossary.mjs   content corrections, run after extraction
tools/extract-media.mjs  the art, out of the build and into pack/art/
```

`book/book.json` was lifted out of `build/the-raven.html` by the
engine's extractor, and is left exactly as produced. The build is kept
because it is what actually shipped and what the extraction is checked
against. Neither is ever hand-edited: corrections go in
`tools/fix-glossary.mjs`, and the pack is generated.

```
node <engine>/tools/extract-book.mjs build/the-raven.html book/book.json raven
node tools/fix-glossary.mjs
node tools/extract-media.mjs
```

The art paths live in `pack/index.js` rather than in `book.json`, and
the comment at the top of that file says why.

## State of it

Honest version: **this book is behind the engine.** It was built before
the engine had a vocabulary trainer or translations, so it has neither.
`book/book.json` now passes the book contract; it did not at first, and
what happened in between is worth writing down, because three of the four
things the contract reported were not this book's fault.

**Two were an engine bug.** `bosom` and `demon` were reported as glossed
words that appear nowhere in the poem. They appear in it twice over — as
"my bosom's core" and "a demon's that is dreaming". The engine's
word-boundary rule treated an apostrophe as part of the word, so `bosom`
did not occur inside `bosom's`, and any glossed noun used possessively
would have been rejected in any book. Fixed in the engine, with the poem's
own lines as the test.

**One was a rule that was too strict.** `still` is glossed twice — "to
still the beating of my heart" is a verb, "let my heart be still a
moment" is an adjective, four stanzas apart, and both glosses are right.
The contract called that a defect. It is now a warning: the reading shows
both, each in the line that settles which is meant, and the trainer skips
the word, because out of its line "what does _still_ mean?" has two right
answers.

**One was real, and is fixed here.** `linking fancy unto fancy` was
glossed as a phrase the poem breaks across a line — "I betook myself to
linking / Fancy unto fancy" — so it matched nothing and the trainer could
never have found it. The key is now `Fancy unto fancy`, which sits on one
line and carries the same sense.

There is also a structural oddity worth knowing about: the build declares
four units in its array and then adds the other eight with
`TEXT_UNITS.push()` further down the file. Anything reading only the
array gets a third of the poem and no warning. The engine's extractor
handles this now — it did not, until this book was pointed at it.

The single-file build in `build/` is untouched and still carries the
`linking fancy unto fancy` gloss. It is kept as the record of what
shipped, not as something to fix.

## What it needs to become current

1. ~~Pull the inlined art out of the 6 MB build into files.~~ Done: 139
   WebP files in `pack/art/`, named by the key the build used.
2. ~~Ship as a pack the engine loads.~~ Done: `pack/`.
3. **The recordings.** There are none. The build loaded them from a
   `raven-audio/` folder that is not in this repository, and without them
   there are no timings, so there is no word-by-word highlighting. Nothing
   here is estimated: `pack/AUDIO-NEEDED.md` names the 178 clips and the
   one cue file that would have to exist, and where to look for the
   folder first. The reading works without them, silently.
4. Add the vocabulary swaps and the translations the engine now supports.
5. Decide what to do with the 120 per-line plates. The build changed the
   picture on every line; the engine gives every line of a segment the
   same one. The files are extracted and waiting.

## Licence

MIT for the software and the generated assets. The poem is public
domain — Poe published it in 1845 and died in 1849.
