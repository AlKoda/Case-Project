#!/usr/bin/env python3
"""Import reference art, skipping anything the project already has.

    python3 tools/import_reference.py --into design/character-sheets \\
            --name man-40s-doctor /path/to/upload.png
    python3 tools/import_reference.py --into design/ui-reference --report-only <files...>

Art arrives in batches, often with overlap between batches, and a duplicate is
easy to miss by eye when twelve sheets share a style. This compares by **pixel
content** rather than file bytes, so a file that has been re-encoded, re-saved
or losslessly optimised is still recognised as the same picture -- which matters
here, because everything that lands in the repository gets re-encoded on the way
in.

Two fingerprints are taken of every image:

* an exact hash of the decoded pixels, which settles whether two files *are* the
  same picture;
* a pair of near-match signatures -- a difference hash for structure and a
  small colour signature -- which catch a rescale, a re-crop or a re-export at
  another quality. Both have to agree before anything is flagged: a batch of
  expression sheets shares a layout, so structure alone calls every one of them
  a near-match of every other. They are reported for a human to judge rather
  than acted on, because "nearly the same" is not a decision a script should
  make about somebody's artwork.

Nothing is ever overwritten. A name that is taken is reported and skipped.
"""

from __future__ import annotations

import argparse
import hashlib
import shutil
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    print("ERROR: this tool needs Pillow (pip install pillow)", file=sys.stderr)
    raise SystemExit(1)

ROOT = Path(__file__).resolve().parents[1]

# Where to look for pictures the project already has.
SEARCHED = ("design", "assets")

# A near-match has to be close on both signatures. Identical images score 0 on
# each; a re-encode stays near 0; twelve different people photographed to the
# same grid score low on structure and high on colour, which is the case these
# thresholds exist to tell apart.
NEAR_STRUCTURE = 6
NEAR_COLOUR = 4.0


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def exact_hash(image: Image.Image) -> str:
    """Hash the decoded pixels, so re-encoding does not change the answer."""
    canonical = image.convert("RGBA")
    return hashlib.sha256(canonical.tobytes()).hexdigest()


def difference_hash(image: Image.Image, size: int = 8) -> int:
    """A 64-bit perceptual hash: is each pixel brighter than the one to its right?"""
    small = image.convert("L").resize((size + 1, size), Image.LANCZOS)
    pixels = small.load()
    bits = 0
    for y in range(size):
        for x in range(size):
            bits = (bits << 1) | (1 if pixels[x, y] > pixels[x + 1, y] else 0)
    return bits


def colour_signature(image: Image.Image, size: int = 16) -> list[tuple[int, int, int]]:
    """A coarse colour thumbnail: what the picture is *of*, not how it is laid out."""
    return list(image.convert("RGB").resize((size, size), Image.LANCZOS).getdata())


def distance(a: int, b: int) -> int:
    return bin(a ^ b).count("1")


def colour_distance(a, b) -> float:
    """Mean per-channel difference. 0 is identical; a re-encode stays under 1."""
    total = sum(abs(p[0] - q[0]) + abs(p[1] - q[1]) + abs(p[2] - q[2]) for p, q in zip(a, b))
    return total / (len(a) * 3)


def index_existing() -> list[tuple[Path, str, int, list]]:
    """Fingerprint every picture already in the repository."""
    found = []
    for folder in SEARCHED:
        base = ROOT / folder
        if not base.is_dir():
            continue
        for path in sorted(base.rglob("*")):
            if path.suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp"}:
                continue
            try:
                with Image.open(path) as image:
                    found.append((path, exact_hash(image), difference_hash(image), colour_signature(image)))
            except Exception as error:  # a file we cannot read is not a duplicate
                print(f"  (could not read {path.relative_to(ROOT)}: {error})")
    return found


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("sources", nargs="+", help="image files to import")
    parser.add_argument("--into", help="destination directory, relative to the repository root")
    parser.add_argument(
        "--name",
        action="append",
        default=[],
        help="destination stem for each source, in order; repeat once per file",
    )
    parser.add_argument(
        "--report-only",
        action="store_true",
        help="say what would happen and write nothing",
    )
    args = parser.parse_args()

    if not args.report_only and not args.into:
        fail("--into is required unless --report-only is given")
    if args.name and len(args.name) != len(args.sources):
        fail(f"{len(args.sources)} files but {len(args.name)} names; give one name per file or none")

    print(f"Indexing what the project already has, under {', '.join(SEARCHED)}/")
    existing = index_existing()
    print(f"  {len(existing)} picture(s) fingerprinted\n")

    destination = (ROOT / args.into) if args.into else None
    if destination and not args.report_only:
        destination.mkdir(parents=True, exist_ok=True)

    imported = skipped = flagged = 0
    # Fingerprints of what this run has already taken, so a batch that repeats
    # itself is caught as well as one that repeats the repository.
    batch: list[tuple[str, str, int]] = []

    for index, source in enumerate(args.sources):
        path = Path(source)
        if not path.is_file():
            fail(f"no such file: {source}")
        with Image.open(path) as image:
            image.load()
            digest = exact_hash(image)
            perceptual = difference_hash(image)
            palette = colour_signature(image)
            mode, size = image.mode, image.size
            keep = image.copy()

        stem = args.name[index] if args.name else path.stem
        label = f"{stem}{'.png'}"

        twin = next((p for p, h, _, _ in existing if h == digest), None)
        if twin is None:
            twin_name = next((n for n, h, _, _ in batch if h == digest), None)
            if twin_name:
                print(f"SKIP  {label}\n      identical to {twin_name}, earlier in this batch")
                skipped += 1
                continue
        else:
            print(f"SKIP  {label}\n      identical to {twin.relative_to(ROOT)}")
            skipped += 1
            continue

        def near(candidates, name_of):
            out = []
            for item in candidates:
                structure = distance(perceptual, item[2])
                colour = colour_distance(palette, item[3])
                if structure <= NEAR_STRUCTURE and colour <= NEAR_COLOUR:
                    out.append((name_of(item[0]), structure, colour))
            return out

        close = near(existing, lambda p: p.relative_to(ROOT)) + near(batch, Path)

        if args.report_only:
            print(f"NEW   {label}  {size[0]}x{size[1]} {mode}")
        else:
            target = destination / label
            if target.exists():
                print(f"SKIP  {label}\n      a different picture already has that name")
                skipped += 1
                continue
            # Re-encode losslessly; drop an alpha channel that holds nothing.
            out = keep
            if out.mode == "RGBA" and out.getchannel("A").getextrema()[0] == 255:
                out = out.convert("RGB")
            out.save(target, format="PNG", optimize=True)
            before = path.stat().st_size
            after = target.stat().st_size
            print(f"NEW   {target.relative_to(ROOT)}  {size[0]}x{size[1]}  {before // 1024} -> {after // 1024} KB")

        for relative, structure, colour in close:
            print(f"      ~ close to {relative} (structure {structure}, colour {colour:.1f}) -- worth a look")
            flagged += 1

        batch.append((label, digest, perceptual, palette))
        imported += 1

    print(f"\n{imported} imported, {skipped} skipped as duplicates", end="")
    print(f", {flagged} near-match(es) flagged" if flagged else "")


if __name__ == "__main__":
    main()
