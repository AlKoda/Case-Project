# Supplied investigation sprites

The two supplied 1536×1024 sheets are integrated through the merge-safe,
text-only [`sprites.js`](sprites.js) data-URI bundle. It contains the 21 crops
used by the running game: twelve cast portraits, four control icons, two card
backs, a named menu card, and two paper surfaces. Keeping the runtime bundle as
JavaScript avoids binary-file patches that GitHub's patch importer cannot apply.

`tools/extract_assets.py` remains the canonical crop map. Given
`named-characters.png` and `sprite-sheet.png`, it also exports the complete set
of 105 PNG crops locally:

- 18 label-free portraits and ten named reference cards;
- 18 complete blank-label person cards and six card backs;
- 36 circular interface/status icons;
- 15 anonymous silhouette tokens; and
- a paper stack and ruled notebook panel.

Generated PNGs are intentionally gitignored. The extractor finishes by rebuilding
`assets/sprites.js` from the exact subset used at runtime, so the committed file
is deterministic and reviewable as text.
