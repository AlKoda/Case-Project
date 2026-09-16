# Source sheet extraction map

The untracked supplied masters are expected in `source-assets/` at 1536×1024. Exact
inclusive-exclusive crop coordinates are the `SHEETS` table in
`tools/extract_assets.py`, which is the canonical, executable source map.

## `locations.svg`

The six large bordered cards are exported to `assets/locations/`: academy,
interrogation room, office, evidence room, parking lot, and hallway.

## `location-atlas.svg`

The top-row circles yield six location tokens; the second row yields six wide
location thumbnails. Individually framed pieces lower on the sheet yield the
paper panel, evidence board, security camera, archive box, evidence bag, desk
lamp, filing cabinet, plant, academy crest, camera, archive, vehicle, and door
icons. Decorative fragments and duplicate isometric rooms are not exported.
