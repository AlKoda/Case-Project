#!/usr/bin/env python3
"""Named project backups so any step can be reviewed, kept, or stepped back.

Each backup is a complete snapshot of every file in the project -- including
work that has not been committed yet -- stored as an annotated git tag named

    backup/YYYY-MM-DD-HHMM-short-label

Snapshots share storage with the rest of the repository, so keeping many of
them is cheap, and pushing them to GitHub keeps them safe off this machine.

    python3 tools/backup.py save "before rewriting the interview UI"
    python3 tools/backup.py list
    python3 tools/backup.py restore before-rewriting-the-interview-ui
    python3 tools/backup.py export           # zip of the newest backup
    python3 tools/backup.py delete <name>
"""

from __future__ import annotations

import argparse
import datetime as dt
import os
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PREFIX = "backup"
EXPORT_DIR = ROOT / "backups"
SLUG_LIMIT = 48
PUSH_DELAYS = (2, 4, 8, 16)


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def git(
    *args: str,
    check: bool = True,
    quiet: bool = True,
    env: dict[str, str] | None = None,
) -> str:
    """Run a git command inside the project and return its trimmed output."""

    result = subprocess.run(
        ["git", *args],
        cwd=ROOT,
        text=True,
        capture_output=quiet,
        check=False,
        env={**os.environ, **(env or {})},
    )
    if check and result.returncode:
        detail = ((result.stderr or "") + (result.stdout or "")).strip()
        fail(f"`git {' '.join(args)}` failed: {detail}")
    return (result.stdout or "").strip()


def slugify(label: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", label.strip().lower()).strip("-")
    return slug[:SLUG_LIMIT].strip("-") or "snapshot"


def tag_exists(name: str) -> bool:
    return bool(git("rev-parse", "--verify", "--quiet", f"refs/tags/{name}", check=False))


def unique_name(label: str) -> str:
    base = f"{PREFIX}/{dt.datetime.now():%Y-%m-%d-%H%M}-{slugify(label)}"
    name, suffix = base, 2
    while tag_exists(name):
        name, suffix = f"{base}-{suffix}", suffix + 1
    return name


def resolve(name: str) -> str:
    """Accept a full tag name, or just the part after `backup/`."""

    for candidate in (name, f"{PREFIX}/{name}"):
        if tag_exists(candidate):
            return candidate
    matches = [tag for tag in backup_tags() if name in tag]
    if len(matches) == 1:
        return matches[0]
    if matches:
        listed = "\n  ".join(matches)
        fail(f"`{name}` matches several backups:\n  {listed}")
    fail(f"no backup named `{name}` -- run `python3 tools/backup.py list` to see them")
    raise AssertionError("unreachable")


def backup_tags() -> list[str]:
    refs = git(
        "for-each-ref",
        "--sort=-creatordate",
        "--format=%(refname:short)",
        f"refs/tags/{PREFIX}/*",
    )
    return [line for line in refs.splitlines() if line]


def current_branch() -> str:
    return git("rev-parse", "--abbrev-ref", "HEAD", check=False) or "(detached)"


def pending_changes() -> list[str]:
    return [line for line in git("status", "--porcelain").splitlines() if line.strip()]


def snapshot_commit(message: str) -> str:
    """Commit the working tree exactly as it is, without touching HEAD or the index."""

    with tempfile.TemporaryDirectory() as tmp:
        env = {"GIT_INDEX_FILE": str(Path(tmp) / "index")}
        git("add", "--all", "--", ".", env=env)
        tree = git("write-tree", env=env)
    parent = git("rev-parse", "--verify", "--quiet", "HEAD", check=False)
    args = ["commit-tree", tree]
    if parent:
        args += ["-p", parent]
    return git(*args, "-m", message)


def push_tag(name: str, delete: bool = False) -> bool:
    """Push (or delete) a backup tag, retrying a few times over a flaky network."""

    args = ["push", "origin", f":refs/tags/{name}" if delete else name]
    attempt = None
    for delay in (*PUSH_DELAYS, None):
        attempt = subprocess.run(
            ["git", *args], cwd=ROOT, text=True, capture_output=True, check=False
        )
        if attempt.returncode == 0:
            return True
        if delay is None:
            break
        time.sleep(delay)
    detail = (attempt.stderr or attempt.stdout or "").strip().splitlines()
    print(f"  GitHub push failed: {detail[-1] if detail else 'unknown error'}")
    return False


def prune_empty_dirs() -> None:
    """Drop directories left empty by a restore; git only tracks files."""

    for parent, names, files in os.walk(ROOT, topdown=False, followlinks=False):
        names[:] = [name for name in names if name != ".git"]
        directory = Path(parent)
        if directory == ROOT or directory == EXPORT_DIR or ".git" in directory.parts:
            continue
        if not names and not files and not any(directory.iterdir()):
            directory.rmdir()


def cmd_save(args: argparse.Namespace) -> None:
    label = " ".join(args.label).strip() or "snapshot"
    name = unique_name(label)
    branch = current_branch()
    changes = pending_changes()
    state = (
        "working tree was clean"
        if not changes
        else f"{len(changes)} file(s) had uncommitted edits"
    )
    message = f"{label}\n\nSnapshot of branch {branch}; {state}."

    commit = snapshot_commit(f"Backup: {message}")
    git("tag", "--annotate", name, commit, "--message", message)

    print(f"Saved backup: {name}")
    print(f"  label   : {label}")
    print(f"  branch  : {branch}")
    print(f"  contents: every project file ({len(git('ls-tree', '-r', '--name-only', name).splitlines())} files), {state}")
    if args.no_push:
        print("  storage : this machine only (--no-push was used)")
    elif push_tag(name):
        print("  storage : this machine and GitHub")
    else:
        print("  storage : this machine only -- push failed, retry with:")
        print(f"            git push origin {name}")
    print(f"\nStep back to it later with:\n  python3 tools/backup.py restore {name.split('/', 1)[1]}")


def cmd_list(args: argparse.Namespace) -> None:
    rows = [
        (row.split("\t") + ["", "", ""])[:4]
        for row in git(
            "for-each-ref",
            "--sort=-creatordate",
            "--format=%(refname:short)%09%(creatordate:format:%Y-%m-%d %H:%M)%09%(contents:subject)%09%(creatordate:unix)",
            f"refs/tags/{PREFIX}/*",
        ).splitlines()
        if row
    ]
    if not rows:
        print("No backups yet. Create one with:\n  python3 tools/backup.py save \"a short description\"")
        return

    # Only point at the newest backup when one is unambiguously the newest;
    # two saved in the same second have no meaningful order between them.
    newest = rows[0][3]
    unambiguous = sum(1 for row in rows if row[3] == newest) == 1

    print(f"{len(rows)} backup(s), most recently saved first:\n")
    for index, (name, created, subject, _) in enumerate(rows):
        marker = "->" if index == 0 and unambiguous else "  "
        print(f"{marker} {name}")
        print(f"     saved {created} -- {subject}")
    print("\nRestore one with:\n  python3 tools/backup.py restore <name>")


def cmd_restore(args: argparse.Namespace) -> None:
    ref = resolve(args.name)
    changes = pending_changes()

    if changes and not args.no_safety:
        safety = unique_name("before-restore")
        commit = snapshot_commit(f"Backup: automatic snapshot taken before restoring {ref}")
        git("tag", "--annotate", safety, commit, "--message", f"Automatic snapshot taken before restoring {ref}")
        print(f"Current state saved first as {safety}")
        if not args.no_push:
            push_tag(safety)
    elif changes:
        print(f"Discarding uncommitted edits in {len(changes)} file(s) (--no-safety was used)")

    keep = set(git("ls-tree", "-r", "--name-only", ref).splitlines())
    git("read-tree", "-u", "--reset", f"{ref}^{{tree}}")

    removed = []
    for path in git("ls-files", "--others", "--exclude-standard").splitlines():
        if path and path not in keep:
            target = ROOT / path
            if target.is_file() and ROOT in target.resolve().parents:
                target.unlink()
                removed.append(path)
    prune_empty_dirs()

    print(f"\nRestored every project file to {ref}")
    if removed:
        print(f"  removed {len(removed)} file(s) that did not exist in that backup")
    print(f"  branch  : {current_branch()} (unchanged -- history was not rewritten)")
    print("\nThe restored files are staged. Next:")
    print("  git diff --cached --stat     # see what stepping back changed")
    print(f"  git commit -m \"Restore {ref}\"")
    print(f"  git push -u origin {current_branch()}")
    print("\nChanged your mind? Nothing is lost -- `python3 tools/backup.py list`")
    print("and restore the newest backup to come straight back.")


def cmd_export(args: argparse.Namespace) -> None:
    tags = backup_tags()
    if not args.name and not tags:
        fail("no backups to export -- create one with `python3 tools/backup.py save`")
    ref = resolve(args.name) if args.name else tags[0]
    EXPORT_DIR.mkdir(exist_ok=True)
    out = EXPORT_DIR / f"Case-Project-{ref.split('/', 1)[1]}.zip"
    git("archive", "--format=zip", f"--prefix=Case-Project-{ref.split('/', 1)[1]}/", "-o", str(out), ref)
    size = out.stat().st_size / (1024 * 1024)
    print(f"Wrote {out.relative_to(ROOT)} ({size:.1f} MB) from {ref}")
    print("This zip is a plain copy of the whole project and is not committed to git.")


def cmd_delete(args: argparse.Namespace) -> None:
    ref = resolve(args.name)
    git("tag", "--delete", ref)
    print(f"Deleted backup {ref} from this machine")
    if not args.no_push and push_tag(ref, delete=True):
        print("Also removed it from GitHub")


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="backup.py",
        description="Named backups of the whole project, so any step can be undone.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    save = sub.add_parser("save", help="snapshot every file under a name you choose")
    save.add_argument("label", nargs="*", help="short description, e.g. \"before the UI rewrite\"")
    save.add_argument("--no-push", action="store_true", help="keep the backup on this machine only")
    save.set_defaults(func=cmd_save)

    listing = sub.add_parser("list", help="show every backup, newest first")
    listing.set_defaults(func=cmd_list)

    restore = sub.add_parser("restore", help="put every file back the way a backup has it")
    restore.add_argument("name", help="backup name, or any unique part of it")
    restore.add_argument("--no-safety", action="store_true", help="skip the automatic snapshot of the current state")
    restore.add_argument("--no-push", action="store_true", help="do not push that automatic snapshot")
    restore.set_defaults(func=cmd_restore)

    export = sub.add_parser("export", help="write a backup out as a plain .zip")
    export.add_argument("name", nargs="?", help="backup name (default: the newest one)")
    export.set_defaults(func=cmd_export)

    delete = sub.add_parser("delete", help="remove a backup you no longer need")
    delete.add_argument("name", help="backup name, or any unique part of it")
    delete.add_argument("--no-push", action="store_true", help="remove it from this machine only")
    delete.set_defaults(func=cmd_delete)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        raise SystemExit(130)
    except BrokenPipeError:
        os._exit(0)  # output was piped into something like `head`
