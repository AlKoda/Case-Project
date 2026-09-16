/**
 * Image loading against the asset manifest.
 *
 * Every lookup walks the manifest's candidate list and keeps the first file
 * that decodes. Results are cached for the session, so a missing file is probed
 * once and never again. If nothing resolves, a placeholder is drawn at runtime
 * rather than leaving a broken image: the game is always playable, whatever art
 * happens to be present.
 */

import { backgroundSources, portraitSources, bustSources, evidenceSources, SLOTS } from "../data/manifest.js";

const resolved = new Map();
const pending = new Map();

/** Does this URL decode as an image? */
function probe(url) {
  return new Promise((done) => {
    const image = new Image();
    image.onload = () => done(image.naturalWidth > 0);
    image.onerror = () => done(false);
    image.src = url;
  });
}

/**
 * Draw a stand-in so a missing file never shows as a broken image.
 * Styled to match the game rather than shouting: a dark card, a hairline in
 * lamp amber, and the name of the thing that is missing.
 */
function placeholder({ width, height, label, kind }) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const wash = ctx.createLinearGradient(0, 0, 0, height);
  wash.addColorStop(0, "#1b202a");
  wash.addColorStop(1, "#0b0d13");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);

  // Diagonal hatch, so a placeholder never reads as finished art.
  ctx.strokeStyle = "rgba(232, 176, 75, 0.06)";
  ctx.lineWidth = Math.max(2, width / 200);
  const step = Math.max(24, width / 14);
  for (let x = -height; x < width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + height, height);
    ctx.stroke();
  }

  const inset = Math.max(8, width * 0.03);
  ctx.strokeStyle = "rgba(232, 176, 75, 0.35)";
  ctx.lineWidth = Math.max(1, width / 400);
  ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);

  const size = Math.max(16, Math.min(width, height) * 0.075);
  ctx.fillStyle = "#cdc8bd";
  ctx.font = `${size}px Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, width / 2, height / 2 - size * 0.6);
  ctx.fillStyle = "#6b675f";
  ctx.font = `${size * 0.62}px "Courier New", monospace`;
  ctx.fillText(`${kind} · art pending`, width / 2, height / 2 + size * 0.7);

  return canvas.toDataURL("image/png");
}

/** Walk `candidates`, cache and return the first that decodes, else a placeholder. */
function resolve(key, candidates, spec) {
  if (resolved.has(key)) return Promise.resolve(resolved.get(key));
  if (pending.has(key)) return pending.get(key);

  const search = (async () => {
    for (const url of candidates) {
      if (await probe(url)) {
        resolved.set(key, url);
        return url;
      }
    }
    const drawn = placeholder(spec);
    resolved.set(key, drawn);
    return drawn;
  })();

  pending.set(key, search);
  search.finally(() => pending.delete(key));
  return search;
}

export function background(scene, label = scene) {
  return resolve(`bg:${scene}`, backgroundSources(scene), {
    ...SLOTS.background,
    label,
    kind: "background",
  });
}

export function portrait(person, mood = "neutral", label = person) {
  return resolve(`art:${person}:${mood}`, portraitSources(person, mood), {
    ...SLOTS.stage,
    label,
    kind: "portrait",
  });
}

export function bust(person, mood = "neutral", label = person) {
  return resolve(`bust:${person}:${mood}`, bustSources(person, mood), {
    ...SLOTS.bust,
    label,
    kind: "portrait",
  });
}

export function evidence(exhibit, label = exhibit) {
  return resolve(`ev:${exhibit}`, evidenceSources(exhibit), {
    ...SLOTS.evidence,
    label,
    kind: "exhibit",
  });
}

/** Warm the cache so a scene change does not flash. Failures are not fatal. */
export async function preload(jobs) {
  await Promise.allSettled(jobs);
}
