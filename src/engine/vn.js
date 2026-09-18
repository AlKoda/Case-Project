/**
 * The visual-novel stage.
 *
 * A scene is plain data -- an array of nodes -- and this module plays it. The
 * presentation it builds is an interview: the room behind, the person you are
 * questioning standing in the light, and a speech box along the bottom with
 * that person framed in its leading corner, the way a subject sits framed
 * across a table. Whoever is speaking is lit; everyone else falls back into
 * shadow.
 *
 * ## Script nodes
 *
 *   { bg: "interview-room" }                      change the room
 *   { enter: "finch", at: "center", mood: "…" }   bring someone in (they pop out)
 *   { exit: "finch" }                             take someone off
 *   { who: "finch", mood: "tense", text: "…" }    a line of dialogue
 *   { text: "…" }                                 narration, no speaker
 *   { choice: [ { text, goto } ] }                let the detective choose
 *   { press: { claim, accepts, hit, miss } }      challenge a claim with an exhibit
 *   { give: "pocket-watch" }                      hand the player an exhibit
 *   { fingerprint: "finch" }                      take and file a comparison print
 *   { clue: "finch" }                             choose whether to file spoken testimony
 *   { prove: "finch-lied-about-the-light" }       record a proven contradiction
 *   { flag: "name" }                              set a story flag
 *   { label: "name" } / { goto: "name" }          jump targets
 *   { when: fn, then: [ …nodes ] }                conditional block
 *   { end: true }                                 finish the scene
 *
 * Nodes are data, so the whole script of a case is readable top to bottom
 * without touching this file.
 */

import { el, clear, wait, reducedMotion } from "./dom.js";
import { t } from "./i18n.js";
import * as assets from "./assets.js";
import * as preferences from "./preferences.js";

export function createStage(root, { onOpenBoard, instantText = false } = {}) {
  const nodes = buildDom(onOpenBoard);
  clear(root).append(nodes.stage);

  const actors = new Map();
  let resolveAdvance = null;
  let typing = false;
  let finishTyping = null;
  let destroyed = false;
  let cancelInput = null;

  /** Advance, or finish the line that is still typing. */
  function poke() {
    if (typing) finishTyping?.();
    else resolveAdvance?.();
  }

  nodes.stage.addEventListener("click", (event) => {
    // Choices and the backlog manage their own clicks.
    if (event.target.closest(".vn__choices, .vn__tray, .vn__backlog, .vn__chip")) return;
    poke();
  });

  function onKey(event) {
    if (destroyed || nodes.stage.closest("[inert]") || document.querySelector("dialog[open]")) return;
    if (event.key === " " || event.key === "Enter") {
      if (document.activeElement?.tagName === "BUTTON") return;
      event.preventDefault();
      poke();
    }
    if (event.key === "Escape") nodes.backlog.classList.remove("is-open");
  }
  document.addEventListener("keydown", onKey);

  nodes.logButton.addEventListener("click", () => {
    nodes.backlog.classList.toggle("is-open");
    nodes.backlog.scrollTop = nodes.backlog.scrollHeight;
  });

  function waitForAdvance() {
    if (destroyed) return Promise.resolve();
    nodes.advance.classList.add("is-ready");
    return new Promise((resolve) => {
      resolveAdvance = () => {
        resolveAdvance = null;
        nodes.advance.classList.remove("is-ready");
        resolve();
      };
    });
  }

  /** Reveal text one character at a time; a click finishes it early. */
  async function typeOut(text) {
    if (destroyed) return;
    typing = true;
    nodes.text.textContent = "";
    const speed = preferences.typeSpeed();
    if (instantText || reducedMotion() || !Number.isFinite(speed)) {
      nodes.text.textContent = text;
      typing = false;
      return;
    }
    await new Promise((done) => {
      let shown = 0;
      let last = performance.now();
      let frame = 0;
      const step = (now) => {
        if (destroyed) return done();
        shown += ((now - last) / 1000) * speed;
        last = now;
        nodes.text.textContent = text.slice(0, Math.floor(shown));
        if (shown >= text.length) return done();
        frame = requestAnimationFrame(step);
      };
      finishTyping = () => {
        cancelAnimationFrame(frame);
        nodes.text.textContent = text;
        done();
      };
      frame = requestAnimationFrame(step);
    });
    finishTyping = null;
    typing = false;
  }

  async function setBackground(scene, label) {
    const url = await assets.background(scene, label);
    if (destroyed) return;
    nodes.bg.style.backgroundImage = `url("${url}")`;
    nodes.bg.animate?.([{ opacity: 0.35 }, { opacity: 1 }], { duration: 420, easing: "ease-out" });
  }

  /** Bring a character onto the stage. They scale up into the light. */
  async function enter(person, { at = "center", mood = "neutral", cast }) {
    if (actors.has(person)) return;
    const profile = cast?.[person] ?? {};
    const figure = el("figure", { class: `vn__actor vn__actor--${at}`, dataset: { person } });
    const image = el("img", { alt: "", decoding: "async" });
    figure.append(image);
    nodes.cast.append(figure);
    actors.set(person, { figure, image, mood, profile });

    image.src = await assets.portrait(person, mood, profile.name ?? person);
    if (destroyed) return;
    requestAnimationFrame(() => figure.classList.add("is-on"));
    await wait(reducedMotion() ? 0 : 260);
  }

  async function exit(person) {
    const actor = actors.get(person);
    if (!actor) return;
    actor.figure.classList.remove("is-on");
    actors.delete(person);
    await wait(reducedMotion() ? 0 : 220);
    actor.figure.remove();
  }

  /** Swap a character's art without re-entering them. */
  async function setMood(person, mood) {
    const actor = actors.get(person);
    if (!actor || actor.mood === mood) return;
    actor.mood = mood;
    const url = await assets.portrait(person, mood, actor.profile.name ?? person);
    if (destroyed) return;
    actor.image.src = url;
    actor.figure.animate?.(
      [{ filter: "brightness(1.6)" }, { filter: "brightness(1)" }],
      { duration: 240, easing: "ease-out" },
    );
  }

  /** Light the speaker, drop everyone else into shadow. */
  function spotlight(person) {
    for (const [id, actor] of actors) {
      actor.figure.classList.toggle("is-speaking", id === person);
    }
  }

  /** The portrait framed in the corner of the speech box. */
  async function setBust(person, mood, cast) {
    if (!person) {
      nodes.box.classList.add("is-narration");
      nodes.name.textContent = "";
      return;
    }
    nodes.box.classList.remove("is-narration");
    const profile = cast?.[person] ?? {};
    nodes.name.textContent = t(`cast.${person}.name`, profile.name ?? person);
    nodes.role.textContent = t(`cast.${person}.role`, profile.role ?? "");

    // The detective is the eyes we are behind and the victim is past speaking:
    // both get a name plate and no frame, rather than a drawn placeholder.
    nodes.box.classList.toggle("is-faceless", Boolean(profile.noPortrait));
    if (profile.noPortrait) {
      nodes.bust.style.setProperty("--accent", profile.accent ?? "var(--lamp-200)");
      return;
    }
    const url = await assets.bust(person, mood ?? "neutral", profile.name ?? person);
    if (destroyed) return;
    if (nodes.bustImage.src !== url) {
      nodes.bustImage.src = url;
      nodes.bust.animate?.(
        [{ transform: "scale(0.86)", opacity: 0.2 }, { transform: "scale(1)", opacity: 1 }],
        { duration: 240, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
      );
    }
    nodes.bust.style.setProperty("--accent", profile.accent ?? "var(--lamp-200)");
  }

  /** Offer the detective a set of replies. Resolves with the chosen option. */
  function ask(options) {
    if (destroyed) return Promise.resolve({});
    return new Promise((resolve) => {
      cancelInput = () => resolve({});
      let answered = false;
      clear(nodes.choices);
      nodes.choices.classList.add("is-open");
      nodes.choices.style.setProperty("--choice-count", options.length);
      let current = 0;
      const eyebrow = el("p", {
        class: "vn__choices-label",
        text: t("vn.chooseApproach", "Choose your next line of inquiry"),
      });
      const counter = el("span", { class: "vn__choices-count", "aria-live": "polite" });
      const rail = el("div", { class: "vn__choices-rail" });
      const previous = el("button", {
        class: "vn__choice-nav",
        type: "button",
        text: "←",
        title: t("vn.previousTopic", "Previous topic"),
        "aria-label": t("vn.previousTopic", "Previous topic"),
        onClick: () => show(current - 1),
      });
      const next = el("button", {
        class: "vn__choice-nav",
        type: "button",
        text: "→",
        title: t("vn.nextTopic", "Next topic"),
        "aria-label": t("vn.nextTopic", "Next topic"),
        onClick: () => show(current + 1),
      });
      const dots = el("div", { class: "vn__choice-dots", "aria-hidden": "true" });

      function show(index, focus = true) {
        current = (index + options.length) % options.length;
        [...rail.children].forEach((choice, choiceIndex) => {
          choice.classList.toggle("is-current", choiceIndex === current);
          choice.tabIndex = choiceIndex === current ? 0 : -1;
        });
        [...dots.children].forEach((dot, dotIndex) => dot.classList.toggle("is-current", dotIndex === current));
        counter.textContent = `${current + 1} / ${options.length}`;
        if (focus) rail.children[current]?.focus();
      }

      nodes.choices.append(el("div", { class: "vn__choices-head" }, eyebrow, counter));
      nodes.choices.append(el("div", { class: "vn__choice-deck" }, previous, rail, next), dots);
      options.forEach((option, index) => {
        const button = el(
          "button",
          {
            class: "vn__choice",
            style: { "--choice-index": index },
            type: "button",
            onClick: async () => {
              if (answered) return;
              answered = true;
              cancelInput = null;
              button.classList.add("is-selected");
              for (const choice of rail.children) choice.disabled = true;
              await wait(500);
              if (destroyed) return resolve({});
              nodes.choices.classList.remove("is-open");
              clear(nodes.choices);
              resolve(option);
            },
          },
          el("span", { class: "vn__choice-index", text: String(index + 1) }),
          el("span", { class: "vn__choice-text", text: t(option.key ?? "", option.text) }),
        );
        button.addEventListener("keydown", (event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); show(current - 1); }
          if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); show(current + 1); }
        });
        rail.append(button);
        dots.append(el("i"));
      });
      show(0, false);
      rail.firstChild?.focus();
    });
  }

  /**
   * Put a claim under pressure: the player picks an exhibit to contradict it.
   * Resolves with the chosen exhibit id, or null if they back off.
   */
  function press(claim, held, catalogue) {
    if (destroyed) return Promise.resolve(null);
    return new Promise((resolve) => {
      cancelInput = () => resolve(null);
      clear(nodes.tray);
      nodes.tray.classList.add("is-open");
      nodes.tray.append(
        el("p", { class: "vn__tray-claim" },
          el("span", { class: "vn__tray-label", text: t("vn.onRecord", "On the record") }),
          el("q", { text: claim }),
        ),
      );
      const grid = el("div", { class: "vn__tray-grid" });
      for (const id of held) {
        const exhibit = catalogue[id] ?? { name: id };
        const button = el(
          "button",
          {
            class: "vn__exhibit",
            type: "button",
            onClick: () => {
              nodes.tray.classList.remove("is-open");
              clear(nodes.tray);
              cancelInput = null;
              resolve(id);
            },
          },
          el("img", { alt: "", src: exhibit.art ?? "", loading: "lazy" }),
          el("span", { text: t(`exhibit.${id}.name`, exhibit.name) }),
        );
        grid.append(button);
      }
      nodes.tray.append(grid);
      nodes.tray.append(
        el("button", {
          class: "vn__back",
          type: "button",
          text: t("vn.letItStand", "Let it stand"),
          onClick: () => {
            nodes.tray.classList.remove("is-open");
            clear(nodes.tray);
            cancelInput = null;
            resolve(null);
          },
        }),
      );
      grid.firstChild?.focus();
    });
  }

  function remember(speaker, text) {
    nodes.backlog.append(
      el("p", { class: "vn__backlog-line" },
        speaker ? el("b", { text: `${speaker}: ` }) : null,
        text,
      ),
    );
  }

  function setClock(label) {
    nodes.clock.textContent = label ?? "";
  }

  function destroy() {
    destroyed = true;
    finishTyping?.();
    cancelInput?.();
    cancelInput = null;
    document.removeEventListener("keydown", onKey);
    resolveAdvance?.();
  }

  return {
    dom: nodes,
    setBackground,
    enter,
    exit,
    setMood,
    spotlight,
    setBust,
    typeOut,
    waitForAdvance,
    ask,
    press,
    remember,
    setClock,
    destroy,
    get destroyed() { return destroyed; },
    get actors() {
      return actors;
    },
  };
}

function buildDom(onOpenBoard) {
  const bg = el("div", { class: "vn__bg" });
  const cast = el("div", { class: "vn__cast" });
  const bustImage = el("img", { alt: "", class: "vn__bust-img" });
  const bust = el("div", { class: "vn__bust" }, bustImage);
  const name = el("p", { class: "vn__name" });
  const role = el("p", { class: "vn__role" });
  const text = el("p", { class: "vn__text", "aria-live": "polite" });
  const advance = el("span", { class: "vn__advance", "aria-hidden": "true" });
  const clock = el("span", { class: "vn__clock" });
  const logButton = el("button", {
    class: "vn__chip",
    type: "button",
    text: t("vn.log", "Log"),
    title: t("vn.logTitle", "Show everything said so far"),
    "aria-label": t("vn.logTitle", "Show everything said so far"),
  });
  const boardButton = el("button", {
    class: "vn__chip vn__board-button",
    type: "button",
    text: t("vn.caseBoard", "Case board"),
    title: t("vn.caseBoardTitle", "Open the case board without leaving this scene"),
    "aria-label": t("vn.caseBoardTitle", "Open the case board without leaving this scene"),
    onClick: () => onOpenBoard?.(),
  });
  const backlog = el("div", { class: "vn__backlog" });
  const choices = el("div", { class: "vn__choices" });
  const tray = el("div", { class: "vn__tray" });

  const box = el(
    "div",
    { class: "vn__box" },
    bust,
    el("div", { class: "vn__body" },
      el("div", { class: "vn__plate" }, name, role),
      text,
    ),
    advance,
    el("span", { class: "vn__read-hint", text: t("vn.continueHint", "Click or Space to continue") }),
  );

  const stage = el(
    "div",
    { class: "vn grain" },
    bg,
    el("div", { class: "vn__grade", "aria-hidden": "true" }),
    el("div", { class: "vn__blinds", "aria-hidden": "true" }),
    el("div", { class: "vn__vignette", "aria-hidden": "true" }),
    cast,
    el("div", { class: "vn__hud" },
      el("span", { class: "vn__rec" }, el("i", { "aria-hidden": "true" }), t("vn.recording", "REC")),
      clock,
      logButton,
      boardButton,
    ),
    backlog,
    tray,
    choices,
    box,
  );

  return { stage, bg, cast, box, bust, bustImage, name, role, text, advance, choices, tray, backlog, clock, logButton, boardButton };
}
