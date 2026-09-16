# Al-Manar — design notes

## What it is

A single-sitting interview mystery, played as a visual novel. One hotel on the
Muttrah harbour, one night, seven people who were somewhere else. The player
questions them, collects physical evidence, builds a corkboard out of it, and
breaks the one account that cannot survive contact with the facts.

It is a demonstration piece: the point is to show a concept carried through
design, writing, implementation and iteration. The case is fiction and is not a
representation of real investigative procedure.

## The player's night

1. **The stairs.** Search the scene. Four exhibits are there for anyone who
   looks; none of them mean anything yet.
2. **The statements.** Question people in any order — three suspects who can be
   accused and four witnesses who cannot. Each gives an account, and each
   account contains at least one thing that is not true.
3. **The press.** When a claim is wrong, put an exhibit on the table. A hit
   breaks the account and opens what the subject was protecting. A miss costs a
   beat, and the subject enjoys it.
4. **The wall.** Pin what matters to the corkboard, run string between the
   things that belong together, and lay the timed exhibits out along the
   timeline until the missing twenty-seven minutes are visible as a gap.
5. **The name.** Accuse one of the three. The verdict explains itself either way.

There is no fail state and no timer. A wrong accusation is a scene, not a game
over, and the file can be reopened.

## Why interviews

Every scene is one person, one chair and one room. That is a deliberate
constraint and it pays for itself three ways:

* **Art.** Seven portraits and one background carry the whole middle of the
  game. A project that has to look finished before it is finished should spend
  its art budget where the player is looking.
* **Writing.** The mystery is carried entirely by what people say and refuse to
  say, so the prose is doing the work the mechanics would otherwise have to.
* **Feel.** The pop-out figure and the speech box that frames the speaker in its
  corner put the player across a table from somebody. That framing is the game.

## The wall

The board is the one screen the player builds rather than reads. That is the
whole design goal: a case file printed as a list tells you what is known, and a
corkboard shows you what you believe about it.

Three rules keep it honest:

* **Nothing on it is scored.** The game never checks whether a string is
  "correct". A board that grades you is a puzzle wearing a board's clothes, and
  it stops being a place to think.
* **Nothing is destroyed.** Taking a card down returns it to the tray, clearing
  the wall returns everything, and undo covers the rest. The player should never
  hesitate over a rearrangement, and "Clear wall" should not be a button nobody
  dares press.
* **The timeline is the argument.** Exhibits that fix a moment carry their time
  on their face. Laid out in order they make the twenty-seven minutes between
  the watch and the pronouncement into a visible hole, which is the deduction
  the case is built around.

Positions are normalised against the cork rather than stored in pixels, so a
board survives a resize; the cork's bounds were measured off the artwork so a
card can never be pinned to the wooden frame.

## The contradiction web

Six exhibits, six contradictions, three suspects, four witnesses, one killer.

The design rule is that **everybody lies, and only one of them killed anybody.**
The others are protecting something merely embarrassing — an argument about
wages, an illegal book under a counter, eleven private minutes and a letter.
Breaking their accounts is not wasted effort: each one removes a candidate and,
in two cases, hands over the exhibit that breaks the killer.

Witnesses are questioned but never accused, and they are written differently
from the suspects. A suspect's interview is built around an account that cannot
survive the evidence. A witness is honest, so what they hold back is detail
rather than guilt, and presenting an exhibit opens a better answer instead of
breaking a story. The same press mechanic carries both: a press with no
contradiction attached simply unlocks more.

Between them the four fix the shape of the night — when the victim left the
desk, when voices were heard on the stairs, when the door went — so the timeline
can be assembled from testimony as well as from objects. Testimony also feeds
back: question the porter before the doctor and the accusation about the dark
staircase is specific and quoted rather than general.

The killer's three contradictions are load-bearing and build on each other:

| Claim | Broken by | What it means |
| --- | --- | --- |
| Death occurred at 2:14 | the stopped watch | twenty-seven minutes are missing |
| He saw the blood plainly | the unscrewed stairwell bulb | he described a scene he could not see |
| He slept until the commotion | the switchboard log | he was awake and telephoning |

The player can accuse at any time. The verdict scores what they could actually
prove, so naming the right person on a hunch is possible and visibly thinner
than naming them on evidence.

## Art direction

Hard-boiled: near-black rooms, a single warm key light standing in for a desk
lamp, cold teal filling the shadows it cannot reach. Red appears only for
contradiction and accusation, so it keeps its force.

Source art arrives in every colour temperature there is, so the stage grades it
towards near-monochrome before compositing — that is what makes a red-lit
corridor and a grey office read as the same night. Over the top: slatted blind
shadow, a vignette, and film grain from a self-contained SVG filter. No image
files, no requests, no web fonts.

Motion is deliberate and slightly heavy. Figures scale up into the light rather
than sliding; text arrives at a measured typewriter pace. All of it is
decorative — `prefers-reduced-motion` reduces every duration to zero and the
game stays fully playable.

## Constraints held throughout

* **No build step, no dependencies, no network.** ES modules served as files.
* **Nothing is ever a broken image.** Art resolution falls back through `.png`,
  `.svg`, a neighbouring mood, and finally a placeholder drawn at runtime.
* **No English string reaches the DOM directly.** Everything passes through
  `t(key, english)`, so a translation is a file rather than a rewrite, and
  right-to-left layout is a document attribute rather than a second stylesheet.
* **Scripts are data.** A new interview is a list of plain objects. The engine
  knows nothing about the case and the case knows nothing about the DOM.
* **The data is checked.** `tools/check_scenes.mjs` walks every script for dead
  jumps, unobtainable exhibits and unprovable contradictions, because those fail
  in front of a player rather than at load time.

## Testing

Two layers, because they fail differently.

`tools/check_project.py` checks that the build is *coherent* — dead jumps,
exhibits nobody can obtain, contradictions no press can prove, characters who
speak before walking on. Those are authoring mistakes, and they are cheap to
catch before they reach a browser.

`tools/playtest.mjs` checks that it is *playable*, by driving a real browser
from the title screen to a verdict and through the wall's own interactions. The
bugs that actually reached the screen were all of this kind: a lost import that
blanked a screen, a tray that collapsed to one column, cards hanging off the
cork on a narrow display, a scene of the crime a player could strand themselves
in. Static checks would not have found any of them.

## Accessibility

Keyboard throughout: space and enter advance, choices are real buttons in tab
order, escape closes the log. The wall never requires a drag — every tray item
has a pin button, and a focused card takes arrow keys to move, `L` to start a
string and `Delete` to come down. Dialogue is announced through a polite live
region. Colour is never the only signal — a broken account is labelled as well
as tinted. Type scales with the viewport and the layout holds at phone width.

## What is deliberately not here

No combat, no timers, no reflex checks, no inventory puzzle. The player's only
verb is attention.
