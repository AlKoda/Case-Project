/**
 * Game state and persistence.
 *
 * State is one plain object, mutated only through `update`, which persists and
 * then notifies. Saves are versioned: a save written by an older build is
 * discarded rather than half-loaded, because a partially-understood save is
 * worse than a fresh start.
 */

const KEY = "case-board/bellweather";
const VERSION = 3;

const listeners = new Set();

function blank() {
  return {
    version: VERSION,
    startedAt: null,
    /** Scene the player is in, and how far through it. */
    scene: null,
    line: 0,
    /** Exhibit ids the player has collected. */
    exhibits: [],
    /** Contradiction ids the player has proven. */
    proven: [],
    /** Free-form flags set by dialogue scripts. */
    flags: {},
    /** Interview scenes already played to the end. */
    completed: [],
    /** Every line the player has seen, for the backlog. */
    backlog: [],
    accusation: null,
  };
}

let state = blank();

export function get() {
  return state;
}

/** Apply a patch (or a function of state) and persist the result. */
export function update(patch) {
  const next = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...next };
  persist();
  for (const listener of listeners) listener(state);
  return state;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function has(list, id) {
  return state[list]?.includes(id) ?? false;
}

/** Add an id to one of the array fields, ignoring duplicates. */
export function collect(list, id) {
  if (has(list, id)) return state;
  return update({ [list]: [...state[list], id] });
}

export function setFlag(name, value = true) {
  return update({ flags: { ...state.flags, [name]: value } });
}

export function flag(name) {
  return Boolean(state.flags[name]);
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Private browsing, disabled storage, a full quota: none of these should
    // interrupt play. The session simply will not survive a reload.
  }
}

/** True if a resumable save exists. */
export function hasSave() {
  return Boolean(read());
}

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Load the save if there is a usable one. Returns true when state changed. */
export function restore() {
  const saved = read();
  if (!saved) return false;
  state = { ...blank(), ...saved };
  for (const listener of listeners) listener(state);
  return true;
}

export function reset() {
  state = blank();
  state.startedAt = Date.now();
  persist();
  for (const listener of listeners) listener(state);
  return state;
}
