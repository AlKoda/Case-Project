# UI reference sheets

Design reference for the game's interface, supplied as full sheets. These are
**source material, not runtime assets** — nothing in `src/` loads them. They are
kept here so they survive, and so whatever gets cut out of them can be traced
back to where it came from.

| File | What is on it |
| --- | --- |
| `screen-layouts.png` | Nine screens: title, main menu, case selection, investigation overview, evidence detail, suspect profile, interrogation, options, save/load |
| `ui-panels.png` | Panels and windows: case file, evidence, dossier, dialogue strip, inventory grid, evidence board frame, tabs, buttons, toggles, sliders, modals, stamps |
| `icons.png` | Icon set: people, locations, documents, evidence, communication, objects, actions, map, controls, labels, time, badges |
| `vn-templates.png` | Visual-novel chrome: dialogue boxes, portrait frames, nameplates, emotion markers, narration and thought boxes, choice buttons, banners |
| `card-templates.png` | Blank dossier and card templates: suspect, witness, person, evidence, document, location, theory, plus folders, notes, photos, pins, seals and stamps |
| `hud-dialogue.png` | In-game HUD: dialogue box, choice list, inventory, quick slots, evidence and notebook panels, objectives, notifications, save slots, pause menu |
| `settings.png` | Settings screen: tabs, sliders, toggles, checkboxes, dropdowns, key bindings, confirm and warning dialogs |
| `case-board-kit.png` | Corkboard kit: board surfaces, polaroids, pins, string, tags, folders, suspect profile, timeline and clue-list panels |
| `main-menu.png` | Main menu and case selection: title lockup, buttons in every state, case cards, episode list, detective profile |
| `board-and-props.png` | Evidence board backgrounds and props: cork surfaces in three crops, pinned photos, notes, string, pins, tape, stamps, map fragments, desk dressing |

Anything cut from these belongs under `assets/`, at the paths
[`assets/README.md`](../../assets/README.md) documents.

Sibling folders hold the rest of the reference library:
[`../character-sheets/`](../character-sheets/) for people and
[`../environment-sheets/`](../environment-sheets/) for places.

New art is imported with `tools/import_reference.py`, which fingerprints by
pixel content and refuses anything the project already has — five of these
sheets arrived twice and the second copies were skipped.
