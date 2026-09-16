# Supplied asset integration log

The two delivered sheets define 105 discrete production crops. The checked-in
runtime representation is the text-only `assets/sprites.js` bundle rather than
binary PNG files, allowing the change to pass through GitHub patch-based PR and
merge systems. The dependency-free extractor can regenerate all individual PNGs
and the bundle from the source sheets.

## Delivered from the supplied police-academy sheets

The menu, case picker, board location card, and interactive scene surfaces now use the extracted academy environments. See `SOURCE-MAP.md`.

## Priority 1 — story-specific replacements

- Twelve label-free portraits are assigned to the two playable cases. Cards with
  printed identities are never assigned to differently named story characters.
- The captain reference card and paper stack furnish the opening menu.
- Red and compass card backs identify the theft and homicide case files.
- Four supplied symbols identify link, notebook, hint, and accusation controls.
- The ruled-paper sprite textures dialogue responses and notebook entries.

## Not present in these sheets

Create one consistent, documentary-style portrait per named character. Chest-up,
neutral expression, soft window light, plain warm-gray background, culturally
appropriate contemporary Omani clothing, no uniforms unless the story requires
one. Export each as 800×1000 WebP under `assets/characters/` using a lowercase
hyphenated character name. The UI will eventually need a square-safe face crop.

## Priority 3 — evidence

Create straight-on forensic record photographs on a neutral gray evidence table.
Use a color card and metric scale only when plausible. Required groups currently
include the hotel keycard/access log, CCTV still, safe fingerprint, restaurant
log, missing notepad sheet, and the Villa study objects referenced in the playable
case. Export 1200×900 WebP under `assets/evidence/`; avoid legible personal data.

## Integration rule

For story-specific imagery that is not present in the supplied academy sheets, the interface must show an intentional blank panel
with **Missing image** and the asset title rather than generating unrelated
cartoon artwork. New assets should be reviewed at menu, card, modal, and mobile
sizes before replacing a blank.
