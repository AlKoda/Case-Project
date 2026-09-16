# The Bellweather — design notes

## What it is

A single-sitting interview mystery, played as a visual novel. One hotel, one
night, four people who were somewhere else. The player questions each of them,
collects physical evidence, and breaks the one account that cannot survive
contact with it.

It is a demonstration piece: the point is to show a concept carried through
design, writing, implementation and iteration. The case is fiction and is not a
representation of real investigative procedure.

## The player's night

1. **The stairs.** Search the scene. Four exhibits are there for anyone who
   looks; none of them mean anything yet.
2. **The statements.** Question four people in any order. Each gives an account.
   Each account contains at least one thing that is not true.
3. **The press.** When a claim is wrong, put an exhibit on the table. A hit
   breaks the account and opens what the subject was protecting. A miss costs a
   beat, and the subject enjoys it.
4. **The name.** Accuse somebody. The verdict explains itself either way.

There is no fail state and no timer. A wrong accusation is a scene, not a game
over, and the file can be reopened.

## Why interviews

Every scene is one person, one chair and one room. That is a deliberate
constraint and it pays for itself three ways:

* **Art.** Four portraits and one background carry the whole middle of the game.
  A project that has to look finished before it is finished should spend its art
  budget where the player is looking.
* **Writing.** The mystery is carried entirely by what people say and refuse to
  say, so the prose is doing the work the mechanics would otherwise have to.
* **Feel.** The pop-out figure and the speech box that frames the speaker in its
  corner put the player across a table from somebody. That framing is the game.

## The contradiction web

Six exhibits, six contradictions, four suspects, one killer.

The design rule is that **everybody lies, and only one of them killed anybody.**
Three of the four are protecting something that is merely embarrassing — an
argument about wages, an illegal book behind a bar, eleven private minutes and a
letter. Breaking their accounts is not wasted effort: each one removes a
candidate and, in two cases, hands over the exhibit that breaks the killer.

The killer's three contradictions are load-bearing and build on each other:

| Claim | Broken by | What it means |
| --- | --- | --- |
| Death occurred at 2:14 | the stopped pocket watch | twenty-seven minutes are missing |
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

## Accessibility

Keyboard throughout: space and enter advance, choices are real buttons in tab
order, escape closes the log. Dialogue is announced through a polite live
region. Colour is never the only signal — a broken account is labelled as well
as tinted. Type scales with the viewport and the layout holds at phone width.

## What is deliberately not here

No combat, no timers, no reflex checks, no inventory puzzle. The player's only
verb is attention.
