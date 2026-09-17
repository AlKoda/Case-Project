import { el } from "../engine/dom.js";
import { t } from "../engine/i18n.js";
import * as store from "../engine/store.js";
import * as assets from "../engine/assets.js";
import { CASE, CAST, EXHIBITS } from "../data/case.js";
import { INTERVIEWS, SCENES } from "../data/scenes.js";
import { LOCATIONS } from "../data/locations.js";

const interviewFor = (person) => INTERVIEWS.find((entry) => entry.person === person);

/** The investigation hub: an explorable map, travel panel, and persistent tools. */
export function mountMap(root, go) {
  const state = store.get();
  let selected = LOCATIONS.find((place) => place.id === state.currentLocation) ?? LOCATIONS[1];

  const map = el("div", { class: "city-map", role: "group", "aria-label": t("map.area", "Investigation map") });
  const detail = el("aside", { class: "location-card", "aria-live": "polite" });
  const placeButtons = new Map();

  function openPhone() {
    const alreadyRead = store.flag("switchboard_messages_read");
    const messages = [
      ["01:31", "ROOM 312", "Connect me to the night counter."],
      ["01:36", "NIGHT COUNTER", "Doctor Sharif? You said not to disturb you."],
      ["01:41", "ROOM 312", "Forget the call. And erase this from the slip."],
      ["01:47", "SYSTEM", "Line disconnected — service stair signal recorded."],
    ];
    const feed = el("div", { class: "phone__feed", tabindex: "0", "aria-label": t("phone.messages", "Switchboard messages. Scroll to inspect all messages.") });
    for (const [time, who, body] of messages) feed.append(el("article", { class: "phone__message" },
      el("span", { text: time }), el("b", { text: who }), el("p", { text: body })));
    const status = el("p", { class: "phone__status", "aria-live": "polite", text: alreadyRead ? t("phone.filed", "Lead filed · the final call was at 01:47") : t("phone.instruction", "Scroll through the complete exchange") });
    const modal = el("div", { class: "phone-modal", role: "dialog", "aria-modal": "true", "aria-label": t("phone.title", "Switchboard handset") },
      el("div", { class: "phone" },
        el("header", { class: "phone__header" }, el("span", { text: "AL-MANAR / INTERNAL" }), el("i", { text: "● LIVE LINE" })),
        el("h2", { text: t("phone.heading", "Recovered messages") }),
        el("p", { class: "phone__hint", text: t("phone.hint", "The clerk left the exchange open. Read to the end.") }),
        feed, status,
        el("button", { class: "btn phone__close", type: "button", text: t("phone.close", "Pocket the handset"), onClick: () => modal.remove() })));
    const reveal = () => {
      if (feed.scrollTop + feed.clientHeight < feed.scrollHeight - 8) return;
      store.setFlag("switchboard_messages_read");
      status.textContent = t("phone.filed", "Lead filed · the final call was at 01:47");
      status.classList.add("is-found");
    };
    feed.addEventListener("scroll", reveal, { passive: true });
    modal.addEventListener("click", (event) => { if (event.target === modal) modal.remove(); });
    document.addEventListener("keydown", function close(event) {
      if (event.key !== "Escape" || !modal.isConnected) return;
      modal.remove(); document.removeEventListener("keydown", close);
    });
    root.append(modal);
    feed.focus();
  }

  // Roads and the hotel footprint stay decorative; actual destinations are
  // native buttons laid over them, so the map works equally well by keyboard.
  map.innerHTML = `
    <svg class="city-map__drawing" viewBox="0 0 1000 620" aria-hidden="true">
      <path class="city-map__water" d="M0 470 C190 420 310 520 475 455 C650 385 820 480 1000 400 L1000 620 L0 620Z"/>
      <path class="city-map__road" d="M95 465 C255 368 360 425 518 372 C675 319 778 330 916 244"/>
      <path class="city-map__road city-map__road--thin" d="M617 414 L708 87 M487 378 L520 146"/>
      <path class="city-map__hotel" d="M495 92 L775 92 L775 432 L495 432Z"/>
      <path class="city-map__floor" d="M495 184 H775 M495 276 H775 M495 368 H775"/>
      <path class="city-map__station" d="M90 390 H255 V500 H90Z"/>
      <text x="635" y="121" class="city-map__label">AL-MANAR HOTEL</text>
      <text x="172" y="425" class="city-map__label">NIGHTWATCH</text>
      <text x="90" y="570" class="city-map__harbour">MUTTRAH HARBOUR</text>
    </svg>`;

  function renderDetail() {
    detail.replaceChildren();
    const image = el("div", { class: "location-card__image", "aria-hidden": "true" });
    assets.background(selected.background, selected.name).then((url) => { image.style.backgroundImage = `url("${url}")`; });

    const actions = el("div", { class: "location-card__actions" });
    if (selected.scene) {
      const sceneExhibits = SCENES[selected.scene]?.script.filter((node) => node.give).map((node) => node.give) ?? [];
      const missing = sceneExhibits.filter((id) => !store.has("exhibits", id)).length;
      actions.append(el("button", {
        class: "btn btn--major",
        type: "button",
        text: missing ? t("map.search", "Search the crime scene") : t("map.revisit", "Revisit the crime scene"),
        onClick: () => travel(() => go("scene", { id: selected.scene, next: "hub" })),
      }));
    }
    for (const personId of selected.people ?? []) {
      const interview = interviewFor(personId);
      if (!interview) continue;
      const person = CAST[personId];
      const done = store.has("completed", interview.id);
      actions.append(el("button", {
        class: `location-person${done ? " is-done" : ""}`,
        type: "button",
        onClick: () => travel(() => go("scene", { id: interview.id, next: "hub" })),
      },
      el("span", { class: "location-person__status", text: done ? t("map.questioned", "Questioned") : t("map.waiting", "Available") }),
      el("b", { text: t(`cast.${personId}.name`, person.name) }),
      el("small", { text: t(`cast.${personId}.role`, person.role) })));
    }
    if (selected.id === "lobby") actions.append(el("button", {
      class: `location-person location-person--clue${store.flag("switchboard_messages_read") ? " is-done" : ""}`,
      type: "button",
      onClick: openPhone,
    }, el("span", { class: "location-person__status", text: store.flag("switchboard_messages_read") ? t("map.inspected", "Inspected") : t("map.newLead", "New lead") }),
    el("b", { text: t("phone.action", "Check the switchboard handset") }),
    el("small", { text: t("phone.actionNote", "A message thread is still open on the clerk’s desk") })));
    if (selected.actions?.includes("board")) actions.append(el("button", { class: "btn", type: "button", text: t("map.board", "Open case board"), onClick: () => travel(() => go("board")) }));
    if (selected.actions?.includes("accuse")) actions.append(el("button", { class: "btn btn--alert", type: "button", text: t("hub.accuse", "Name a suspect"), onClick: () => travel(() => go("accuse")) }));

    detail.append(image,
      el("p", { class: "location-card__kicker", text: t(`location.${selected.id}.kicker`, selected.kicker) }),
      el("h2", { text: t(`location.${selected.id}.name`, selected.name) }),
      el("p", { class: "location-card__building", text: selected.building }),
      el("p", { class: "location-card__description", text: t(`location.${selected.id}.description`, selected.description) }),
      actions,
    );
  }

  function travel(done) {
    store.update({ currentLocation: selected.id });
    map.classList.add("is-travelling");
    setTimeout(done, 220);
  }

  for (const place of LOCATIONS) {
    const button = el("button", {
      class: `map-pin${place.id === selected.id ? " is-selected" : ""}${place.id === "stairs" ? " map-pin--crime" : ""}`,
      type: "button",
      style: { "--map-x": `${place.x}%`, "--map-y": `${place.y}%` },
      "aria-pressed": place.id === selected.id ? "true" : "false",
      onClick: () => {
        selected = place;
        for (const [id, node] of placeButtons) {
          const active = id === place.id;
          node.classList.toggle("is-selected", active);
          node.setAttribute("aria-pressed", String(active));
        }
        renderDetail();
      },
    }, el("span", { class: "map-pin__dot", "aria-hidden": "true" }), el("span", { class: "map-pin__label", text: t(`location.${place.id}.name`, place.name) }));
    placeButtons.set(place.id, button);
    map.append(button);
  }

  const found = state.exhibits.length;
  const questioned = INTERVIEWS.filter((entry) => state.completed.includes(entry.id)).length;
  root.append(el("section", { class: "screen map-screen grain" },
    el("header", { class: "map-header" },
      el("div", null, el("p", { class: "map-header__file", text: CASE.file }), el("h1", { text: t("map.title", "Night map") })),
      el("p", { class: "map-header__brief", text: t("map.brief", "Move through the hotel. Search rooms. Find the people who were awake.") }),
      el("div", { class: "map-header__progress", "aria-label": t("map.progress", "Investigation progress") },
        el("span", { text: `${found}/${Object.keys(EXHIBITS).length} ${t("map.clues", "clues")}` }),
        el("span", { text: `${questioned}/${INTERVIEWS.length} ${t("map.people", "people questioned")}` }))),
    el("div", { class: "map-layout" }, map, detail),
    el("nav", { class: "field-nav", "aria-label": t("map.tools", "Investigation tools") },
      el("button", { class: "field-nav__item is-active", type: "button", text: t("map.map", "Map") }),
      el("button", { class: "field-nav__item", type: "button", text: t("map.board", "Case board"), onClick: () => go("board") }),
      el("button", { class: "field-nav__item", type: "button", text: t("map.accuse", "Accuse"), onClick: () => go("accuse") }),
      el("button", { class: "field-nav__item", type: "button", text: t("title.settings", "Settings"), onClick: () => go("settings", { back: "hub" }) })),
  ));
  renderDetail();
}
