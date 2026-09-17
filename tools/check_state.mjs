#!/usr/bin/env node

/** Regression checks for browser state loaded from localStorage. */

import assert from "node:assert/strict";

const values = new Map();
globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, String(value)),
};
globalThis.document = { documentElement: { dataset: {} } };

values.set("case-board/al-manar", JSON.stringify({
  version: 6,
  exhibits: ["watch", 12, "watch"],
  completed: null,
  flags: "not an object",
  board: {
    pins: {
      good: { x: 0.4, y: 0.6, at: 107 },
      clamped: { x: -4, y: 8, at: "late" },
      broken: { x: "left", y: null },
    },
    strings: [{ a: "good", b: "clamped" }, { a: 1, b: null }],
    notes: { one: "valid", two: 2 },
    nextNote: -5,
  },
}));

const store = await import("../src/engine/store.js");
assert.equal(store.restore(), true);
assert.deepEqual(store.get().exhibits, ["watch"]);
assert.deepEqual(store.get().completed, []);
assert.deepEqual(store.get().flags, {});
assert.deepEqual(store.get().board.pins.clamped, { x: 0, y: 1, at: null });
assert.equal("broken" in store.get().board.pins, false);
assert.equal(store.get().board.strings.length, 1);
assert.deepEqual(store.get().board.notes, { one: "valid" });
assert.equal(store.get().board.nextNote, 1);

values.set("case-board/preferences", JSON.stringify({
  textSpeed: "warp",
  motion: false,
  grain: "yes",
}));
const preferences = await import("../src/engine/preferences.js");
assert.deepEqual(preferences.get(), { textSpeed: "normal", motion: "system", grain: true });
preferences.update({ textSpeed: "instant", motion: "reduced", grain: false });
assert.deepEqual(preferences.get(), { textSpeed: "instant", motion: "reduced", grain: false });

console.log("malformed saves and preferences are safely normalised");
