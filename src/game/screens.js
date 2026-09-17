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
import { CASE, CAST, EXHIBITS, CONTRADICTIONS, SUSPECTS, CULPRIT, VERDICTS, DIALOGUE_CLUES } from "../data/case.js";
import { SCENES } from "../data/scenes.js";
import { mountBoard } from "./board.js";
import * as preferences from "../engine/preferences.js";
import { mountMap } from "./map.js";

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

  const screen = el("section", { class: "screen title grain" },
      art,
      el("div", { class: "title__vignette", "aria-hidden": "true" }),
      el("header", { class: "title__mast" },
        el("span", { class: "title__rule", "aria-hidden": "true" }),
        el("p", { text: t("title.department", "Royal Oman Police · Nightwatch") }),
      ),
      el("div", { class: "title__layout" },
        el("div", { class: "title__identity" },
          el("p", { class: "title__file", text: t("title.file", CASE.file) }),
          el("h1", { class: "title__name", text: t("title.name", CASE.title) }),
          el("p", { class: "title__strap", text: t("title.strap", CASE.strapline) }),
        ),
        el("nav", { class: "title__menu", "aria-label": t("title.menu", "Main menu") },
          el("button", {
            class: "menu-button btn--major",
            type: "button",
            text: store.hasSave() ? t("title.new", "New investigation") : t("title.begin", "Begin the night"),
            onClick: () => {
              store.reset();
              go("intro");
            },
          }),
          store.hasSave()
            ? el("button", {
                class: "menu-button btn",
                type: "button",
                text: t("title.resume", "Resume investigation"),
                onClick: () => {
                  store.restore();
                  go("hub");
                },
              })
            : null,
          el("button", {
            class: "menu-button",
            type: "button",
            text: t("title.settings", "Settings"),
            onClick: () => go("settings", { back: "title" }),
          }),
        ),
      ),
      el("footer", { class: "title__foot" },
        el("div", { class: "title__credits" },
          el("p", { class: "title__note", text: t("title.note", "A work of fiction. Click or press space to advance dialogue.") }),
          el("p", { class: "title__maker" },
            el("span", { lang: "en", text: 'Made by Officer Cadet Almunther Abdullah Rashid Almakhmari' }),
            el("span", { lang: "ar", dir: "rtl", text: 'صنع بواسطة الضابط المرشح المنذر بن عبدالله بن راشد المخمري' }),
          ),
        ),
        el("p", { class: "title__edition", text: t("title.edition", "The Muttrah file · 1948") }),
      ),
    );
  root.append(screen);

  // A restrained parallax tilt makes the menu feel like a physical case file.
  // CSS variables keep the effect decorative and trivial to disable.
  screen.addEventListener("pointermove", (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 2;
    const y = (event.clientY / window.innerHeight - 0.5) * 2;
    screen.style.setProperty("--look-x", x.toFixed(3));
    screen.style.setProperty("--look-y", y.toFixed(3));
  });
  screen.addEventListener("pointerleave", () => {
    screen.style.setProperty("--look-x", 0);
    screen.style.setProperty("--look-y", 0);
  });
}

/* ------------------------------------------------------------- settings */

function optionGroup(key, legend, options, value, onChange) {
  return el("fieldset", { class: "settings__group" },
    el("legend", { text: legend }),
    el("div", { class: "settings__options" },
      options.map(([id, label, note]) => el("label", { class: "settings__option" },
        el("input", {
          type: "radio",
          name: key,
          value: id,
          checked: value === id,
          onChange: () => onChange(id),
        }),
        el("span", null, el("b", { text: label }), el("small", { text: note })),
      )),
    ),
  );
}

export function settings(root, go, { back = "title" } = {}) {
  const prefs = preferences.get();
  const preview = el("p", {
    class: "settings__preview",
    text: t("settings.preview", "The rain had erased every footprint except the one that mattered."),
  });

  root.append(el("section", { class: "screen settings grain" },
    el("div", { class: "settings__art", "aria-hidden": "true" }),
    el("div", { class: "settings__panel" },
      el("p", { class: "settings__eyebrow", text: t("settings.eyebrow", "Desk preferences") }),
      el("h1", { text: t("settings.title", "Settings") }),
      el("p", { class: "settings__lede", text: t("settings.lede", "Adjust how the case is presented. Changes are saved on this device.") }),
      optionGroup("textSpeed", t("settings.text", "Dialogue speed"), [
        ["slow", t("settings.slow", "Measured"), t("settings.slowNote", "A deliberate reading pace")],
        ["normal", t("settings.normal", "Standard"), t("settings.normalNote", "The intended pace")],
        ["fast", t("settings.fast", "Swift"), t("settings.fastNote", "Reveal lines quickly")],
        ["instant", t("settings.instant", "Instant"), t("settings.instantNote", "Show complete lines")],
      ], prefs.textSpeed, (textSpeed) => preferences.update({ textSpeed })),
      preview,
      optionGroup("motion", t("settings.motion", "Motion"), [
        ["system", t("settings.system", "Use system setting"), t("settings.systemNote", "Follow your device preference")],
        ["reduced", t("settings.reduced", "Reduce motion"), t("settings.reducedNote", "Remove decorative movement")],
      ], prefs.motion, (motion) => preferences.update({ motion })),
      el("label", { class: "settings__toggle" },
        el("input", {
          type: "checkbox",
          checked: prefs.grain,
          onChange: (event) => preferences.update({ grain: event.currentTarget.checked }),
        }),
        el("span", null,
          el("b", { text: t("settings.grain", "Film grain") }),
          el("small", { text: t("settings.grainNote", "Keep the noir texture over scenes") }),
        ),
      ),
      el("button", { class: "btn settings__back", type: "button", dataset: { escapeBack: "true" }, text: t("settings.back", "Back to main menu"), onClick: () => go(back) }),
    ),
  ));
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

  let closeBoard = null;
  let boardWasOpen = false;
  const openBoard = () => {
    if (boardWasOpen) return;
    boardWasOpen = true;
    host.setAttribute("inert", "");
    const overlay = el("div", { class: "board-overlay", role: "dialog", "aria-modal": "true", "aria-label": t("board.dialog", "Case board") });
    root.append(overlay);
    const cleanup = mountBoard(overlay, go, {
      overlay: true,
      onClose: () => {
        cleanup();
        overlay.remove();
        host.removeAttribute("inert");
        boardWasOpen = false;
        stage.dom.boardButton.focus();
      },
    });
    closeBoard = () => {
      cleanup();
      overlay.remove();
      host.removeAttribute("inert");
      boardWasOpen = false;
    };
  };

  const stage = createStage(host, { onOpenBoard: openBoard });
  store.update({ scene: id });

  await playScene(stage, definition, {
    cast: CAST,
    exhibits: EXHIBITS,
    onExhibit: (exhibitId) => flash(host, t("hud.filed", "Filed:"), EXHIBITS[exhibitId]?.name ?? exhibitId),
    onProof: (proofId) => flash(host, t("hud.broken", "Account broken:"), CONTRADICTIONS[proofId]?.claim ?? proofId),
    onClue: (clueId) => flash(host, t("hud.clueFiled", "Testimony filed:"), DIALOGUE_CLUES[clueId]?.headline ?? clueId),
  });

  closeBoard?.();
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
  mountMap(root, go);
}

/** The case board is a tool at the station, rather than the whole field hub. */
export function board(root, go) {
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
        dataset: { escapeBack: "true" },
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
          dataset: { escapeBack: "true" },
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

export const SCREENS = { title, settings, hub, accuse, verdict, scene };
export { transition };
