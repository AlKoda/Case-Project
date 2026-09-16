/**
 * Translation layer.
 *
 * The game ships English only, but no English string is ever written straight
 * into the DOM. Every visible string -- interface chrome and dialogue alike --
 * passes through `t(key, english)`, which returns the active locale's version
 * if one exists and the English otherwise.
 *
 * That has two consequences worth stating plainly:
 *
 *   * With no translation loaded, `t` is a pass-through. English costs nothing
 *     and needs no table, so the scripts stay readable as scripts.
 *   * Adding a language means shipping one file of key -> string and calling
 *     `registerLocale`. No screen, script or component changes.
 *
 * `tools/i18n_extract.py` walks the case data and writes the template of every
 * key with its English source, so a translator never has to read the code.
 *
 * Text direction is handled here too, so a right-to-left locale flips the
 * document once and the layout follows: the stylesheets use logical properties
 * (inline-start / inline-end) rather than left / right throughout.
 */

const locales = new Map([["en", {}]]);
const listeners = new Set();

let active = "en";

/** Locales that read right to left. */
const RTL = new Set(["ar", "he", "fa", "ur"]);

/** Add or replace a locale table: { "some.key": "translated string" }. */
export function registerLocale(code, table) {
  locales.set(code, { ...(locales.get(code) ?? {}), ...table });
}

export function availableLocales() {
  return [...locales.keys()];
}

export function locale() {
  return active;
}

/** Writing direction of the active locale: "ltr" or "rtl". */
export function direction() {
  return RTL.has(active) ? "rtl" : "ltr";
}

/** Switch locale, update the document, and notify subscribers. */
export function setLocale(code) {
  if (!locales.has(code)) {
    console.warn(`i18n: locale "${code}" is not registered; staying on "${active}"`);
    return active;
  }
  active = code;
  document.documentElement.lang = code;
  document.documentElement.dir = direction();
  for (const listener of listeners) listener(code);
  return active;
}

/** Subscribe to locale changes. Returns an unsubscribe function. */
export function onLocaleChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Translate. `english` is both the fallback and the source of truth for
 * extraction, so a key with no translation still renders correct English.
 */
export function t(key, english = "") {
  const table = locales.get(active);
  const translated = table?.[key];
  if (translated != null) return translated;
  if (active !== "en") {
    const base = locales.get("en")?.[key];
    if (base != null) return base;
  }
  return english;
}

/** Interpolate {name} placeholders after translating. */
export function tf(key, english, values = {}) {
  return t(key, english).replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match,
  );
}
