# Case Board

A dependency-free, browser-based 2D investigation demo. Players inspect a fictional
scene, read evidence, interview suspects and witnesses, connect information on a case
board, and make an accusation. The application includes English and Arabic interfaces
and two self-contained fictional cases.

> This is an interactive narrative demonstration, not police training or real-world
> investigative guidance.

## Run locally

No installation, package manager, or build step is required.

1. Open `case-board-v8.html` in a modern desktop browser; or
2. Serve the folder locally, then visit the displayed address:

   ```bash
   python3 -m http.server 8000
   ```

   Open <http://localhost:8000/case-board-v8.html>.

Internet access is only needed for the optional Google Fonts request. The game remains
functional when those fonts cannot load because it has system-font fallbacks.

## Play

1. Continue from the academy splash screen and select a case.
2. Open the case file, inspect the numbered scene markers, and open the evidence they
   reveal.
3. Interview people. Some questions unlock after you find relevant clues.
4. Use **String** to connect two cards, **Notebook** for notes and active leads, and the
   timeline area to arrange events.
5. Compare prints where available, then use **Accuse** when you can explain the case.

Use `Escape` to close an overlay. Use `+` / `-` to zoom the board and `0` to fit it.

## Project files

| File | Purpose |
| --- | --- |
| `case-board-v8.html` | The complete static application: layout, styling, SVG art, fictional case data, and game logic. |
| `GAME_DESIGN.md` | The product and gameplay design reference for future work. |

## Development checks

Validate the embedded JavaScript after editing it:

```bash
sed -n '/<script>/,/<\/script>/p' case-board-v8.html | sed '1d;$d' > /tmp/case-board.js
node --check /tmp/case-board.js
```

Then open the game in a browser and manually check the splash screen, case selection,
scene search, interviews, accusation flow, English/Arabic switch, and mobile layout.
