#!/usr/bin/env python3
"""Slice supplied UI atlases into merge-friendly SVG-wrapped image assets."""

from __future__ import annotations

import argparse
import base64
from io import BytesIO
from pathlib import Path
from PIL import Image

EXPECTED_SIZE = (1536, 1024)

# Rectangles are hand measured, inclusive-exclusive.  They intentionally keep
# painted edges and shadows; this is an atlas, not an evenly spaced sprite grid.
SHEETS = {
    "ui-part1": {
        "ui": {
            "case-file": (27, 91, 392, 337),
            "evidence-card": (418, 91, 634, 341),
            "person-card": (666, 91, 896, 333),
            "dialogue-panel": (27, 387, 644, 504),
            "note": (844, 386, 1040, 511),
            "leads": (1068, 386, 1310, 515),
            "inventory-grid": (27, 544, 223, 757),
            "evidence-board": (242, 543, 557, 757),
            "details-panel": (579, 543, 1028, 750),
            "log-panel": (1049, 547, 1264, 757),
            "hints-panel": (1287, 550, 1510, 650),
            "conclusions-panel": (1287, 658, 1510, 758),
            "book-blue": (608, 786, 689, 906),
            "book-green": (702, 786, 783, 906),
            "book-paper": (794, 786, 877, 906),
            "book-red": (888, 786, 970, 906),
            "book-purple": (980, 786, 1061, 906),
            "time-display": (28, 936, 490, 1008),
            "notification-bar": (521, 936, 920, 1008),
            "button-new-case": (951, 942, 1053, 998),
            "button-save": (1061, 942, 1162, 998),
            "button-load": (1172, 942, 1271, 998),
            "button-settings": (1281, 942, 1394, 998),
            "button-exit": (1403, 942, 1510, 998),
        },
        "icons": {
            "category-people": (936, 68, 1023, 161),
            "category-places": (1027, 68, 1116, 161),
            "category-objects": (1121, 68, 1208, 161),
            "category-documents": (1213, 68, 1301, 161),
            "category-events": (1308, 68, 1398, 161),
            "category-theories": (1405, 68, 1495, 161),
            "action-search": (946, 190, 1022, 240),
            "action-observe": (1039, 190, 1115, 240),
            "action-listen": (1132, 190, 1208, 240),
            "action-talk": (1226, 190, 1301, 240),
            "action-analyze": (1319, 190, 1395, 240),
            "status-confirmed": (961, 285, 1017, 339),
            "status-observed": (1072, 285, 1128, 339),
            "status-related": (1183, 285, 1239, 339),
            "status-contradicts": (1294, 285, 1350, 339),
            "status-unknown": (1405, 285, 1461, 339),
        },
    },
    "ui-part2": {
        "ui": {
            "popup-information": (18, 100, 215, 286),
            "popup-confirmation": (224, 100, 425, 286),
            "popup-alert": (432, 88, 606, 290),
            "toast-success": (630, 101, 945, 148),
            "toast-info": (630, 151, 945, 196),
            "toast-warning": (630, 199, 945, 244),
            "toast-error": (630, 247, 945, 292),
            "objectives": (966, 102, 1238, 293),
            "tab-description": (28, 328, 145, 360),
            "tab-details": (145, 328, 245, 360),
            "tab-links": (245, 328, 347, 360),
            "tab-notes": (347, 328, 451, 360),
            "tooltip": (483, 337, 769, 407),
            "context-menu": (990, 341, 1177, 565),
            "filter-controls": (1196, 341, 1371, 516),
            "card-paper": (377, 438, 478, 591),
            "card-blue": (490, 438, 593, 591),
            "card-red": (604, 438, 708, 591),
            "card-green": (718, 438, 823, 591),
            "card-purple": (835, 438, 941, 591),
            "portrait-blue": (375, 621, 520, 752),
            "portrait-red": (531, 621, 675, 752),
            "portrait-gold": (687, 621, 832, 752),
            "portrait-purple": (843, 621, 987, 752),
            "progress-bars": (1008, 603, 1289, 761),
            "paper-clipped": (685, 791, 773, 895),
            "paper-note": (783, 791, 872, 895),
            "paper-lined": (878, 787, 985, 904),
            "paper-torn": (993, 812, 1096, 919),
        },
        "icons": {
            "pin-important": (28, 792, 77, 869),
            "pin-person": (84, 792, 132, 869),
            "pin-vehicle": (139, 792, 187, 869),
            "pin-building": (194, 792, 242, 869),
            "pin-search": (247, 792, 296, 869),
            "pin-alert": (299, 792, 347, 869),
            "misc-icons": (1181, 795, 1505, 915),
        },
    },
}


def locate(root: Path, stem: str) -> Path:
    for suffix in (".png", ".jpg", ".jpeg", ".webp"):
        candidate = root / f"{stem}{suffix}"
        if candidate.exists():
            return candidate
    raise FileNotFoundError(f"No {stem} sheet found in {root}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=Path("source-assets"))
    parser.add_argument("--output", type=Path, default=Path("assets"))
    args = parser.parse_args()

    count = 0
    for sheet_name, groups in SHEETS.items():
        image = Image.open(locate(args.source, sheet_name)).convert("RGB")
        if image.size != EXPECTED_SIZE:
            raise ValueError(f"{sheet_name} is {image.size}; expected {EXPECTED_SIZE}")
        for group, regions in groups.items():
            target = args.output / group
            target.mkdir(parents=True, exist_ok=True)
            for name, box in regions.items():
                crop = image.crop(box)
                encoded = BytesIO()
                crop.save(encoded, "PNG", optimize=True)
                payload = base64.b64encode(encoded.getvalue()).decode("ascii")
                svg = (
                    f'<svg xmlns="http://www.w3.org/2000/svg" width="{crop.width}" '
                    f'height="{crop.height}" viewBox="0 0 {crop.width} {crop.height}">\n'
                    f'  <image width="{crop.width}" height="{crop.height}" '
                    f'href="data:image/png;base64,{payload}"/>\n</svg>\n'
                )
                (target / f"{name}.svg").write_text(svg, encoding="ascii")
                print(f"{group}/{name}.svg <- {sheet_name} {box} ({crop.width}x{crop.height})")
                count += 1
    print(f"Extracted {count} assets.")


if __name__ == "__main__":
    main()
