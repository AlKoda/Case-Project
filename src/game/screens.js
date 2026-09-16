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
import { SCENES, INTERVIEWS } from "../data/scenes.js";

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

/* ------------------------------------------------------------------- hub */

export function hub(root, go) {
  const state = store.get();
  const proven = state.proven.map((id) => CONTRADICTIONS[id]).filter(Boolean);
  const againstFinch = state.proven.filter((id) => id.startsWith("finch-")).length;

  const board = el("section", { class: "screen board grain" });

  board.append(
    el("header", { class: "board__head" },
      el("div", null,
        el("p", { class: "board__file", text: CASE.file }),
        el("h1", { class: "board__title", text: CASE.title }),
      ),
      el("p", { class: "board__synopsis", text: CASE.synopsis }),
    ),
  );

  const columns = el("div", { class: "board__cols" });

  /* People */
  const people = el("div", { class: "panel" },
    el("h2", { class: "panel__title", text: t("hub.people", "Statements") }),
  );
  for (const interview of INTERVIEWS) {
    const person = CAST[interview.person];
    const done = state.completed.includes(interview.id);
    const card = el("button", {
      class: `person${done ? " is-done" : ""}`,
      type: "button",
      onClick: () => go("scene", { id: interview.id, next: "hub" }),
    });
    const shot = el("img", { class: "person__shot", alt: "" });
    assets.portrait(interview.person, "neutral", person.name).then((url) => { shot.src = url; });
    card.append(
      shot,
      el("div", { class: "person__body" },
        el("p", { class: "person__name", text: person.name }),
        el("p", { class: "person__role", text: person.role }),
        el("p", { class: "person__teaser", text: interview.teaser }),
      ),
      el("span", { class: "person__state", text: done ? t("hub.again", "Question again") : t("hub.open", "Question") }),
    );
    card.style.setProperty("--accent", person.accent);
    people.append(card);
  }
  columns.append(people);

  /* Evidence */
  const evidence = el("div", { class: "panel" },
    el("h2", { class: "panel__title", text: t("hub.evidence", "In the file") }),
  );
  if (state.exhibits.length === 0) {
    evidence.append(el("p", { class: "panel__empty", text: t("hub.noEvidence", "Nothing yet. The stairs are where it starts.") }));
  }
  const grid = el("div", { class: "exhibits" });
  for (const id of state.exhibits) {
    const exhibit = EXHIBITS[id];
    if (!exhibit) continue;
    const shot = el("img", { alt: "", class: "exhibit__shot" });
    assets.evidence(id, exhibit.name).then((url) => { shot.src = url; });
    grid.append(
      el("article", { class: "exhibit" },
        shot,
        el("div", null,
          el("h3", { class: "exhibit__name", text: exhibit.name }),
          el("p", { class: "exhibit__summary", text: exhibit.summary }),
          el("p", { class: "exhibit__note", text: exhibit.note }),
        ),
      ),
    );
  }
  evidence.append(grid);

  if (!state.completed.includes("scene:stairs")) {
    evidence.append(
      el("button", {
        class: "btn btn--major",
        type: "button",
        text: t("hub.goStairs", "Go down to the stairs"),
        onClick: () => go("scene", { id: "scene:stairs", next: "hub" }),
      }),
    );
  }
  columns.append(evidence);

  /* Broken accounts */
  const broken = el("div", { class: "panel" },
    el("h2", { class: "panel__title", text: t("hub.broken", "Accounts broken") }),
  );
  if (proven.length === 0) {
    broken.append(el("p", { class: "panel__empty", text: t("hub.noProof", "Everyone's story is still standing.") }));
  }
  for (const item of proven) {
    broken.append(
      el("article", { class: "proof" },
        el("p", { class: "proof__who", text: CAST[item.subject]?.name ?? item.subject }),
        el("q", { class: "proof__claim", text: item.claim }),
        el("p", { class: "proof__verdict", text: item.verdict }),
      ),
    );
  }
  broken.append(
    el("div", { class: "board__finish" },
      el("p", {
        class: "board__gauge",
        text:
          againstFinch >= 3
            ? t("hub.ready", "Three of one man's statements are in pieces. That is a case.")
            : t("hub.notReady", "You can name somebody now. Whether it stands up is another question."),
      }),
      el("button", {
        class: `btn ${againstFinch >= 3 ? "btn--major" : ""}`,
        type: "button",
        text: t("hub.accuse", "Name a suspect"),
        onClick: () => go("accuse"),
      }),
    ),
  );
  columns.append(broken);

  board.append(columns);
  root.append(board);
}

/* --------------------------------------------------------------- accuse */

export function accuse(root, go) {
  const list = el("div", { class: "accuse__row" });
  for (const id of SUSPECTS) {
    const person = CAST[id];
    const shot = el("img", { alt: "", class: "accuse__shot" });
    assets.portrait(id, "cold", person.name).then((url) => { shot.src = url; });
    const card = el("button", {
      class: "accuse__card",
      type: "button",
      onClick: () => {
        store.update({ accusation: id });
        go("verdict");
      },
    }, shot, el("p", { class: "accuse__name", text: person.name }), el("p", { class: "accuse__role", text: person.role }));
    card.style.setProperty("--accent", person.accent);
    list.append(card);
  }

  root.append(
    el("section", { class: "screen accuse grain" },
      el("h1", { class: "accuse__title", text: t("accuse.title", "Name one.") }),
      el("p", { class: "accuse__lede", text: t("accuse.lede", "Once it is said out loud it is said. The file goes forward with your name on it.") }),
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
  assets.portrait(named, "broken", person.name).then((url) => { shot.src = url; });

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
