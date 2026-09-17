#!/usr/bin/env python3
"""Cut an expression sheet into one PNG per panel.

Character art arrives as a strip: the same person several times over, one
expression per panel, on a transparent background. The game wants them as
separate files, one per mood, at the paths the asset manifest looks for.

    python3 tools/slice_sheet.py sheet.png --person finch --moods neutral evasive cold broken

Panels are found by their transparency, not by dividing the width evenly:
columns whose alpha is effectively empty are treated as gutters, and each run
of non-empty columns between them is a panel. That survives panels of unequal
width and figures that are not centred in their slot.

Each panel is trimmed to its own content, then padded back out to a common
canvas, aligned bottom-centre. Keeping one canvas for every mood is what stops
a character jumping around the stage when their expression changes.
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    print("ERROR: this tool needs Pillow (pip install pillow)", file=sys.stderr)
    raise SystemExit(1)

ROOT = Path(__file__).resolve().parents[1]

# Alpha at or below this counts as background. Art often carries a faint glow
# rather than true zero, so a hard `== 0` would find one enormous panel.
FLOOR = 24
# A gutter must be at least this wide to split panels, so a gap inside a figure
# (between an arm and a body) is not mistaken for one.
MIN_GUTTER = 12
# Panels narrower than this fraction of the sheet are noise, not people.
MIN_PANEL = 0.04


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def column_weights(image: Image.Image) -> list[int]:
    """How much solid content each column holds."""
    alpha = image.getchannel("A")
    width, height = alpha.size
    data = alpha.load()
    return [sum(1 for y in range(height) if data[x, y] > FLOOR) for x in range(width)]


def find_panels(weights: list[int], width: int) -> list[tuple[int, int]]:
    """Runs of occupied columns, separated by gutters of empty ones."""
    panels: list[tuple[int, int]] = []
    start = None
    gap = 0
    for x, weight in enumerate(weights):
        if weight > 0:
            if start is None:
                start = x
            gap = 0
        elif start is not None:
            gap += 1
            if gap >= MIN_GUTTER:
                panels.append((start, x - gap + 1))
                start = None
                gap = 0
    if start is not None:
        panels.append((start, width))
    return [(a, b) for a, b in panels if (b - a) >= width * MIN_PANEL]


def split_evenly(weights: list[int], count: int) -> list[tuple[int, int]]:
    """Fall back to cutting at the emptiest column near each even boundary.

    Used when gutter detection cannot separate the panels -- a sheet with a
    glow behind the figures, or figures whose shoulders touch. The panel count
    is known from the mood list, so the job is only to find the best `count-1`
    places to cut, and the emptiest column near each evenly-spaced boundary is
    a good place.
    """
    occupied = [x for x, weight in enumerate(weights) if weight > 0]
    if not occupied:
        return []
    start, end = occupied[0], occupied[-1] + 1
    slot = (end - start) / count
    # Look this far either side of an even boundary for a better cut.
    window = max(4, int(slot * 0.25))

    cuts = [start]
    for index in range(1, count):
        guess = int(start + slot * index)
        lo = max(cuts[-1] + 1, guess - window)
        hi = min(end - 1, guess + window)
        if lo >= hi:
            cuts.append(guess)
            continue
        # Prefer the emptiest column; tie-break towards the even boundary so a
        # long flat run does not push the cut to one end of the window.
        cuts.append(min(range(lo, hi), key=lambda x: (weights[x], abs(x - guess))))
    cuts.append(end)
    return list(zip(cuts, cuts[1:]))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("sheet", help="the expression strip to cut up")
    parser.add_argument("--person", required=True, help="character id, e.g. finch")
    parser.add_argument("--moods", nargs="+", required=True, help="one name per panel, left to right")
    parser.add_argument("--out", default="assets/characters", help="directory the character folder goes in")
    parser.add_argument("--height", type=int, default=1400, help="height of the output canvas")
    parser.add_argument("--width", type=int, default=900, help="width of the output canvas")
    parser.add_argument(
        "--colors",
        type=int,
        default=128,
        help="palette size; flat-shaded art loses nothing and shrinks ~85%%. 0 keeps full colour.",
    )
    parser.add_argument(
        "--bust",
        action="store_true",
        help="also write bust.png: a square head-and-shoulders crop for the speech box and board cards",
    )
    parser.add_argument(
        "--bust-height",
        type=float,
        default=0,
        help=(
            "override the bust crop as a fraction of the figure's height (e.g. 0.34). "
            "The automatic neck-line detection is right for most figures and wrong for "
            "the occasional one with wide hair; this is the escape hatch."
        ),
    )
    parser.add_argument("--dry-run", action="store_true", help="report the panels found and stop")
    parser.add_argument(
        "--archive-source",
        action="store_true",
        help="copy the original sheet to assets/source/characters/<person>/",
    )
    args = parser.parse_args()

    sheet = Image.open(args.sheet).convert("RGBA")
    weights = column_weights(sheet)
    panels = find_panels(weights, sheet.width)
    how = "gutters"
    if len(panels) != len(args.moods):
        panels = split_evenly(weights, len(args.moods))
        how = "even split at local minima"

    print(f"{Path(args.sheet).name}: {sheet.width}x{sheet.height} -> {len(panels)} panel(s) via {how}")
    for index, (left, right) in enumerate(panels):
        label = args.moods[index] if index < len(args.moods) else "(unnamed)"
        print(f"  {index + 1}. x {left:>5}-{right:<5} width {right - left:>4}  {label}")

    if len(panels) != len(args.moods):
        fail(
            f"found {len(panels)} panels but {len(args.moods)} moods were named. "
            "Pass one mood per panel, or adjust the sheet."
        )
    if args.dry_run:
        return

    # Trim each panel to its own content first, so the common canvas can be
    # sized from the tallest figure rather than from the sheet's whitespace.
    cuts = []
    for left, right in panels:
        panel = sheet.crop((left, 0, right, sheet.height))
        box = panel.getbbox()
        cuts.append(panel.crop(box) if box else panel)

    canvas_h = args.height
    canvas_w = args.width
    # One contain scale for the whole set preserves proportions and body size
    # while guaranteeing the manifest's exact stage slot.
    scale = min(canvas_h / max(cut.height for cut in cuts), canvas_w / max(cut.width for cut in cuts))

    target = ROOT / args.out / args.person
    target.mkdir(parents=True, exist_ok=True)
    if args.archive_source:
        archive = ROOT / "assets" / "source" / "characters" / args.person
        archive.mkdir(parents=True, exist_ok=True)
        archived = archive / Path(args.sheet).name
        if archived.exists() and archived.read_bytes() != Path(args.sheet).read_bytes():
            fail(f"refusing to overwrite different archived source: {archived.relative_to(ROOT)}")
        shutil.copy2(args.sheet, archived)
        print(f"  archived {archived.relative_to(ROOT)}")

    canvases = []
    for mood, cut in zip(args.moods, cuts):
        # One scale factor for every panel, so the character keeps their size
        # and only the face changes between moods.
        sized = cut.resize((max(1, int(cut.width * scale)), max(1, int(cut.height * scale))), Image.LANCZOS)
        canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
        canvas.paste(sized, ((canvas_w - sized.width) // 2, canvas_h - sized.height), sized)
        canvases.append(canvas)
        if args.colors:
            # Flat, posterised art has far fewer than 128 real colours, so a
            # palette costs nothing visible and saves most of the file size.
            canvas = canvas.quantize(colors=args.colors, method=Image.FASTOCTREE)
        out = target / f"{mood}.png"
        canvas.save(out, optimize=True)
        print(f"  wrote {out.relative_to(ROOT)}  {canvas_w}x{canvas_h}  {out.stat().st_size // 1024} KB")

    if args.bust:
        write_busts(canvases, args.moods, target, args.colors, args.bust_height)


def write_busts(
    figures: list[Image.Image],
    moods: list[str],
    target: Path,
    colors: int,
    override: float = 0,
) -> None:
    """Write one square head-and-shoulders portrait per mood, plus a default.

    The speech box and the board cards both want a face, and cropping one out
    of a full-length figure by guessing a percentage lands on hair. Instead the
    crop is anchored to the real top of the artwork and sized from the figure's
    own width, which tracks how tightly the character is drawn.

    The crop box is computed once, from the neutral figure, and applied to every
    mood. Recomputing it per mood would let the frame shift by a few pixels each
    time the expression changed, which reads as the portrait twitching.
    """

    box = bust_box(figures[0], override)
    if box is None:
        return

    for mood, figure in zip(moods, figures):
        crop = figure.crop(box).resize((512, 512), Image.LANCZOS)
        if colors:
            crop = crop.quantize(colors=colors, method=Image.FASTOCTREE)
        out = target / f"bust-{mood}.png"
        crop.save(out, optimize=True)
        print(f"  wrote {out.relative_to(ROOT)}  512x512  {out.stat().st_size // 1024} KB")

    # A plain bust.png is what the manifest falls back to when a mood has none.
    default = target / "bust.png"
    default.write_bytes((target / f"bust-{moods[0]}.png").read_bytes())
    print(f"  wrote {default.relative_to(ROOT)}  512x512  (copy of {moods[0]})")


def bust_box(figure: Image.Image, override: float = 0) -> tuple[int, int, int, int] | None:
    """Work out where a character's head and shoulders are."""
    box = figure.getbbox()
    if not box:
        return None
    left, top, right, bottom = box

    # Row-by-row content width. A head is markedly narrower than the shoulders
    # below it, so the place where the silhouette suddenly widens is the neck
    # line -- a far better anchor than any fixed fraction of the figure.
    alpha = figure.getchannel("A")
    data = alpha.load()
    widths = []
    for y in range(top, bottom):
        row = [x for x in range(left, right) if data[x, y] > FLOOR]
        widths.append((row[0], row[-1]) if row else (0, 0))

    def width_at(index: int) -> int:
        a, b = widths[index]
        return b - a

    span = bottom - top
    sample = [width_at(i) for i in range(0, max(1, int(span * 0.18)))]
    head_w = sorted(sample)[len(sample) // 2] or (right - left)

    shoulder = span
    for index in range(int(span * 0.12), span):
        if width_at(index) > head_w * 1.55:
            shoulder = index
            break

    # Keep a little of the shoulders, and never crop tighter than the head.
    size = int(span * override) if override else int(max(head_w * 1.25, min(span, shoulder * 1.22)))
    head_rows = [widths[i] for i in range(0, min(shoulder, len(widths))) if width_at(i) > 0]
    centre = (
        (min(a for a, _ in head_rows) + max(b for _, b in head_rows)) // 2
        if head_rows
        else (left + right) // 2
    )

    return (
        max(0, centre - size // 2),
        top,
        min(figure.width, centre + size // 2),
        min(figure.height, top + size),
    )


if __name__ == "__main__":
    main()
