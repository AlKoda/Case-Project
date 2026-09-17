/**
 * Script interpreter.
 *
 * Walks a scene's node list and drives the stage. Keeping this separate from
 * `vn.js` means the presentation knows nothing about evidence or contradictions,
 * and the case data knows nothing about the DOM.
 */

import * as store from "./store.js";
import { t } from "./i18n.js";
import * as assets from "./assets.js";
import { expand } from "./script.js";

/** Map every { label } node to its index so { goto } can jump. */
function labels(script) {
  const table = new Map();
  script.forEach((node, index) => {
    if (node.label) table.set(node.label, index);
  });
  return table;
}

/**
 * Play one scene to its end.
 *
 * @param stage    a stage from createStage()
 * @param scene    { id, background, clock, script }
 * @param context  { cast, exhibits, onExhibit, onProof }
 */
export async function playScene(stage, scene, context) {
  const { cast = {}, exhibits = {} } = context;
  const script = expand(scene.script, scene.id, (when) => when(store.get(), context));
  const marks = labels(script);

  if (scene.background) {
    await stage.setBackground(scene.background, scene.backgroundName ?? scene.background);
  }
  stage.setClock(scene.clock ?? "");

  // Warm every face this scene can wear before the first line. A mood swap
  // resolves through the cache once, but the first time it happens it is a
  // fetch in the middle of a sentence, which lands as a stutter exactly when
  // the player is meant to be reading somebody's expression change.
  warmScene(script, cast);

  let index = 0;
  let guard = 0;

  while (index < script.length && !stage.destroyed) {
    if (guard++ > 10000) {
      console.error(`Scene "${scene.id}" ran away; check its goto targets.`);
      break;
    }
    const node = script[index];
    const jump = await run(node, { stage, scene, script, cast, exhibits, context });

    if (stage.destroyed || jump?.end) break;
    if (jump?.goto) {
      const target = marks.get(jump.goto);
      if (target == null) {
        console.error(`Scene "${scene.id}" jumps to unknown label "${jump.goto}".`);
        break;
      }
      index = target + 1;
      continue;
    }
    index += 1;
  }

  return store.get();
}

/** Fetch the art a scene will ask for, without blocking its first line. */
function warmScene(script, cast) {
  const people = new Set();
  const moods = new Set(["neutral"]);
  for (const node of script) {
    if (node.enter) people.add(node.enter);
    if (node.who && !cast[node.who]?.noPortrait) people.add(node.who);
    if (node.mood) moods.add(node.mood);
  }

  const jobs = [];
  for (const person of people) {
    const name = cast[person]?.name ?? person;
    for (const mood of moods) {
      jobs.push(assets.portrait(person, mood, name));
      jobs.push(assets.bust(person, mood, name));
    }
  }
  // Deliberately not awaited: the first line should not wait on the last face.
  assets.preload(jobs);
}

async function run(node, ctx) {
  const { stage, scene, cast, exhibits, context } = ctx;

  if (node.label != null) return null;
  if (node.end) return { end: true };
  if (node.goto) return { goto: node.goto };

  if (node.bg) {
    await stage.setBackground(node.bg, node.bgName ?? node.bg);
    return null;
  }

  if (node.clock) {
    stage.setClock(node.clock);
    return null;
  }

  if (node.enter) {
    await stage.enter(node.enter, { at: node.at, mood: node.mood, cast });
    return null;
  }

  if (node.exit) {
    await stage.exit(node.exit);
    return null;
  }

  if (node.give) {
    store.collect("exhibits", node.give);
    context.onExhibit?.(node.give);
    return null;
  }

  if (node.fingerprint) {
    const id = `fingerprint-${node.fingerprint}`;
    store.collect("exhibits", id);
    context.onExhibit?.(id);
    return null;
  }

  if (node.clue) {
    const state = store.get();
    if (state.clues.includes(node.clue) || state.dismissedClues.includes(node.clue)) return null;
    const chosen = await stage.ask([
      { text: t("vn.fileClue", "File this as a clue"), action: "file" },
      { text: t("vn.leaveTestimony", "Leave it as testimony"), action: "leave" },
    ]);
    if (stage.destroyed) return { end: true };
    if (chosen.action === "file") {
      store.collect("clues", node.clue);
      context.onClue?.(node.clue);
    } else {
      store.collect("dismissedClues", node.clue);
    }
    return null;
  }

  if (node.prove) {
    store.collect("proven", node.prove);
    context.onProof?.(node.prove);
    return null;
  }

  if (node.flag) {
    store.setFlag(node.flag, node.value ?? true);
    return null;
  }

  if (node.choice) {
    const options = node.choice.filter((option) => !option.when || option.when(store.get()));
    const chosen = await stage.ask(options);
    if (stage.destroyed) return { end: true };
    chosen.take?.(store);
    if (chosen.goto) return { goto: chosen.goto };
    return null;
  }

  if (node.press) return pressClaim(node.press, node.key, ctx);

  if (node.text != null) {
    const speaker = node.who ?? null;
    const line = t(node.key ?? scene.id, node.text);

    if (speaker) {
      if (node.mood) await stage.setMood(speaker, node.mood);
      stage.spotlight(speaker);
    } else {
      stage.spotlight(null);
    }
    await stage.setBust(speaker, node.mood, cast);
    await stage.typeOut(line);
    stage.remember(speaker ? (cast[speaker]?.name ?? speaker) : null, line);
    await stage.waitForAdvance();
    return null;
  }

  console.warn("Unrecognised script node:", node);
  return null;
}

/**
 * The player challenges a claim with an exhibit.
 *
 * A hit records the contradiction and continues down `hit`; a miss plays `miss`
 * and returns to the claim, because being wrong should cost a beat rather than
 * end the interview.
 */
async function pressClaim(press, key, ctx) {
  const { stage, cast, exhibits, context } = ctx;
  const held = store.get().exhibits;

  if (held.length === 0) {
    await stage.typeOut(t("vn.nothingToPress", "Nothing in the file contradicts that. Not yet."));
    await stage.waitForAdvance();
    return press.miss ? { goto: press.miss } : null;
  }

  // Give the tray resolved artwork so exhibits are recognisable at a glance.
  const catalogue = {};
  await Promise.all(
    held.map(async (id) => {
      const exhibit = exhibits[id] ?? { name: id };
      catalogue[id] = { ...exhibit, art: await assets.evidence(id, exhibit.name ?? id) };
    }),
  );

  // Keyed off the press node itself: a scene may hold several presses.
  const claim = t(`${key}.claim`, press.claim);
  const picked = await stage.press(claim, held, catalogue);

  if (stage.destroyed) return { end: true };
  if (picked == null) return press.stand ? { goto: press.stand } : null;

  const accepts = Array.isArray(press.accepts) ? press.accepts : [press.accepts];
  if (accepts.includes(picked)) {
    if (press.prove) {
      store.collect("proven", press.prove);
      context.onProof?.(press.prove);
    }
    return press.hit ? { goto: press.hit } : null;
  }
  return press.miss ? { goto: press.miss } : null;
}
