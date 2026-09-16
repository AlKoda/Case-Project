# Case UI sprite exports

The two supplied 1536×1024 atlases have been divided into **76 named SVG
assets**. They are grouped by purpose rather than by their position on a sheet:

- `ui/` contains panels, card frames, paper, tabs, notifications, books, and
  buttons.
- `icons/` contains category, action, status, map-pin, and miscellaneous icon
  strips.
- `characters/`, `evidence/`, and `locations/` remain reserved for future art
  that actually depicts the playable cases; generic UI silhouettes are not
  mislabeled as story characters or locations.

Keep the supplied source atlases locally as `source-assets/ui-part1.png` and
`source-assets/ui-part2.png`. Rebuild all crops with:

```sh
python3 -m pip install -r tools/requirements-assets.txt
python3 tools/extract_assets.py
```

The extractor verifies both source dimensions and uses individually measured
rectangles. It emits text-based SVG files containing the lossless crop, rather
than binary files that cannot be represented by the pull-request patch service.
It does not assume a uniform grid. See [`SOURCE-MAP.md`](SOURCE-MAP.md) for the
complete crop manifest.
