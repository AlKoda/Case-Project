# Supplied asset integration log

The two delivered sheets define 105 discrete production crops. The checked-in
runtime representation is the text-only `assets/sprites.js` bundle rather than
binary PNG files, allowing the change to pass through GitHub patch-based PR and
merge systems. The dependency-free extractor can regenerate all individual PNGs
and the bundle from the source sheets.

## In-game use

- Twelve label-free portraits are assigned to the two playable cases. Cards with
  printed identities are never assigned to differently named story characters.
- The captain reference card and paper stack furnish the opening menu.
- Red and compass card backs identify the theft and homicide case files.
- Four supplied symbols identify link, notebook, hint, and accusation controls.
- The ruled-paper sprite textures dialogue responses and notebook entries.

## Not present in these sheets

The delivered images do not contain room backgrounds, evidence-object photos,
or dedicated dialogue-button strips. Existing interactive SVG scene diagrams
and accessible HTML controls therefore remain in use rather than substituting
unrelated artwork.
