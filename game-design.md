# Case Board — Game Design Document

## Purpose and scope

**Case Board** is a short, browser-based investigative narrative game intended as a
demonstration of how AI-assisted development can help take a concept through design,
implementation, review, and iteration. It is deliberately fictional and should not be
treated as police training, investigative guidance, or a representation of real cases.

The playable scope is two self-contained cases, each designed for a short demonstration:

1. **The Necklace at the Muscat Grand** — a hotel theft investigation.
2. **Silence at Villa Al-Nawras** — a fictional homicide investigation.

The player is not asked to make reflexive choices or engage in combat. Progress comes
from examining information, testing accounts against evidence, and forming a justified
accusation.

## Core player experience

The player works on a cork-board case file. They open character and evidence cards,
inspect a scene, question people, make notes, and draw coloured strings between related
cards. The interface makes the player’s reasoning visible without requiring them to
solve a rigid drag-and-drop puzzle.

### Gameplay loop

1. **Orient:** read the briefing and choose a case.
2. **Search:** inspect numbered points in the scene to reveal physical evidence.
3. **Question:** interview suspects and witnesses; new questions unlock when relevant
   information is found.
4. **Test:** compare available fingerprints against evidence and use testimony to
   challenge inconsistencies.
5. **Organize:** pin evidence, notes, and connections on the board and optionally place
   cards along the timeline.
6. **Conclude:** accuse a suspect and receive a transparent explanation and score.

## Systems

### Evidence and clue system

Evidence is represented by individual cards with a title, compact illustration, and
description. Scene hotspots reveal selected evidence cards. Some cards are available at
the start, while others are unlocked only after a scene search. Key exhibits support the
final explanation but the interface permits exploratory reading.

### Suspects and interviews

Each case has three suspects and three witnesses. Interview topics include ordinary
questions, clue-bearing questions, contradictions, and clearance information. A topic
can require a previously discovered exhibit, a scene observation, or another answer.
This ensures deductions arise from information the player has actually encountered.

### Deduction and case strength

Case strength is a progress indicator based on a small set of case-specific pillars:
evidence, interview answers, and comparisons that support a defensible conclusion. It
is not a claim of real-world evidentiary sufficiency; it exists to give players clear
feedback in a fictional game.

Players can connect any two board cards with coloured string, make free-form notes, and
use the timeline area to arrange the evening’s events. These actions support sensemaking
rather than mechanically gate the story.

### Scene search and comparison

The scene is a 2D illustrated room with numbered, clickable hotspots. Inspecting a
hotspot records the observation and may reveal evidence. Some character cards offer a
fingerprint record; players can run a comparison against compatible print evidence.

### Accusation and resolution

The accusation flow asks for a suspect and selected supporting exhibits. The verdict
explains why the selected person is or is not supported by the fictional case record,
then breaks the score down by evidence, scene coverage, contradictions, clearances, and
hints used. Incorrect accusations are educational feedback, not a fail state that locks
the player out of the case.

## Story structure

Each case is a compact three-act investigation:

1. **Initial ambiguity:** several people have plausible access, motive, or suspicious
   details.
2. **Narrowing:** scene evidence and interviews disprove alibis or distinguish a lead
   from a red herring.
3. **Convergence:** physical evidence, opportunity, and motive point to one fictional
   suspect; the verdict explains the connection.

Future cases should keep this shape, use fictional people and places, avoid graphic
content, and provide at least two meaningful ways to clear innocent suspects.

## Visual and audio direction

The visual language is original: muted paper, cork, ink, navy, oxblood, green, and brass
colours; strong silhouettes; inline SVG portraits and evidence illustrations; sparse
motion; and a tactile case-file presentation. It may evoke a minimalist,
information-first occult-noir mood, but it must not copy artwork, characters, layouts,
or assets from other games.

No audio is currently included. If added, it should be subtle, optional, and include a
visible mute control. Avoid sudden sounds, graphic effects, or realistic emergency audio.

## UI and accessibility

The game supports English and Arabic, including right-to-left rendering. Core controls
include zoom, fit-to-board, full-screen mode, stringing, notes, hints, case selection,
and reset. Keyboard users can use `Escape` to close open panels and `+`, `-`, or `0` to
adjust or fit the board view.

Future improvements should prioritize visible focus states, complete keyboard operation
for card interactions, reduced-motion support, descriptive accessible names for icon
buttons, and testing with narrow mobile viewports.

## Technical direction

The project is a dependency-free static web application: one HTML file containing the
markup, CSS, SVG art, game data, and JavaScript. This keeps it easy to run in a browser,
easy to share as a demonstration, and simple for Codex to inspect and improve. New work
should preserve that portability unless a clear benefit justifies introducing a build
tool or framework.
