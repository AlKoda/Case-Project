# Supplied sheet extraction map

Both source sheets are 1536×1024 PNG files. Coordinates below are
inclusive-exclusive (`left, top, right, bottom`). `tools/extract_assets.py` is
the canonical, executable map.

## Named character sheet (`named-characters.png` / `image_1.png`)

Ten complete cards are cut using their irregular hand-inspected edges into
`characters/reference/`: five columns at approximately x=22, 327, 628, 929,
1230 and two rows at y=26 and y=514. The exact ten rectangles and filenames
are in the script's `NAMED` mapping. These cards retain their printed names and
roles, so the game does not misidentify them as its separate playable cast.

## Component sheet (`sprite-sheet.png` / `image_2.png`)

| Region | Exports | Use |
|---|---:|---|
| x=18–1090, y=15–814 | 18 portrait crops | Playable suspect and witness art |
| x=18–1090, y=15–814 | 18 complete person cards | Reusable blank-label card sprites |
| x=1111–1515, y=20–477 | 36 icons | Search, evidence, people, status, time, warning, and other UI symbols |
| x=1104–1520, y=531–829 | 15 silhouettes | Anonymous/hidden identity tokens |
| x=22–926, y=834–999 | 6 card backs | Case picker and reusable deck art |
| 950,835,1201,1004 | 1 paper stack | Main-menu archive dressing |
| 1217,848,1510,1007 | 1 notebook page | Dialogue and notebook surface |

All PNG outputs are local/generated artifacts; the committed `sprites.js` bundle embeds the 21 crops used by the game as text data URIs.

The component sheet contains no room scenes. No card, icon, or portrait has
been mislabeled as a room; the game's existing interactive room diagrams remain
in place. Text and button labels remain HTML for accessibility, translation,
and responsive layout, while the supplied paper and portrait sprites provide
the visual surfaces.
