#!/usr/bin/env python3
"""Dependency-free smoke checks for the static game bundle."""

from __future__ import annotations

import re
import subprocess
import sys
import tempfile
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "index.html"


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


def main() -> None:
    source = HTML.read_text(encoding="utf-8")
    parser = DocumentCheck()
    parser.feed(source)

    duplicates = sorted({item for item in parser.ids if parser.ids.count(item) > 1})
    if duplicates:
        fail(f"duplicate HTML ids: {', '.join(duplicates)}")

    css_references = re.findall(r'url\(["\']?(assets/[^)"\']+)', source)
    missing = sorted(
        reference
        for reference in set(parser.references + css_references)
        if "'" not in reference and '"' not in reference and not (ROOT / reference).is_file()
    )
    if missing:
        fail(f"missing local assets: {', '.join(missing)}")

    scripts = re.findall(r"<script(?:\s[^>]*)?>(.*?)</script>", source, re.DOTALL)
    inline = "\n".join(script for script in scripts if script.strip())
    with tempfile.NamedTemporaryFile("w", suffix=".js", encoding="utf-8") as script_file:
        script_file.write(inline)
        script_file.flush()
        result = subprocess.run(["node", "--check", script_file.name], check=False)
    if result.returncode:
        fail("inline JavaScript did not pass node --check")

    print(f"OK: {len(parser.ids)} unique ids, {len(set(parser.references + css_references))} local references, JavaScript syntax")


if __name__ == "__main__":
    main()
