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
import { openDialog, showHelp, toggleFullscreen } from "../engine/dialog.js";
import { isPresenting, startPresentation, currentStep } from "./presenter.js";
import { PRESENTATION_SCENES } from "../data/presentation.js";

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
  assets.background("rain-street", "Outside the Al-Manar").then((url) => {
    art.style.backgroundImage = `url("${url}")`;
  });

  const screen = el("section", { class: "screen title grain" },
      art,
      el("div", { class: "title__vignette", "aria-hidden": "true" }),
      el("header", { class: "title__mast" },
        el("span", { class: "title__rule", "aria-hidden": "true" }),
        el("p", { text: t("title.department", "Nightwatch · Muttrah case archive") }),
        el("button", { class: "title__fullscreen", type: "button", text: t("title.fullscreen", "Full screen ↗"), onClick: toggleFullscreen }),
      ),
      el("div", { class: "title__layout" },
        el("div", { class: "title__identity" },
          el("p", { class: "title__file", text: t("title.file", CASE.file) }),
          el("h1", { class: "title__name", text: t("title.name", CASE.title) }),
          el("p", { class: "title__strap", text: t("title.strap", CASE.strapline) }),
          el("p", { class: "title__format", text: t("title.format", "An interactive investigation demonstration") }),
          el("div", { class: "title__facts" },
            ...[["01", "Incident"], ["07", "People awake"], ["03", "Suspect accounts"]].map(([value, label], i) => el("div", null,
              el("b", { text: value }), el("span", { text: t(`title.fact.${i}`, label) }))),
          ),
        ),
        el("nav", { class: "title__menu", "aria-label": t("title.menu", "Main menu") },
          el("div", { class: "title__dossier" },
            el("p", { class: "eyebrow", text: t("title.dossier", "Investigation dossier / 47-B") }),
            el("h2", { text: t("title.dossierTitle", "A fall. Or a cover story.") }),
            el("p", { text: t("title.dossierBody", "A night manager is found beneath a dark staircase. Examine the scene, compare the accounts, and build a case from what you can prove.") }),
          ),
          el("button", { class: "menu-button btn--major", type: "button", text: t("title.walkthrough", "Presentation walkthrough"), onClick: () => startPresentation(go) }),
          el("p", { class: "title__walkthrough-note", text: t("title.walkthroughNote", "Five prepared chapters · about 5 minutes · separate from your saved case") }),
          el("button", {
            class: "menu-button",
            type: "button",
            text: store.hasSave() ? t("title.new", "New investigation") : t("title.begin", "Open the full investigation"),
            onClick: () => {
              const begin = () => { store.reset(); go("briefing"); };
              if (store.hasSave()) openDialog({ title: t("title.replace", "Start a fresh investigation?"), body: t("title.replaceBody", "This replaces the case saved on this device. The presentation walkthrough can be used without replacing it."), actions: [{ label: t("title.confirmNew", "Start new case"), primary: true, run: begin }] });
              else begin();
            },
          }),
          store.hasSave()
            ? el("button", {
                class: "menu-button btn",
                type: "button",
                text: t("title.resume", "Resume investigation"),
                onClick: () => {
                  store.restore();
                  go(store.get().scene || store.get().completed.length ? "hub" : "briefing");
                },
              })
            : null,
          el("button", { class: "menu-button", type: "button", text: t("help.title", "Working the case"), onClick: showHelp }),
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
          el("p", { class: "title__note", text: t("title.note", "Fictional scenario · AI-assisted development · No live AI decisions.") }),
          el("p", { class: "title__maker" },
            el("span", { lang: "en", text: 'Made by Officer Cadet Almunther Abdullah Rashid Almakhmari' }),
            el("span", { lang: "ar", dir: "rtl", text: 'صنع بواسطة الضابط المرشح المنذر بن عبدالله بن راشد المخمري' }),
          ),
        ),
        el("p", { class: "title__edition", text: t("title.edition", "The Muttrah file · Demonstration edition") }),
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

export function briefing(root, go) {
  const presenting = isPresenting();
  root.append(el("section", { class: "screen briefing grain" },
    el("header", { class: "briefing__mast" },
      el("span", { class: "eyebrow", text: t("briefing.archive", "Nightwatch / Investigation brief") }),
      el("span", { class: "eyebrow", text: CASE.file })),
    el("div", { class: "briefing__layout" },
      el("div", { class: "briefing__story" },
        el("p", { class: "eyebrow", text: t("briefing.location", "Al-Manar Hotel · Muttrah harbour") }),
        el("h1", null, t("briefing.title", "Every account leaves"), el("br"), el("em", { text: t("briefing.titleEnd", "a trace.") })),
        el("p", { class: "briefing__lede", text: t("briefing.lede", "A night manager. A dark staircase. A report that calls it an accident.") }),
        el("p", { text: t("briefing.body", "Tariq Al-Rawahi was found at the foot of the service stairs at 02:14. Seven people were awake in the hotel. Your task is to reconstruct the night, test their accounts, and distinguish suspicion from a supported finding.") }),
        el("div", { class: "briefing__incident" },
          el("div", null, el("span", { text: t("briefing.victim", "Victim") }), el("b", { text: "Tariq Al-Rawahi" })),
          el("div", null, el("span", { text: t("briefing.discovery", "Reported discovery") }), el("b", { text: "02:14" })),
          el("div", null, el("span", { text: t("briefing.scene", "Scene") }), el("b", { text: t("location.stairs.name", "Service stairs") }))),
      ),
      el("aside", { class: "briefing__method" },
        el("p", { class: "eyebrow", text: t("briefing.method", "The investigation workflow") }),
        ...[
          ["Observe", "Examine the scene and collect physical evidence."],
          ["Question", "Hear each account and file useful testimony."],
          ["Connect", "Compare exhibits, trace times, and challenge contradictions."],
          ["Conclude", "Review what was established and explain the finding."],
        ].map(([label, body], i) => el("div", { class: "method-step" },
          el("span", { text: `0${i + 1}` }), el("div", null, el("h2", { text: t(`briefing.method.${i}.title`, label) }), el("p", { text: t(`briefing.method.${i}.body`, body) })))),
        el("div", { class: "briefing__actions" },
          el("button", { class: "btn btn--major", type: "button", text: presenting ? t("briefing.demoBegin", "Examine the first exhibit →") : t("briefing.begin", "Begin investigation →"), onClick: () => presenting ? go("presentation", { step: 1 }) : go("intro") }),
          !presenting ? el("button", { class: "briefing__back", type: "button", dataset: { escapeBack: "true" }, text: t("briefing.back", "Back to main menu"), onClick: () => go("title") }) : null)),
    ),
    el("footer", { class: "briefing__footer" },
      el("p", { text: t("briefing.controls", "Read at your own pace · Click or Space to advance · Revisit any location") }),
      el("p", { text: presenting ? t("briefing.prepared", "Presentation uses prepared checkpoints. Your saved investigation is preserved.") : t("briefing.fiction", "A fictional scenario for demonstration, not an account of official investigative procedure.") })),
  ));
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
      el("button", { class: "btn settings__back", type: "button", dataset: { escapeBack: "true" }, text: back === "title" ? t("settings.back", "Back to main menu") : t("map.back", "Back to map"), onClick: () => go(back) }),
    ),
  ));
}

/* ----------------------------------------------------------------- scene */

/** Play a VN scene, then hand control to `next`. */
export function scene(root, go, { id, next }) {
  const definition = SCENES[id] ?? PRESENTATION_SCENES[id];
  let cancelled = false;
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
    const containFocus = (event) => {
      if (event.key !== "Tab") return;
      const controls = [...overlay.querySelectorAll('button:not([disabled]), textarea, [tabindex="0"]')];
      const first = controls[0], last = controls.at(-1);
      if (!first) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    overlay.addEventListener("keydown", containFocus);
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
    overlay.querySelector('.board__close')?.focus();
    closeBoard = () => {
      cleanup();
      overlay.remove();
      host.removeAttribute("inert");
      boardWasOpen = false;
    };
  };

  const stage = createStage(host, { onOpenBoard: openBoard, instantText: isPresenting() });
  store.update({ scene: id });

  const run = async () => {
    await playScene(stage, definition, {
      cast: CAST,
      exhibits: EXHIBITS,
      onExhibit: (exhibitId) => flash(host, t("hud.filed", "Filed:"), EXHIBITS[exhibitId]?.name ?? exhibitId),
      onProof: (proofId) => flash(host, t("hud.broken", "Account broken:"), CONTRADICTIONS[proofId]?.claim ?? proofId),
      onClue: (clueId) => flash(host, t("hud.clueFiled", "Testimony filed:"), DIALOGUE_CLUES[clueId]?.headline ?? clueId),
    });

    if (cancelled) return;
    closeBoard?.();
    stage.destroy();
    store.collect("completed", id);
    if (isPresenting()) go("presentation", { step: currentStep() + 1 });
    else go(next ?? "hub");
  };
  run().catch((error) => { if (!cancelled) console.error(error); });
  return () => { cancelled = true; closeBoard?.(); stage.destroy(); };
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
  return mountMap(root, go);
}

/** The case board is a tool at the station, rather than the whole field hub. */
export function board(root, go) {
  return mountBoard(root, go);
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
        openDialog({ title: t("accuse.confirm", "Submit this finding?"), body: `${person.name}. ${t("accuse.confirmBody", "The conclusion will be assessed against the contradictions recorded in your file.")}`, actions: [{ label: t("accuse.submit", "Review conclusion"), primary: true, run: () => { store.update({ accusation: id }); go("verdict"); } }] });
      },
    },
      shot,
      el("p", { class: "accuse__name", text: t(`cast.${id}.name`, person.name) }),
      el("p", { class: "accuse__role", text: t(`cast.${id}.role`, person.role) }),
      el("p", {
        class: "accuse__proof",
        text: broken.length
          ? `${broken.length} ${t("accuse.broken", "contradiction(s)")} \u00b7 ${t("accuse.weight", "weight")} ${weight}`
          : t("accuse.nothing", "No contradictions recorded"),
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
      el("h1", { class: "accuse__title", text: t("accuse.title", "Review your findings") }),
      el("p", { class: "accuse__lede", text: t("accuse.lede", "Select the account you believe the evidence supports. You can reopen the investigation after reviewing the conclusion.") }),
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
  if (!SUSPECTS.includes(named)) return go("accuse");
  const result = VERDICTS[named] ?? VERDICTS[CULPRIT];
  const required = Object.entries(CONTRADICTIONS).filter(([, proof]) => proof.subject === CULPRIT).map(([id]) => id);
  const supported = result.correct && required.every((id) => state.proven.includes(id));
  const incomplete = result.correct && !supported;
  const person = CAST[named] ?? CAST[CULPRIT];
  const proofs = state.proven.map((id) => CONTRADICTIONS[id]).filter(Boolean);
  const supporting = proofs.filter((p) => p.subject === named);
  const weight = supporting.reduce((sum, p) => sum + p.weight, 0);

  const shot = el("img", { alt: "", class: "verdict__shot" });
  assets.bust(named, "broken", person.name).then((url) => { shot.src = url; });

  root.append(
    el("section", { class: `screen verdict grain ${supported ? "is-right" : incomplete ? "is-incomplete" : "is-wrong"}` },
      el("p", { class: "verdict__file", text: `${CASE.file} / ${CASE.title}${isPresenting() ? " / Prepared presentation summary" : ""}` }),
      el("p", { class: "verdict__stamp", text: supported ? t("verdict.charged", "Case supported · Charged") : incomplete ? t("verdict.incomplete", "Further investigation required") : t("verdict.released", "Released without charge") }),
      el("div", { class: "verdict__head" },
        shot,
        el("div", null,
          el("h1", { class: "verdict__name", text: incomplete ? person.name : result.headline }),
          el("p", { class: "verdict__body", text: incomplete ? t("verdict.incompleteBody", "Your finding names Ayman Sharif, but his account has not been fully tested. Establish the lighting, the call record, and the discrepancy in the reported time before treating this fictional case as supported.") : result.body }),
        ),
      ),
      el("div", { class: "verdict__ledger" },
        el("h2", { text: t("verdict.support", "What you could prove") }),
        supporting.length
          ? supporting.map((p) => el("p", { class: "verdict__proof" }, el("q", { text: p.claim }), " ", p.verdict))
          : el("p", { class: "panel__empty", text: t("verdict.nothing", "Nothing in this person's account was ever broken.") }),
        el("p", { class: "verdict__weight", text: `${t("verdict.weight", "Weight of proof:")} ${weight}` }),
        el("div", { class: "finding-metrics" },
          ...[[state.exhibits.length, "Exhibits filed"], [state.clues.length, "Testimony leads"], [supporting.length, "Recorded contradictions"]].map(([count, label], i) => el("div", null, el("b", { text: count }), el("span", { text: t(`verdict.metric.${i}`, label) }))),
        ),
      ),
      el("div", { class: "verdict__reflection" },
        el("h2", { text: t("verdict.reflection", "From information to a reasoned finding") }),
        el("p", { text: t("verdict.reflectionBody", "A suspicious statement is a lead. A contradiction links a claim to an exhibit. The board makes those relationships visible; the investigator still decides what the evidence supports.") }),
        isPresenting() ? el("p", { class: "verdict__disclosure", text: t("verdict.disclosure", "This walkthrough uses prepared fictional checkpoints. AI assisted the development of this demonstration; dialogue and conclusions are scripted. It does not perform real evidence analysis or make live AI decisions.") }) : null,
      ),
      el("div", { class: "verdict__actions" },
        el("button", { class: "btn", type: "button", text: t("verdict.print", "Print case summary"), onClick: () => window.print() }),
        !isPresenting() ? el("button", {
          class: "btn",
          type: "button",
          dataset: { escapeBack: "true" },
          text: t("verdict.reopen", "Reopen the file"),
          onClick: () => { store.update({ accusation: null }); go("hub"); },
        }) : null,
        !isPresenting() ? el("button", {
          class: "btn btn--major",
          type: "button",
          text: t("verdict.again", "Return to main menu"),
          onClick: () => go("title"),
        }) : null,
      ),
    ),
  );
}

export const SCREENS = { title, briefing, settings, hub, board, accuse, verdict, scene };
export { transition };
