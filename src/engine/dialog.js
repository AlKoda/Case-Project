import { el } from './dom.js';
import { t } from './i18n.js';

/** Native dialog supplies focus containment, Escape and background inertness. */
export function openDialog({ title, body, actions = [] }) {
  const previous = document.activeElement;
  const dialog = el('dialog', { class: 'desk-dialog', 'aria-labelledby': 'desk-dialog-title' },
    el('p', { class: 'eyebrow', text: t('dialog.file', 'Al-Manar · Case file 47-B') }),
    el('h2', { id: 'desk-dialog-title', text: title }),
    typeof body === 'string' ? el('p', { text: body }) : body,
    el('div', { class: 'desk-dialog__actions' },
      ...actions.map(({ label, primary, run }) => el('button', {
        type: 'button', class: `btn${primary ? ' btn--major' : ''}`, text: label,
        onClick: () => { dialog.close(); run?.(); },
      })),
      el('button', { type: 'button', class: 'btn', text: t('dialog.close', 'Close'), onClick: () => dialog.close() }),
    ),
  );
  document.body.append(dialog);
  dialog.addEventListener('close', () => {
    dialog.remove();
    if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
  }, { once: true });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.showModal();
}

export function showHelp() {
  openDialog({
    title: t('help.title', 'Working the case'),
    body: el('div', { class: 'help-content' },
      el('p', { text: t('help.intro', 'Search the scene, hear each account, and test claims against the evidence. There is no timer.') }),
      ...[
        ['Read', 'Click the scene or press Space to advance. Click once to reveal a line immediately.'],
        ['Investigate', 'Choose a location on the map, then select a person or search the stairs. You can return to any interview.'],
        ['File', 'Choose “File this as a clue” to keep useful testimony. Physical evidence is filed when you find it.'],
        ['Challenge', 'When a claim appears, select the exhibit that contradicts it. A failed challenge lets you reconsider.'],
        ['Connect', 'On the board, press + to pin a card. Select a card, start a string, then select another. Tidy and Undo keep the wall manageable.'],
        ['Review', 'Use Review findings to select a suspect. The conclusion distinguishes a supported case from an incomplete one.'],
      ].map(([label, body], i) => el('div', { class: 'help-row' },
        el('b', { text: t(`help.${i}.label`, label) }), el('p', { text: t(`help.${i}.body`, body) }))),
      el('p', { class: 'help-content__keys', text: t('help.keys', 'Escape: close a window or go back · Board: arrow keys move a card, L starts a string, Delete removes it, Ctrl / Cmd + Z undoes.') }),
    ),
  });
}

export async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    openDialog({ title: t('fullscreen.title', 'Full-screen presentation'), body: t('fullscreen.body', 'Full screen is unavailable in this window. Open the project in its own browser tab and use your browser’s full-screen command.') });
  }
}
