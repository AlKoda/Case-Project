#!/usr/bin/env python3
"""Unwrap the legacy art into real PNG files at the manifest's documented paths.

The original assets are PNG images base64-encoded inside an SVG wrapper, a
workaround for a transport that accepted text only. That restriction is gone, so
this script recovers the PNGs and writes them where the asset manifest looks for
them:

    assets/backgrounds/<id>.png              1920x1080, the room behind the scene
    assets/characters/<id>/neutral.png       transparent bust or full figure
    assets/evidence/<id>.png                 square, transparent

The result is placeholder art sitting in the exact slots the finished art will
occupy, so replacing a placeholder means overwriting one file -- no code change,
no manifest edit. Re-running is safe: every file is rewritten from the legacy
source, so hand-made art should be committed under its final name, not left as a
placeholder this script would overwrite.

    python3 tools/extract_placeholders.py [--force]

Existing files are kept unless --force is given, so your own art is never
clobbered by a routine re-run.
"""

from __future__ import annotations

import argparse
import base64
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPRITES = ROOT / "assets" / "sprites.js"

# Legacy sprite key -> character id. The sprite sheet has no one matching our
# cast; these are stand-ins chosen for silhouette and mood only.
CHARACTERS = {
    "cole": "portrait-man-profile",
    "calloway": "portrait-woman-magenta",
    "brennan": "portrait-man-red",
    "finch": "portrait-man-glasses",
    "roy": "portrait-woman-headscarf",
    "vance": "portrait-older-man-gold",
}

# Background id -> legacy SVG holding the embedded PNG.
BACKGROUNDS = {
    "interview-room": "locations/interrogation-room.svg",
    "precinct-desk": "locations/office.svg",
    "hotel-stairs": "locations/hallway.svg",
    "evidence-room": "locations/evidence-room.svg",
    "rain-street": "locations/parking-lot.svg",
}

# Evidence id -> legacy SVG. Chosen for rough visual kinship with the exhibit.
EVIDENCE = {
    "stair-bulb": "props/desk-lamp.svg",
    "switchboard-log": "ui/paper-lined.svg",
    "ledger": "ui/book-red.svg",
    "pocket-watch": "ui/evidence-card.svg",
    "sequin": "ui/card-red.svg",
    "umbrella": "props/evidence-bag.svg",
}

DATA_URI = re.compile(r"data:image/png;base64,([A-Za-z0-9+/=]+)")


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def png_from_svg(path: Path) -> bytes:
    """Pull the first embedded PNG out of an SVG wrapper."""

    match = DATA_URI.search(path.read_text(encoding="utf-8"))
    if not match:
        fail(f"{path.relative_to(ROOT)} has no embedded PNG to unwrap")
    return base64.b64decode(match.group(1))


def sprite_table() -> dict[str, bytes]:
    """Decode assets/sprites.js without executing it."""

    if not SPRITES.is_file():
        fail("assets/sprites.js is missing; nothing to unwrap")
    source = SPRITES.read_text(encoding="utf-8")
    table: dict[str, bytes] = {}
    # Entries look like:  "key": [ "chunk", "chunk", ].join(""),
    for entry in re.finditer(r'"([a-z0-9-]+)":\s*\[', source):
        key = entry.group(1)
        end = source.find('].join(""', entry.end())
        if end == -1:
            continue
        joined = "".join(re.findall(r'"([^"]*)"', source[entry.end():end]))
        match = DATA_URI.fullmatch(joined)
        if match:
            table[key] = base64.b64decode(match.group(1))
    return table


def dimensions(png: bytes) -> tuple[int, int]:
    """Read width and height out of the PNG IHDR chunk."""

    return int.from_bytes(png[16:20], "big"), int.from_bytes(png[20:24], "big")


def write(target: Path, payload: bytes, force: bool, report: list[str]) -> None:
    relative = target.relative_to(ROOT)
    if target.exists() and not force:
        report.append(f"  kept      {relative} (already present)")
        return
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(payload)
    width, height = dimensions(payload)
    report.append(f"  wrote     {relative}  {width}x{height}  {len(payload) // 1024} KB")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--force", action="store_true", help="overwrite files that already exist")
    args = parser.parse_args()

    report: list[str] = []
    sprites = sprite_table()

    missing = sorted(set(CHARACTERS.values()) - set(sprites))
    if missing:
        fail(f"sprite sheet is missing expected keys: {', '.join(missing)}")

    print("Characters")
    for character, key in CHARACTERS.items():
        write(ROOT / "assets" / "characters" / character / "neutral.png", sprites[key], args.force, report)
    print("\n".join(report)); report.clear()

    print("Backgrounds")
    for name, source in BACKGROUNDS.items():
        write(ROOT / "assets" / "backgrounds" / f"{name}.png", png_from_svg(ROOT / "assets" / source), args.force, report)
    print("\n".join(report)); report.clear()

    print("Evidence")
    for name, source in EVIDENCE.items():
        write(ROOT / "assets" / "evidence" / f"{name}.png", png_from_svg(ROOT / "assets" / source), args.force, report)
    print("\n".join(report))

    print("\nPlaceholders are in place. Replace any one of them by overwriting the")
    print("file at the same path -- the game picks it up with no code change.")


if __name__ == "__main__":
    main()
