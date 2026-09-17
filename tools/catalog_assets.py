#!/usr/bin/env python3
"""Inventory runtime artwork and validate the asset-folder contract."""

from __future__ import annotations

import argparse
import hashlib
import json
import struct
import sys
import zlib
from dataclasses import asdict, dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
CATALOG = ASSETS / "catalog.json"
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"


@dataclass(frozen=True)
class Art:
    path: str
    kind: str
    width: int
    height: int
    alpha: bool
    bytes: int
    sha256: str


def png_info(path: Path) -> tuple[int, int, bool]:
    """Return width, height and whether a valid PNG can represent transparency."""
    data = path.read_bytes()
    if not data.startswith(PNG_SIGNATURE) or len(data) < 33:
        raise ValueError(f"{path.relative_to(ROOT)} is not a PNG")
    length = struct.unpack(">I", data[8:12])[0]
    if data[12:16] != b"IHDR" or length != 13:
        raise ValueError(f"{path.relative_to(ROOT)} has no PNG IHDR")
    width, height, _depth, colour, compression, filtering, interlace = struct.unpack(
        ">IIBBBBB", data[16:29]
    )
    if not width or not height or compression or filtering or interlace not in (0, 1):
        raise ValueError(f"{path.relative_to(ROOT)} has an invalid PNG header")
    has_trns = False
    offset = 8
    saw_end = False
    while offset + 12 <= len(data):
        chunk_length = struct.unpack(">I", data[offset:offset + 4])[0]
        chunk_end = offset + 12 + chunk_length
        if chunk_end > len(data):
            raise ValueError(f"{path.relative_to(ROOT)} has a truncated PNG chunk")
        chunk_type = data[offset + 4:offset + 8]
        chunk_data = data[offset + 8:offset + 8 + chunk_length]
        expected_crc = struct.unpack(">I", data[offset + 8 + chunk_length:chunk_end])[0]
        if zlib.crc32(chunk_type + chunk_data) & 0xFFFFFFFF != expected_crc:
            raise ValueError(f"{path.relative_to(ROOT)} has a corrupt PNG chunk")
        has_trns = has_trns or chunk_type == b"tRNS"
        if chunk_type == b"IEND":
            saw_end = True
            break
        offset = chunk_end
    if not saw_end:
        raise ValueError(f"{path.relative_to(ROOT)} has no PNG IEND")
    return width, height, colour in (4, 6) or has_trns


def classify(path: Path) -> str | None:
    parts = path.relative_to(ASSETS).parts
    if len(parts) == 2 and parts[0] == "backgrounds":
        return "background"
    if len(parts) == 2 and parts[0] == "evidence":
        return "evidence"
    if len(parts) == 3 and parts[0] == "characters":
        return "bust" if parts[2].startswith("bust") else "stage"
    return None


def inventory() -> list[Art]:
    art: list[Art] = []
    for path in sorted(ASSETS.rglob("*.png")):
        kind = classify(path)
        if kind is None:
            continue
        width, height, alpha = png_info(path)
        payload = path.read_bytes()
        art.append(Art(path.relative_to(ROOT).as_posix(), kind, width, height, alpha,
                       len(payload), hashlib.sha256(payload).hexdigest()))
    return art


def warnings(art: list[Art]) -> list[str]:
    notes: list[str] = []
    for item in art:
        if item.kind == "background" and (item.width < 1920 or item.height < 1080):
            notes.append(f"{item.path}: {item.width}x{item.height}; background target is 1920x1080")
        elif item.kind == "stage" and item.height != 1400:
            notes.append(f"{item.path}: height is {item.height}; stage target is 1400")
        elif item.kind in ("bust", "evidence") and (item.width, item.height) != (512, 512):
            notes.append(f"{item.path}: {item.width}x{item.height}; {item.kind} target is 512x512")
        if item.kind in ("stage", "bust", "evidence") and not item.alpha:
            notes.append(f"{item.path}: has no transparency channel")
    return notes


def rendered() -> str:
    art = inventory()
    document = {"schema": 1, "generatedBy": "python3 tools/catalog_assets.py --write",
                "assets": [asdict(item) for item in art], "warnings": warnings(art)}
    return json.dumps(document, indent=2, ensure_ascii=False) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--write", action="store_true", help="refresh assets/catalog.json")
    mode.add_argument("--check", action="store_true", help="verify the checked-in catalog")
    mode.add_argument("--report", action="store_true", help="print a human-readable audit")
    args = parser.parse_args()
    try:
        output = rendered()
    except ValueError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1) from error
    if args.write:
        CATALOG.write_text(output, encoding="utf-8")
        print(f"wrote {CATALOG.relative_to(ROOT)}")
    elif args.check:
        if not CATALOG.is_file() or CATALOG.read_text(encoding="utf-8") != output:
            print("ERROR: assets/catalog.json is stale; run tools/catalog_assets.py --write", file=sys.stderr)
            raise SystemExit(1)
        print(f"assets:    {len(inventory())} PNGs catalogued; catalog is current")
    else:
        items = inventory()
        print(f"{len(items)} runtime PNGs")
        for note in warnings(items):
            print(f"warning: {note}")


if __name__ == "__main__":
    main()
