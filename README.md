# Case Project

A dependency-free HTML/CSS/JavaScript investigation game. The site is entirely
static and does not require Jekyll or another build system. Its small application
shell lives in `index.html`, presentation in `src/styles.css`, and game data and
behaviour in `src/game.js`, so each layer can be upgraded independently.

The intended player loop, story structure, accessibility goals, and technical
constraints are documented in [`game-design.md`](game-design.md).

## Run locally

Serve the repository root with any static HTTP server, for example:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.

Progress is saved automatically in the browser. Returning players can use **Continue**
from the opening screen; starting another case creates a fresh session for that case.
During a case, the field-action dock provides direct access to scene search, active
leads, and clue linking without requiring players to discover toolbar controls first.

## Preflight check

Before sharing a play-test build, run the dependency-free project check:

```sh
python3 tools/check_project.py
```

It verifies unique document IDs, local asset references, and the syntax of the inline
game JavaScript. For a manual smoke test, complete this short path in both English and
Arabic: open a case, inspect a scene hotspot, question a character, add and move a note,
connect two cards, refresh and continue the saved session, then open the accusation flow.

## GitHub Pages

The GitHub Actions workflow in `.github/workflows/deploy-pages.yml` publishes
the repository as a static site. In the repository's **Settings → Pages**, set
the source to **GitHub Actions**. Pushes to `main` will then deploy the game at
`https://<owner>.github.io/Case-Project/`.

The `.nojekyll` marker explicitly disables Jekyll processing. The game is the
root `index.html` document and its sprite images use repository-relative paths,
so it works without path rewriting when hosted at `/Case-Project/`.

## Supplied sprite artwork

The supplied sheets are split into characters, cards, icons, tokens, and UI
surfaces, and those exports are used throughout the opening flow and case board.
See [`assets/ASSET_LOG.md`](assets/ASSET_LOG.md) for integration details and
[`assets/SOURCE-MAP.md`](assets/SOURCE-MAP.md) for the reproducible crop map.
