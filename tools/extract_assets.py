#!/usr/bin/env python3
"""Reproducibly extract hand-inspected regions from the supplied art sheets."""

from __future__ import annotations

import argparse
from pathlib import Path
from PIL import Image

EXPECTED_SIZE = (1536, 1024)

SHEETS = {
    "characters": {
        "ahmed-al-kindi": (22, 26, 306, 493), "laila-hassan": (327, 26, 611, 493),
        "dr-faisal-nasr": (628, 26, 912, 493), "captain-al-maamari": (929, 26, 1215, 493),
        "nora-salim": (1230, 26, 1516, 493), "salim-al-balushi": (22, 514, 306, 985),
        "yusuf-al-harthi": (326, 514, 611, 985), "mariam-al-zadjali": (628, 514, 912, 985),
        "confidential-unknown": (930, 514, 1215, 985), "dr-samira-al-lawati": (1230, 514, 1517, 985),
    },
    "locations": {
        "police-academy": (8, 11, 505, 435), "interrogation-room": (519, 11, 1017, 435),
        "office": (1030, 11, 1528, 435), "evidence-room": (8, 448, 505, 823),
        "parking-lot": (519, 448, 1017, 823), "hallway": (1030, 448, 1528, 823),
    },
    "ui": {
        "case-file": (35, 24, 426, 307), "evidence-card": (450, 29, 667, 303),
        "person-card": (688, 31, 904, 293), "dialogue-panel": (41, 323, 728, 444),
        "note": (905, 314, 1093, 453), "leads": (1119, 318, 1325, 460),
        "evidence-board": (220, 469, 562, 733), "details-panel": (579, 470, 1038, 716),
        "log-panel": (1062, 479, 1262, 735), "hints-panel": (1284, 482, 1502, 617),
        "conclusions-panel": (1284, 632, 1502, 742), "time-display": (39, 913, 538, 995),
        "navigation-toast": (578, 914, 971, 995), "navigation-buttons": (1004, 919, 1502, 988),
    },
    "icons": {
        "category-people": (930, 27, 1019, 135), "category-places": (1027, 27, 1116, 135),
        "category-objects": (1123, 27, 1212, 135), "category-documents": (1220, 27, 1309, 135),
        "category-events": (1317, 27, 1406, 135), "category-theories": (1414, 27, 1503, 135),
        "status-confirmed": (977, 223, 1039, 282), "status-observed": (1083, 223, 1145, 282),
        "status-related": (1188, 223, 1251, 282), "status-contradicts": (1291, 223, 1353, 282),
        "status-unknown": (1395, 223, 1457, 282),
    },
}

ALIASES = {
    "characters": ("characters", "character", "character-sheet"),
    "locations": ("locations", "location", "location-sheet"),
    "ui": ("ui", "interface", "ui-sheet"),
}

def locate(root: Path, kind: str) -> Path:
    for stem in ALIASES[kind]:
        for suffix in (".png", ".jpg", ".jpeg", ".webp"):
            candidate = root / f"{stem}{suffix}"
            if candidate.exists():
                return candidate
    raise FileNotFoundError(f"No {kind} sheet found in {root} (accepted names: {', '.join(ALIASES[kind])})")

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=Path("/source-assets"))
    parser.add_argument("--output", type=Path, default=Path("assets"))
    args = parser.parse_args()

    opened = {kind: Image.open(locate(args.source, kind)).convert("RGB") for kind in ALIASES}
    for kind, image in opened.items():
        if image.size != EXPECTED_SIZE:
            raise ValueError(f"{kind} sheet is {image.size}; expected {EXPECTED_SIZE}. Refusing unsafe crops.")

    for group, regions in SHEETS.items():
        sheet = opened["ui" if group in ("ui", "icons") else group]
        target = args.output / group
        target.mkdir(parents=True, exist_ok=True)
        for name, box in regions.items():
            crop = sheet.crop(box)
            crop.save(target / f"{name}.webp", "WEBP", quality=92, method=6)
            print(f"{group}/{name}.webp <- {box} ({crop.width}x{crop.height})")

if __name__ == "__main__":
    main()
