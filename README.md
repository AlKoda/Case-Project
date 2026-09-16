# Case Project

A self-contained HTML/CSS/JavaScript investigation game. The site is entirely
static and does not require Jekyll or another build system.

The intended player loop, story structure, accessibility goals, and technical
constraints are documented in [`game-design.md`](game-design.md).

## Run locally

Serve the repository root with any static HTTP server, for example:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.

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
