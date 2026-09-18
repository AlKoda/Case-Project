/** Short, self-contained excerpts for a live presentation. The full case stays
 * in scenes.js. These checkpoints are openly labelled as prepared material. */
export const PRESENTATION_STEPS = [
  { id: 'briefing', label: 'Briefing', note: 'Introduce the scenario and the investigation workflow.' },
  { id: 'evidence', label: 'Evidence', note: 'Examine a physical exhibit. Click or press Space to advance.' },
  { id: 'interview', label: 'Interview', note: 'Test the doctor’s account: the unscrewed bulb contradicts what he claims to have seen.' },
  { id: 'board', label: 'Connections', note: 'Move a card, inspect an exhibit, or add a string. This wall is an editable prepared example.' },
  { id: 'findings', label: 'Findings', note: 'Review the prepared case and explain how the evidence supports its conclusion.' },
];

export const PRESENTATION_SCENES = {
  'demo:evidence': {
    id: 'demo:evidence', background: 'hotel-stairs', clock: '04:10 · Service stairs',
    script: [
      { text: 'The service stairs are dark. Tariq Al-Rawahi lies beneath a sheet at the foot of the last flight.' },
      { who: 'harthy', text: 'The report says two-fourteen. Let’s see what the scene can tell us.' },
      { choice: [{ text: 'Examine the pocket watch.', goto: 'watch' }, { text: 'Inspect the stairwell light.', goto: 'bulb' }] },
      { label: 'watch' },
      { text: 'The watch glass is cracked. Its hands stopped at 01:47 — twenty-seven minutes before the reported discovery.' },
      { give: 'pocket-watch' },
      { who: 'harthy', text: 'A useful time marker. It is a lead to test against the other accounts, not a conclusion on its own.' },
      { goto: 'finish' },
      { label: 'bulb' },
      { text: 'The filament is intact. The bulb was deliberately loosened in its socket. The darkness was arranged.' },
      { give: 'stair-bulb' },
      { who: 'harthy', text: 'Keep that detail. It matters when someone tells us what they saw on these stairs.' },
      { label: 'finish' },
      { text: 'Next, compare a spoken account with the physical evidence. The presentation controls let you move directly to the interview.' },
      { end: true },
    ],
  },
  'demo:interview': {
    id: 'demo:interview', background: 'interview-room', clock: '05:31 · Room 312',
    script: [
      { enter: 'sharif', at: 'center', mood: 'neutral' },
      { who: 'sharif', text: 'I came down when I heard the commotion. I saw the blood plainly on the stairs.' },
      { who: 'harthy', text: 'You saw it plainly? Before the porter brought a torch?' },
      { who: 'sharif', mood: 'evasive', text: 'There was enough light. I know what I saw.' },
      { label: 'challenge' },
      { press: { claim: 'I saw the blood plainly in the stairwell.', accepts: 'stair-bulb', prove: 'sharif-saw-blood', hit: 'hit', miss: 'miss', stand: 'stand' } },
      { label: 'miss' },
      { who: 'harthy', text: 'That exhibit does not establish the lighting. Think about the condition of the stairwell bulb.' },
      { goto: 'challenge' },
      { label: 'stand' },
      { who: 'harthy', text: 'We can leave the claim unresolved for now. A statement needs evidence before we can challenge it.' },
      { end: true },
      { label: 'hit' },
      { who: 'harthy', text: 'The bulb was unscrewed. Those stairs were black. You described something you could not have seen in that light.' },
      { who: 'sharif', mood: 'broken', text: 'Perhaps I remembered it differently.' },
      { text: 'One contradiction is recorded. The complete fictional case requires the call record and the stopped watch as well. Continue to Connections to see those exhibits organised.' },
      { end: true },
    ],
  },
};
