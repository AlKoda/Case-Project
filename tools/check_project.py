#!/usr/bin/env python3
"""Dependency-free smoke checks for the static game bundle.

Run before sharing a play-test build:

    python3 tools/check_project.py

It checks five things, in the order they tend to break:

  1. the document: no duplicate ids, every local href/src resolves
  2. the stylesheets: every url(...) resolves
  3. the modules: every .js under src/ parses as an ES module
  4. persisted state: malformed local data is normalised before reaching the UI
  5. the case data: handed to tools/check_scenes.mjs, which walks the scripts
     for dead jumps, unreachable exhibits and unprovable contradictions
"""

from __future__ import annotations

import re
import shutil
import subprocess
import sys
import tempfile
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "index.html"
SRC = ROOT / "src"


class DocumentCheck(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.ids: list[str] = []
        self.references: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if values.get("id"):
            self.ids.append(values["id"] or "")
        for name in ("src", "href"):
            value = values.get(name)
            if value and not value.startswith(("http://", "https://", "data:", "#")):
                self.references.append(value)


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def check_document() -> list[str]:
    source = HTML.read_text(encoding="utf-8")
    parser = DocumentCheck()
    parser.feed(source)

    duplicates = sorted({item for item in parser.ids if parser.ids.count(item) > 1})
    if duplicates:
        fail(f"duplicate HTML ids: {', '.join(duplicates)}")

    missing = sorted(ref for ref in set(parser.references) if not (ROOT / ref).is_file())
    if missing:
        fail(f"index.html references missing files: {', '.join(missing)}")

    print(f"  document: {len(parser.ids)} unique ids, {len(set(parser.references))} local references")
    return parser.references


def check_stylesheets(references: list[str]) -> None:
    sheets = [ROOT / ref for ref in references if ref.endswith(".css")]
    urls: set[str] = set()
    for sheet in sheets:
        text = sheet.read_text(encoding="utf-8")
        # Inline SVG data URIs carry their own url(#filter) references; drop
        # them before scanning so those are not mistaken for files.
        text = re.sub(r'url\(\s*["\']?data:[^)]*\)', "", text)
        for match in re.findall(r'url\(\s*["\']?([^)"\']+)', text):
            if match.startswith(("data:", "http://", "https://", "#", "%23")):
                continue
            # CSS urls are relative to the stylesheet, not the document root.
            urls.add(str((sheet.parent / match).resolve().relative_to(ROOT)))

    missing = sorted(url for url in urls if not (ROOT / url).is_file())
    if missing:
        fail(f"stylesheets reference missing files: {', '.join(missing)}")
    print(f"  styles:   {len(sheets)} stylesheets, {len(urls)} asset references")


def check_modules() -> None:
    if not shutil.which("node"):
        print("  modules:  skipped (node is not installed)")
        return

    modules = sorted(SRC.rglob("*.js"))
    if not modules:
        fail("no JavaScript modules found under src/")

    with tempfile.TemporaryDirectory() as tmp:
        for module in modules:
            # node only treats a file as an ES module by extension or by a
            # package.json; copying to .mjs avoids adding either to the repo.
            probe = Path(tmp) / f"{module.stem}.mjs"
            probe.write_text(module.read_text(encoding="utf-8"), encoding="utf-8")
            result = subprocess.run(
                ["node", "--check", str(probe)], capture_output=True, text=True, check=False
            )
            if result.returncode:
                fail(f"{module.relative_to(ROOT)} did not parse:\n{result.stderr.strip()}")
    print(f"  modules:  {len(modules)} ES modules parse")


def check_case_data() -> None:
    checker = ROOT / "tools" / "check_scenes.mjs"
    if not shutil.which("node"):
        print("  case:     skipped (node is not installed)")
        return
    if not checker.is_file():
        fail("tools/check_scenes.mjs is missing")
    result = subprocess.run(["node", str(checker)], capture_output=True, text=True, check=False)
    if result.returncode:
        print(result.stdout.strip(), file=sys.stderr)
        fail(result.stderr.strip() or "case data check failed")
    lines = [line for line in result.stdout.strip().splitlines() if line.strip()]
    summary = next((line for line in lines if line.startswith("OK:")), "")
    print(f"  case:     {summary.removeprefix('OK: ')}")
    # Notes are things worth knowing that are not failures, e.g. art still to come.
    for line in lines:
        if line.strip().startswith("note:"):
            print(f"            {line.strip()}")


def check_persisted_state() -> None:
    checker = ROOT / "tools" / "check_state.mjs"
    if not shutil.which("node"):
        print("  state:    skipped (node is not installed)")
        return
    result = subprocess.run(["node", str(checker)], capture_output=True, text=True, check=False)
    if result.returncode:
        fail(result.stderr.strip() or "persisted state check failed")
    print(f"  state:    {result.stdout.strip()}")


def check_asset_catalog() -> None:
    checker = ROOT / "tools" / "catalog_assets.py"
    result = subprocess.run(
        [sys.executable, str(checker), "--check"], capture_output=True, text=True, check=False
    )
    if result.returncode:
        fail(result.stderr.strip() or "asset catalog check failed")
    print(f"  {result.stdout.strip()}")


def check_presentation() -> None:
    if not shutil.which("node"):
        print("  demo:     skipped (node is not installed)")
        return
    result = subprocess.run(
        ["node", str(ROOT / "tools" / "check_presentation.mjs")],
        capture_output=True, text=True, check=False,
    )
    if result.returncode:
        fail(result.stderr.strip() or "presentation check failed")
    print(f"  demo:     {result.stdout.strip()}")


def main() -> None:
    print("Checking the Al-Manar build")
    references = check_document()
    check_stylesheets(references)
    check_asset_catalog()
    check_modules()
    check_persisted_state()
    check_case_data()
    check_presentation()
    print("OK")


if __name__ == "__main__":
    main()
