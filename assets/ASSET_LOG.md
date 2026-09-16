# UI asset integration log

The supplied UI atlases are exported into merge-friendly, text-based SVG files
under `assets/ui/` and `assets/icons/`. The live game currently
uses the exports for:

- the main-menu case-file illustration;
- suspect, witness, and evidence card frames;
- the crime-scene case-file surface;
- modal, briefing, notebook, note, and toast paper treatments;
- toolbar actions, categories, help, hint, accusation, and board-zone symbols.

Text is deliberately not baked into interactive controls. Labels remain HTML so
English and Arabic modes, focus states, screen readers, and responsive layouts
continue to work. Crops containing example words are retained as reference
assets, but are not placed underneath live labels where duplicated wording would
be misleading.

Generic silhouettes from these UI sheets are likewise not presented as named
case characters. The project keeps dedicated directories for future story art.
