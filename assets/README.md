# Investigation artwork

This directory is the destination for game-ready exports made from the three
supplied asset sheets. The files are grouped by their role rather than by source sheet:

- `characters/` — the ten complete, bordered character cards.
- `locations/` — the six large location cards (not the small alternates along
  the bottom of the sheet).
- `ui/` — reusable paper panels, cards, board furniture, and controls.
- `icons/` — compact category and status symbols.

See [`SOURCE-MAP.md`](SOURCE-MAP.md) for the exact source rectangles and the
places where the exports are used.  To reproduce the exports, place the three
original 1536×1024 sheets in `/source-assets` and run:

```sh
python3 -m pip install -r tools/requirements-assets.txt
python3 tools/extract_assets.py --source /source-assets --output assets
```

The extractor samples the supplied sheet dimensions, validates every crop,
and uses hand-inspected rectangles that retain each item's outer border while
excluding adjacent artwork. It deliberately does **not** divide a sheet into
an equal grid.
