# Supplied investigation sprites

The two supplied 1536×1024 police-academy sprite sheets have been cut into
purpose-specific SVG image containers instead of being displayed as whole contact sheets.

- `locations/` — six bordered location cards and six compact wide variants.
- `rooms/` — clean room artwork with the source card labels removed.
- `props/` — isolated environmental props.
- `icons/` — compact navigation/category symbols.
- `ui/` — reusable paper and evidence-board surfaces.

The game uses the evidence room as menu atmosphere, the wide interrogation and
office scenes behind interactive search overlays, and full scene art on case
selection. Text and controls remain HTML so they stay accessible and bilingual.

To reproduce all crops:

```sh
python3 -m pip install -r tools/requirements-assets.txt
python3 tools/extract_assets.py --source source-assets --output assets
```

The extraction map in `tools/extract_assets.py` uses hand-inspected,
inclusive-exclusive rectangles; it intentionally does not assume an equal grid.
