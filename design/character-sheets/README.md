# Character expression sheets

Reference art for people. **Source material, not runtime assets** — nothing in
`src/` loads these. Cut and edited versions belong under
`assets/characters/<person>/`, at the paths
[`assets/README.md`](../../assets/README.md) documents.

Filenames describe what is drawn, not who the character is, because none of
these have been cast yet. Rename them when they get a role.

## Individual sheets — 1254 × 1254, a 2 × 2 grid of four expressions

Reading order is left-to-right, top-to-bottom: **neutral, amused/evasive,
cold/angry, shocked/broken** — the same four moods the game already uses.

| File | Who is drawn |
| --- | --- |
| `man-20s-hoodie` | young man, messy hair, hoodie |
| `man-20s-hoodie-massar` | young man, hoodie with a red-and-white massar |
| `man-20s-police-cap` | young officer, peaked cap, ROP crest |
| `man-30s-police` | officer, beard, uniform and radio |
| `man-30s-worker` | labourer, stubble, red-panelled jacket |
| `man-40s-coat-beard` | man in a dark coat, open collar |
| `man-40s-doctor` | physician, lab coat, stethoscope, ID badge |
| `man-40s-moustache` | man with a moustache, dark jacket |
| `man-40s-shopkeeper-apron` | shopkeeper, apron over a shirt |
| `man-60s-massar-elder` | elder, white beard, massar, corded waistcoat |
| `woman-20s-hijab-red-band` | young woman, black hijab with red trim |
| `woman-30s-curly-cardigan` | woman, long curly hair, cardigan |
| `woman-50s-dark-pearls` | woman, dark wavy hair, pearls, blazer |
| `woman-60s-grey-pearls` | woman, grey hair, pearls, striped blazer |
| `woman-60s-hijab-elder` | elder woman, black abaya with red geometric trim |
| `woman-police-hijab` | woman officer, beret over hijab, ROP crest |

## Grouped sheets

| File | Layout |
| --- | --- |
| `group-four-characters` | 1672 × 941 — four people, two expressions each |
| `group-three-characters` | 1672 × 941 — three people, four expressions each |
| `portrait-cards-and-roles` | 1448 × 1086 — 24 portraits in card frames, plus a role-icon legend |

## Cutting them

`tools/slice_sheet.py` splits a **horizontal strip** — one row of panels. These
are grids, so it will not cut them as they stand. Either crop each row out
first and run the slicer per row, or teach the slicer a `--rows` option. That is
worth doing once rather than by hand sixteen times.

The slicer's other behaviour still applies and is worth keeping: every panel
scaled by one factor and bottom-aligned so a character does not jump when their
expression changes, `--bust` for the square head-and-shoulders crop the speech
box uses, and palette quantisation.
