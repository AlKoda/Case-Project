/**
 * Game state and persistence.
 *
 * State is one plain object, mutated only through `update`, which persists and
 * then notifies. Saves are versioned: a save written by an older build is
 * discarded rather than half-loaded, because a partially-understood save is
 * worse than a fresh start.
 *
 * The version has to move whenever the *data* changes shape as well as when
 * the state does. Renaming a character or an exhibit leaves an old save full of
 * ids that no longer resolve -- cards that cannot be drawn, contradictions that
 * match nothing -- which is exactly the half-loaded state this guards against.
 * The key is named after the case for the same reason.
 */

const KEY = "case-board/al-manar";
const VERSION = 6;

const listeners = new Set();

function blank() {
  return {
    version: VERSION,
    startedAt: null,
    /** Scene the player is in, and how far through it. */
    scene: null,
    line: 0,
    /** Last place selected on the field map. */
    currentLocation: "lobby",
    /** Exhibit ids the player has collected. */
    exhibits: [],
    /** Spoken leads deliberately filed (or deliberately left as testimony). */
    clues: [],
    dismissedClues: [],
    /** Contradiction ids the player has proven. */
    proven: [],
    /** Free-form flags set by dialogue scripts. */
    flags: {},
    /** Interview scenes already played to the end. */
    completed: [],
    /** Every line the player has seen, for the backlog. */
    backlog: [],
    /**
     * The evidence wall. Positions are normalised 0..1 against the wall box so
     * they survive a resize; `at` is minutes past midnight for anything the
     * player has placed on the timeline, and null for anything pinned free.
     */
    board: {
      pins: {},      // cardId -> { x, y, at }
      strings: [],   // { a, b }
      notes: {},     // noteId -> text
      nextNote: 1,
    },
    accusation: null,
  };
}

const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const strings = (value) => Array.isArray(value) ? [...new Set(value.filter((item) => typeof item === "string"))] : [];

/**
 * Treat localStorage as untrusted input. A save can be hand-edited, partially
 * written, or left behind by a development build with the same version. Keep
 * usable fields while restoring every collection to the shape the UI expects.
 */
function normalise(saved) {
  const fresh = blank();
  const board = isRecord(saved.board) ? saved.board : {};
  const pins = isRecord(board.pins)
    ? Object.fromEntries(Object.entries(board.pins).flatMap(([id, pin]) => {
        if (!isRecord(pin) || !Number.isFinite(pin.x) || !Number.isFinite(pin.y)) return [];
        return [[id, {
          x: Math.min(1, Math.max(0, pin.x)),
          y: Math.min(1, Math.max(0, pin.y)),
          at: Number.isFinite(pin.at) ? pin.at : null,
        }]];
      }))
    : {};
  const notes = isRecord(board.notes)
    ? Object.fromEntries(Object.entries(board.notes).filter(([, note]) => typeof note === "string"))
    : {};
  const links = Array.isArray(board.strings)
    ? board.strings.filter((link) => isRecord(link) && typeof link.a === "string" && typeof link.b === "string")
    : [];

  return {
    ...fresh,
    startedAt: Number.isFinite(saved.startedAt) ? saved.startedAt : null,
    scene: typeof saved.scene === "string" ? saved.scene : null,
    line: Number.isInteger(saved.line) && saved.line >= 0 ? saved.line : 0,
    currentLocation: typeof saved.currentLocation === "string" ? saved.currentLocation : fresh.currentLocation,
    exhibits: strings(saved.exhibits),
    clues: strings(saved.clues),
    dismissedClues: strings(saved.dismissedClues),
    proven: strings(saved.proven),
    flags: isRecord(saved.flags) ? { ...saved.flags } : {},
    completed: strings(saved.completed),
    backlog: Array.isArray(saved.backlog) ? saved.backlog.filter(isRecord) : [],
    board: {
      pins,
      strings: links,
      notes,
      nextNote: Number.isInteger(board.nextNote) && board.nextNote > 0 ? board.nextNote : 1,
    },
    accusation: typeof saved.accusation === "string" ? saved.accusation : null,
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

/** Replace the board, persisting and notifying like any other update. */
export function setBoard(patch) {
  return update({ board: { ...state.board, ...patch } });
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
    return normalise(parsed);
  } catch {
    return null;
  }
}

/** Load the save if there is a usable one. Returns true when state changed. */
export function restore() {
  const saved = read();
  if (!saved) return false;
  state = saved;
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
