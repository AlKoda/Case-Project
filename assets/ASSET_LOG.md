# Production asset log

This file records every visual that should replace a labeled blank or the current
prototype artwork. The direction is **grounded police-procedural drama**, not a
cartoon: restrained contrast, believable materials, natural skin texture, and a
muted slate / sand / oxblood palette. Avoid police trademarks, readable private
information, watermarks, exaggerated noir tropes, and graphic violence.

## Delivered from the supplied police-academy sheets

The menu, case picker, board location card, and interactive scene surfaces now use the extracted academy environments. See `SOURCE-MAP.md`.

## Priority 1 — story-specific replacements

| File to deliver | Use | Art direction | Crop / export |
| --- | --- | --- | --- |
| `ui/menu-archive.webp` | Main-menu key art | A quiet evidence archive in Muscat: steel shelving, case folders, archival boxes, a desk lamp just out of frame, subtle local architectural detail. No people, insignia, or readable labels. Photorealistic and understated. | Portrait-friendly 1600×2000; keep the center clear enough for responsive cropping. |
| `locations/muscat-grand-cover.webp` | Necklace case cover | An upscale hotel suite after investigators have arrived: open wall safe in the middle distance, evidence markers kept subtle, warm practical light against cool night light. No people. | 1600×700. |
| `locations/villa-al-nawras-cover.webp` | Villa case cover | Coastal villa study at night, desk and unlatched terrace door visible, sea haze beyond. No body, blood, people, or readable documents. | 1600×700. |

## Priority 2 — characters

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
