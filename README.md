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

Honest version: **this book is behind the engine and has known defects.**
It was built before Raven Reader had a vocabulary trainer or
translations, so it has neither. The extraction and the book contract
found four content problems that are live in the shipped build:

| problem | where |
| --- | --- |
| `linking fancy unto fancy` is glossed but appears nowhere in the text | `units[8].gloss[2]` |
| `bosom` is glossed but appears nowhere in the text | `units[8].gloss[7]` |
| `demon` is glossed but appears nowhere in the text | `units[11].gloss[3]` |
| `still` is glossed twice, with two different meanings | `units[4].gloss` |

There is also a structural oddity worth knowing about: the build declares
four units in its array and then adds the other eight with
`TEXT_UNITS.push()` further down the file. Anything reading only the
array gets a third of the poem and no warning. The engine's extractor
handles this now — it did not, until this book was pointed at it.

## What it needs to become current

1. Fix the four glossary defects above, in `book/book.json`.
2. Pull the inlined art and audio out of the 6 MB build into files, and
   generate a WebVTT cue file so the words light up as they are spoken.
3. Add the vocabulary swaps and the translations the engine now supports.
4. Ship as a pack the engine loads, rather than as a single-file build.

## Licence

MIT for the software and the generated assets. The poem is public
domain — Poe published it in 1845 and died in 1849.
