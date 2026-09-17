/**
 * Entry point and router.
 *
 * Screens are plain functions, so "routing" is a table and a call. There is no
 * history integration on purpose: this is a single sitting with a save, not a
 * site to navigate.
 */

import { el, clear } from "./engine/dom.js";
import * as store from "./engine/store.js";
import { registerLocale, setLocale } from "./engine/i18n.js";
import { SCREENS } from "./game/screens.js";
import * as preferences from "./engine/preferences.js";

const root = document.getElementById("app");

const ROUTES = {
  title: (r, go) => SCREENS.title(r, go),
  settings: (r, go, params) => SCREENS.settings(r, go, params),
  intro: (r, go) => SCREENS.scene(r, go, { id: "intro", next: "stairs" }),
  stairs: (r, go) => SCREENS.scene(r, go, { id: "scene:stairs", next: "hub" }),
  hub: (r, go) => SCREENS.hub(r, go),
  board: (r, go) => SCREENS.board(r, go),
  accuse: (r, go) => SCREENS.accuse(r, go),
  verdict: (r, go) => SCREENS.verdict(r, go),
  scene: (r, go, params) => SCREENS.scene(r, go, params),
};

let leaving = false;

async function go(name, params) {
  const route = ROUTES[name];
  if (!route) {
    console.error(`Unknown route "${name}"`);
    return;
  }
  if (leaving) return;
  leaving = true;
  root.classList.add("is-leaving");
  await new Promise((resolve) => setTimeout(resolve, 160));
  clear(root);
  root.classList.remove("is-leaving");
  leaving = false;
  route(root, go, params);
}

/**
 * Load a translation if one has been dropped in.
 *
 * `src/data/strings.<code>.js` is not part of the build and does not have to
 * exist -- if the import fails the game stays in English. That is the whole
 * mechanism: ship the file, get the language.
 */
async function loadLocale(code) {
  if (!code || code === "en") return;
  try {
    const module = await import(`./data/strings.${code}.js`);
    registerLocale(code, module.STRINGS ?? {});
    setLocale(code);
  } catch {
    console.info(`No translation bundle for "${code}" yet; staying in English.`);
  }
}

function preferredLocale() {
  const asked = new URLSearchParams(location.search).get("lang");
  if (asked) return asked;
  try {
    return localStorage.getItem("case-board/lang") ?? "en";
  } catch {
    return "en";
  }
}

async function boot() {
  document.documentElement.lang = "en";
  document.documentElement.dir = "ltr";
  await loadLocale(preferredLocale());
  preferences.apply();
  store.restore();
  go("title");
}

boot();
