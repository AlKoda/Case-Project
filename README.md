# Al-Manar

An interactive investigation demonstration with a complete fictional mystery.
It runs in the browser with no build step, runtime dependencies, or external services. Seven people were awake in a hotel on the
Muttrah harbour the night the night manager went down the service stairs. All
seven were somewhere else. You have until morning.

The game is played as a visual novel: the person you are questioning stands in
the room, and the speech box along the bottom frames them in its corner, the way
a subject sits framed across a table. When an account contradicts the evidence
in your file, you put the exhibit on the table and the account comes apart.

Between interviews you move through a field map of the Al-Manar and Muttrah
station. Pick a floor or room to revisit the crime scene, find a witness, or
return to Nightwatch. At the station you work a corkboard — drag anything out
of the tray, pin it
where it makes sense, run string between the things that belong together, and
drop whatever fixes a time onto the timeline along the bottom.

The case board is also available from the top-right of every playable scene.
Opening it pauses the conversation in place, and closing it returns to the same
line. Every pin, note, timeline placement and string is saved immediately on the
device, whether the board was opened between interviews or in the field.

Important spoken details are not filed automatically. When testimony contains a
usable lead, choose whether to **file it as a clue** (which adds its statement to
the board) or leave it as testimony. Suspects can also be asked for comparison
fingerprints: ridge groups are labelled alphabetically, so a Type A scene print
can be compared directly with each suspect's Type A, B, or C result.

## Present the demonstration

Choose **Presentation walkthrough** from the opening screen. Five visible chapters
make the demonstration repeatable without requiring a complete playthrough:

1. **Briefing** introduces the incident and the Observe → Question → Connect → Conclude workflow.
2. **Evidence** lets you examine the watch or the deliberately loosened bulb.
3. **Interview** lets you challenge Sharif’s lighting claim with an exhibit. Select the bulb to demonstrate a recorded contradiction; a wrong exhibit offers another attempt.
4. **Connections** opens an editable prepared board. Inspect a card, move it, add a note, or run a string.
5. **Findings** presents the supported prepared conclusion, the three contradictions, and a printable case summary.

Use **Next chapter** or select a chapter directly. **Full screen** is available on
the title and presentation controls. **Exit walkthrough** returns to the menu.
The walkthrough uses temporary prepared checkpoints: edits, scene choices, and
findings never replace the visitor’s saved investigation. Reloading also leaves
the saved case intact. Lines appear immediately in presentation mode, without
changing the visitor’s dialogue-speed preference.

For a full investigation, choose **Open the full investigation** (or **New
investigation** when a save exists). It starts with the same briefing and then
plays the complete case. The field map suggests a next action, and **Help**
explains the controls. Starting a new case asks before replacing an existing save.

AI assisted development of this demonstration. Dialogue, evidence, and conclusions
are scripted fictional material; no live AI analyzes evidence or makes decisions.
The walkthrough labels its prepared checkpoints explicitly.

## Run it

Serve the repository root with any static HTTP server:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000/>. Click or press space to advance dialogue;
`Escape` closes the log.

Progress saves to the browser automatically, and **Resume** on the title screen
picks the night back up.

The main menu's **Settings** screen stores presentation preferences separately
from case progress. Dialogue can be measured, standard, swift, or instant;
decorative motion and film grain can also be reduced without changing a save.

## How it is put together

```
index.html              the shell: stylesheets and one module
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
  game/
    board.js            the evidence wall: pinning, string, timeline
    map.js              field navigation: buildings, rooms and witnesses
    screens.js          title, briefing, accusation, verdict
    presenter.js        temporary presentation checkpoints and chapter controls
  data/
    manifest.js         where art lives and how a file is chosen
    case.js             cast, exhibits, contradictions, witnesses, verdicts
    locations.js        destinations and who can be found there
    scenes.js           the script
  styles/               tokens, base, stage, screens, board
```

The split that matters is between `data/` and everything else. A scene is a list
of plain objects, so the whole script reads top to bottom as a screenplay and a
new interview is written without touching a line of engine code. The node
grammar is documented at the top of [`src/engine/vn.js`](src/engine/vn.js).

## The evidence wall

The board between interviews is a corkboard you build yourself.

- **Drag** anything from the tray on the right onto the wall, or press the `+`
  on a tray item to pin it without a mouse.
- **Click** a pinned card to read it in the tray, question that person, or start
  a string from it; click a second card to tie the string, and click a string to
  cut it.
- **Drop a card on the timeline** along the bottom and it takes a time. Anything
  that fixes a moment — a stopped watch, a logged call — says so on its face and
  goes straight to the right place when pinned from the tray.
- **Drag a card off the wall** to take it down. Nothing is ever lost; it goes
  back to the tray.
- **Add note** puts a blank card up for whatever you are thinking. **Tidy** lays
  the loose cards out on a grid. **Clear wall** returns everything to the tray.
- **Undo** (or `Ctrl`/`Cmd`+`Z`) takes back the last change — a move, a string,
  a card taken down, a wall cleared. Rearranging a board should never be a
  decision you have to think about first.

If you left the scene of the crime without examining everything, the board says
so and offers a way back down. Walking away from an exhibit would otherwise put
a contradiction permanently out of reach.

Pinned cards are focusable: arrow keys nudge (hold shift for bigger steps),
`L` starts a string, `Delete` takes the card down, `Enter` opens it.

Positions are stored normalised against the cork, so the wall survives a resize,
a rotation and a different monitor without anything drifting. Nothing on the
wall is scored — the game never checks whether your strings are "right", because
the point of a board is that it holds a theory while you decide what you believe.

## Artwork

Every image resolves through [`src/data/manifest.js`](src/data/manifest.js).
Nothing builds a path by hand, so **new art never needs a code change** — only a
file in the right place:

```
assets/backgrounds/<scene>.png          1920 x 1080
assets/characters/<person>/<mood>.png    900 x 1400, transparent
assets/characters/<person>/bust-<mood>.png 512 x 512, head and shoulders
assets/evidence/<exhibit>.png            512 x  512, transparent
```

Candidates are tried in order: your `.png`, then `.svg`, then a sensible
fallback (a missing mood drops to `neutral`, a missing bust drops to the stage
figure), then a placeholder drawn at runtime. Nothing is ever a broken image, and
a character needs only `neutral.png` to appear in every scene.

Character art usually arrives as one strip per person, one expression per panel.
`tools/slice_sheet.py` cuts it up, scales every panel by the same factor, aligns
them so a character does not jump when their expression changes, and writes the
square bust the speech box and board cards use. The existing backgrounds and character art are retained. Six evidence exhibits
now use curated SVG drawings with case-specific details, including the watch’s
01:47 time, the intact bulb filament, and the 01:52 outside call from room 312.
These SVGs take priority over the earlier PNGs; the original PNGs remain available
as fallbacks. [`assets/README.md`](assets/README.md)
documents every name in use and the exact commands the current art was cut with.
Uncut masters live under `assets/source/`, while `assets/catalog.json` records
the size, transparency support, byte size, and checksum of every runtime PNG so
future additions can be audited without opening each file by hand.

Moods a script may ask for are listed in the manifest: `neutral`, `tense`,
`evasive`, `broken`, `cold`.

## Translation

The game ships English only, but no English string is written straight into the
DOM: every one passes through `t(key, english)`, which returns the active
locale's version when there is one — interface, dialogue, cast, exhibits, the
board's cards and the witnesses' statements alike. Adding a language is one
command and one file:

```sh
node tools/i18n_extract.mjs ar > src/data/strings.ar.js   # every string, English alongside
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
speak before walking on, witnesses whose times the timeline cannot parse. Those
are the failures that would otherwise surface halfway through an interview in
front of a player.

## Play tests

`check_project.py` checks that the build is coherent. To check that it is
*playable*, there is an end-to-end suite that drives a real browser:

```sh
npm install playwright     # once; the game itself needs nothing
node tools/playtest.mjs    # browser scenarios
node tools/playtest.mjs board undo
```

It starts its own server on a free port, plays a night from the title screen to
a verdict, pins and ties and undoes on the wall, presses a witness, checks the
accusation reports the file's real strength, and confirms no card hangs off the
cork at desktop, tablet or phone width. Every scenario also fails if anything
was thrown or logged as an error along the way.

Playwright is a development dependency and nothing else needs it — the game is
still a static site with no build step and no runtime dependencies. Without it
the suite exits cleanly and says so, so it is safe to wire into a hook.

### Presentation and interaction checks

`check_project.py` also runs dependency-free presentation checks: valid checkpoint
IDs, both evidence branches, successful / failed / deferred challenges, cancelled
scenes, and save isolation.

Optional DOM interaction checks exercise routing, CSS map coordinates, board undo,
exact timeline times, rapid chapter changes, saved-case restoration, confirmation
dialogs, paused dialogue, and supported / incomplete / incorrect conclusions:

```sh
npm install --no-save happy-dom
node tools/check_ui.mjs
```

These are semantic checks, not rendered visual tests. Before presenting, run the
project in the target browser and check desktop, phone, full screen, and the printed
summary. An accusation naming Sharif is only supported after all three of his
contradictions have been established; a partial case requests further investigation.

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

The Al-Manar, its staff and the case are invented. Nothing here reflects real
investigative procedure, and it should not be read as though it does.
