# The recordings this book does not have

The art is out of the build and in `pack/art/`. The audio is not, because
it was never in the build. `build/the-raven.html` loads narration from a
`raven-audio/` folder placed beside it, and that folder is not in this
repository and has not been found anywhere else. Neither has a cue file.

There is no way to reconstruct either. The engine lights a word when the
media clock reaches it, and the timings come from the recording — from
what a voice actually did, not from an estimate of what it might have
done. A guessed timing drifts within a line and is worse than no
highlight at all, so nothing here is guessed: this file says what would
have to exist, and stops.

The reader works without any of it. `Scene.jsx` renders the line from the
book and treats a missing clip or an unreachable cue file as "no
highlighting", so every stanza is on screen and readable today. What is
missing is the read-along, not the reading.

## What would have to exist

**178 recordings**, as `.mp3`, in `raven-audio/` — the folder
`pack/index.js` already names. The extension is not configurable: both
`Scene.jsx` and `Speaker.jsx` build the source as
`` `${audioBase}${clip}.mp3` ``.

**One cue file**, `cues/raven.vtt`, holding all 178 cues in a single
WebVTT file. Not one file per clip: itch refuses a zip of more than 1000
files, which is the reason `toVttBundle` in `src/lib/media/vtt.js` exists.

## The clip ids, exactly

The names are not a convention this book may choose. `beats.js` and
`speech/script.js` construct them, and a file under any other name is a
file the engine will never ask for. Counted from `book/book.json`:

| id | what it is | how many |
| --- | --- | --- |
| `n_<unit>_<i>` | the Professor reading line `i` of a segment. `i` counts lines across the whole segment, not per stanza | **102** |
| `wh_<unit>_<i>` | Wren reacting to line `i`. Only the reactions that carry a `line` — the rest are expressions, not interruptions | **10** |
| `d_<unit>_<i>` | turn `i` of the conversation after a part | **56** |
| `g_pre<i>` | the preshow, `g_pre0` to `g_pre5` | **6** |
| `g_hello` | the greeting at the door | **1** |
| `g_pass<n>` | what each of the three readings will ask of you: `g_pass1`, `g_pass2`, `g_pass3` | **3** |
| | | **178** |

Lines per segment, for `n_`:

```
s1 6   s2 6   s3 6   s4 11  s5 6   s6 6
s7 11  s8 11  s9 12  s10 9  s11 12 s12 6
```

`d_` covers fourteen keys, not twelve: `poe` (10 turns) and `impact` (8)
are the author page and the note on the poem's afterlife. They are not
read aloud, but the two characters talk about each, and `trackFor` places
those conversations after the story rather than dropping them.

Magi, for scale, ships 519 clips and one 2077-line `magi.vtt`.

## The cue file

One `WEBVTT` header, then one cue per clip, each with the clip id as its
identifier and inline timestamps on the words:

```
n_s1_0
00:00:00.100 --> 00:00:03.900
Once <00:00:00.520>upon <00:00:00.810>a <00:00:00.930>midnight <00:00:01.400>dreary
```

`vtt.js` writes this (`toVttBundle`) and reads it back (`wordsByClip`),
so a generated file can be checked against itself before it ships.

The cue text is a timing artifact and is never what the student reads.
The words on screen come from `book.json`; the cues only decide which one
is lit, and `alignCues` matches them greedily because the two disagree
often enough — an em-dash splits a spoken word in two, and the poem is
full of them. A cue that cannot be placed holds the highlight where it is
rather than jumping.

## How the file would be produced

Whisper emits word-level WebVTT directly, which is what makes this a
transcription job over real recordings rather than an authoring job.

But there is one thing worth chasing before recording anything.
`build/the-raven.html` loads `raven-audio/timings.js`, a script that sets
`window.RAVEN_TIMINGS` to `{clipId: [{t, w}, …]}`. The engine's
`tools/timings-to-vtt.mjs` reads exactly that global by name — it was
written against this book's format — and converts it into a cue bundle,
checking every word round-trips before it writes. **If a copy of the
`raven-audio` folder still exists on any machine, it holds both the
recordings and their real timings**, and `cues/raven.vtt` falls out of it
with nobody estimating anything. The build's own settings panel names
where the folder came from: a `MAKE-VOICES` script that produced it.

Failing that, the recordings have to be made again before there is
anything to time.

## The silent WAV in the build

Not a recording, and not extracted. It is 44 bytes of WAV header with an
empty data chunk, written inline in two string literals inside
`VOICE.unlock`, and it is played once on the first tap to prime the audio
pipeline — browsers refuse to start audio until the person has interacted
with the page, and they do not say so. The engine does not need it:
`Scene.jsx` calls `play()` from a real gesture and swallows the rejection.
