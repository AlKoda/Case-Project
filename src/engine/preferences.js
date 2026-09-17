/** Player-facing presentation preferences, kept separate from case progress. */

const KEY = "case-board/preferences";
const DEFAULTS = { textSpeed: "normal", motion: "system", grain: true };
const SPEEDS = { slow: 32, normal: 52, fast: 90, instant: Infinity };

let current = read();

function read() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return { ...DEFAULTS };
  }
}

export function get() {
  return { ...current };
}

export function update(patch) {
  current = { ...current, ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(current)); } catch { /* Session-only is fine. */ }
  apply();
  return get();
}

export function apply() {
  const root = document.documentElement;
  root.dataset.motion = current.motion;
  root.dataset.grain = current.grain ? "on" : "off";
}

export function typeSpeed() {
  return SPEEDS[current.textSpeed] ?? SPEEDS.normal;
}

