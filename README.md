# The Raven — Edgar Allan Poe — Raven Reader

Poe's 1845 poem as an illustrated, narrated reading for language
classrooms. Eighteen stanzas across twelve segments, with a picture and a
recording for each, comprehension questions, and a glossary of the words
that stop a learner.

**This is a book, not the engine.** The engine is
[Raven Reader](https://github.com/dancockrell/raven-reader) — which is
named after this poem, which is a confusion worth naming once and then
avoiding. Throughout this repository, _The Raven_ means the poem and
Raven Reader means the software.

## What is here

```
book/book.json        the book as data: text, glossary, questions,
                      characters, pictures — no code in it
build/the-raven.html  the single-file reader, as shipped on itch.io.
                      6 MB, art and audio inlined as data URIs.
```

`book/book.json` was lifted out of `build/the-raven.html` by the
engine's extractor, and is the form the current engine reads. The build
is kept because it is what actually shipped and what the extraction is
checked against.

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

1. Pull the inlined art and audio out of the 6 MB build into files, and
   generate a WebVTT cue file so the words light up as they are spoken.
2. Add the vocabulary swaps and the translations the engine now supports.
3. Ship as a pack the engine loads, rather than as a single-file build.

## Licence

MIT for the software and the generated assets. The poem is public
domain — Poe published it in 1845 and died in 1849.
