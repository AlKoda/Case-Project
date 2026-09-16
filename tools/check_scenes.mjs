/**
 * Integrity checks for the case data.
 *
 * The game is data-driven, which moves a whole class of mistakes out of the
 * code and into the script: a goto with no label, a press that accepts an
 * exhibit nobody can hold, a character who speaks without being on stage. None
 * of those throw at load time -- they fail in front of a player, halfway
 * through an interview. This catches them before a commit does.
 *
 *     node tools/check_scenes.mjs
 */

import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { SCENES, INTERVIEWS } from "../src/data/scenes.js";
import { CAST, EXHIBITS, CONTRADICTIONS, SUSPECTS, CULPRIT, VERDICTS, WITNESSES } from "../src/data/case.js";
import { MOODS } from "../src/data/manifest.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const problems = [];
const notes = [];

/** A real defect: the game will misbehave. */
const fail = (where, message) => problems.push(`${where}: ${message}`);

/**
 * Worth saying, but not a failure. Missing art is the obvious case -- the
 * loader draws a labelled placeholder, which is a deliberate part of the
 * design, so a build with art still to come must not fail the check.
 */
const note = (where, message) => notes.push(`${where}: ${message}`);

/** One of the candidate files for an asset must exist on disk. */
function artExists(...candidates) {
  return candidates.some((relative) => existsSync(join(ROOT, relative)));
}

for (const [id, scene] of Object.entries(SCENES)) {
  if (scene.id !== id) fail(id, `scene.id is "${scene.id}" but it is keyed as "${id}"`);

  const labels = new Set(scene.script.filter((n) => n.label).map((n) => n.label));
  const onStage = new Set();

  // Conditional blocks are inlined for checking; their nodes are real nodes.
  const nodes = scene.script.flatMap((node) => (node.then ? [node, ...node.then] : [node]));

  const jump = (target, where) => {
    if (target && !labels.has(target)) fail(id, `${where} jumps to missing label "${target}"`);
  };

  for (const node of nodes) {
    if (node.goto) jump(node.goto, "goto");
    if (node.enter) {
      if (!CAST[node.enter]) fail(id, `enter names unknown character "${node.enter}"`);
      onStage.add(node.enter);
    }
    if (node.exit && !CAST[node.exit]) fail(id, `exit names unknown character "${node.exit}"`);
    if (node.who) {
      if (!CAST[node.who]) fail(id, `line spoken by unknown character "${node.who}"`);
      else if (!CAST[node.who].noPortrait && !onStage.has(node.who)) {
        fail(id, `"${node.who}" speaks before entering the stage`);
      }
    }
    if (node.mood && !MOODS.includes(node.mood)) {
      fail(id, `unknown mood "${node.mood}" (manifest knows: ${MOODS.join(", ")})`);
    }
    if (node.give && !EXHIBITS[node.give]) fail(id, `gives unknown exhibit "${node.give}"`);
    if (node.prove && !CONTRADICTIONS[node.prove]) fail(id, `proves unknown contradiction "${node.prove}"`);
    if (node.choice) {
      for (const option of node.choice) {
        if (!option.text) fail(id, "a choice option has no text");
        jump(option.goto, `choice "${option.text}"`);
      }
    }
    if (node.press) {
      const accepts = Array.isArray(node.press.accepts) ? node.press.accepts : [node.press.accepts];
      for (const exhibit of accepts) {
        if (!EXHIBITS[exhibit]) fail(id, `press accepts unknown exhibit "${exhibit}"`);
      }
      if (node.press.prove && !CONTRADICTIONS[node.press.prove]) {
        fail(id, `press proves unknown contradiction "${node.press.prove}"`);
      }
      jump(node.press.hit, "press hit");
      jump(node.press.miss, "press miss");
      jump(node.press.stand, "press stand");
      if (!node.press.hit) fail(id, "a press has no hit branch, so proving it goes nowhere");
    }
  }

  if (scene.background && !artExists(`assets/backgrounds/${scene.background}.png`, `assets/backgrounds/${scene.background}.svg`)) {
    note(id, `background "${scene.background}" has no art; a placeholder will be drawn`);
  }
}

for (const interview of INTERVIEWS) {
  if (!SCENES[interview.id]) fail("INTERVIEWS", `lists missing scene "${interview.id}"`);
  if (!CAST[interview.person]) fail("INTERVIEWS", `lists unknown character "${interview.person}"`);
}

for (const [id, contradiction] of Object.entries(CONTRADICTIONS)) {
  if (!CAST[contradiction.subject]) fail(id, `subject "${contradiction.subject}" is not in the cast`);
  if (!EXHIBITS[contradiction.breaks]) fail(id, `broken by unknown exhibit "${contradiction.breaks}"`);
}

for (const suspect of SUSPECTS) {
  if (!CAST[suspect]) fail("SUSPECTS", `"${suspect}" is not in the cast`);
  if (!VERDICTS[suspect]) fail("SUSPECTS", `"${suspect}" can be accused but has no verdict`);
}
if (!VERDICTS[CULPRIT]?.correct) fail("VERDICTS", `the culprit "${CULPRIT}" is not marked correct`);
for (const [id, verdict] of Object.entries(VERDICTS)) {
  if (verdict.correct && id !== CULPRIT) fail("VERDICTS", `"${id}" is marked correct but the culprit is "${CULPRIT}"`);
}

// Every contradiction should be reachable from some press, or it can never be proven.
const proved = new Set();
for (const scene of Object.values(SCENES)) {
  for (const node of scene.script) {
    if (node.prove) proved.add(node.prove);
    if (node.press?.prove) proved.add(node.press.prove);
  }
}
for (const id of Object.keys(CONTRADICTIONS)) {
  if (!proved.has(id)) fail("CONTRADICTIONS", `"${id}" can never be proven; no press or prove node reaches it`);
}

// Every exhibit should be obtainable.
const given = new Set();
for (const scene of Object.values(SCENES)) {
  for (const node of scene.script) if (node.give) given.add(node.give);
}
for (const id of Object.keys(EXHIBITS)) {
  if (!given.has(id)) fail("EXHIBITS", `"${id}" is never given to the player`);
  if (!artExists(`assets/evidence/${id}.png`, `assets/evidence/${id}.svg`)) {
    note("EXHIBITS", `"${id}" has no art; a placeholder will be drawn`);
  }
}

for (const [id, person] of Object.entries(CAST)) {
  if (person.noPortrait) continue;   // deliberately has no art
  if (!artExists(`assets/characters/${id}/neutral.png`, `assets/characters/${id}/neutral.svg`)) {
    note("CAST", `"${id}" has no neutral art; a placeholder will be drawn`);
  }
}

// Witnesses feed the board and its timeline, so their data has to line up too.
for (const witness of WITNESSES) {
  if (!CAST[witness.person]) fail("WITNESSES", `unknown character "${witness.person}"`);
  if (!/^\d{2}:\d{2}$/.test(witness.time ?? "")) {
    fail("WITNESSES", `"${witness.person}" has no usable time for the timeline`);
  }
  if (!witness.headline || !witness.statement) {
    fail("WITNESSES", `"${witness.person}" is missing a headline or statement`);
  }
}

// Any exhibit that claims a time must state it in a form the timeline parses.
for (const [id, exhibit] of Object.entries(EXHIBITS)) {
  if (exhibit.time != null && !/^\d{2}:\d{2}$/.test(exhibit.time)) {
    fail("EXHIBITS", `"${id}" has an unreadable time "${exhibit.time}"`);
  }
}

if (problems.length) {
  console.error("Case data problems:");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

for (const item of notes) console.log(`  note: ${item}`);

const lines = Object.values(SCENES).reduce((n, s) => n + s.script.filter((x) => x.text != null).length, 0);
console.log(
  `OK: ${Object.keys(SCENES).length} scenes, ${lines} lines, ${Object.keys(CAST).length} cast, ` +
    `${Object.keys(EXHIBITS).length} exhibits, ${Object.keys(CONTRADICTIONS).length} contradictions, ` +
    `${SUSPECTS.length} suspects, ${WITNESSES.length} witnesses` +
    (notes.length ? `, ${notes.length} awaiting art` : ""),
);
