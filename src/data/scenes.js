/**
 * The script.
 *
 * Every scene is data: a list of nodes the player interprets in order. The
 * grammar is documented at the top of `engine/vn.js`. Nothing here touches the
 * DOM, which is why a scene can be read as what it is -- a screenplay.
 *
 * A note on the interviews. Each one is built the same way: the subject gives
 * an account, the account contains one thing that cannot be true, and the
 * player either finds the exhibit that breaks it or does not. Being wrong costs
 * a beat and the subject gets to enjoy it. Nobody's story collapses on the
 * first push.
 */

export const SCENES = {
  /* ------------------------------------------------------------------ */
  intro: {
    id: "intro",
    background: "rain-street",
    backgroundName: "Outside the Al-Manar",
    clock: "03:41",
    script: [
      { text: "Rain off the Gulf since Sunday. The kind that finds the seams of a coat and settles in for the week." },
      { text: "The Al-Manar keeps a lamp burning over its door out of habit. Tonight the lamp is out, along with every other light between here and the harbour." },
      { text: "A man went down the service stairs at some point in the small hours and did not get up. The house doctor called it a fall and wrote a time on a form." },
      { text: "Nightwatch sends you because nightwatch sends whoever is awake." },

      { bg: "precinct-desk", bgName: "Muttrah station, night desk" },
      { clock: "03:52" },
      { text: "The file is four pages and three of them are the hotel's letterhead." },
      { who: "harthy", text: "Tariq Al-Rawahi. Night manager. Forty-four years old, and until Wednesday, nothing in this building's ledger worth writing down." },
      { who: "harthy", text: "Found at the foot of the service stairs at two-fourteen. Pronounced at the scene by a resident of room three-twelve." },
      { who: "harthy", mood: "cold", text: "A resident who signs himself doctor, and who the medical board stopped calling one eleven years ago." },
      { text: "Seven people were in the building and awake. All seven were somewhere else. Somewhere else is a small hotel on a dead-quiet Wednesday." },
      { who: "harthy", text: "Start with the stairs. The stairs don't have an alibi." },
      { end: true },
    ],
  },

  /* ------------------------------------------------------------------ */
  "scene:stairs": {
    id: "scene:stairs",
    background: "hotel-stairs",
    backgroundName: "Service stairs, the Al-Manar",
    clock: "04:10",
    script: [
      { text: "The service stairs run four floors down the back of the hotel, and every one of them smells of wet plaster and old cooking." },
      { text: "Tariq is at the bottom, under a sheet the porters found somewhere. The stairs above him are dark. The stairs above them are dark too." },

      { label: "look" },
      {
        choice: [
          { text: "Go through his pockets.", goto: "watch", when: (s) => !s.exhibits.includes("pocket-watch") },
          { text: "Find out why it's so dark in here.", goto: "bulb", when: (s) => !s.exhibits.includes("stair-bulb") },
          { text: "Run a hand along the stair rail.", goto: "bead", when: (s) => !s.exhibits.includes("shawl-bead") },
          { text: "Look in the lobby cupboard.", goto: "umbrella", when: (s) => !s.exhibits.includes("umbrella") },
          { text: "Enough. Go and talk to the living.", goto: "done" },
        ],
      },

      { label: "watch" },
      { text: "Keys. Nine rials. A folded card for a florist on the corniche. And a pocket watch, the good kind, the kind a man buys himself when nobody else will." },
      { text: "The glass is starred. The hands have stopped." },
      { who: "harthy", mood: "cold", text: "One forty-seven." },
      { text: "Sharif wrote two-fourteen on the form. A watch is a stupid, honest little machine. It stops when it is struck and it does not revise." },
      { give: "pocket-watch" },
      { goto: "look" },

      { label: "bulb" },
      { text: "The stairwell fixture is at the first landing, a bare bulb in a wire cage. You get a chair from the corridor and take it down." },
      { text: "Cold. Filament whole. Not a mark of heat anywhere on the glass." },
      { who: "harthy", text: "It didn't blow. Somebody gave it a half-turn." },
      { text: "In a blackout, a dark staircase is the least remarkable thing in the city. That is exactly what makes it worth doing." },
      { give: "stair-bulb" },
      { goto: "look" },

      { label: "bead" },
      { text: "Third step from the bottom, where the rail meets the newel post, something catches the torch and throws it back." },
      { text: "A bead. Bottle-green glass, drilled through, the sort that is stitched on by the hundred and lost by the dozen." },
      { who: "harthy", text: "One shawl in this building sheds these, and it was on the banquet floor all night." },
      { text: "It proves somebody stood here. It says nothing whatever about when." },
      { give: "shawl-bead" },
      { goto: "look" },

      { label: "umbrella" },
      { text: "The lobby cupboard holds nine coats, a floor polisher and a black umbrella, hooked over the rail." },
      { text: "You put a hand to it. It is still running onto the tile." },
      { who: "harthy", text: "Somebody went out in that. Went out, and came back, and hung it up tidy." },
      { give: "umbrella" },
      { goto: "look" },

      { label: "done" },
      { text: "Four floors of stairs and one honest witness, and the honest one is a watch." },
      { end: true },
    ],
  },

  /* ------------------------------------------------------------------ */
  "interview:lawati": {
    id: "interview:lawati",
    background: "interview-room",
    backgroundName: "The banquet floor, after hours",
    clock: "05:05",
    script: [
      { text: "They give you the banquet floor to work in. The chairs are still stacked and the flowers from the wedding are already going over." },
      { enter: "lawati", at: "center", mood: "neutral" },
      { who: "lawati", mood: "neutral", text: "You want the version with the crying, or the version that's true? I can do either. I've been doing the first one all night for the day manager." },
      { who: "harthy", text: "The true one. I'll tell you if I need the other." },
      { who: "lawati", mood: "neutral", text: "Then sit down. You're making the room feel like a police station." },

      { label: "ask" },
      {
        choice: [
          { text: "Where were you between one and two?", goto: "where", when: (s) => !s.flags.lawatiWhere },
          { text: "What was Tariq to you?", goto: "tariq", when: (s) => !s.flags.lawatiTariq },
          { text: "Who else was awake?", goto: "who", when: (s) => !s.flags.lawatiWho },
          { text: "Did you go near the service stairs?", goto: "stairs", when: (s) => s.flags.lawatiWhere },
          { text: "That'll do for now.", goto: "done" },
        ],
      },

      { label: "where" },
      { flag: "lawatiWhere" },
      { who: "lawati", mood: "neutral", text: "On the banquet floor. The Al-Harthi wedding went until two and then went on going, the way they do when nobody wants to drive home in that rain." },
      { who: "lawati", mood: "neutral", text: "Forty people watched me run it. When the lights went I had the candles out of the store cupboard before the band had finished the bar. You can serve in the dark. It is the only improvement the blackout made." },
      { who: "harthy", text: "The whole two hours." },
      { who: "lawati", mood: "evasive", text: "The whole two hours." },
      { text: "Her hand goes to the back of her neck, and stays there a beat too long." },
      { goto: "ask" },

      { label: "tariq" },
      { flag: "lawatiTariq" },
      { who: "lawati", mood: "neutral", text: "Tariq Al-Rawahi was the man who signed the wages and the man who explained why they were late. Same man. He was very good at the second job." },
      { who: "lawati", mood: "cold", text: "Four weeks my floor had been short. Not short like a mistake. Short like a policy." },
      { who: "harthy", text: "You argue about it?" },
      { who: "lawati", mood: "evasive", text: "I mentioned it. You mention a thing enough times and it stops being an argument and starts being the weather." },
      { goto: "ask" },

      { label: "who" },
      { flag: "lawatiWho" },
      { who: "lawati", mood: "neutral", text: "Sulaiman on the night counter, taking bets he thinks nobody has noticed in eleven years. Badriya on the board, with her book and her pencil. Faisal on the desk, half asleep." },
      { who: "lawati", mood: "cold", text: "And the doctor. Sitting where he always sits, at the end of the counter, making one cup of coffee last until closing so nobody can say he is loitering." },
      { who: "harthy", text: "Sharif was downstairs. You're sure." },
      { who: "lawati", mood: "neutral", text: "From two o'clock, certainly. He made a point of it. Asked me whether the band would play something for him and made a business of asking, the way you do when you want the room to notice you're in it." },
      { who: "harthy", mood: "cold", text: "From two o'clock." },
      { who: "lawati", mood: "neutral", text: "That's what I said." },
      { goto: "ask" },

      { label: "stairs" },
      { who: "harthy", text: "Did you go near the service stairs tonight?" },
      { who: "lawati", mood: "cold", text: "No." },
      { text: "Flat. Immediate. No pause to remember, which is the thing people forget to fake." },
      {
        press: {
          claim: "I never went near the service stairs tonight.",
          accepts: "shawl-bead",
          prove: "lawati-stairs",
          hit: "caught",
          miss: "wrong",
          stand: "stand",
        },
      },

      { label: "wrong" },
      { who: "lawati", mood: "cold", text: "That's a thing, all right. It isn't a thing about me." },
      { text: "You put it back in the file. She watches you do it, and something in her shoulders comes down an inch." },
      { goto: "ask" },

      { label: "stand" },
      { who: "lawati", mood: "neutral", text: "Then we're finished, and I can go and be upset somewhere with better chairs." },
      { goto: "ask" },

      { label: "caught" },
      { text: "You set the bead on the table between you. Bottle-green. It sits there and does all the talking." },
      { who: "lawati", mood: "cold", text: "…" },
      { who: "lawati", mood: "broken", text: "Half past one. Between the speeches and the cake. I went down to tell him that if Friday was short as well, my whole floor would be working at the Intercontinental and he could explain the empty room to the owners himself." },
      { who: "harthy", text: "And?" },
      { who: "lawati", mood: "broken", text: "And he laughed at me. In the dark, on the stairs, he laughed at me, and I went back up and cut a wedding cake with my face on." },
      { who: "lawati", mood: "cold", text: "I didn't touch him. I wanted to. There's a difference and I've had four hours to think about how much of one." },
      { who: "harthy", mood: "cold", text: "The stairwell was dark at half past one." },
      { who: "lawati", mood: "neutral", text: "Pitch. I went down it by the rail. That's how your little green thing got where it got." },
      { text: "Dark at one-thirty. Which means the bulb was already turned before Tariq ever went down there." },
      { flag: "darkBeforeTheFall" },
      { goto: "ask" },

      { label: "done" },
      { who: "lawati", mood: "neutral", text: "Detective. When you find out it was somebody, come and tell me. I'd like to know which face I've been serving coffee to." },
      { exit: "lawati" },
      { end: true },
    ],
  },

  /* ------------------------------------------------------------------ */
  "interview:zadjali": {
    id: "interview:zadjali",
    background: "interview-room",
    backgroundName: "The night counter",
    clock: "05:40",
    script: [
      { enter: "zadjali", at: "center", mood: "neutral" },
      { who: "zadjali", mood: "neutral", text: "Before you start — I want it on record I've cooperated. I've been cooperating since three in the morning. I'm nearly out of cooperation." },
      { who: "harthy", text: "Then spend what's left carefully." },

      { label: "ask" },
      {
        choice: [
          { text: "Where were you at one forty-seven?", goto: "where", when: (s) => !s.flags.zadjaliWhere },
          { text: "You keep a book behind that counter.", goto: "book", when: (s) => !s.flags.zadjaliBook },
          { text: "Did Tariq owe anybody?", goto: "owe", when: (s) => s.flags.zadjaliBook && !s.flags.zadjaliOwe },
          { text: "Let's talk about what Tariq owed you.", goto: "debt", when: (s) => s.flags.zadjaliOwe },
          { text: "That's all.", goto: "done" },
        ],
      },

      { label: "where" },
      { flag: "zadjaliWhere" },
      { who: "zadjali", mood: "neutral", text: "Behind the counter. Where I am every night from six until the last of them gives up and goes to bed." },
      { who: "zadjali", mood: "neutral", text: "When the lights went I got the lamps out of the box under the register, and then I stood there like a shrine until two." },
      { who: "harthy", text: "Anyone stood there with you?" },
      { who: "zadjali", mood: "neutral", text: "The doctor. End of the counter, same stool, same cup. He has been nursing that cup since the year before last." },
      { who: "harthy", text: "The whole time?" },
      { who: "zadjali", mood: "evasive", text: "He was there at two. I'll swear to two. Before that it was black as a well in there and I was counting change by feel." },
      { goto: "ask" },

      { label: "book" },
      { flag: "zadjaliBook" },
      { who: "zadjali", mood: "cold", text: "I don't know what you mean." },
      { who: "harthy", text: "Eleven years, Mrs Al-Lawati says. She thinks you think nobody has noticed." },
      { who: "zadjali", mood: "cold", text: "Iman Al-Lawati should worry about her own arrangements." },
      { text: "He works a cloth through his hands like he is wringing out a decision." },
      { who: "zadjali", mood: "evasive", text: "All right. I take a little action. Boat races, mostly. Nothing that hurts anyone and nothing that isn't paid." },
      { who: "harthy", text: "Then you keep a book. Fetch it." },
      { who: "zadjali", mood: "cold", text: "It's my living in that book. Nine years of it." },
      { who: "harthy", mood: "cold", text: "And a man died on your stairs. Fetch the book, Mr Al-Zadjali." },
      { text: "He takes it from a shelf under the register, where it has clearly lived for nine years, and sets it down like something with a pulse." },
      { give: "ledger" },
      { goto: "ask" },

      { label: "owe" },
      { flag: "zadjaliOwe" },
      { who: "harthy", text: "Did Tariq owe anybody in this building?" },
      { who: "zadjali", mood: "neutral", text: "Tariq Al-Rawahi owed everybody in this building. That was his hobby." },
      { who: "harthy", text: "Did he owe you?" },
      { who: "zadjali", mood: "cold", text: "Tariq Al-Rawahi never paid me a baisa of what he owed. Not one. You can write that down and I'll sign underneath it." },
      { goto: "ask" },

      { label: "debt" },
      { who: "harthy", text: "Not a baisa." },
      { who: "zadjali", mood: "cold", text: "Not a baisa." },
      {
        press: {
          claim: "Tariq never paid me a baisa of what he owed.",
          accepts: "ledger",
          prove: "zadjali-paid",
          hit: "caught",
          miss: "wrong",
          stand: "stand",
        },
      },

      { label: "wrong" },
      { who: "zadjali", mood: "neutral", text: "And what's that got to do with my counter?" },
      { text: "Nothing, is the answer, and he can see you know it." },
      { goto: "ask" },

      { label: "stand" },
      { who: "zadjali", mood: "neutral", text: "Good. Then I'll get back to my floor." },
      { goto: "ask" },

      { label: "caught" },
      { text: "You open his own book on the table, at his own column, in his own hand." },
      { who: "harthy", mood: "cold", text: "Four hundred rials. Carried since the spring. Cleared at one twenty this morning, and the ink is still deciding whether it's dry." },
      { who: "zadjali", mood: "broken", text: "…All right. All right." },
      { who: "zadjali", mood: "broken", text: "He came to the counter at twenty past one with four hundred rials in an envelope and he was shaking. Not frightened shaking. The other kind. Pleased with himself." },
      { who: "harthy", text: "Where does a night manager get four hundred rials on a Wednesday?" },
      { who: "zadjali", mood: "cold", text: "I asked him that. He said, and I'm giving you his words — 'a man's reputation is worth more than he thinks, and a great deal less than he'll pay.'" },
      { who: "zadjali", mood: "cold", text: "Then he laughed and went off up the back stairs and I never saw him again, and when they found him I marked the debt settled and said nothing, because a man in my line does not volunteer." },
      { who: "harthy", mood: "cold", text: "Somebody in this hotel bought silence on Tuesday and stopped paying on Wednesday." },
      { flag: "knowsBlackmail" },
      { goto: "ask" },

      { label: "done" },
      { who: "zadjali", mood: "neutral", text: "Detective. Whatever he was, he drank his coffee at my counter for nine years. Find the one that did it." },
      { exit: "zadjali" },
      { end: true },
    ],
  },

  /* ------------------------------------------------------------------ */
  "interview:hinai": {
    id: "interview:hinai",
    background: "interview-room",
    backgroundName: "Switchboard alcove",
    clock: "06:15",
    script: [
      { enter: "hinai", at: "center", mood: "neutral" },
      { text: "Badriya Al-Hinai sits with her hands folded on a ruled notebook, the way a woman sits who has decided in advance exactly how much she is going to say." },
      { who: "hinai", mood: "neutral", text: "I've been on this board eleven years, Detective. I've never once been asked a question by the police and I would have preferred to keep the run going." },

      { label: "ask" },
      {
        choice: [
          { text: "Walk me through your night.", goto: "night", when: (s) => !s.flags.hinaiNight },
          { text: "What's in the notebook?", goto: "book", when: (s) => !s.flags.hinaiBook },
          { text: "Did you leave the board at any point?", goto: "left", when: (s) => s.flags.hinaiNight },
          { text: "Thank you, Mrs Al-Hinai.", goto: "done" },
        ],
      },

      { label: "night" },
      { flag: "hinaiNight" },
      { who: "hinai", mood: "neutral", text: "Midnight to eight, same as every night. The board is quiet after one. People stop telephoning and start sleeping, which is what the hours are for." },
      { who: "hinai", mood: "neutral", text: "The lights went at ten past one. The board has its own battery, so I sat in the dark and worked by touch. I know where every jack is. I could do it without hands." },
      { goto: "ask" },

      { label: "book" },
      { flag: "hinaiBook" },
      { who: "hinai", mood: "neutral", text: "Every call in and every call out, with the room and the time. Nobody asks me to. The hotel would not notice if I stopped." },
      { who: "hinai", mood: "neutral", text: "I do it because a thing that is written down at the time it happens is worth more than anything anybody remembers afterwards." },
      { who: "harthy", text: "Mrs Al-Hinai, that may be the most useful sentence anyone has said to me tonight." },
      { give: "switchboard-log" },
      { text: "She slides the notebook across without being asked, and turns it the right way round for you first." },
      { goto: "ask" },

      { label: "left" },
      { who: "harthy", text: "Did you leave the board at any point?" },
      { who: "hinai", mood: "neutral", text: "No." },
      { text: "The folded hands tighten by a degree." },
      {
        press: {
          claim: "I never left the switchboard.",
          accepts: "umbrella",
          prove: "hinai-left-the-board",
          hit: "caught",
          miss: "wrong",
          stand: "stand",
        },
      },

      { label: "wrong" },
      { who: "hinai", mood: "neutral", text: "I'm sure that's important to somebody, Detective." },
      { goto: "ask" },

      { label: "stand" },
      { who: "hinai", mood: "neutral", text: "Then I'll say nothing further about it." },
      { goto: "ask" },

      { label: "caught" },
      { text: "You put the umbrella on the desk. It is still making a small dark ring on the blotter." },
      { who: "hinai", mood: "broken", text: "…Eleven minutes. Two o'clock until eleven minutes past. There is a post box at the end of the corniche and I wanted the letter to go with the first collection." },
      { who: "harthy", text: "A letter." },
      { who: "hinai", mood: "broken", text: "To my sister. Whom I have not spoken to in six years and whom I have now written to, and if you make me tell you what is in it I will resign this post tonight." },
      { who: "harthy", text: "I don't need what's in it. I need the eleven minutes." },
      { who: "hinai", mood: "neutral", text: "Two until ten past. The board was covered by nobody, and nobody called, and I have felt sick about it since." },
      { text: "Eleven minutes of a woman's private business. Not a murder. The wrong secret, honestly kept." },
      { goto: "ask" },

      { label: "done" },
      { who: "hinai", mood: "neutral", text: "Detective — read the book properly. People lie to you. It doesn't." },
      { exit: "hinai" },
      { end: true },
    ],
  },

  /* ------------------------------------------------------------------ */
  "interview:sharif": {
    id: "interview:sharif",
    background: "interview-room",
    backgroundName: "The night counter",
    clock: "07:02",
    script: [
      { enter: "sharif", at: "center", mood: "neutral" },
      { text: "Ayman Sharif arrives in a coat he has had pressed, carrying himself like a man being consulted rather than questioned." },
      { who: "sharif", mood: "neutral", text: "Detective Sergeant. I gather you have been busy all night while the rest of us were merely awake." },
      { who: "sharif", mood: "neutral", text: "Ask whatever you need. I signed the form; I'm hardly going to be coy about the contents." },

      { label: "ask" },
      {
        choice: [
          { text: "Tell me about finding him.", goto: "finding", when: (s) => !s.flags.sharifFinding },
          { text: "Where were you before that?", goto: "before", when: (s) => !s.flags.sharifBefore },
          { text: "You wrote two-fourteen on the form.", goto: "time", when: (s) => s.flags.sharifFinding },
          { text: "You saw the blood plainly, you said.", goto: "light", when: (s) => s.flags.sharifFinding },
          { text: "What did Tariq have on you?", goto: "blackmail", when: (s) => s.flags.knowsBlackmail && s.proven.length >= 2 },
          { text: "We'll leave it there.", goto: "done" },
        ],
      },

      { label: "finding" },
      { flag: "sharifFinding" },
      { who: "sharif", mood: "neutral", text: "There was a noise — a door, someone calling. I came down. Tariq was at the foot of the service stairs with his head against the bottom tread." },
      { who: "sharif", mood: "neutral", text: "I knelt, I checked for a pulse at the throat, and there was none. I saw the blood plainly and I saw the angle of the neck, and both told the same story." },
      { who: "sharif", mood: "neutral", text: "A man in a hurry, in a blackout, on a wet staircase. I have signed a hundred of them. This was the hundred and first." },
      { goto: "ask" },

      { label: "before" },
      { flag: "sharifBefore" },
      { who: "sharif", mood: "neutral", text: "At the night counter until two, as Al-Zadjali will tell you and as Mrs Al-Lawati will confirm, since I asked her about the band and she was good enough to indulge me." },
      { who: "harthy", text: "And before the counter?" },
      { who: "sharif", mood: "neutral", text: "In my room. Asleep, from a little after midnight until the commotion. I am sixty-one, Detective. My evenings are not eventful." },
      { text: "He says it smoothly, and it is the only sentence so far he has clearly prepared." },
      { goto: "ask" },

      { label: "time" },
      { who: "harthy", text: "You put the time of death at two-fourteen." },
      { who: "sharif", mood: "neutral", text: "I put the time at which I examined him at two-fourteen, and he was newly dead. Warm. Quite unmistakably within minutes." },
      {
        press: {
          claim: "He was newly dead when I found him at two-fourteen.",
          accepts: "pocket-watch",
          prove: "sharif-time-of-death",
          hit: "timeCaught",
          miss: "wrong",
          stand: "stand",
        },
      },

      { label: "timeCaught" },
      { text: "You put the watch on the table, face up, starred glass and stopped hands." },
      { who: "harthy", mood: "cold", text: "One forty-seven. It stopped when he hit the tread. Twenty-seven minutes before you knelt down and felt for a pulse you already knew wasn't there." },
      { who: "sharif", mood: "cold", text: "A watch can stop for any number of reasons. It might have stopped at noon and he never wound it." },
      { who: "harthy", text: "The glass is starred, doctor. It stopped because it was struck." },
      { who: "sharif", mood: "cold", text: "…Then he lay there twenty-seven minutes before anybody came. That is a tragedy of a hotel, not a confession of mine." },
      { goto: "ask" },

      { label: "light" },
      { who: "harthy", text: "You said you saw the blood plainly." },
      { who: "sharif", mood: "neutral", text: "I did. I have described it in some detail on the form." },
      { who: "harthy", text: "By what light?" },
      { who: "sharif", mood: "neutral", text: "The stairwell light, Detective. There is a fixture at the first landing." },
      {
        press: {
          claim: "I saw the blood plainly, by the stairwell light.",
          accepts: "stair-bulb",
          prove: "sharif-saw-blood",
          hit: "lightCaught",
          miss: "wrong",
          stand: "stand",
        },
      },

      { label: "lightCaught" },
      { text: "You set the bulb down beside the watch. Whole filament. Clean threads. Cold as the room." },
      { who: "harthy", mood: "cold", text: "Half-turned in its socket. That stairwell was black at half past one and it was black at two-fourteen, and Mrs Al-Lawati went down it by feel." },
      { who: "harthy", text: "You knelt in the pitch dark and saw blood plainly." },
      { who: "sharif", mood: "cold", text: "I — the torch. Al-Kindi had a torch." },
      {
        when: (s) => s.flags.kindiTorch,
        then: [
          { who: "harthy", text: "Al-Kindi came after you called out, and he has told me what he found. You were on your knees in the pitch dark naming the injuries for him before his torch reached the body." },
        ],
      },
      {
        when: (s) => !s.flags.kindiTorch,
        then: [
          { who: "harthy", text: "Al-Kindi came after you called out. You had already described the scene by the time he got there." },
        ],
      },
      { who: "sharif", mood: "cold", text: "…" },
      { text: "The consulting manner is still there. It has simply stopped being attached to anything." },
      { goto: "ask" },

      { label: "wrong" },
      { who: "sharif", mood: "neutral", text: "I fail to see the relevance, and I suspect so do you." },
      { text: "He lets the silence sit, and enjoys it, and you are the one who has to end it." },
      { goto: "ask" },

      { label: "stand" },
      { who: "sharif", mood: "neutral", text: "Quite. Shall we move along?" },
      { goto: "ask" },

      { label: "blackmail" },
      { who: "harthy", text: "Four hundred rials crossed Al-Zadjali's counter at twenty past one. Tariq called it what a man's reputation is worth." },
      { who: "harthy", mood: "cold", text: "You were struck off eleven years ago, doctor. Tariq found out. He charged you for the silence, and you paid on Tuesday." },
      { who: "sharif", mood: "cold", text: "That is a considerable structure to build out of a steward's ledger." },
      { who: "harthy", text: "Room three-twelve placed an outside call at one fifty-two. Five minutes after that watch stopped. You told me you slept until the commotion." },
      {
        press: {
          claim: "I was asleep in my room until the commotion at two-fourteen.",
          accepts: "switchboard-log",
          prove: "sharif-slept-through",
          hit: "callCaught",
          miss: "wrong",
          stand: "stand",
        },
      },

      { label: "callCaught" },
      { text: "You open Badriya Al-Hinai's notebook and turn it round for him, the way she turned it round for you." },
      { who: "harthy", mood: "cold", text: "One fifty-two. Room three-twelve, outside line, four minutes. In her hand, in pencil, written at the time it happened." },
      { who: "sharif", mood: "broken", text: "…Badriya keeps a book." },
      { who: "harthy", text: "Badriya keeps a book." },
      { who: "sharif", mood: "broken", text: "Nobody asked her to keep a book." },
      { text: "He sits down without being invited, which is the first ordinary thing he has done since he came in." },
      { who: "sharif", mood: "broken", text: "He came to my room on Tuesday with a cutting from a newspaper eleven years old and a figure written on the back of it. I paid him. I thought that was the end." },
      { who: "sharif", mood: "broken", text: "On Wednesday he came back and named a second figure. He was so pleased with himself. He stood in my doorway and he was so terribly pleased with himself." },
      { who: "harthy", text: "So you turned the bulb." },
      { who: "sharif", mood: "broken", text: "I am not going to help you with the rest of it, Detective. I have been a long time out of the profession, but I have not forgotten how to stop talking." },
      { flag: "sharifCornered" },
      { goto: "ask" },

      { label: "done" },
      {
        when: (s) => s.proven.filter((id) => id.startsWith("sharif-")).length >= 3,
        then: [
          { who: "sharif", mood: "broken", text: "You'll want to make your telephone call, Detective. Ask Mrs Al-Hinai. She'll write down the time." },
        ],
      },
      {
        when: (s) => s.proven.filter((id) => id.startsWith("sharif-")).length < 3,
        then: [
          { who: "sharif", mood: "neutral", text: "Do come back if anything else occurs to you. I am not going anywhere; none of us are, in this weather." },
        ],
      },
      { exit: "sharif" },
      { end: true },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Witnesses. Shorter than the suspects, and honest -- what they hold back
   * is detail, not guilt, so presenting an exhibit jogs a memory rather than
   * breaking an account. */

  "interview:maskari": {
    id: "interview:maskari",
    background: "precinct-desk",
    backgroundName: "Behind the front desk",
    clock: "04:40",
    script: [
      { enter: "maskari", at: "center", mood: "neutral" },
      { text: "Faisal Al-Maskari is twenty-three and has been standing very straight for four hours, in case standing straight turns out to matter." },
      { who: "maskari", mood: "neutral", text: "I'll tell you anything. I've been trying to remember it properly all night in case somebody asked and then nobody asked." },
      { who: "harthy", text: "I'm asking." },

      { label: "ask" },
      {
        choice: [
          { text: "When did you last see Tariq?", goto: "last", when: (s) => !s.flags.maskariLast },
          { text: "Which way did he go?", goto: "which", when: (s) => s.flags.maskariLast && !s.flags.maskariWhich },
          { text: "How did he seem?", goto: "seem", when: (s) => s.flags.maskariLast },
          { text: "Thank you, Mr Al-Maskari.", goto: "done" },
        ],
      },

      { label: "last" },
      { flag: "maskariLast" },
      { who: "maskari", mood: "neutral", text: "Twenty to two. He put the keys on the desk in front of me and said he would be ten minutes." },
      { who: "harthy", text: "You're certain of the time." },
      { who: "maskari", mood: "neutral", text: "The clock behind the desk is the only thing in this hotel that works properly and I look at it roughly four hundred times a night. Twenty to two." },
      { text: "1:40. Seven minutes before a watch stopped on the bottom tread." },
      { goto: "ask" },

      { label: "which" },
      { flag: "maskariWhich" },
      { who: "maskari", mood: "neutral", text: "The back stairs. The service stairs." },
      { who: "harthy", text: "Is that usual?" },
      { who: "maskari", mood: "broken", text: "No. That's the thing I've been sitting here with. The lift was working — it's on the house circuit, it stayed on. He walked past a working lift and took a dark staircase." },
      { who: "maskari", mood: "neutral", text: "You don't do that unless you're meeting someone who doesn't want to be met in a lobby." },
      { flag: "tariqWentToMeetSomeone" },
      { goto: "ask" },

      { label: "seem" },
      { who: "maskari", mood: "neutral", text: "Pleased. That's the word. He'd been in a mood like a wet week since the spring and tonight he was pleased with himself." },
      {
        press: {
          claim: "He'd been in a foul mood for months, and tonight he was pleased with himself.",
          accepts: "ledger",
          hit: "money",
          miss: "shrug",
          stand: "shrug",
        },
      },

      { label: "money" },
      { text: "You put Al-Zadjali's book on the desk, open at the settled column." },
      { who: "maskari", mood: "broken", text: "…That's Sulaiman's. He'd kill me for saying so, but yes — Tariq came back past the desk from the counter about half one, and he had an envelope, and he tapped it on the desk as he went by." },
      { who: "harthy", text: "Tapped it." },
      { who: "maskari", mood: "neutral", text: "Like a man who has just won something. I thought it was a horse. I've been thinking since that it wasn't a horse." },
      { goto: "ask" },

      { label: "shrug" },
      { who: "maskari", mood: "neutral", text: "I couldn't say what that's about, sir. I only know what I saw from behind a desk." },
      { goto: "ask" },

      { label: "done" },
      { who: "maskari", mood: "neutral", text: "Detective — he wasn't a kind man. But he said goodnight to me every night for two years and I'd like whoever did it found." },
      { exit: "maskari" },
      { end: true },
    ],
  },

  "interview:busaidi": {
    id: "interview:busaidi",
    background: "interview-room",
    backgroundName: "Room 214",
    clock: "04:55",
    script: [
      { enter: "busaidi", at: "center", mood: "neutral" },
      { text: "Noor Al-Busaidi opens the door of 214 already dressed, already holding a notebook, and looks disappointed that you are not more interesting." },
      { who: "busaidi", mood: "neutral", text: "Twenty past four. Either the hotel is on fire or somebody is dead, and nobody has smelled smoke." },
      { who: "harthy", text: "You're taking it well." },
      { who: "busaidi", mood: "neutral", text: "I write for a living, Detective. I've been taking things well since I was nineteen. Ask." },

      { label: "ask" },
      {
        choice: [
          { text: "Were you awake?", goto: "awake", when: (s) => !s.flags.busaidiAwake },
          { text: "What did you hear?", goto: "heard", when: (s) => s.flags.busaidiAwake && !s.flags.busaidiHeard },
          { text: "Anything after that?", goto: "after", when: (s) => s.flags.busaidiHeard },
          { text: "That's all I need.", goto: "done" },
        ],
      },

      { label: "awake" },
      { flag: "busaidiAwake" },
      { who: "busaidi", mood: "neutral", text: "Wide. That storm was doing something architectural to the shutters and 214 shares a wall with the service stairs, which is the room they give you when you book late." },
      { goto: "ask" },

      { label: "heard" },
      { flag: "busaidiHeard" },
      { who: "busaidi", mood: "neutral", text: "Two men on the stairs. Not shouting — worse than shouting. The quiet kind, where both of them are being reasonable at each other." },
      { who: "harthy", text: "When?" },
      { who: "busaidi", mood: "neutral", text: "A quarter to two, near enough. I'd given up on sleeping and started listening, which is a habit I'd rather not have." },
      { who: "harthy", text: "Could you make out either voice?" },
      { who: "busaidi", mood: "neutral", text: "One of them was older and was doing most of the talking. The other one laughed once. And then the older one said something I've been turning over since." },
      { who: "busaidi", mood: "broken", text: "He said: 'there is no third time.'" },
      { flag: "noThirdTime" },
      { goto: "ask" },

      { label: "after" },
      { who: "harthy", text: "And after that?" },
      { who: "busaidi", mood: "neutral", text: "Nothing on the stairs. A few minutes later, a telephone — out in the third-floor corridor, not on the stairs. Somebody talking low and fast." },
      {
        press: {
          claim: "A telephone in the third-floor corridor, a few minutes after the voices stopped.",
          accepts: "switchboard-log",
          hit: "call",
          miss: "vague",
          stand: "vague",
        },
      },

      { label: "call" },
      { text: "You turn Badriya Al-Hinai's notebook round so she can read the line herself." },
      { who: "busaidi", mood: "broken", text: "One fifty-two. Room three-twelve." },
      { who: "busaidi", mood: "neutral", text: "Then that's your telephone, and I heard it four minutes after two men stopped being reasonable at each other on a dark staircase." },
      { who: "harthy", mood: "cold", text: "You'd sign that." },
      { who: "busaidi", mood: "neutral", text: "I'd print it, Detective, which is a considerably higher standard." },
      { goto: "ask" },

      { label: "vague" },
      { who: "busaidi", mood: "neutral", text: "I couldn't tell you whose. A wall is a wall." },
      { goto: "ask" },

      { label: "done" },
      { who: "busaidi", mood: "neutral", text: "When this is finished, Detective, I should like fifteen minutes and your name spelled correctly. Not tonight. But I will ask." },
      { exit: "busaidi" },
      { end: true },
    ],
  },

  "interview:kindi": {
    id: "interview:kindi",
    background: "hotel-stairs",
    backgroundName: "Foot of the service stairs",
    clock: "05:25",
    script: [
      { enter: "kindi", at: "center", mood: "neutral" },
      { text: "Majid Al-Kindi has been awake for twenty hours and found a body four of them ago, and it is showing in both eyes." },
      { who: "kindi", mood: "neutral", text: "I've told the day manager, I've told the doctor, and I've told a man from the hotel's insurance who arrived before you did. I'll tell you as well." },
      { who: "harthy", text: "Tell me slower than you told them." },

      { label: "ask" },
      {
        choice: [
          { text: "What brought you down here?", goto: "down", when: (s) => !s.flags.kindiDown },
          { text: "What did you find?", goto: "found", when: (s) => s.flags.kindiDown && !s.flags.kindiFound },
          { text: "About the light on these stairs.", goto: "light", when: (s) => s.flags.kindiFound },
          { text: "Get some sleep, Mr Al-Kindi.", goto: "done" },
        ],
      },

      { label: "down" },
      { flag: "kindiDown" },
      { who: "kindi", mood: "neutral", text: "A door. About ten past two, a door went somewhere below me, hard — not a wind door, a hand door." },
      { who: "kindi", mood: "neutral", text: "I was in the linen room on two. I took the torch off the hook and came down, and the doctor was calling out before I got to the bottom." },
      { goto: "ask" },

      { label: "found" },
      { flag: "kindiFound" },
      { who: "kindi", mood: "broken", text: "The doctor. On his knees beside Mr Al-Rawahi, in the dark, with no torch of his own." },
      { who: "harthy", text: "In the dark." },
      { who: "kindi", mood: "broken", text: "Black as the inside of a pocket. And he was telling me what I was looking at before my torch was on it. 'His neck, Majid. The blood, Majid.'" },
      { who: "kindi", mood: "neutral", text: "I remember thinking he had very good eyes for a man of sixty-one. I have been trying not to think about it since." },
      { flag: "kindiTorch" },
      { goto: "ask" },

      { label: "light" },
      { who: "harthy", text: "That stairwell light. How long has it been out?" },
      { who: "kindi", mood: "neutral", text: "It hasn't. I change it myself. I changed it a fortnight ago and it has burned every night since, blackout or no blackout — the stair fixtures are on the house circuit, same as the lift." },
      {
        press: {
          claim: "The stairwell light has worked every night for a fortnight.",
          accepts: "stair-bulb",
          hit: "turned",
          miss: "puzzled",
          stand: "puzzled",
        },
      },

      { label: "turned" },
      { text: "You hold out the bulb. He turns it over twice, the way a man does with something from his own trade." },
      { who: "kindi", mood: "broken", text: "This isn't blown. Look at it — the filament's whole, the threads are clean. Somebody's given it a half-turn in the socket." },
      { who: "harthy", text: "Could it work loose on its own?" },
      { who: "kindi", mood: "neutral", text: "In a wire cage, on a wall, on a staircase nobody runs on? No, sir. Somebody stood on a chair to do that." },
      { who: "kindi", mood: "broken", text: "…There's a chair in the corridor that isn't where I left it." },
      { flag: "bulbWasTurned" },
      { goto: "ask" },

      { label: "puzzled" },
      { who: "kindi", mood: "neutral", text: "I don't know what that has to do with my lights, sir." },
      { goto: "ask" },

      { label: "done" },
      { who: "kindi", mood: "neutral", text: "Detective. If it turns out the dark on these stairs was my fault, I'd want to be told to my face." },
      { who: "harthy", text: "It wasn't your fault. Somebody made it that way on purpose." },
      { exit: "kindi" },
      { end: true },
    ],
  },
};


/** Interviews offered on the board, in the order they are most useful. */
export const INTERVIEWS = [
  { id: "interview:lawati", person: "lawati", teaser: "In front of forty wedding guests for two hours. Forty people say so." },
  { id: "interview:zadjali", person: "zadjali", teaser: "Runs a book off the night counter and lied about it before you asked." },
  { id: "interview:hinai", person: "hinai", teaser: "Wrote down every call in the building, unasked, all night." },
  { id: "interview:sharif", person: "sharif", teaser: "Signed the form. Wrote the time. Used to be a doctor." },
  { id: "interview:maskari", person: "maskari", teaser: "Took the keys off him at twenty to two and watched which way he went." },
  { id: "interview:busaidi", person: "busaidi", teaser: "Room 214 shares a wall with the service stairs, and she was awake." },
  { id: "interview:kindi", person: "kindi", teaser: "Carried the only torch. Changes the stairwell bulb himself." },
];
