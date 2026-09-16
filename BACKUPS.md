# Backups and stepping back

Every backup is a **complete, named snapshot of the whole project** — every file,
including edits that have not been committed yet. If a change turns out badly, you
can put the project back exactly the way it was, without losing anything you did
in the meantime.

Backups are created by `tools/backup.py`, which needs nothing but Python 3 and git.

## Save a backup before you change something

```sh
python3 tools/backup.py save "before rewriting the interview UI"
```

This prints the name it gave the backup, for example:

```
backup/2026-09-16-1452-before-rewriting-the-interview-ui
```

The name is always `backup/` + the date + the time + the short description you
typed, so the list stays readable months later. Give it a description of the state
you are saving — what the project looks like *now* — rather than what you are about
to try.

By default the backup is also pushed to GitHub, so it survives losing this machine.
Add `--no-push` to keep it local.

## See what you can go back to

```sh
python3 tools/backup.py list
```

The newest backup is marked with `->`.

## Step back to a backup

```sh
python3 tools/backup.py restore before-rewriting-the-interview-ui
```

You can type the full name or any part of it that is unique.

Two things happen, in this order:

1. **The current state is saved first**, automatically, as a backup named
   `...-before-restore`. Stepping back never throws away what you are stepping back
   from, so you can always change your mind.
2. Every file is put back the way that backup has it. Files that did not exist in
   the backup are removed; files that were deleted since are brought back.

Your branch and your commit history are left untouched — nothing is rewritten. The
restored files are staged and ready to commit:

```sh
git diff --cached --stat
git commit -m "Restore backup/2026-09-16-1452-before-rewriting-the-interview-ui"
git push -u origin <your-branch>
```

### Changing your mind again

Because the restore saved your previous state first, going forward again is just
another restore:

```sh
python3 tools/backup.py list          # find the ...-before-restore entry
python3 tools/backup.py restore <that name>
```

## Keep a copy outside git

```sh
python3 tools/backup.py export                 # newest backup
python3 tools/backup.py export <backup-name>   # a specific one
```

This writes a plain `.zip` of the entire project into `backups/`, which is ignored
by git. Use it when you want a copy you can move to another drive or upload
somewhere. It is a copy, not a backup of record — the tagged backups are.

## Delete one you no longer need

```sh
python3 tools/backup.py delete <backup-name>
```

This removes it from this machine and from GitHub. There is no undo for a delete,
so only remove backups you are sure about.

## How it works, briefly

Each backup is an [annotated git tag](https://git-scm.com/book/en/v2/Git-Basics-Tagging)
pointing at a commit that records the working tree as it stood, made without moving
your branch or disturbing what you had staged. Because git stores each file once,
dozens of backups of an 11 MB project cost very little space. Anything git ignores
(`__pycache__/`, `backups/`) is deliberately left out.

That also means the backups are ordinary git objects: `git show <backup-name>` and
`git diff <backup-name>` work on them like any other tag, if you prefer git directly.
