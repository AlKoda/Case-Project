/**
 * Case file 47-B: the Al-Manar.
 *
 * Everything factual about the case lives here -- who is in it, what can be
 * held in an evidence bag, and which claims can be broken. The dialogue that
 * hangs off these facts is in `scenes.js`.
 *
 * The case is fiction. The hotel, its staff and the investigation are invented;
 * this is a mystery, not a manual.
 */

export const CASE = {
  id: "al-manar",
  title: "Al-Manar",
  file: "Case file 47-B",
  strapline: "One hotel. One staircase. Seven people who were somewhere else.",
  synopsis:
    "Tariq Al-Rawahi, night manager of the Al-Manar, was found at the foot of " +
    "the service stairs at 2:14 in the morning, in the middle of a storm that " +
    "had taken half the harbour's lights with it. The house doctor called it a " +
    "fall. The house doctor is not a doctor any more.",
};

/**
 * The cast.
 *
 * `accent` tints that person's frame in the speech box, so the player learns
 * who is talking before they read the name. `noPortrait` is for people with no
 * stage art -- the detective, whose eyes we are behind, and the victim, who is
 * past speaking.
 */
export const CAST = {
  harthy: {
    name: "Det. Sgt. Al-Harthy",
    role: "Nightwatch, Muttrah station",
    accent: "#7fa8ae",
    noPortrait: true,
  },
  lawati: {
    name: "Iman Al-Lawati",
    role: "Runs the banquet floor",
    accent: "#c96f9e",
  },
  zadjali: {
    name: "Sulaiman Al-Zadjali",
    role: "Night steward. Keeps a book on the side",
    accent: "#d9635a",
  },
  sharif: {
    name: "Dr. Ayman Sharif",
    role: "Room 312. Physician, once",
    accent: "#e8b04b",
  },
  hinai: {
    name: "Badriya Al-Hinai",
    role: "Switchboard, midnight to eight",
    accent: "#8fb08a",
  },
  kindi: {
    name: "Majid Al-Kindi",
    role: "Night porter",
    accent: "#b98b5e",
  },
  busaidi: {
    name: "Noor Al-Busaidi",
    role: "Guest, room 214",
    accent: "#9a86c4",
  },
  maskari: {
    name: "Faisal Al-Maskari",
    role: "Front desk, the late shift",
    accent: "#6fa3c9",
  },
  rawahi: {
    name: "Tariq Al-Rawahi",
    role: "Night manager. Deceased",
    accent: "#9a958b",
    noPortrait: true,
  },
};

/**
 * Exhibits. `name` and `summary` are what the player reads; `note` is the
 * detail that only matters once they know what they are looking at. `time` is
 * the moment the exhibit fixes, where it fixes one -- the board's timeline
 * shows it on the card so the player can place it.
 */
export const EXHIBITS = {
  "fingerprint-stairs": {
    name: "Stairwell fingerprint · Type A",
    summary: "A clear Type A print lifted from the bulb's wire cage.",
    note:
      "The print was left where somebody had to reach to loosen the stairwell bulb. " +
      "Compare its alphabetical ridge type with a suspect's taken print.",
    fingerprint: "A",
  },
  "fingerprint-lawati": {
    name: "Al-Lawati fingerprint · Type C",
    summary: "Comparison print: Type C. No match.",
    note: "Iman Al-Lawati's taken print is Type C. It does not match the Type A print from the stairwell.",
    fingerprint: "C",
    person: "lawati",
  },
  "fingerprint-zadjali": {
    name: "Al-Zadjali fingerprint · Type B",
    summary: "Comparison print: Type B. No match.",
    note: "Sulaiman Al-Zadjali's taken print is Type B. It does not match the Type A print from the stairwell.",
    fingerprint: "B",
    person: "zadjali",
  },
  "fingerprint-sharif": {
    name: "Sharif fingerprint · Type A",
    summary: "Comparison print: Type A. MATCH.",
    note:
      "Ayman Sharif's taken print is Type A: the same alphabetical ridge type as the print lifted from " +
      "the stairwell bulb cage. The match places his hand at the sabotaged light.",
    fingerprint: "A",
    person: "sharif",
    matches: "fingerprint-stairs",
  },
  "pocket-watch": {
    name: "Tariq's watch",
    summary: "Stopped at 1:47.",
    time: "01:47",
    note:
      "Glass starred, spring arrested. Watches stop when they are struck, and " +
      "this one was struck at 1:47. Sharif pronounced death at 2:14.",
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
    time: "01:52",
    note:
      "Badriya Al-Hinai's hand, in pencil, in a ruled book she keeps without " +
      "being asked. Room 312 is Sharif. He says he slept until the commotion.",
  },
  ledger: {
    name: "Al-Zadjali's book",
    summary: "Tariq's debt marked settled, in fresh ink.",
    time: "01:20",
    note:
      "Four hundred rials, carried since the spring, cleared at twenty past one " +
      "in the morning. Tariq had nothing on Tuesday. On Wednesday he had all of it.",
  },
  "shawl-bead": {
    name: "Bead from an embroidered shawl",
    summary: "Caught on the stair rail, third step.",
    time: "01:30",
    note:
      "Iman Al-Lawati wears the only shawl in the building that sheds these. It " +
      "proves she was on those stairs. It does not say when.",
  },
  umbrella: {
    name: "Wet umbrella",
    summary: "In the lobby cupboard, still running.",
    time: "02:00",
    note:
      "Somebody went out into the storm and came back. Staff are not supposed to " +
      "leave the floor between midnight and six.",
  },
};

/**
 * Contradictions the player can prove. Proving all three of Sharif's is what
 * turns an accusation into a case.
 */
export const CONTRADICTIONS = {
  "sharif-saw-blood": {
    subject: "sharif",
    claim: "He saw the blood plainly when he found the body.",
    breaks: "stair-bulb",
    verdict:
      "The stairwell bulb had been unscrewed. That staircase was black. Sharif " +
      "described a scene he could not have seen -- unless he already knew what " +
      "was on those stairs.",
    weight: 2,
  },
  "sharif-slept-through": {
    subject: "sharif",
    claim: "He slept until the commotion woke him at 2:14.",
    breaks: "switchboard-log",
    verdict:
      "Room 312 placed an outside call at 1:52, five minutes after the watch " +
      "stopped. Sharif was awake, and he was telephoning somebody.",
    weight: 2,
  },
  "sharif-time-of-death": {
    subject: "sharif",
    claim: "Death occurred at 2:14, when he found the body.",
    breaks: "pocket-watch",
    verdict:
      "The watch arrested at 1:47. Sharif put twenty-seven minutes between the " +
      "fall and the death, and spent them establishing where he was.",
    weight: 3,
  },
  "zadjali-paid": {
    subject: "zadjali",
    claim: "Tariq never paid a baisa of what he owed.",
    breaks: "ledger",
    verdict:
      "Al-Zadjali's own book clears the debt at 1:20. Tariq came into four " +
      "hundred rials in the middle of a storm, hours before he died.",
    weight: 1,
  },
  "lawati-stairs": {
    subject: "lawati",
    claim: "She never went near the service stairs.",
    breaks: "shawl-bead",
    verdict:
      "A bead from her shawl was on the third step. She was there -- earlier " +
      "than the fall, angrier than she admits, but there.",
    weight: 1,
  },
  "hinai-left-the-board": {
    subject: "hinai",
    claim: "She never left the switchboard.",
    breaks: "umbrella",
    verdict:
      "The umbrella in the lobby cupboard is hers, and it was still wet. She " +
      "broke a house rule, not a man's neck.",
    weight: 1,
  },
};

/** Who the player may name. Witnesses are questioned but never accused. */
export const SUSPECTS = ["lawati", "zadjali", "sharif"];

/**
 * The four witnesses. Each contributes a statement the player can pin to the
 * board and place on the timeline; between them they fix where everybody was
 * while the stairs were dark.
 */
export const WITNESSES = [
  {
    person: "maskari",
    time: "01:40",
    headline: "Tariq left the desk at 1:40.",
    statement:
      "\"He handed me the keys and said he would be ten minutes. He said it the " +
      "way a man says it when he has somewhere better to be. He went up the back " +
      "stairs, not the front, and I have thought about that all night.\"",
  },
  {
    person: "busaidi",
    time: "01:45",
    headline: "Two men arguing on the stairs, just before two.",
    statement:
      "\"I could not sleep in that storm. Through the wall of 214 I heard two men " +
      "on the service stairs -- not shouting, worse than shouting, the quiet kind. " +
      "One of them was pleading. I could not tell you which.\"",
  },
  {
    person: "kindi",
    time: "02:12",
    headline: "A door, then the doctor already kneeling.",
    statement:
      "\"A door went at about ten past two, and I took the torch and ran. By the " +
      "time I got down there the doctor was already on his knees beside him, in " +
      "the pitch dark, telling me what I was looking at before I could see it.\"",
  },
  {
    person: "hinai",
    time: "02:14",
    headline: "Every call in the building, written down as it happened.",
    statement:
      "\"Nobody asks me to keep the book. I keep it because a thing written down " +
      "at the time it happens is worth more than anything anybody remembers " +
      "afterwards.\"",
  },
];

/** Spoken details the detective may actively file, rather than receiving automatically. */
export const DIALOGUE_CLUES = Object.fromEntries(
  WITNESSES.map((witness) => [witness.person, witness]),
);

export const CULPRIT = "sharif";

export const VERDICTS = {
  sharif: {
    correct: true,
    headline: "Ayman Sharif, for the killing of Tariq Al-Rawahi.",
    body:
      "Tariq found out what Sharif had been struck off for, and charged him for the " +
      "silence. Sharif paid once, on Tuesday -- four hundred rials, which went " +
      "straight across Al-Zadjali's counter to clear a debt. On Wednesday, Sharif " +
      "decided there would not be a third time. He unscrewed the stairwell bulb, met " +
      "Tariq in the dark at 1:47, and left him at the bottom of it. Then he went " +
      "upstairs, telephoned the only person who could give him an alibi, waited " +
      "until the hotel was awake, came down, and pronounced a man he had killed " +
      "twenty-seven minutes dead.",
  },
  lawati: {
    correct: false,
    headline: "Iman Al-Lawati.",
    body:
      "She was on those stairs and she lied about it, because she went down to argue " +
      "with Tariq about four weeks of short wages for her floor and did not want that " +
      "on a statement. The bead puts her there. Nothing puts her there at 1:47 -- she " +
      "was in front of a wedding party of forty people, and forty people will say so.",
  },
  zadjali: {
    correct: false,
    headline: "Sulaiman Al-Zadjali.",
    body:
      "Al-Zadjali runs a book out of a hotel counter and lied about it from the first " +
      "question, which is what a man does when he is guilty of the wrong thing. His " +
      "ledger clears Tariq's debt at 1:20. A man whose debt has just been paid has no " +
      "reason at all to put the payer down a staircase.",
  },
};
