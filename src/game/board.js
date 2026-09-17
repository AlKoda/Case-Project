/**
 * The evidence wall.
 *
 * A corkboard the player builds themselves: drag anything out of the tray on
 * the right, pin it where it makes sense, run string between the things that
 * belong together, and drop the ones that happened at a known time onto the
 * timeline along the bottom.
 *
 * Nothing here is scored. The wall is a place to think, not a puzzle with a
 * solution -- the game never checks whether your strings are "right", because
 * the point of a board is that it holds a theory while you decide what you
 * believe.
 *
 * ## How positions work
 *
 * A pin stores `x` and `y` normalised 0..1 against the wall's box, and `at`
 * in minutes past midnight when it has been placed on the timeline. Normalised
 * coordinates mean the board survives a window resize, a phone rotation and a
 * different monitor without anything drifting.
 *
 * ## Interaction
 *
 * One pointer handler covers mouse, pen and touch. A press that moves past a
 * few pixels is a drag; one that does not is a click, which opens the card in
 * the tray's inspector. Everything is reachable from the keyboard too: tray
 * items have a Pin button, pinned cards take arrow keys to nudge, Delete to
 * unpin, and L to start a string.
 */

import { el, clear } from "../engine/dom.js";
import { t } from "../engine/i18n.js";
import * as store from "../engine/store.js";
import * as assets from "../engine/assets.js";
import { CASE, CAST, EXHIBITS, CONTRADICTIONS, SUSPECTS, WITNESSES } from "../data/case.js";
import { SCENES, INTERVIEWS } from "../data/scenes.js";

/* The window the timeline covers: 01:00 to 02:30, the ninety minutes that
 * matter. Everything outside it is somebody's alibi. */
const TIME_START = 60;
const TIME_END = 150;
const TICK = 15;

/**
 * The cork surface inside the frame, as fractions of the background image.
 * Measured off the art rather than guessed, because a card pinned to the
 * wooden frame or to the wall beside it looks like a bug, not a choice.
 * These are published to CSS as custom properties so the timeline band and
 * the pinning maths cannot drift apart.
 */
const CORK = { x0: 0.15, x1: 0.86, y0: 0.15, y1: 0.84 };

/* The timeline occupies the bottom of the cork. Cards dropped below this line
 * snap into it and take a time. */
const BAND_TOP = 0.66;
const BAND_Y = 0.675;   // a timed card hangs from the top of the band

/* Cards are centred on their pin, so their centre has to stay far enough
 * inside the cork that the card itself does not overhang the frame. */
const MARGIN_X = 0.055;
const MARGIN_Y = 0.065;

const DRAG_SLOP = 5;

/** minutes past midnight -> "01:47" */
function clock(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes) % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** "01:47" -> minutes past midnight */
function minutes(text) {
  const [h, m] = text.split(":").map(Number);
  return h * 60 + m;
}

export function mountBoard(root, go, { overlay = false, onClose = null } = {}) {
  /* ---------------------------------------------------------- the cards */

  /**
   * Everything that can live on the wall, keyed by card id. Built fresh each
   * mount so newly-found exhibits and newly-questioned people appear.
   */
  function catalogue() {
    const state = store.get();
    const cards = new Map();

    for (const id of state.exhibits) {
      const exhibit = EXHIBITS[id];
      if (!exhibit) continue;
      cards.set(`ex:${id}`, {
        kind: "exhibit",
        title: t(`exhibit.${id}.name`, exhibit.name),
        line: t(`exhibit.${id}.summary`, exhibit.summary),
        body: t(`exhibit.${id}.note`, exhibit.note),
        art: () => assets.evidence(id, exhibit.name),
        time: exhibit.time ?? null,
      });
    }

    for (const interview of INTERVIEWS) {
      const person = CAST[interview.person];
      cards.set(`who:${interview.person}`, {
        kind: SUSPECTS.includes(interview.person) ? "suspect" : "witness",
        title: t(`cast.${interview.person}.name`, person.name),
        line: t(`cast.${interview.person}.role`, person.role),
        body: t(`interview.${interview.person}.teaser`, interview.teaser),
        art: () => assets.bust(interview.person, "neutral", person.name),
        accent: person.accent,
        interview: interview.id,
        // Seven people is more than anybody tracks in their head.
        questioned: state.completed.includes(interview.id),
      });
    }

    for (const witness of WITNESSES) {
      const person = CAST[witness.person];
      if (!person) continue;
      if (!cards.has(`who:${witness.person}`)) {
        cards.set(`who:${witness.person}`, {
          kind: "witness",
          title: t(`cast.${witness.person}.name`, person.name),
          line: t(`cast.${witness.person}.role`, person.role),
          body: t(`witness.${witness.person}.statement`, witness.statement),
          art: () => assets.bust(witness.person, "neutral", person.name),
          accent: person.accent,
        });
      }
      if (state.clues.includes(witness.person)) cards.set(`st:${witness.person}`, {
        kind: "statement",
        title: t(`witness.${witness.person}.headline`, witness.headline),
        line: t(`cast.${witness.person}.name`, person.name),
        body: t(`witness.${witness.person}.statement`, witness.statement),
        accent: person.accent,
        time: witness.time,
      });
    }

    for (const [id, text] of Object.entries(store.get().board.notes)) {
      cards.set(`note:${id}`, { kind: "note", title: t("board.note", "Note"), body: text, editable: id });
    }

    return cards;
  }

  let cards = catalogue();
  let inspecting = null;
  let linkFrom = null;
  let drag = null;

  /**
   * Undo history for the wall.
   *
   * Rearranging a board should never be a decision, so every change that moves,
   * removes or ties something can be taken back. Nudging a card with the arrow
   * keys deliberately does not push an entry -- holding an arrow down would
   * otherwise bury everything else under a hundred one-pixel steps.
   */
  const history = [];
  const HISTORY_LIMIT = 30;

  function remember() {
    const board = store.get().board;
    history.push({
      pins: { ...board.pins },
      strings: board.strings.map((s) => ({ ...s })),
      notes: { ...board.notes },
      nextNote: board.nextNote,
    });
    if (history.length > HISTORY_LIMIT) history.shift();
    undoButton?.toggleAttribute("disabled", false);
  }

  function undo() {
    const previous = history.pop();
    if (!previous) {
      announce(t("board.nothingToUndo", "Nothing to undo."));
      return;
    }
    store.setBoard(previous);
    linkFrom = null;
    cards = catalogue();
    renderPins();
    renderTray();
    undoButton?.toggleAttribute("disabled", history.length === 0);
    announce(t("board.undone", "Undone."));
  }

  /* ------------------------------------------------------------- layout */

  const strings = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  strings.setAttribute("class", "wall__strings");

  const wall = el("div", { class: "wall", tabindex: "-1" });
  const band = el("div", { class: "band" });
  wall.append(strings, band);

  const tray = el("aside", { class: "tray" });
  const status = el("p", { class: "board__status", "aria-live": "polite" });

  const undoButton = el("button", {
    class: "btn btn--small",
    type: "button",
    text: t("board.undo", "Undo"),
    title: t("board.undoTitle", "Take back the last change to the wall (Ctrl+Z)"),
    disabled: true,
    onClick: undo,
  });

  const screen = el(
    "section",
    { class: `screen board grain${overlay ? " board--overlay" : ""}` },
    el("header", { class: "board__bar" },
      el("div", { class: "board__id" },
        el("p", { class: "board__file", text: CASE.file }),
        el("h1", { class: "board__title", text: t("title.name", CASE.title) }),
      ),
      status,
      el("div", { class: "board__tools" },
        overlay
          ? el("span", { class: "board__saved", text: t("board.saved", "Saved on this device") })
          : null,
        !overlay && missedAtTheStairs().length
          ? el("button", {
              class: "btn btn--small btn--alert",
              type: "button",
              text: t("board.backToStairs", "Back to the stairs"),
              title: t("board.backToStairsTitle", "There is still something down there you have not looked at"),
              onClick: () => go("scene", { id: "scene:stairs", next: "hub" }),
            })
          : null,
        undoButton,
        toolButton(t("board.addNote", "Add note"), addNote),
        toolButton(t("board.tidy", "Tidy"), tidy),
        toolButton(t("board.clear", "Clear wall"), clearWall),
        !overlay ? el("button", {
          class: "btn btn--small",
          type: "button",
          text: t("map.back", "Back to map"),
          onClick: () => go("hub"),
        }) : null,
        !overlay ? el("button", {
          class: "btn btn--major",
          type: "button",
          text: t("hub.accuse", "Name a suspect"),
          onClick: () => go("accuse"),
        }) : null,
        overlay ? el("button", {
          class: "btn btn--major board__close",
          type: "button",
          text: t("board.close", "Return to scene"),
          onClick: onClose,
        }) : null,
      ),
    ),
    el("div", { class: "board__stage" }, el("div", { class: "board__scroll" }, wall), tray),
  );

  root.append(screen);

  /**
   * Exhibits the scene-of-the-crime search hands over, read out of the script
   * rather than listed here, so adding one to the stairs cannot leave this
   * behind.
   */
  function stairsExhibits() {
    return (SCENES["scene:stairs"]?.script ?? [])
      .filter((node) => node.give)
      .map((node) => node.give);
  }

  /**
   * A player who leaves the stairs early would otherwise never see the
   * exhibits they skipped, and some contradictions would become unprovable --
   * a dead end with no signpost. The stairs stay open while anything is still
   * down there.
   */
  function missedAtTheStairs() {
    const held = store.get().exhibits;
    return stairsExhibits().filter((id) => !held.includes(id));
  }

  function toolButton(label, onClick) {
    return el("button", { class: "btn btn--small", type: "button", text: label, onClick });
  }

  assets.background("case-board", "Evidence wall").then((url) => {
    wall.style.backgroundImage = `url("${url}")`;
  });

  // One source of truth for the cork geometry: the band is positioned from
  // these, so the drop maths and the drawn band can never disagree.
  wall.style.setProperty("--cork-x0", `${CORK.x0 * 100}%`);
  wall.style.setProperty("--cork-x1", `${(1 - CORK.x1) * 100}%`);
  wall.style.setProperty("--cork-y1", `${(1 - CORK.y1) * 100}%`);
  wall.style.setProperty("--band-h", `${(CORK.y1 - BAND_TOP) * 100}%`);

  /* -------------------------------------------------------- the timeline */

  function buildBand() {
    clear(band);
    band.append(el("span", { class: "band__label", text: t("board.timeline", "Timeline") }));
    for (let m = TIME_START; m <= TIME_END; m += TICK) {
      const tick = el("span", {
        class: "band__tick",
        style: { insetInlineStart: `${((m - TIME_START) / (TIME_END - TIME_START)) * 100}%` },
      }, el("i"), el("b", { text: clock(m) }));
      band.append(tick);
    }
  }

  /** x across the wall (0..1) -> minutes, clamped to the window. */
  function timeAt(x) {
    const clamped = Math.min(1, Math.max(0, x));
    return Math.round((TIME_START + clamped * (TIME_END - TIME_START)) / 5) * 5;
  }

  function xForTime(at) {
    return (at - TIME_START) / (TIME_END - TIME_START);
  }

  /* ------------------------------------------------------------ the tray */

  function renderTray() {
    clear(tray);

    if (inspecting) return renderInspector();

    const pins = store.get().board.pins;
    const groups = [
      ["exhibit", t("board.exhibits", "Evidence")],
      ["suspect", t("board.suspects", "Suspects")],
      ["witness", t("board.witnesses", "Witnesses")],
      ["statement", t("board.statements", "Statements")],
      ["note", t("board.notes", "Notes")],
    ];

    tray.append(el("h2", { class: "tray__title", text: t("board.tray", "Not yet on the wall") }));

    let any = false;
    for (const [kind, label] of groups) {
      const items = [...cards].filter(([id, card]) => card.kind === kind && !pins[id]);
      if (!items.length) continue;
      any = true;
      tray.append(el("h3", { class: "tray__group", text: label }));
      const list = el("div", { class: "tray__list" });
      for (const [id, card] of items) list.append(trayCard(id, card));
      tray.append(list);
    }

    if (!any) {
      tray.append(el("p", { class: "tray__empty", text: t("board.trayEmpty", "Everything is on the wall.") }));
    }
  }

  function trayCard(id, card) {
    const node = el("div", {
      class: `chip chip--${card.kind}${card.questioned ? " is-done" : ""}`,
      dataset: { card: id },
    },
      el("div", { class: "chip__body" },
        el("p", { class: "chip__title" },
          card.title,
          card.questioned
            ? el("span", { class: "chip__done", title: t("board.questioned", "Already questioned"), text: "\u2713" })
            : null,
        ),
        card.line ? el("p", { class: "chip__line", text: card.line }) : null,
      ),
      el("button", {
        class: "chip__pin",
        type: "button",
        title: t("board.pinIt", "Pin to the wall"),
        text: "+",
        onClick: (event) => {
          event.stopPropagation();
          pinSomewhereFree(id);
        },
      }),
    );
    if (card.accent) node.style.setProperty("--accent", card.accent);
    node.addEventListener("pointerdown", (event) => beginDrag(event, id, true));
    return node;
  }

  function renderInspector() {
    const card = cards.get(inspecting);
    if (!card) {
      inspecting = null;
      return renderTray();
    }
    const pinned = Boolean(store.get().board.pins[inspecting]);

    tray.append(
      el("button", {
        class: "tray__back",
        type: "button",
        text: t("board.back", "← Back to the tray"),
        onClick: () => { inspecting = null; renderTray(); },
      }),
      el("h2", { class: "tray__title", text: card.title }),
      card.line ? el("p", { class: "tray__role", text: card.line }) : null,
    );

    if (card.editable != null) {
      const area = el("textarea", {
        class: "tray__note",
        rows: "6",
        placeholder: t("board.notePlaceholder", "What are you thinking?"),
      });
      area.value = card.body ?? "";
      area.addEventListener("input", () => {
        const notes = { ...store.get().board.notes, [card.editable]: area.value };
        store.setBoard({ notes });
        cards = catalogue();
      });
      tray.append(area);
    } else if (card.body) {
      tray.append(el("p", { class: "tray__body", text: card.body }));
    }

    if (card.time) {
      tray.append(el("p", { class: "tray__time", text: `${t("board.fixes", "Fixes a time:")} ${card.time}` }));
    }

    const actions = el("div", { class: "tray__actions" });
    if (card.interview && !overlay) {
      actions.append(el("button", {
        class: "btn btn--major",
        type: "button",
        text: t("hub.open", "Question"),
        onClick: () => go("scene", { id: card.interview, next: "hub" }),
      }));
    }
    actions.append(el("button", {
      class: "btn btn--small",
      type: "button",
      text: pinned ? t("board.unpin", "Take off the wall") : t("board.pinIt", "Pin to the wall"),
      onClick: () => {
        if (pinned) unpin(inspecting);
        else pinSomewhereFree(inspecting);
        renderTray();
      },
    }));
    if (pinned) {
      actions.append(el("button", {
        class: "btn btn--small",
        type: "button",
        text: t("board.link", "Run string from here"),
        onClick: () => startLink(inspecting),
      }));
    }
    tray.append(actions);
  }

  /* ------------------------------------------------------------ the wall */

  function renderPins() {
    for (const node of wall.querySelectorAll(".pin")) node.remove();
    const { pins } = store.get().board;

    for (const [id, pin] of Object.entries(pins)) {
      const card = cards.get(id);
      if (!card) continue;
      wall.append(pinNode(id, card, pin));
    }
    drawStrings();
  }

  function pinNode(id, card, pin) {
    const described = [
      card.title,
      card.line,
      pin.at != null ? `${t("board.atTime", "at")} ${clock(pin.at)}` : t("board.onWall", "pinned to the wall"),
      card.questioned ? t("board.questioned", "Already questioned") : null,
      tiedTo(id),
    ]
      .filter(Boolean)
      // The card's own text already punctuates itself; joining blindly would
      // give a screen reader "stopped at one forty-seven dot dot".
      .map((part) => String(part).trim().replace(/[.,;]+$/, ""))
      .join(". ") + ".";

    const node = el("article", {
      class:
        `pin pin--${card.kind}${pin.at != null ? " is-timed" : ""}` +
        `${linkFrom === id ? " is-linking" : ""}${card.questioned ? " is-done" : ""}`,
      dataset: { card: id },
      tabindex: "0",
      role: "group",
      "aria-label": described,
      style: { insetInlineStart: `${pin.x * 100}%`, insetBlockStart: `${pin.y * 100}%` },
    });
    if (card.accent) node.style.setProperty("--accent", card.accent);

    node.append(el("span", { class: "pin__tack", "aria-hidden": "true" }));

    if (card.art) {
      const img = el("img", { class: "pin__art", alt: "" });
      card.art().then((url) => { img.src = url; });
      node.append(img);
    }
    node.append(el("p", { class: "pin__title", text: card.title }));
    if (card.kind === "note" && card.body) {
      node.append(el("p", { class: "pin__note", text: card.body }));
    } else if (card.line) {
      node.append(el("p", { class: "pin__line", text: card.line }));
    }
    if (pin.at != null) {
      node.append(el("span", { class: "pin__clock", text: clock(pin.at) }));
    }

    node.addEventListener("pointerdown", (event) => beginDrag(event, id, false));
    node.addEventListener("keydown", (event) => onPinKey(event, id));
    return node;
  }

  /** "Tied to X and Y", for the card's spoken description. */
  function tiedTo(id) {
    const names = store.get().board.strings
      .filter((s) => s.a === id || s.b === id)
      .map((s) => cards.get(s.a === id ? s.b : s.a)?.title)
      .filter(Boolean);
    if (!names.length) return null;
    return `${t("board.tiedTo", "Tied to")} ${names.join(", ")}`;
  }

  function onPinKey(event, id) {
    const { pins } = store.get().board;
    const pin = pins[id];
    if (!pin) return;
    const step = event.shiftKey ? 0.05 : 0.01;
    const moves = {
      ArrowLeft: [-step, 0], ArrowRight: [step, 0],
      ArrowUp: [0, -step], ArrowDown: [0, step],
    };
    if (moves[event.key]) {
      event.preventDefault();
      const [dx, dy] = moves[event.key];
      place(id, pin.x + dx, pin.y + dy, false);   // nudges do not flood history
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      unpin(id);
    } else if (event.key.toLowerCase() === "l") {
      event.preventDefault();
      linkFrom ? finishLink(id) : startLink(id);
    } else if (event.key === "Enter") {
      event.preventDefault();
      inspect(id);
    }
  }

  /* -------------------------------------------------------------- pinning */

  function place(id, x, y, record = true) {
    if (record) remember();
    const clampedX = Math.min(CORK.x1 - MARGIN_X, Math.max(CORK.x0 + MARGIN_X, x));
    const clampedY = Math.min(CORK.y1 - MARGIN_Y, Math.max(CORK.y0 + MARGIN_Y, y));
    const onBand = clampedY >= BAND_TOP;
    const pins = { ...store.get().board.pins };
    pins[id] = onBand
      ? { x: clampedX, y: BAND_Y, at: timeAt(clampedX) }
      : { x: clampedX, y: clampedY, at: null };
    store.setBoard({ pins });
    renderPins();
    announce(onBand
      ? `${cards.get(id)?.title} — ${clock(pins[id].at)}`
      : `${cards.get(id)?.title} ${t("board.pinned", "pinned")}`);
  }

  /** Find open space near the middle so the keyboard path never stacks cards. */
  function pinSomewhereFree(id) {
    const card = cards.get(id);
    if (card?.time) {
      const at = minutes(card.time);
      place(id, xForTime(at), BAND_Y);
      renderTray();
      return;
    }
    const taken = Object.values(store.get().board.pins);
    const midX = (CORK.x0 + CORK.x1) / 2;
    const midY = (CORK.y0 + BAND_TOP) / 2;
    for (let ring = 0; ring < 6; ring += 1) {
      for (let step = 0; step < 8; step += 1) {
        const x = midX + Math.cos((step / 8) * Math.PI * 2) * (0.07 + ring * 0.07);
        const y = midY + Math.sin((step / 8) * Math.PI * 2) * (0.06 + ring * 0.06);
        if (!taken.some((p) => Math.abs(p.x - x) < 0.075 && Math.abs(p.y - y) < 0.1)) {
          place(id, x, y);
          renderTray();
          return;
        }
      }
    }
    place(id, midX, midY);
    renderTray();
  }

  function unpin(id) {
    remember();
    const pins = { ...store.get().board.pins };
    delete pins[id];
    const kept = store.get().board.strings.filter((s) => s.a !== id && s.b !== id);
    store.setBoard({ pins, strings: kept });
    if (linkFrom === id) linkFrom = null;
    renderPins();
    renderTray();
    announce(`${cards.get(id)?.title} ${t("board.unpinned", "taken off the wall")}`);
  }

  /* -------------------------------------------------------------- strings */

  function startLink(id) {
    linkFrom = id;
    renderPins();
    announce(t("board.linkFrom", "Pick the card to run the string to. Escape cancels."));
  }

  function finishLink(id) {
    if (!linkFrom || linkFrom === id) {
      linkFrom = null;
      renderPins();
      return;
    }
    const existing = store.get().board.strings;
    const already = existing.some(
      (s) => (s.a === linkFrom && s.b === id) || (s.a === id && s.b === linkFrom),
    );
    remember();
    const strings = already
      ? existing.filter((s) => !((s.a === linkFrom && s.b === id) || (s.a === id && s.b === linkFrom)))
      : [...existing, { a: linkFrom, b: id }];
    store.setBoard({ strings });
    announce(already ? t("board.cut", "String cut.") : t("board.tied", "String tied."));
    linkFrom = null;
    renderPins();   // also refreshes each card's spoken description
  }

  /** Redraw every string. Called on any change and on resize. */
  function drawStrings() {
    const box = wall.getBoundingClientRect();
    strings.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    strings.setAttribute("width", box.width);
    strings.setAttribute("height", box.height);
    clear(strings);

    const { pins, strings: list } = store.get().board;
    for (const { a, b } of list) {
      const pa = pins[a];
      const pb = pins[b];
      if (!pa || !pb) continue;
      const x1 = pa.x * box.width;
      const y1 = pa.y * box.height;
      const x2 = pb.x * box.width;
      const y2 = pb.y * box.height;
      // A little sag, so it reads as string rather than a network diagram.
      const sag = Math.min(46, Math.hypot(x2 - x1, y2 - y1) * 0.12);
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${(y1 + y2) / 2 + sag} ${x2} ${y2}`);
      path.setAttribute("class", "string");
      path.addEventListener("click", () => {
        remember();
        store.setBoard({ strings: store.get().board.strings.filter((s) => !(s.a === a && s.b === b)) });
        drawStrings();
        announce(t("board.cut", "String cut."));
      });
      strings.append(path);
    }
  }

  /* ------------------------------------------------------------ dragging */

  function beginDrag(event, id, fromTray) {
    if (event.button != null && event.button !== 0) return;
    if (event.target.closest(".chip__pin")) return;
    event.preventDefault();

    const rect = event.currentTarget.getBoundingClientRect();
    drag = {
      id,
      fromTray,
      startX: event.clientX,
      startY: event.clientY,
      offX: event.clientX - rect.left - rect.width / 2,
      offY: event.clientY - rect.top - rect.height / 2,
      source: event.currentTarget,
      moved: false,
      ghost: null,
    };
    window.addEventListener("pointermove", onDragMove);
    window.addEventListener("pointerup", onDragEnd, { once: true });
  }

  function onDragMove(event) {
    if (!drag) return;
    if (!drag.moved) {
      if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < DRAG_SLOP) return;
      drag.moved = true;
      drag.ghost = makeGhost(drag);
      document.body.append(drag.ghost);
      drag.source.classList.add("is-dragging");
      wall.classList.add("is-receiving");
    }
    drag.ghost.style.left = `${event.clientX - drag.offX}px`;
    drag.ghost.style.top = `${event.clientY - drag.offY}px`;
    const box = wall.getBoundingClientRect();
    const overBand =
      event.clientY - box.top >= box.height * BAND_TOP &&
      event.clientX >= box.left && event.clientX <= box.right &&
      event.clientY <= box.bottom;
    band.classList.toggle("is-target", overBand);
    drag.ghost.classList.toggle("is-timed", overBand);
  }

  function onDragEnd(event) {
    window.removeEventListener("pointermove", onDragMove);
    if (!drag) return;
    const { id, moved, fromTray } = drag;

    drag.ghost?.remove();
    drag.source.classList.remove("is-dragging");
    wall.classList.remove("is-receiving");
    band.classList.remove("is-target");
    drag = null;

    if (!moved) {
      if (linkFrom && !fromTray) finishLink(id);
      else inspect(id);
      return;
    }

    const box = wall.getBoundingClientRect();
    const inside =
      event.clientX >= box.left && event.clientX <= box.right &&
      event.clientY >= box.top && event.clientY <= box.bottom;

    if (inside) {
      place(id, (event.clientX - box.left) / box.width, (event.clientY - box.top) / box.height);
      renderTray();
    } else if (!fromTray) {
      unpin(id);
    }
  }

  function makeGhost(state) {
    const card = cards.get(state.id);
    const ghost = el("div", { class: `pin pin--${card.kind} pin--ghost` });
    if (card?.accent) ghost.style.setProperty("--accent", card.accent);
    if (card?.art) {
      const img = el("img", { class: "pin__art", alt: "" });
      card.art().then((url) => { img.src = url; });
      ghost.append(img);
    }
    ghost.append(el("p", { class: "pin__title", text: card.title }));
    return ghost;
  }

  /* --------------------------------------------------------------- tools */

  function inspect(id) {
    inspecting = id;
    renderTray();
  }

  function addNote() {
    remember();
    const board = store.get().board;
    const id = String(board.nextNote);
    store.setBoard({
      notes: { ...board.notes, [id]: "" },
      nextNote: board.nextNote + 1,
    });
    cards = catalogue();
    pinSomewhereFree(`note:${id}`);
    inspect(`note:${id}`);
    tray.querySelector(".tray__note")?.focus();
  }

  /** Lay every pinned card out on a grid, leaving the timeline alone. */
  function tidy() {
    remember();
    const pins = { ...store.get().board.pins };
    const free = Object.entries(pins).filter(([, pin]) => pin.at == null);
    const columns = Math.ceil(Math.sqrt(free.length)) || 1;
    free.forEach(([id], index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const rows = Math.ceil(free.length / columns);
      const spanX = (CORK.x1 - CORK.x0) - MARGIN_X * 2;
      const spanY = (BAND_TOP - CORK.y0) - MARGIN_Y;
      pins[id] = {
        x: CORK.x0 + MARGIN_X + (col + 0.5) * (spanX / columns),
        y: CORK.y0 + MARGIN_Y * 0.5 + (row + 0.5) * (spanY / Math.max(1, rows)),
        at: null,
      };
    });
    store.setBoard({ pins });
    renderPins();
    announce(t("board.tidied", "Wall tidied."));
  }

  function clearWall() {
    if (!Object.keys(store.get().board.pins).length) return;
    remember();
    store.setBoard({ pins: {}, strings: [] });
    linkFrom = null;
    renderPins();
    renderTray();
    announce(t("board.cleared", "Wall cleared. Everything is back in the tray, and Undo puts it back."));
  }

  function announce(message) {
    status.textContent = message;
  }

  /* ---------------------------------------------------------------- boot */

  function onKey(event) {
    if (event.key === "Escape" && overlay && !linkFrom) {
      event.preventDefault();
      onClose?.();
      return;
    }
    if (event.key === "Escape" && linkFrom) {
      linkFrom = null;
      renderPins();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      // Not while the player is typing in a note.
      if (event.target instanceof HTMLTextAreaElement) return;
      event.preventDefault();
      undo();
    }
  }
  document.addEventListener("keydown", onKey);

  const observer = new ResizeObserver(() => drawStrings());
  observer.observe(wall);

  buildBand();
  renderPins();
  renderTray();

  const missed = missedAtTheStairs().length;
  const proven = store.get().proven.length;
  if (missed) {
    announce(
      `${t("board.missed", "You left the stairs with something unexamined.")} ` +
        t("board.missedHint", "Go back down before you name anybody."),
    );
  } else if (proven) {
    announce(`${proven} ${t("board.provenCount", "account(s) broken.")}`);
  } else {
    announce(t("board.hint", "Drag anything from the tray onto the wall. Click a pinned card to run string from it."));
  }

  return () => {
    document.removeEventListener("keydown", onKey);
    observer.disconnect();
  };
}
