# Source sheet extraction map

Coordinates are inclusive-exclusive pixel rectangles in the original
1536×1024 sheets (`left, top, right, bottom`). A two-pixel dark surround is
kept where it is part of the artwork; the neighboring cards are excluded.

## Character sheet

| Source region | Output | Use |
|---|---|---|
| `22,26,306,493` | `characters/ahmed-al-kindi.webp` | Complete reference character card |
| `327,26,611,493` | `characters/laila-hassan.webp` | Complete reference character card |
| `628,26,912,493` | `characters/dr-faisal-nasr.webp` | Complete reference character card |
| `929,26,1215,493` | `characters/captain-al-maamari.webp` | Complete reference character card |
| `1230,26,1516,493` | `characters/nora-salim.webp` | Complete reference character card |
| `22,514,306,985` | `characters/salim-al-balushi.webp` | Complete reference character card |
| `326,514,611,985` | `characters/yusuf-al-harthi.webp` | Complete reference character card |
| `628,514,912,985` | `characters/mariam-al-zadjali.webp` | Complete reference character card |
| `930,514,1215,985` | `characters/confidential-unknown.webp` | Complete reference character card |
| `1230,514,1517,985` | `characters/dr-samira-al-lawati.webp` | Complete reference character card |

These names do not correspond to the playable cases' cast, so the complete
cards are retained as organized production assets rather than incorrectly
substituted for existing suspects.

## Location sheet

| Source region | Output | Use |
|---|---|---|
| `8,11,505,435` | `locations/police-academy.webp` | Academy splash backdrop |
| `519,11,1017,435` | `locations/interrogation-room.webp` | Interview panel atmosphere |
| `1030,11,1528,435` | `locations/office.webp` | Notebook atmosphere |
| `8,448,505,823` | `locations/evidence-room.webp` | Investigation board backdrop |
| `519,448,1017,823` | `locations/parking-lot.webp` | Reserved location card |
| `1030,448,1528,823` | `locations/hallway.webp` | Reserved location card |

The six small images at `y ≈ 847–997` are alternates and are intentionally not
exported or used in place of the primary cards.

## UI sheet

| Source region | Output | Use |
|---|---|---|
| `35,24,426,307` | `ui/case-file.webp` | Case-select card paper texture |
| `450,29,667,303` | `ui/evidence-card.webp` | Evidence card surface |
| `688,31,904,293` | `ui/person-card.webp` | Person card surface |
| `41,323,728,444` | `ui/dialogue-panel.webp` | Interview response surface |
| `905,314,1093,453` | `ui/note.webp` | Notebook note surface |
| `1119,318,1325,460` | `ui/leads.webp` | Leads tab surface |
| `220,469,562,733` | `ui/evidence-board.webp` | Board visual texture |
| `579,470,1038,716` | `ui/details-panel.webp` | Detail panel surface |
| `1062,479,1262,735` | `ui/log-panel.webp` | Log panel surface |
| `1284,482,1502,617` | `ui/hints-panel.webp` | Hint panel surface |
| `1284,632,1502,742` | `ui/conclusions-panel.webp` | Conclusion panel surface |
| `39,913,538,995` | `ui/time-display.webp` | Clock/toolbar atmosphere |
| `578,914,971,995` | `ui/navigation-toast.webp` | Toast atmosphere |
| `1004,919,1502,988` | `ui/navigation-buttons.webp` | Navigation button reference |
| `930,27,1019,135` | `icons/category-people.webp` | Reusable category icon |
| `1027,27,1116,135` | `icons/category-places.webp` | Reusable category icon |
| `1123,27,1212,135` | `icons/category-objects.webp` | Reusable category icon |
| `1220,27,1309,135` | `icons/category-documents.webp` | Reusable category icon |
| `1317,27,1406,135` | `icons/category-events.webp` | Reusable category icon |
| `1414,27,1503,135` | `icons/category-theories.webp` | Reusable category icon |
| `977,223,1039,282` | `icons/status-confirmed.webp` | Confirmed status artwork |
| `1083,223,1145,282` | `icons/status-observed.webp` | Observed status artwork |
| `1188,223,1251,282` | `icons/status-related.webp` | Related status artwork |
| `1291,223,1353,282` | `icons/status-contradicts.webp` | Contradiction status artwork |
| `1395,223,1457,282` | `icons/status-unknown.webp` | Unknown status artwork |

Buttons, labels, text fields, tabs, and dynamic status text remain HTML so they
stay accessible, translatable, responsive, and interactive. The corresponding
sheet regions are references/textures rather than replacements for controls.
