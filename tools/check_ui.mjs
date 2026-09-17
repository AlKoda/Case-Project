#!/usr/bin/env node
/** Semantic interaction checks. Does not replace a rendered browser playtest.
 * Optional development dependency: npm install --no-save happy-dom */
import assert from 'node:assert/strict';
let Window;
try { ({ Window } = await import('happy-dom')); }
catch { console.log('UI interaction checks skipped: npm install --no-save happy-dom'); process.exit(0); }
const window = new Window({ url: 'http://localhost:8000/' });
for (const key of ['document', 'localStorage', 'HTMLElement', 'HTMLTextAreaElement', 'HTMLInputElement', 'KeyboardEvent', 'MouseEvent', 'Event', 'ResizeObserver', 'location']) globalThis[key] = window[key];
globalThis.window = window;
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
// Image resolution is stubbed: these checks verify DOM behavior, not rendering.
globalThis.Image = class { naturalWidth = 512; set src(_) { queueMicrotask(() => this.onload?.()); } };
document.body.innerHTML = '<main id="app" class="app"></main>';
const root = document.getElementById('app');
const sleep = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));
function button(text, scope = document) {
  const node = [...scope.querySelectorAll('button')].find((node) => node.textContent.includes(text));
  assert.ok(node, `missing button: ${text}`);
  return node;
}
const store = await import('../src/engine/store.js');
const { update } = await import('../src/engine/preferences.js');
update({ textSpeed: 'instant', motion: 'reduced' });
store.reset();
store.collect('completed', 'scene:stairs');
store.update({ scene: 'scene:stairs', exhibits: ['pocket-watch', 'stair-bulb'] });
const originalSave = localStorage.getItem('case-board/al-manar');
await import('../src/main.js');
await sleep(500);
assert.ok(root.querySelector('.title'));
button('Resume investigation').click();
await sleep();
assert.equal(root.querySelectorAll('.map-pin').length, 6);
const room = button('Room 312');
assert.equal(room.style.getPropertyValue('--map-x'), '57%', 'map coordinates are not CSS custom properties');
room.click();
assert.ok(root.querySelector('.location-person').textContent.includes('Sharif'));
assert.equal(store.get().currentLocation, 'room312');
button('Main menu').click();
await sleep();
const savedBeforePreview = localStorage.getItem('case-board/al-manar');
button('Presentation walkthrough').click();
await sleep();
assert.ok(root.querySelector('.briefing'));
assert.equal(root.querySelectorAll('.presenter__step').length, 5);
button('Evidence', root.querySelector('.presenter__steps')).click();
await sleep();
assert.ok(root.querySelector('.screen--scene'));
// Change chapter while the evidence scene is waiting for an advance.
button('Interview', root.querySelector('.presenter__steps')).click();
await sleep(700);
assert.ok(root.querySelector('.vn__name').textContent.includes('Sharif'));
button('Connections', root.querySelector('.presenter__steps')).click();
await sleep();
assert.equal(root.querySelectorAll('.pin').length, 6);
button('Add note').click();
assert.equal(Object.keys(store.get().board.notes).length, 1);
button('Undo').click();
assert.equal(Object.keys(store.get().board.notes).length, 0);
// Exact exhibit times must survive automatic placement on the timeline.
button('Clear wall').click();
for (const [id, expected] of [['pocket-watch', 107], ['switchboard-log', 112]]) {
  root.querySelector(`.chip[data-card="ex:${id}"] .chip__pin`).click();
  assert.equal(store.get().board.pins[`ex:${id}`].at, expected);
  assert.equal(root.querySelector(`.pin[data-card="ex:${id}"] .pin__clock`).textContent, id === 'pocket-watch' ? '01:47' : '01:52');
}
button('Findings', root.querySelector('.presenter__steps')).click();
await sleep();
assert.ok(root.querySelector('.verdict__stamp').textContent.includes('Charged'));
assert.equal(root.querySelectorAll('.verdict__proof').length, 3);
assert.ok(root.querySelector('.verdict__disclosure').textContent.includes('scripted'));
button('Exit walkthrough').click();
await sleep();
assert.ok(root.querySelector('.title'));
assert.equal(localStorage.getItem('case-board/al-manar'), savedBeforePreview);
assert.deepEqual(store.get().exhibits, ['pocket-watch', 'stair-bulb']);
// A quick exit during a chapter transition must still restore the title/save.
button('Presentation walkthrough').click();
await sleep();
button('Evidence', root.querySelector('.presenter__steps')).click();
button('Exit walkthrough').click();
await sleep(700);
assert.ok(root.querySelector('.title'));
assert.equal(localStorage.getItem('case-board/al-manar'), savedBeforePreview);
assert.equal(document.documentElement.dataset.presentation, undefined);

// Test the supported / incomplete / incorrect findings independently.
const { verdict, accuse, title, scene } = await import('../src/game/screens.js');
const allProofs = ['sharif-saw-blood', 'sharif-slept-through', 'sharif-time-of-death'];
for (const [accusation, proven, expected] of [
  ['sharif', [], 'Further investigation'],
  ['sharif', ['sharif-saw-blood'], 'Further investigation'],
  ['sharif', allProofs, 'Charged'],
  ['lawati', allProofs, 'Released'],
]) {
  store.update({ accusation, proven }); root.replaceChildren(); verdict(root, () => {});
  assert.ok(root.querySelector('.verdict__stamp').textContent.includes(expected));
  if (expected === 'Further investigation') assert.equal(root.querySelector('.verdict__name').textContent, 'Dr. Ayman Sharif');
}
root.replaceChildren(); accuse(root, () => {});
root.querySelector('.accuse__card').click();
assert.ok(document.querySelector('dialog[open]'), 'a suspect was submitted without review');
button('Close', document.querySelector('dialog')).click();
await sleep(20);
assert.equal(document.querySelectorAll('dialog').length, 0);

root.replaceChildren(); title(root, () => {});
button('New investigation').click();
assert.ok(document.querySelector('dialog[open]'), 'new case silently replaced a save');
button('Close', document.querySelector('dialog')).click();
await sleep(20);
const priorLine = store.get().scene;
assert.equal(priorLine, 'scene:stairs');

// While the case board is open, Space must not advance the underlying line.
root.replaceChildren();
const cancel = scene(root, () => {}, { id: 'intro' });
await sleep(50);
const textBefore = root.querySelector('.vn__text').textContent;
button('Case board').click();
await sleep(20);
document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
await sleep(20);
assert.equal(root.querySelector('.vn__text').textContent, textBefore);
button('Return to scene').click();
cancel();
console.log('PASS: routing, map coordinates, walkthrough navigation, board undo, save restoration, evidence-based endings, dialogs, paused scene');
await window.happyDOM.abort();
