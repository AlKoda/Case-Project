/**
 * Screens.
 *
 * Everything outside a played scene: the title, the case board the player
 * returns to between interviews, the accusation, and the verdict. Each screen
 * is a function that fills a root element and calls `go(name)` to move on.
 */

import { el, clear } from "../engine/dom.js";
import { t } from "../engine/i18n.js";
import * as store from "../engine/store.js";
import * as assets from "../engine/assets.js";
import { createStage } from "../engine/vn.js";
import { playScene } from "../engine/player.js";
import { CASE, CAST, EXHIBITS, CONTRADICTIONS, SUSPECTS, CULPRIT, VERDICTS } from "../data/case.js";
import { SCENES } from "../data/scenes.js";
import { mountBoard } from "./board.js";

/** Screens fade through this so a hard cut never happens mid-sentence. */
function transition(root, build) {
  root.classList.add("is-leaving");
  return new Promise((resolve) => {
    setTimeout(() => {
      clear(root);
      root.classList.remove("is-leaving");
      build();
      resolve();
    }, 180);
  });
}

/* ---------------------------------------------------------------- title */

export function title(root, go) {
  const art = el("div", { class: "title__art" });
  assets.background("rain-street", "Outside the Bellweather").then((url) => {
    art.style.backgroundImage = `url("${url}")`;
  });

  root.append(
    el("section", { class: "screen title grain" },
      art,
      el("div", { class: "title__vignette", "aria-hidden": "true" }),
      el("div", { class: "title__plate" },
        el("p", { class: "title__file", text: t("title.file", CASE.file) }),
        el("h1", { class: "title__name", text: t("title.name", CASE.title) }),
        el("p", { class: "title__strap", text: t("title.strap", CASE.strapline) }),
        el("div", { class: "title__actions" },
          el("button", {
            class: "btn btn--major",
            type: "button",
            text: t("title.begin", "Begin the night"),
            onClick: () => {
              store.reset();
              go("intro");
            },
          }),
          store.hasSave()
            ? el("button", {
                class: "btn",
                type: "button",
                text: t("title.resume", "Resume"),
                onClick: () => {
                  store.restore();
                  go("hub");
                },
              })
            : null,
        ),
        el("p", { class: "title__note", text: t("title.note", "A work of fiction. Click or press space to advance dialogue.") }),
      ),
    ),
  );
}

/* ----------------------------------------------------------------- scene */

/** Play a VN scene, then hand control to `next`. */
export async function scene(root, go, { id, next }) {
  const definition = SCENES[id];
  if (!definition) {
    console.error(`No scene "${id}"`);
    return go("hub");
  }

  const host = el("section", { class: "screen screen--scene" });
  root.append(host);

  const stage = createStage(host);
  store.update({ scene: id });

  await playScene(stage, definition, {
    cast: CAST,
    exhibits: EXHIBITS,
    onExhibit: (exhibitId) => flash(host, t("hud.filed", "Filed:"), EXHIBITS[exhibitId]?.name ?? exhibitId),
    onProof: (proofId) => flash(host, t("hud.broken", "Account broken:"), CONTRADICTIONS[proofId]?.claim ?? proofId),
  });

  stage.destroy();
  store.collect("completed", id);
  go(next ?? "hub");
}

/** A short banner for something the player just gained. */
function flash(host, label, body) {
  const note = el("div", { class: "flash" },
    el("b", { text: label }),
    el("span", { text: body }),
  );
  host.append(note);
  requestAnimationFrame(() => note.classList.add("is-on"));
  setTimeout(() => {
    note.classList.remove("is-on");
    setTimeout(() => note.remove(), 400);
  }, 2600);
}

/* ------------------------------------------------------------------ wall */

/**
 * The case board. The scene work is done in `board.js`; this only guarantees
 * the player has been to the stairs first, since a wall with nothing to pin on
 * it is a poor introduction to a wall.
 */
export function hub(root, go) {
  if (!store.get().completed.includes("scene:stairs")) {
    return go("scene", { id: "scene:stairs", next: "hub" });
  }
  mountBoard(root, go);
}

/* --------------------------------------------------------------- accuse */

export function accuse(root, go) {
  const state = store.get();

  /** How much of a person's account the player has actually taken apart. */
  const brokenFor = (id) =>
    state.proven
      .map((proofId) => CONTRADICTIONS[proofId])
      .filter((proof) => proof?.subject === id);

  const list = el("div", { class: "accuse__row" });
  for (const id of SUSPECTS) {
    const person = CAST[id];
    const broken = brokenFor(id);
    const weight = broken.reduce((sum, proof) => sum + proof.weight, 0);

    const shot = el("img", { alt: "", class: "accuse__shot" });
    assets.bust(id, "cold", person.name).then((url) => { shot.src = url; });

    const card = el("button", {
      class: `accuse__card${broken.length ? " has-proof" : ""}`,
      type: "button",
      onClick: () => {
        store.update({ accusation: id });
        go("verdict");
      },
    },
      shot,
      el("p", { class: "accuse__name", text: t(`cast.${id}.name`, person.name) }),
      el("p", { class: "accuse__role", text: t(`cast.${id}.role`, person.role) }),
      el("p", {
        class: "accuse__proof",
        text: broken.length
          ? `${broken.length} ${t("accuse.broken", "broken")} \u00b7 ${t("accuse.weight", "weight")} ${weight}`
          : t("accuse.nothing", "nothing broken"),
      }),
    );
    card.style.setProperty("--accent", person.accent);
    list.append(card);
  }

  /* One honest line about how the file reads, without naming anyone. */
  const strongest = Math.max(0, ...SUSPECTS.map((id) => brokenFor(id).length));
  const gauge =
    strongest >= 3
      ? t("accuse.ready", "Three of one person's statements are in pieces. That is a case.")
      : strongest > 0
        ? t("accuse.thin", "You can name somebody on this. Whether it stands up in the morning is another question.")
        : t("accuse.none", "Nobody's account has been broken yet. This would be a guess with a signature on it.");

  root.append(
    el("section", { class: "screen accuse grain" },
      el("h1", { class: "accuse__title", text: t("accuse.title", "Name one.") }),
      el("p", { class: "accuse__lede", text: t("accuse.lede", "Once it is said out loud it is said. The file goes forward with your name on it.") }),
      el("p", { class: "accuse__gauge", text: gauge }),
      list,
      el("button", {
        class: "btn",
        type: "button",
        text: t("accuse.back", "Not yet"),
        onClick: () => go("hub"),
      }),
    ),
  );
}

/* -------------------------------------------------------------- verdict */

export function verdict(root, go) {
  const state = store.get();
  const named = state.accusation;
  const result = VERDICTS[named] ?? VERDICTS[CULPRIT];
  const person = CAST[named] ?? CAST[CULPRIT];
  const proofs = state.proven.map((id) => CONTRADICTIONS[id]).filter(Boolean);
  const supporting = proofs.filter((p) => p.subject === named);
  const weight = supporting.reduce((sum, p) => sum + p.weight, 0);

  const shot = el("img", { alt: "", class: "verdict__shot" });
  assets.bust(named, "broken", person.name).then((url) => { shot.src = url; });

  root.append(
    el("section", { class: `screen verdict grain ${result.correct ? "is-right" : "is-wrong"}` },
      el("p", { class: "verdict__stamp", text: result.correct ? t("verdict.charged", "Charged") : t("verdict.released", "Released without charge") }),
      el("div", { class: "verdict__head" },
        shot,
        el("div", null,
          el("h1", { class: "verdict__name", text: result.headline }),
          el("p", { class: "verdict__body", text: result.body }),
        ),
      ),
      el("div", { class: "verdict__ledger" },
        el("h2", { text: t("verdict.support", "What you could prove") }),
        supporting.length
          ? supporting.map((p) => el("p", { class: "verdict__proof" }, el("q", { text: p.claim }), " ", p.verdict))
          : el("p", { class: "panel__empty", text: t("verdict.nothing", "Nothing in this person's account was ever broken.") }),
        el("p", { class: "verdict__weight", text: `${t("verdict.weight", "Weight of proof:")} ${weight}` }),
      ),
      el("div", { class: "verdict__actions" },
        el("button", {
          class: "btn",
          type: "button",
          text: t("verdict.reopen", "Reopen the file"),
          onClick: () => { store.update({ accusation: null }); go("hub"); },
        }),
        el("button", {
          class: "btn btn--major",
          type: "button",
          text: t("verdict.again", "Start a new night"),
          onClick: () => { store.reset(); go("title"); },
        }),
      ),
    ),
  );
}

export const SCREENS = { title, hub, accuse, verdict, scene };
export { transition };
