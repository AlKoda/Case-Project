#!/usr/bin/env node
/** Dependency-free checks of the prepared walkthrough and save isolation. */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const values = new Map();
globalThis.localStorage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)) };
globalThis.document = { documentElement: { dataset: {} } };
globalThis.Image = class {
  naturalWidth = 512;
  set src(path) {
    queueMicrotask(() => existsSync(fileURLToPath(new URL(`../${path}`, import.meta.url))) ? this.onload?.() : this.onerror?.());
  }
};
const store = await import('../src/engine/store.js');
const presenter = await import('../src/game/presenter.js');
const { PRESENTATION_SCENES, PRESENTATION_STEPS } = await import('../src/data/presentation.js');
const { EXHIBITS, CONTRADICTIONS, CAST } = await import('../src/data/case.js');
const { SCENES } = await import('../src/data/scenes.js');
const { playScene } = await import('../src/engine/player.js');

store.reset();
store.collect('exhibits', 'shawl-bead');
store.setBoard({ notes: { original: 'Keep my theory' }, nextNote: 2 });
const original = structuredClone(store.get());
const saved = values.get('case-board/al-manar');
let routed;
presenter.startPresentation((name, params) => { routed = { name, params }; });
assert.equal(presenter.isPresenting(), true);
assert.deepEqual(routed, { name: 'presentation', params: { step: 0 } });
assert.equal(PRESENTATION_STEPS.length, 5);
for (let index = 0; index < 5; index++) {
  presenter.prepareStep(index);
  const state = store.get();
  for (const id of state.exhibits) assert.ok(EXHIBITS[id], `unknown exhibit ${id}`);
  for (const id of state.proven) assert.ok(CONTRADICTIONS[id], `unknown proof ${id}`);
  for (const id of state.completed) assert.ok(SCENES[id], `unknown scene ${id}`);
  if (index === 4) assert.deepEqual(state.proven.sort(), Object.entries(CONTRADICTIONS).filter(([, proof]) => proof.subject === 'sharif').map(([id]) => id).sort());
  store.setFlag('presenter_test');
  assert.equal(values.get('case-board/al-manar'), saved, 'preview wrote to saved case');
}

function stage(overrides = {}) {
  return {
    destroyed: false, actors: new Map(),
    setBackground: async () => {}, setClock: () => {}, enter: async () => {}, exit: async () => {},
    setMood: async () => {}, spotlight: () => {}, setBust: async () => {}, typeOut: async () => {},
    remember: () => {}, waitForAdvance: async () => {}, ask: async (options) => options[0],
    press: async () => 'stair-bulb', ...overrides,
  };
}
const context = { cast: CAST, exhibits: EXHIBITS };
presenter.prepareStep(1);
await playScene(stage(), PRESENTATION_SCENES['demo:evidence'], context);
assert.ok(store.has('exhibits', 'pocket-watch'));
presenter.prepareStep(1);
await playScene(stage({ ask: async (options) => options[1] }), PRESENTATION_SCENES['demo:evidence'], context);
assert.ok(store.has('exhibits', 'stair-bulb'));

presenter.prepareStep(2);
let attempts = 0;
await playScene(stage({ press: async () => (++attempts === 1 ? 'pocket-watch' : 'stair-bulb') }), PRESENTATION_SCENES['demo:interview'], context);
assert.equal(attempts, 2, 'a failed challenge cannot be retried');
assert.deepEqual(store.get().proven, ['sharif-saw-blood']);
presenter.prepareStep(2);
await playScene(stage({ press: async () => null }), PRESENTATION_SCENES['demo:interview'], context);
assert.deepEqual(store.get().proven, [], 'leaving a claim untested recorded a proof');

presenter.prepareStep(2);
const cancelled = stage();
cancelled.press = async () => { cancelled.destroyed = true; return 'stair-bulb'; };
await playScene(cancelled, PRESENTATION_SCENES['demo:interview'], context);
assert.deepEqual(store.get().proven, [], 'cancelled scene mutated the next checkpoint');

presenter.endPresentation((name) => { routed = name; });
assert.equal(routed, 'title');
assert.equal(presenter.isPresenting(), false);
assert.deepEqual(store.get(), original, 'saved workspace did not return intact');
assert.equal(values.get('case-board/al-manar'), saved);
store.collect('exhibits', 'umbrella');
assert.notEqual(values.get('case-board/al-manar'), saved, 'ordinary saves did not resume after presentation');
console.log('five valid checkpoints; evidence and challenge branches; scene cancellation; original save preserved');
