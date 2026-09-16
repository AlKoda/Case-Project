/**
 * Case file 47-B: the Bellweather.
 *
 * Everything factual about the case lives here -- who is in it, what can be
 * held in an evidence bag, and which claims can be broken. The dialogue that
 * hangs off these facts is in `scenes.js`.
 *
 * The case is fiction. Any resemblance to real procedure is incidental; this is
 * a mystery, not a manual.
 */

export const CASE = {
  id: "bellweather",
  title: "The Bellweather",
  file: "Case file 47-B",
  strapline: "One hotel. One staircase. Four people who were somewhere else.",
  synopsis:
    "Teddy Vance, night manager of the Bellweather Hotel, was found at the foot " +
    "of the service stairs at 2:14 in the morning, in the middle of a storm that " +
    "had taken half the district's lights with it. The house doctor called it a " +
    "fall. The house doctor is not a doctor any more.",
};

/**
 * The cast. `accent` tints that person's frame in the speech box, so the player
 * learns who is talking before they read the name.
 */
export const CAST = {
  cole: {
    name: "Det. Sgt. Cole",
    role: "Nightwatch, 4th Precinct",
    accent: "#7fa8ae",
  },
  calloway: {
    name: "Iris Calloway",
    role: "Lounge singer, six nights a week",
    accent: "#c96f9e",
  },
  brennan: {
    name: "Sol Brennan",
    role: "Bartender. Keeps a book on the side",
    accent: "#d9635a",
  },
  finch: {
    name: "Dr. Ambrose Finch",
    role: "Room 312. Physician, once",
    accent: "#e8b04b",
  },
  roy: {
    name: "Delphine Roy",
    role: "Switchboard, midnight to eight",
    accent: "#8fb08a",
  },
  vance: {
    name: "Teddy Vance",
    role: "Night manager. Deceased",
    accent: "#9a958b",
  },
};

/**
 * Exhibits. `name` and `summary` are what the player reads; `note` is the
 * detail that only matters once they know what they are looking at.
 */
export const EXHIBITS = {
  "pocket-watch": {
    name: "Vance's pocket watch",
    summary: "Stopped at 1:47.",
    note:
      "Glass starred, spring arrested. Watches stop when they are struck, and " +
      "this one was struck at 1:47. Finch pronounced death at 2:14.",
  },
  "stair-bulb": {
    name: "Bulb from the stairwell",
    summary: "Unscrewed. Not blown.",
    note:
      "Filament intact, threads clean, not a mark of heat on it. Somebody turned " +
      "it a half-turn in its socket. In a blackout nobody would think twice about " +
      "a dark staircase.",
  },
  "switchboard-log": {
    name: "Switchboard log",
    summary: "Room 312 placed an outside call at 1:52.",
    note:
      "Delphine Roy's hand, in pencil, in a ruled book she keeps without being " +
      "asked. Room 312 is Finch. He says he slept until the commotion at 2:14.",
  },
  ledger: {
    name: "Brennan's book",
    summary: "Vance's debt marked PAID, in fresh ink.",
    note:
      "Eleven hundred, carried since August, cleared at twenty past one in the " +
      "morning. Vance had no money on Tuesday. On Wednesday he had all of it.",
  },
  sequin: {
    name: "Sequin from a stage dress",
    summary: "Caught on the stair rail, third step.",
    note:
      "Iris Calloway wears the only dress in the building that sheds these. It " +
      "proves she was on those stairs. It does not say when.",
  },
  umbrella: {
    name: "Wet umbrella",
    summary: "In the lobby closet, still running.",
    note:
      "Somebody went out into the storm and came back. Staff are not supposed to " +
      "leave the floor between midnight and six.",
  },
};

/**
 * Contradictions the player can prove. Proving all three of Finch's is what
 * turns an accusation into a case.
 */
export const CONTRADICTIONS = {
  "finch-saw-blood": {
    subject: "finch",
    claim: "He saw the blood plainly when he found the body.",
    breaks: "stair-bulb",
    verdict:
      "The stairwell bulb had been unscrewed. That staircase was black. Finch " +
      "described a scene he could not have seen -- unless he already knew what " +
      "was on those stairs.",
    weight: 2,
  },
  "finch-slept-through": {
    subject: "finch",
    claim: "He slept until the commotion woke him at 2:14.",
    breaks: "switchboard-log",
    verdict:
      "Room 312 placed an outside call at 1:52, five minutes after the watch " +
      "stopped. Finch was awake, and he was telephoning somebody.",
    weight: 2,
  },
  "finch-time-of-death": {
    subject: "finch",
    claim: "Death occurred at 2:14, when he found the body.",
    breaks: "pocket-watch",
    verdict:
      "The watch arrested at 1:47. Finch put twenty-seven minutes between the " +
      "fall and the death, and spent them establishing where he was.",
    weight: 3,
  },
  "brennan-paid": {
    subject: "brennan",
    claim: "Vance never paid a penny of what he owed.",
    breaks: "ledger",
    verdict:
      "Brennan's own book clears the debt at 1:20. Vance came into eleven hundred " +
      "in the middle of a storm, hours before he died.",
    weight: 1,
  },
  "calloway-stairs": {
    subject: "calloway",
    claim: "She never went near the service stairs.",
    breaks: "sequin",
    verdict:
      "A sequin from her dress was on the third step. She was there -- earlier " +
      "than the fall, angrier than she admits, but there.",
    weight: 1,
  },
  "roy-left-the-floor": {
    subject: "roy",
    claim: "She never left the switchboard.",
    breaks: "umbrella",
    verdict:
      "The umbrella in the lobby closet is hers, and it was still wet. She broke " +
      "a house rule, not a man's neck.",
    weight: 1,
  },
};

/** Who the player may name, and what happens when they do. */
export const SUSPECTS = ["calloway", "brennan", "finch", "roy"];

export const CULPRIT = "finch";

export const VERDICTS = {
  finch: {
    correct: true,
    headline: "Ambrose Finch, for the killing of Teddy Vance.",
    body:
      "Vance found out what Finch had been struck off for, and charged him for the " +
      "silence. Finch paid once, on Tuesday -- eleven hundred, which went straight " +
      "across Brennan's bar to clear a debt. On Wednesday, Finch decided there would " +
      "not be a third time. He unscrewed the stairwell bulb, met Vance in the dark at " +
      "1:47, and left him at the bottom of it. Then he went upstairs, telephoned the " +
      "only person who could give him an alibi, waited until the hotel was awake, came " +
      "down, and pronounced a man he had killed twenty-seven minutes dead.",
  },
  calloway: {
    correct: false,
    headline: "Iris Calloway.",
    body:
      "She was on those stairs and she lied about it, because she went down to shout " +
      "at Vance about four weeks of short pay and did not want that on a statement. " +
      "The sequin puts her there. Nothing puts her there at 1:47 -- she was under the " +
      "lights in front of forty people, and forty people will say so.",
  },
  brennan: {
    correct: false,
    headline: "Sol Brennan.",
    body:
      "Brennan runs a book out of a hotel bar and lied about it from the first " +
      "question, which is what a man does when he is guilty of the wrong crime. His " +
      "ledger clears Vance's debt at 1:20. A bookmaker whose debt is paid has no " +
      "reason at all to put the payer down a staircase.",
  },
  roy: {
    correct: false,
    headline: "Delphine Roy.",
    body:
      "She left her switchboard for eleven minutes to post a letter she did not want " +
      "anybody reading over her shoulder, and she would rather be suspected of murder " +
      "than explain it. Her log is the most honest document in the building. It is " +
      "also the thing that hangs Finch.",
  },
};
