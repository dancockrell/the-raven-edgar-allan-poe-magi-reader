# The recordings were found

This file used to count what would have to be recorded, on the basis
that the narration was gone. It was not. Everything it said was needed
already existed.

## What it used to say

That the audio "is not in this repository and has not been found
anywhere else", that "there is no way to reconstruct either", and that
178 clips and one cue file would have to be made.

Every part of that was wrong, and wrong in the most expensive direction:
it described work that did not need doing, and it was confident enough
that a cleanup pass read it and spared four zips on the strength of it.
That accident is the only reason the recordings still exist.

## Where they actually were

Four archives beside the repository, each with a complete `raven-audio/`
folder:

    raven-itch-folder.zip     367 mp3
    raven-itch-folder_2.zip   368 mp3
    raven-itch-folder_4.zip   368 mp3
    raven-itch-folder_6.zip   368 mp3

And inside each, `raven-audio/timings.js`: 113 KB declaring
`window.RAVEN_TIMINGS`, 368 clips of word-level timings in the same
`{ t, w }` shape the engine's `tools/timings-to-vtt.mjs` reads. That
tool was written against this book and had been waiting for this file.

## What is here now

    pack/audio/           368 mp3, 10.9 MB, committed
    pack/cues/raven.vtt   368 cues, 5,047 words, 104 KB

The conversion round-trips. `timings-to-vtt.mjs` reads its own output
back and refuses to write if one word or one millisecond differs. It
reported zero failures.

The reader asks for 178 of those clips, 102 of them story beats. None is
missing and none lacks a cue, so this book now has narration and
word-by-word highlighting on the same terms as Magi, with nothing
regenerated and no timing estimated.

A further 190 recordings are here and unused by the current engine:
question audio (`q_`), answer feedback (`w_`), and guide lines the React
build does not yet call for. They are kept because they cost nothing and
were nearly lost once.

## Why these are committed when the art is not

`pack/art/` is gitignored because `build/the-raven.html` is in this
repository and carries all 139 images as base64. Tracking the extracted
copies would store the same pixels twice.

Nothing carries the audio. It existed in four loose zips outside version
control and nowhere else on this machine. 10.9 MB is a small price for
the only copy of something nothing here can remake.

## The part worth remembering

A file saying "this cannot be recovered" is a claim, and this one was
never checked. The recordings were four folders away the whole time, and
finding them took two minutes once somebody looked instead of believing
the note.
