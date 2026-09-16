# The Bellweather

A hard-boiled interview mystery that runs in the browser with no build step, no
dependencies and no network requests. Four people were awake in a hotel the
night the night manager went down the service stairs. All four were somewhere
else. You have until morning.

The game is played as a visual novel: the person you are questioning stands in
the room, and the speech box along the bottom frames them in its corner, the way
a subject sits framed across a table. When an account contradicts the evidence
in your file, you put the exhibit on the table and the account comes apart.

## Run it

Serve the repository root with any static HTTP server:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000/>. Click or press space to advance dialogue;
`Escape` closes the log.

Progress saves to the browser automatically, and **Resume** on the title screen
picks the night back up.

## How it is put together

```
index.html              the shell: four stylesheets and one module
src/
  main.js               router and boot
  engine/
    vn.js               the stage: room, cast, speech box, evidence tray
    player.js           walks a script and drives the stage
    script.js           stable keys for every line, shared with the translator
    assets.js           image loading with fallbacks and drawn placeholders
    store.js            state and the save
    i18n.js             translation and text direction
    dom.js              element helpers
  game/screens.js       title, case board, accusation, verdict
  data/
    manifest.js         where art lives and how a file is chosen
    case.js             cast, exhibits, contradictions, verdicts
    scenes.js           the script
  styles/               tokens, base, stage, screens
```

The split that matters is between `data/` and everything else. A scene is a list
of plain objects, so the whole script reads top to bottom as a screenplay and a
new interview is written without touching a line of engine code. The node
grammar is documented at the top of [`src/engine/vn.js`](src/engine/vn.js).

## Artwork

Every image resolves through [`src/data/manifest.js`](src/data/manifest.js).
Nothing builds a path by hand, so **new art never needs a code change** — only a
file in the right place:

```
assets/backgrounds/<scene>.png          1920 x 1080
assets/characters/<person>/<mood>.png    900 x 1400, transparent
assets/characters/<person>/bust.png      512 x  512, head and shoulders (optional)
assets/evidence/<exhibit>.png            512 x  512, transparent
```

Candidates are tried in order: your `.png`, then `.svg`, then a sensible
fallback (a missing mood drops to `neutral`, a missing bust drops to the stage
figure), then a placeholder drawn at runtime. Nothing is ever a broken image, and
a character needs only `neutral.png` to appear in every scene.

**The art currently in those folders is placeholder art.** It was recovered from
the previous sprite sheets by `tools/extract_placeholders.py`, which unwraps the
PNGs that older tooling had base64-encoded inside SVG containers. To replace any
of it, overwrite the file at the same path — that is the entire process.

Moods a script may ask for are listed in the manifest: `neutral`, `tense`,
`evasive`, `broken`, `cold`.

## Translation

The game ships English only, but no English string is written straight into the
DOM: every one passes through `t(key, english)`, which returns the active
locale's version when there is one. Adding a language is one command and one
file:

```sh
node tools/i18n_extract.mjs ar > src/data/strings.ar.js   # 283 keys, English alongside
# fill in the blanks, then:
open "http://localhost:8000/?lang=ar"
```

There is no other install step. Right-to-left languages need nothing extra —
the engine sets the document direction from the locale code, and the stylesheets
are written in logical properties throughout, so the layout flips on its own.
Any key left empty falls back to English, so a partial translation is safe.

Re-running the extractor against an existing bundle keeps the work already done
and marks whatever is new.

## Checks

```sh
python3 tools/check_project.py
```

Checks the document for duplicate ids and dead references, the stylesheets for
missing assets, every module for parse errors, and — via
`tools/check_scenes.mjs` — the case data itself: jumps that land on no label,
exhibits nobody can obtain, contradictions no press can prove, characters who
speak before walking on. Those are the failures that would otherwise surface
halfway through an interview in front of a player.

## Backups

Before trying something you might want to undo:

```sh
python3 tools/backup.py save "before rewriting the interview UI"
```

`list` shows what you can return to and `restore <name>` steps back, saving the
current state first so nothing is lost either way. See [`BACKUPS.md`](BACKUPS.md).

## GitHub Pages

`.github/workflows/deploy-pages.yml` publishes the repository as a static site.
In **Settings → Pages**, set the source to **GitHub Actions**; pushes to `main`
then deploy to `https://<owner>.github.io/Case-Project/`. The `.nojekyll` marker
disables Jekyll, and all asset paths are repository-relative, so it works when
hosted from a subdirectory.

## A note on the fiction

The Bellweather, its staff and the case are invented. Nothing here reflects real
investigative procedure, and it should not be read as though it does.
