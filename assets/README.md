# Artwork

Every file here is **placeholder art**. Replacing any of it means overwriting a
file at the same path — there is no manifest to edit and no code to change.

The layout below is the contract. It is defined in
[`../src/data/manifest.js`](../src/data/manifest.js), which is the only place in
the project that knows how an image path is built.

```
backgrounds/<scene>.png             1920 x 1080   the room behind the scene
characters/<person>/<mood>.png       900 x 1400   transparent, cropped mid-thigh
characters/<person>/bust.png         512 x  512   head and shoulders (optional)
evidence/<exhibit>.png               512 x  512   transparent, shot straight on
```

## How a file is chosen

For each image the loader tries, in order:

1. the `.png` at that exact name — your art
2. the `.svg` at that exact name — if you prefer vectors
3. a neighbouring fallback — a missing mood drops to `neutral`, a missing bust
   drops to the stage figure
4. a placeholder drawn on a canvas at runtime

Nothing is ever a broken image, and a character needs only `neutral.png` to
appear in every scene. Add `tense.png` later and the tense beats start using it
immediately.

Moods a script may ask for: `neutral`, `tense`, `evasive`, `broken`, `cold`.

## Names in use

Backgrounds are `interview-room`, `precinct-desk`, `hotel-stairs`,
`evidence-room` and `rain-street`. Characters are `cole`, `calloway`,
`brennan`, `finch`, `roy` and `vance`. Exhibits are `pocket-watch`,
`stair-bulb`, `switchboard-log`, `ledger`, `sequin` and `umbrella`.

`python3 ../tools/check_project.py` reports anything the manifest wants and
cannot find.
