import { el } from '../engine/dom.js';
import { t } from '../engine/i18n.js';
import * as store from '../engine/store.js';
import { PRESENTATION_STEPS } from '../data/presentation.js';
import { toggleFullscreen } from '../engine/dialog.js';

let active = false;
let step = 0;
export const isPresenting = () => active;
export const currentStep = () => step;

const evidence = ['pocket-watch', 'stair-bulb', 'fingerprint-stairs', 'switchboard-log', 'fingerprint-sharif', 'ledger'];
const proofs = ['sharif-saw-blood', 'sharif-slept-through', 'sharif-time-of-death'];

function checkpoint(index) {
  const base = { startedAt: Date.now(), completed: ['scene:stairs'], currentLocation: 'room312' };
  if (index >= 2) base.exhibits = ['pocket-watch', 'stair-bulb', 'switchboard-log'];
  if (index >= 3) {
    base.exhibits = evidence;
    base.completed = ['scene:stairs', 'interview:sharif', 'interview:hinai', 'interview:zadjali'];
    base.proven = proofs;
    base.board = {
      pins: {
        'who:sharif': { x: .48, y: .25, at: null },
        'ex:stair-bulb': { x: .25, y: .26, at: null },
        'ex:fingerprint-sharif': { x: .73, y: .26, at: null },
        'ex:fingerprint-stairs': { x: .73, y: .46, at: null },
        'ex:pocket-watch': { x: .25, y: .49, at: null },
        'ex:switchboard-log': { x: .48, y: .49, at: null },
      },
      strings: [
        { a: 'who:sharif', b: 'ex:stair-bulb' },
        { a: 'who:sharif', b: 'ex:fingerprint-sharif' },
        { a: 'ex:fingerprint-sharif', b: 'ex:fingerprint-stairs' },
        { a: 'who:sharif', b: 'ex:switchboard-log' },
        { a: 'who:sharif', b: 'ex:pocket-watch' },
      ], notes: {}, nextNote: 1,
    };
  }
  if (index === 4) base.accusation = 'sharif';
  return base;
}

export function startPresentation(go) {
  active = true;
  document.documentElement.dataset.presentation = 'on';
  go('presentation', { step: 0 });
}

export function prepareStep(index) {
  step = Math.max(0, Math.min(PRESENTATION_STEPS.length - 1, Number.isInteger(index) ? index : 0));
  store.beginPreview(checkpoint(step));
  return PRESENTATION_STEPS[step].id;
}

export function endPresentation(go) {
  active = false;
  delete document.documentElement.dataset.presentation;
  store.endPreview();
  go('title');
}

export function presentationBar(root, go) {
  const info = PRESENTATION_STEPS[step];
  const bar = el('aside', { class: 'presenter', 'aria-label': t('presenter.controls', 'Presentation controls') },
    el('div', { class: 'presenter__heading' },
      el('span', { class: 'presenter__badge', text: t('presenter.badge', 'Presentation') }),
      el('span', { class: 'presenter__prepared', text: t('presenter.prepared', 'Prepared fictional case checkpoints') })),
    el('nav', { class: 'presenter__steps', 'aria-label': t('presenter.chapters', 'Presentation chapters') },
      ...PRESENTATION_STEPS.map((item, index) => el('button', {
        class: `presenter__step${index === step ? ' is-current' : ''}`, type: 'button',
        'aria-current': index === step ? 'step' : null,
        onClick: () => go('presentation', { step: index }),
      }, el('span', { text: String(index + 1).padStart(2, '0') }), t(`presenter.${item.id}`, item.label)))),
    el('p', { class: 'presenter__note', text: t(`presenter.${info.id}.note`, info.note) }),
    el('div', { class: 'presenter__actions' },
      el('button', { type: 'button', class: 'presenter__utility', text: t('presenter.fullscreen', 'Full screen'), onClick: toggleFullscreen }),
      el('button', { type: 'button', class: 'presenter__utility', text: t('presenter.exit', 'Exit walkthrough'), onClick: () => endPresentation(go) }),
      el('button', { type: 'button', class: 'btn btn--major btn--small', text: step < 4 ? t('presenter.next', 'Next chapter →') : t('presenter.finish', 'Finish presentation'), onClick: () => step < 4 ? go('presentation', { step: step + 1 }) : endPresentation(go) })),
  );
  root.append(bar);
}
