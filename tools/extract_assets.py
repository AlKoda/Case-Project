#!/usr/bin/env python3
"""Extract the two supplied 1536x1024 sprite sheets without external tools."""

from __future__ import annotations

import argparse
import base64
import binascii
import struct
import zlib
from pathlib import Path

SIZE = (1536, 1024)

NAMED = {
    "ahmed-al-kindi": (22, 26, 306, 493), "laila-hassan": (327, 26, 611, 493),
    "dr-faisal-nasr": (628, 26, 912, 493), "captain-al-maamari": (929, 26, 1215, 493),
    "nora-salim": (1230, 26, 1516, 493), "salim-al-balushi": (22, 514, 306, 985),
    "yusuf-al-harthi": (326, 514, 611, 985), "mariam-al-zadjali": (628, 514, 912, 985),
    "confidential-unknown": (930, 514, 1215, 985), "dr-samira-al-lawati": (1230, 514, 1517, 985),
}

CARD_X = [(18, 190), (199, 372), (382, 554), (562, 731), (741, 910), (920, 1090)]
CARD_Y = [(15, 275), (285, 544), (554, 814)]
PORTRAIT_NAMES = [
    "officer", "man-red", "woman-purple", "young-man-teal", "analyst-red", "older-man",
    "woman-headscarf", "man-glasses", "young-man-cap", "woman-magenta", "man-profile", "woman-bob",
    "detective-hat", "woman-blonde", "man-blue", "woman-red", "older-man-gold", "young-man-blue",
]
ICON_NAMES = [
    "police", "person", "group", "briefcase", "education", "medical", "cafe", "document", "key", "location", "vehicle", "camera",
    "search", "witness", "audio", "dialogue", "fingerprint", "unknown", "agreement", "heart", "broken-heart", "justice", "money", "star",
    "medical-cross", "city", "book", "settings", "laboratory", "nature", "danger", "fire", "warning", "network", "time", "mask",
]

BUNDLE = {
    **{f"portrait-{name}": f"characters/{name}.png" for name in (
        "man-red", "man-blue", "woman-purple", "analyst-red", "man-glasses", "young-man-cap",
        "young-man-teal", "woman-headscarf", "older-man-gold", "woman-magenta", "man-profile", "older-man",
    )},
    "menu-captain": "characters/reference/captain-al-maamari.png",
    "ui-paper-stack": "ui/paper-stack.png", "ui-notebook-page": "ui/notebook-page.png",
    "icon-network": "icons/network.png", "icon-document": "icons/document.png",
    "icon-warning": "icons/warning.png", "icon-justice": "icons/justice.png",
    "card-back-red": "cards/back-red.png", "card-back-compass": "cards/back-compass.png",
}


class PNG:
    def __init__(self, path: Path):
        blob = path.read_bytes()
        if blob[:8] != b"\x89PNG\r\n\x1a\n":
            raise ValueError(f"{path} is not a PNG")
        pos, data = 8, bytearray()
        self.color = None
        while pos < len(blob):
            n = struct.unpack(">I", blob[pos:pos + 4])[0]
            kind, payload = blob[pos + 4:pos + 8], blob[pos + 8:pos + 8 + n]
            pos += n + 12
            if kind == b"IHDR":
                self.width, self.height, depth, self.color, comp, filt, interlace = struct.unpack(">IIBBBBB", payload)
                if depth != 8 or self.color not in (2, 6) or interlace:
                    raise ValueError("Only non-interlaced 8-bit RGB/RGBA sheets are supported")
            elif kind == b"IDAT": data.extend(payload)
            elif kind == b"IEND": break
        self.channels = 3 if self.color == 2 else 4
        stride = self.width * self.channels
        raw, offset, prior = zlib.decompress(data), 0, bytearray(stride)
        self.rows = []
        for _ in range(self.height):
            mode, scan = raw[offset], bytearray(raw[offset + 1:offset + stride + 1]); offset += stride + 1
            for x in range(stride):
                left = scan[x - self.channels] if x >= self.channels else 0
                up = prior[x]
                ul = prior[x - self.channels] if x >= self.channels else 0
                if mode == 1: scan[x] = (scan[x] + left) & 255
                elif mode == 2: scan[x] = (scan[x] + up) & 255
                elif mode == 3: scan[x] = (scan[x] + ((left + up) >> 1)) & 255
                elif mode == 4:
                    p = left + up - ul; pa, pb, pc = abs(p-left), abs(p-up), abs(p-ul)
                    scan[x] = (scan[x] + (left if pa <= pb and pa <= pc else up if pb <= pc else ul)) & 255
                elif mode != 0: raise ValueError(f"Unsupported PNG filter {mode}")
            self.rows.append(bytes(scan)); prior = scan

    def crop(self, box: tuple[int, int, int, int], target: Path) -> None:
        left, top, right, bottom = box; width, height = right-left, bottom-top
        scan = b"".join(b"\0" + row[left*self.channels:right*self.channels] for row in self.rows[top:bottom])
        def chunk(kind: bytes, payload: bytes) -> bytes:
            return struct.pack(">I", len(payload)) + kind + payload + struct.pack(">I", binascii.crc32(kind + payload) & 0xffffffff)
        out = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, self.color, 0, 0, 0))
        out += chunk(b"IDAT", zlib.compress(scan, 9)) + chunk(b"IEND", b"")
        target.parent.mkdir(parents=True, exist_ok=True); target.write_bytes(out)


def find(root: Path, names: tuple[str, ...]) -> Path:
    for name in names:
        path = root / name
        if path.exists(): return path
    raise FileNotFoundError(f"Missing source sheet; expected one of: {', '.join(names)}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", type=Path, default=Path("/source-assets"))
    ap.add_argument("--output", type=Path, default=Path("assets"))
    args = ap.parse_args()
    named = PNG(find(args.source, ("named-characters.png", "image_1.png")))
    sprites = PNG(find(args.source, ("sprite-sheet.png", "image_2.png")))
    for image in (named, sprites):
        if (image.width, image.height) != SIZE: raise ValueError(f"Sheet must be {SIZE[0]}x{SIZE[1]}")
    for name, box in NAMED.items(): named.crop(box, args.output / "characters" / "reference" / f"{name}.png")
    for i, name in enumerate(PORTRAIT_NAMES):
        col, row = i % 6, i // 6; x1, x2 = CARD_X[col]; y1, _ = CARD_Y[row]
        sprites.crop((x1 + 4, y1 + 4, x2 - 4, y1 + 205), args.output / "characters" / f"{name}.png")
        sprites.crop((x1, CARD_Y[row][0], x2, CARD_Y[row][1]), args.output / "cards" / f"person-{name}.png")
    for i, name in enumerate(ICON_NAMES):
        col, row = i % 6, i // 6
        sprites.crop((1111 + col*68, 20 + row*80, 1168 + col*68, 77 + row*80), args.output / "icons" / f"{name}.png")
    for i in range(15):
        col, row = i % 5, i // 5
        sprites.crop((1104 + col*84, 531 + row*101, 1180 + col*84, 627 + row*101), args.output / "tokens" / f"silhouette-{i+1:02}.png")
    for i, name in enumerate(("blue", "red", "gold", "purple", "black", "compass")):
        sprites.crop((22 + i*152, 834, 166 + i*152, 999), args.output / "cards" / f"back-{name}.png")
    sprites.crop((950, 835, 1201, 1004), args.output / "ui" / "paper-stack.png")
    sprites.crop((1217, 848, 1510, 1007), args.output / "ui" / "notebook-page.png")
    bundle = ["/* Text-only data-URI bundle generated from the supplied sheets. */", "window.CASE_SPRITES = {"]
    for key, relative in BUNDLE.items():
        encoded = base64.b64encode((args.output / relative).read_bytes()).decode("ascii")
        chunks = ["data:image/png;base64," + encoded[:96]] + [encoded[i:i + 96] for i in range(96, len(encoded), 96)]
        bundle.append(f'  "{key}": [')
        bundle.extend(f'    "{chunk}",' for chunk in chunks)
        bundle.append('  ].join(""),')
    bundle.append("};\n")
    (args.output / "sprites.js").write_text("\n".join(bundle), encoding="ascii")


if __name__ == "__main__": main()
