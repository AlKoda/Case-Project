/**
 * Asset manifest: the single contract between the game and its artwork.
 *
 * Nothing in the engine builds an image path by hand. Every image the game
 * shows is resolved through the helpers here, which means new art never
 * requires a code change -- only a file at the right path.
 *
 * ## Where art goes
 *
 *   assets/backgrounds/<scene>.png            1920 x 1080
 *   assets/characters/<person>/<mood>.png      900 x 1400, transparent
 *   assets/characters/<person>/bust-<mood>.png 512 x  512, head and shoulders
 *   assets/evidence/<exhibit>.png              512 x  512, transparent
 *
 * ## How a file is chosen
 *
 * Each helper returns candidate paths in priority order. The loader takes the
 * first one that actually decodes and remembers it, so a missing file costs one
 * failed request and nothing else. The order is always:
 *
 *   1. .png at the requested name        <- your art
 *   2. .svg at the requested name        <- vector art, if you prefer it
 *   3. a sensible fallback               <- e.g. neutral mood for a missing mood
 *   4. a generated placeholder           <- drawn at runtime, never blank
 *
 * Because of step 3 a character needs only `neutral.png` to appear in every
 * scene; add `tense.png` later and the tense beats start using it immediately,
 * with no edit anywhere in the code.
 */

/** Pixel dimensions each slot is composed against. Art is fitted, not cropped,
 *  so off-size images still work -- these are the sizes that avoid upscaling. */
export const SLOTS = {
  background: {
    width: 1920,
    height: 1080,
    note: "Room behind the scene. Safe area is the middle 70%: the stage figure covers the rest.",
  },
  stage: {
    width: 900,
    height: 1400,
    note: "The figure that pops out when someone speaks. Transparent PNG, cropped at mid-thigh, lit from the left.",
  },
  bust: {
    width: 512,
    height: 512,
    note:
      "Head and shoulders for the corner of the speech box and the board's cards. " +
      "`bust-<mood>.png` lets the corner portrait change expression with the stage " +
      "figure; a plain `bust.png` covers every mood at once. Without either, the " +
      "stage art is cropped to the head, which suits a full figure and little else.",
  },
  evidence: {
    width: 512,
    height: 512,
    note: "One exhibit, square, transparent, shot straight on against nothing.",
  },
};

/** Moods the dialogue scripts may ask for. A script may use any of these; the
 *  loader falls back to `neutral` for whichever files do not exist yet. */
export const MOODS = ["neutral", "tense", "evasive", "broken", "cold"];

const ROOT = "assets";

/** Candidate files for a scene background, best first. */
export function backgroundSources(scene) {
  return [`${ROOT}/backgrounds/${scene}.png`, `${ROOT}/backgrounds/${scene}.svg`];
}

/** Candidate files for a character at a given mood, best first.
 *  Falls back to the character's neutral art before giving up. */
export function portraitSources(person, mood = "neutral") {
  const sources = [
    `${ROOT}/characters/${person}/${mood}.png`,
    `${ROOT}/characters/${person}/${mood}.svg`,
  ];
  if (mood !== "neutral") {
    sources.push(`${ROOT}/characters/${person}/neutral.png`);
    sources.push(`${ROOT}/characters/${person}/neutral.svg`);
  }
  return sources;
}

/** Candidate files for the portrait framed in the corner of the speech box.
 *  Falls through to the stage art when no dedicated bust has been supplied. */
export function bustSources(person, mood = "neutral") {
  const sources = [];
  if (mood !== "neutral") {
    sources.push(`${ROOT}/characters/${person}/bust-${mood}.png`);
    sources.push(`${ROOT}/characters/${person}/bust-${mood}.svg`);
  }
  sources.push(`${ROOT}/characters/${person}/bust-neutral.png`);
  sources.push(`${ROOT}/characters/${person}/bust.png`);
  sources.push(`${ROOT}/characters/${person}/bust.svg`);
  return [...sources, ...portraitSources(person, mood)];
}

/** Candidate files for an evidence exhibit, best first. */
export function evidenceSources(exhibit) {
  return [`${ROOT}/evidence/${exhibit}.png`, `${ROOT}/evidence/${exhibit}.svg`];
}
