# Artwork

The layout below is the contract. It is defined in
[`../src/data/manifest.js`](../src/data/manifest.js), which is the only place in
the project that knows how an image path is built. Replacing any image means
overwriting a file at the same path — there is no manifest to edit and no code
to change.

Original sheets and uncropped images belong in [`source/`](source/README.md),
not beside runtime files. `catalog.json` is the machine-readable inventory of
every runtime PNG (dimensions, alpha capability, size, and checksum); regenerate
it after any art change with `python3 tools/catalog_assets.py --write`.

```
backgrounds/<scene>.png             1920 x 1080   the room behind the scene
characters/<person>/<mood>.png       900 x 1400   transparent, full figure
characters/<person>/bust-<mood>.png   512 x  512   head and shoulders
evidence/<exhibit>.png               512 x  512   transparent, shot straight on
```

## How a file is chosen

For each image the loader tries, in order:

1. the `.png` at that exact name — your art
2. the `.svg` at that exact name — if you prefer vectors
3. a neighbouring fallback — a missing mood drops to `neutral`, a missing
   per-mood bust drops to `bust-neutral.png`, then `bust.png`, then to the full
   figure cropped at the head
4. a placeholder drawn on a canvas at runtime

Nothing is ever a broken image, and a character needs only `neutral.png` to
appear in every scene. Add `tense.png` later and the tense beats start using it
immediately.

Moods a script may ask for: `neutral`, `tense`, `evasive`, `broken`, `cold`.

## Cutting an expression sheet

Character art usually arrives as a strip — the same person several times over,
one expression per panel. `tools/slice_sheet.py` cuts it up and writes the
files where the manifest expects them:

```sh
python3 tools/slice_sheet.py sheet.png --person sharif \
        --moods neutral evasive cold broken --bust --archive-source
```

Panels are found by their transparency rather than by dividing the width
evenly, so unequal panels and off-centre figures survive. Every panel is scaled
by the same factor, contained in an exact 900×1400 canvas, and aligned
bottom-centre, which is what stops a character jumping around the stage when
their expression changes. `--colors` (default 128)
quantises the palette — flat art loses nothing and shrinks about 85%.

`--bust` also writes a square head-and-shoulders crop **per mood**, so the
portrait in the corner of the speech box changes expression along with the
figure on stage. The crop box is worked out once from the neutral figure and
applied to every mood — recomputing it each time would shift the frame by a few
pixels whenever the expression changed, which reads as the portrait twitching.

It finds the neck by looking for where the silhouette widens into the
shoulders, which is right for most figures and wrong for the occasional one
with wide hair; when it misses, `--bust-height 0.65` sets the crop explicitly as
a fraction of the figure.

The art currently checked in was produced with:

```sh
# suspects, four expressions each
python3 tools/slice_sheet.py <sheet> --person zadjali --moods neutral evasive cold broken --bust
python3 tools/slice_sheet.py <sheet> --person sharif  --moods neutral evasive cold broken --bust
python3 tools/slice_sheet.py <sheet> --person lawati  --moods neutral evasive cold broken --bust
# witnesses, two expressions each
python3 tools/slice_sheet.py <sheet> --person kindi   --moods neutral broken --bust
python3 tools/slice_sheet.py <sheet> --person hinai   --moods neutral broken --bust
python3 tools/slice_sheet.py <sheet> --person busaidi --moods neutral broken --bust --bust-height 0.65
python3 tools/slice_sheet.py <sheet> --person maskari --moods neutral broken --bust --bust-height 0.65
```

## Names in use

**Backgrounds** — `interview-room`, `precinct-desk`, `hotel-stairs`,
`evidence-room`, `rain-street`, and `case-board` (the corkboard behind the
evidence wall; its cork surface is measured in `src/game/board.js`, so replacing
it with art whose frame sits elsewhere means updating the `CORK` constants).

**Characters** — suspects `lawati`, `zadjali`, `sharif`; witnesses `hinai`,
`kindi`, `busaidi`, `maskari`. The detective (`harthy`) and the victim
(`rawahi`) are marked `noPortrait` in `src/data/case.js` and deliberately have
no art.

**Exhibits** — `pocket-watch`, `stair-bulb`, `switchboard-log`, `ledger`,
`shawl-bead`, `umbrella`.

Four carry placeholder art recovered from the project's previous sprite sheets.
`shawl-bead` and `umbrella` deliberately have none: the closest stand-ins showed
a red book and a desk lamp, and in a game about identifying evidence a picture
of the wrong object is worse than no picture. Those two render as drawn
placeholders until real art arrives, which is honest about being empty.

`python3 ../tools/check_project.py` lists whatever is still awaiting art as a
note rather than a failure, since a placeholder is a designed outcome and not a
broken build.

`python3 ../tools/check_project.py` reports anything the manifest wants and
cannot find.
