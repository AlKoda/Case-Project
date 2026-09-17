# Source artwork

Keep original, uncut artwork here so a runtime crop can always be reproduced.
Group source files by destination rather than by delivery batch:

```text
source/
  backgrounds/                 uncropped room artwork
  characters/<person>/         expression sheets and layered masters
  evidence/                    uncropped exhibit photographs or illustrations
```

Files here are not runtime assets. The browser only loads optimised files from
`../backgrounds`, `../characters`, and `../evidence`.

Archive and cut a character sheet in one operation:

```sh
python3 tools/slice_sheet.py incoming/sharif.png --person sharif \
  --moods neutral evasive cold broken --bust --archive-source
python3 tools/catalog_assets.py --write
python3 tools/check_project.py
```

The cutter writes exact 900×1400 transparent stage canvases and stable 512×512
bust crops. Never hand-crop later moods independently: a shared scale, baseline,
and bust box prevent the character from jumping between lines.
