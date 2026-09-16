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
    backgroundName: "Outside the Bellweather",
    clock: "03:41",
    script: [
      { text: "Rain since Sunday. The kind that finds the seams of a coat and settles in for the week." },
      { text: "The Bellweather keeps a lamp burning over its door out of habit. Tonight the lamp is out, along with every other light for nine blocks." },
      { text: "A man went down the service stairs at some point in the small hours and did not get up. The house doctor called it a fall and wrote a time on a form." },
      { text: "Nightwatch sends you because nightwatch sends whoever is awake." },

      { bg: "precinct-desk", bgName: "Fourth Precinct, night desk" },
      { clock: "03:52" },
      { text: "The file is four pages and three of them are the hotel's letterhead." },
      { who: "cole", mood: "neutral", text: "Teddy Vance. Night manager. Forty-four years old, and until Wednesday, nothing in this building's ledger worth writing down." },
      { who: "cole", text: "Found at the foot of the service stairs at two-fourteen. Pronounced at the scene by a resident of room three-twelve." },
      { who: "cole", mood: "cold", text: "A resident who signs himself doctor, and who the state medical board stopped calling one in 'fifty-one." },
      { text: "Four people were in the building and awake. All four were somewhere else. Somewhere else is a small hotel on a dead-quiet Wednesday." },
      { who: "cole", text: "Start with the stairs. The stairs don't have an alibi." },
      { end: true },
    ],
  },

  /* ------------------------------------------------------------------ */
  "scene:stairs": {
    id: "scene:stairs",
    background: "hotel-stairs",
    backgroundName: "Service stairs, the Bellweather",
    clock: "04:10",
    script: [
      { text: "The service stairs run four floors down the back of the hotel, and every one of them smells of wet plaster and old cooking." },
      { text: "Vance is at the bottom, under a sheet the porters found somewhere. The stairs above him are dark. The stairs above them are dark too." },

      { label: "look" },
      {
        choice: [
          { text: "Go through his pockets.", goto: "watch", when: (s) => !s.exhibits.includes("pocket-watch") },
          { text: "Find out why it's so dark in here.", goto: "bulb", when: (s) => !s.exhibits.includes("stair-bulb") },
          { text: "Run a hand along the stair rail.", goto: "sequin", when: (s) => !s.exhibits.includes("sequin") },
          { text: "Look in the lobby closet.", goto: "umbrella", when: (s) => !s.exhibits.includes("umbrella") },
          { text: "Enough. Go and talk to the living.", goto: "done" },
        ],
      },

      { label: "watch" },
      { text: "Keys. Nine dollars. A folded card for a florist on Ainsley. And a pocket watch, the good kind, the kind a man buys himself when nobody else will." },
      { text: "The glass is starred. The hands have stopped." },
      { who: "cole", mood: "cold", text: "One forty-seven." },
      { text: "Finch wrote two-fourteen on the form. A watch is a stupid, honest little machine. It stops when it is struck and it does not revise." },
      { give: "pocket-watch" },
      { goto: "look" },

      { label: "bulb" },
      { text: "The stairwell fixture is at the first landing, a bare bulb in a wire cage. You get a chair from the corridor and take it down." },
      { text: "Cold. Filament whole. Not a mark of heat anywhere on the glass." },
      { who: "cole", text: "It didn't blow. Somebody gave it a half-turn." },
      { text: "In a blackout, a dark staircase is the least remarkable thing in the city. That is exactly what makes it worth doing." },
      { give: "stair-bulb" },
      { goto: "look" },

      { label: "sequin" },
      { text: "Third step from the bottom, where the rail meets the newel post, something catches the torch and throws it back." },
      { text: "A sequin. Bottle-green, cupped, the sort that is sewn on by the hundred and lost by the dozen." },
      { who: "cole", text: "One dress in this building sheds these, and it's on stage six nights a week." },
      { text: "It proves somebody stood here. It says nothing whatever about when." },
      { give: "sequin" },
      { goto: "look" },

      { label: "umbrella" },
      { text: "The lobby closet holds nine coats, a vacuum cleaner and a black umbrella, hooked over the rail." },
      { text: "You put a hand to it. It is still running onto the tile." },
      { who: "cole", text: "Somebody went out in that. Went out, and came back, and hung it up tidy." },
      { give: "umbrella" },
      { goto: "look" },

      { label: "done" },
      { text: "Four floors of stairs and one honest witness, and the honest one is a watch." },
      { end: true },
    ],
  },

  /* ------------------------------------------------------------------ */
  "interview:calloway": {
    id: "interview:calloway",
    background: "interview-room",
    backgroundName: "The lounge, after hours",
    clock: "05:05",
    script: [
      { text: "They give you the lounge to work in. The chairs are still up on the tables and the piano lid is down." },
      { enter: "calloway", at: "center", mood: "neutral" },
      { who: "calloway", mood: "neutral", text: "You want the version with the crying, or the version that's true? I can do either. I've been doing the first one all night for the day manager." },
      { who: "cole", text: "The true one. I'll tell you if I need the other." },
      { who: "calloway", mood: "neutral", text: "Then sit down. You're making the room feel like a police station." },

      { label: "ask" },
      {
        choice: [
          { text: "Where were you between one and two?", goto: "where", when: (s) => !s.flags.callowayWhere },
          { text: "What was Vance to you?", goto: "vance", when: (s) => !s.flags.callowayVance },
          { text: "Who else was awake?", goto: "who", when: (s) => !s.flags.callowayWho },
          { text: "Did you go near the service stairs?", goto: "stairs", when: (s) => s.flags.callowayWhere },
          { text: "That'll do for now.", goto: "done" },
        ],
      },

      { label: "where" },
      { flag: "callowayWhere" },
      { who: "calloway", mood: "neutral", text: "On the stand. Second set starts at half past midnight and runs till two, and on a Wednesday it runs longer because nobody wants to go upstairs to a cold room." },
      { who: "calloway", mood: "neutral", text: "Forty people watched me do it. When the lights went, I kept going. You can sing in the dark. It's the only improvement the blackout made." },
      { who: "cole", text: "The whole two hours." },
      { who: "calloway", mood: "evasive", text: "The whole two hours." },
      { text: "Her hand goes to the back of her neck, and stays there a beat too long." },
      { goto: "ask" },

      { label: "vance" },
      { flag: "callowayVance" },
      { who: "calloway", mood: "neutral", text: "Teddy Vance was the man who wrote the cheques and the man who explained why they were late. Same man. He was very good at the second job." },
      { who: "calloway", mood: "tense", text: "Four weeks I'd been short. Not short like a mistake. Short like a policy." },
      { who: "cole", text: "You argue about it?" },
      { who: "calloway", mood: "evasive", text: "I mentioned it. You mention a thing enough times and it stops being an argument and starts being the weather." },
      { goto: "ask" },

      { label: "who" },
      { flag: "callowayWho" },
      { who: "calloway", mood: "neutral", text: "Sol behind the bar, taking bets he thinks nobody's noticed in eleven years. Delphine on the board, with her book and her pencil." },
      { who: "calloway", mood: "cold", text: "And the doctor. Sitting where he always sits, at the end of the bar, drinking the one drink he makes last till closing so nobody can say he's drinking." },
      { who: "cole", text: "Finch was in the lounge. You're sure." },
      { who: "calloway", mood: "neutral", text: "From two o'clock, certainly. He made a point of it. Asked me for a song and made a business of asking, the way you do when you want the room to notice you're in it." },
      { who: "cole", mood: "cold", text: "From two o'clock." },
      { who: "calloway", mood: "neutral", text: "That's what I said." },
      { goto: "ask" },

      { label: "stairs" },
      { who: "cole", text: "Did you go near the service stairs tonight?" },
      { who: "calloway", mood: "tense", text: "No." },
      { text: "Flat. Immediate. No pause to remember, which is the thing people forget to fake." },
      {
        press: {
          claim: "I never went near the service stairs tonight.",
          accepts: "sequin",
          prove: "calloway-stairs",
          hit: "caught",
          miss: "wrong",
          stand: "stand",
        },
      },

      { label: "wrong" },
      { who: "calloway", mood: "cold", text: "That's a thing, all right. It isn't a thing about me." },
      { text: "You put it back in the file. She watches you do it, and something in her shoulders comes down an inch." },
      { goto: "ask" },

      { label: "stand" },
      { who: "calloway", mood: "neutral", text: "Then we're finished, and I can go and be upset somewhere with better chairs." },
      { goto: "ask" },

      { label: "caught" },
      { text: "You set the sequin on the table between you. Bottle-green. It sits there and does all the talking." },
      { who: "calloway", mood: "tense", text: "…" },
      { who: "calloway", mood: "broken", text: "Half past one. Between sets. I went down to tell him that if Friday was short as well I'd be singing at the Marquis and he could explain the empty room to the owners himself." },
      { who: "cole", text: "And?" },
      { who: "calloway", mood: "broken", text: "And he laughed at me. In the dark, on the stairs, he laughed at me, and I went back up and did the second set with my face on." },
      { who: "calloway", mood: "tense", text: "I didn't touch him. I wanted to. There's a difference and I've had four hours to think about how much of one." },
      { who: "cole", mood: "cold", text: "The stairwell was dark at half past one." },
      { who: "calloway", mood: "neutral", text: "Pitch. I went down it by the rail. That's how your little green thing got where it got." },
      { text: "Dark at one-thirty. Which means the bulb was already turned before Vance ever went down there." },
      { flag: "darkBeforeTheFall" },
      { goto: "ask" },

      { label: "done" },
      { who: "calloway", mood: "neutral", text: "Detective. When you find out it was somebody, come and tell me. I'd like to know which face I've been singing to." },
      { exit: "calloway" },
      { end: true },
    ],
  },

  /* ------------------------------------------------------------------ */
  "interview:brennan": {
    id: "interview:brennan",
    background: "interview-room",
    backgroundName: "The lounge, after hours",
    clock: "05:40",
    script: [
      { enter: "brennan", at: "center", mood: "neutral" },
      { who: "brennan", mood: "neutral", text: "Before you start — I want it on record I've cooperated. I've been cooperating since three in the morning. I'm nearly out of cooperation." },
      { who: "cole", text: "Then spend what's left carefully." },

      { label: "ask" },
      {
        choice: [
          { text: "Where were you at one forty-seven?", goto: "where", when: (s) => !s.flags.brennanWhere },
          { text: "You keep a book behind that bar.", goto: "book", when: (s) => !s.flags.brennanBook },
          { text: "Did Vance owe anybody?", goto: "owe", when: (s) => s.flags.brennanBook && !s.flags.brennanOwe },
          { text: "Let's talk about what Vance owed you.", goto: "debt", when: (s) => s.flags.brennanOwe },
          { text: "That's all.", goto: "done" },
        ],
      },

      { label: "where" },
      { flag: "brennanWhere" },
      { who: "brennan", mood: "neutral", text: "Behind the bar. Where I am every night from six until the last one of them gives up." },
      { who: "brennan", mood: "neutral", text: "When the lights went I got the candles out of the box under the register, and then I stood there like a birthday cake until two." },
      { who: "cole", text: "Anyone stood there with you?" },
      { who: "brennan", mood: "neutral", text: "The doctor. End of the bar, same stool, same one whisky. He's been nursing that whisky since 'fifty-two." },
      { who: "cole", text: "The whole time?" },
      { who: "brennan", mood: "evasive", text: "He was there at two. I'll swear to two. Before that it was black as a hat in there and I was counting change by feel." },
      { goto: "ask" },

      { label: "book" },
      { flag: "brennanBook" },
      { who: "brennan", mood: "tense", text: "I don't know what you mean." },
      { who: "cole", text: "Eleven years, Miss Calloway says. She thinks you think nobody's noticed." },
      { who: "brennan", mood: "tense", text: "Iris Calloway should worry about her own arrangements." },
      { text: "He works the bar rag through his hands like he is wringing out a decision." },
      { who: "brennan", mood: "evasive", text: "All right. I take a little action. Horses, mostly. Nothing that hurts anyone and nothing that isn't paid." },
      { who: "cole", text: "Then you keep a book. Fetch it." },
      { who: "brennan", mood: "tense", text: "It's my living in that book. Nine years of it." },
      { who: "cole", mood: "cold", text: "And a man died on your stairs. Fetch the book, Mr Brennan." },
      { text: "He takes it from a shelf under the register, where it has clearly lived for nine years, and sets it down like something with a pulse." },
      { give: "ledger" },
      { goto: "ask" },

      { label: "owe" },
      { flag: "brennanOwe" },
      { who: "cole", text: "Did Vance owe anybody in this building?" },
      { who: "brennan", mood: "neutral", text: "Teddy Vance owed everybody in this building. That was his hobby." },
      { who: "cole", text: "Did he owe you?" },
      { who: "brennan", mood: "cold", text: "Teddy Vance never paid me a penny of what he owed. Not one. You can write that down and I'll sign underneath it." },
      { goto: "ask" },

      { label: "debt" },
      { who: "cole", text: "Not a penny." },
      { who: "brennan", mood: "cold", text: "Not a penny." },
      {
        press: {
          claim: "Teddy Vance never paid me a penny of what he owed.",
          accepts: "ledger",
          prove: "brennan-paid",
          hit: "caught",
          miss: "wrong",
          stand: "stand",
        },
      },

      { label: "wrong" },
      { who: "brennan", mood: "neutral", text: "And what's that got to do with my bar?" },
      { text: "Nothing, is the answer, and he can see you know it." },
      { goto: "ask" },

      { label: "stand" },
      { who: "brennan", mood: "neutral", text: "Good. Then I'll get back to my floor." },
      { goto: "ask" },

      { label: "caught" },
      { text: "You open his own book on the table, at his own column, in his own hand." },
      { who: "cole", mood: "cold", text: "Eleven hundred. Carried since August. Cleared at one twenty this morning, and the ink is still deciding whether it's dry." },
      { who: "brennan", mood: "broken", text: "…All right. All right." },
      { who: "brennan", mood: "broken", text: "He came to the bar at twenty past one with eleven hundred dollars in an envelope and he was shaking. Not scared shaking. The other kind. Pleased with himself." },
      { who: "cole", text: "Where does a night manager get eleven hundred dollars on a Wednesday?" },
      { who: "brennan", mood: "tense", text: "I asked him that. He said, and I'm giving you his words — 'a man's reputation is worth more than he thinks, and a lot less than he'll pay.'" },
      { who: "brennan", mood: "tense", text: "Then he laughed and went off up the back stairs and I never saw him again, and when they found him I marked the debt paid and said nothing, because a man in my line doesn't volunteer." },
      { who: "cole", mood: "cold", text: "Somebody in this hotel bought silence on Tuesday and stopped paying on Wednesday." },
      { flag: "knowsBlackmail" },
      { goto: "ask" },

      { label: "done" },
      { who: "brennan", mood: "neutral", text: "Detective. Whatever he was, he drank at my bar for nine years. Find the one that did it." },
      { exit: "brennan" },
      { end: true },
    ],
  },

  /* ------------------------------------------------------------------ */
  "interview:roy": {
    id: "interview:roy",
    background: "interview-room",
    backgroundName: "Switchboard alcove",
    clock: "06:15",
    script: [
      { enter: "roy", at: "center", mood: "neutral" },
      { text: "Delphine Roy sits with her hands folded on a ruled notebook, the way a woman sits who has decided in advance exactly how much she is going to say." },
      { who: "roy", mood: "neutral", text: "I've been on this board eleven years, Detective. I've never once been asked a question by the police and I would have preferred to keep the run going." },

      { label: "ask" },
      {
        choice: [
          { text: "Walk me through your night.", goto: "night", when: (s) => !s.flags.royNight },
          { text: "What's in the notebook?", goto: "book", when: (s) => !s.flags.royBook },
          { text: "Did you leave the board at any point?", goto: "left", when: (s) => s.flags.royNight },
          { text: "Thank you, Mrs Roy.", goto: "done" },
        ],
      },

      { label: "night" },
      { flag: "royNight" },
      { who: "roy", mood: "neutral", text: "Midnight to eight, same as every night. The board is quiet after one. People stop telephoning and start sleeping, which is what the hours are for." },
      { who: "roy", mood: "neutral", text: "The lights went at ten past one. The board has its own battery, so I sat in the dark and worked by touch. I know where every jack is. I could do it without hands." },
      { goto: "ask" },

      { label: "book" },
      { flag: "royBook" },
      { who: "roy", mood: "neutral", text: "Every call in and every call out, with the room and the time. Nobody asks me to. The hotel would not notice if I stopped." },
      { who: "roy", mood: "neutral", text: "I do it because a thing that is written down at the time it happens is worth more than anything anybody remembers afterwards." },
      { who: "cole", text: "Mrs Roy, that may be the most useful sentence anyone has said to me tonight." },
      { give: "switchboard-log" },
      { text: "She slides the notebook across without being asked, and turns it the right way round for you first." },
      { goto: "ask" },

      { label: "left" },
      { who: "cole", text: "Did you leave the board at any point?" },
      { who: "roy", mood: "tense", text: "No." },
      { text: "The folded hands tighten by a degree." },
      {
        press: {
          claim: "I never left the switchboard.",
          accepts: "umbrella",
          prove: "roy-left-the-floor",
          hit: "caught",
          miss: "wrong",
          stand: "stand",
        },
      },

      { label: "wrong" },
      { who: "roy", mood: "neutral", text: "I'm sure that's important to somebody, Detective." },
      { goto: "ask" },

      { label: "stand" },
      { who: "roy", mood: "neutral", text: "Then I'll say nothing further about it." },
      { goto: "ask" },

      { label: "caught" },
      { text: "You put the umbrella on the desk. It is still making a small dark ring on the blotter." },
      { who: "roy", mood: "broken", text: "…Eleven minutes. Two o'clock until eleven minutes past. There is a post box on the corner of Ainsley and I wanted the letter to go with the first collection." },
      { who: "cole", text: "A letter." },
      { who: "roy", mood: "broken", text: "To my sister. Whom I have not spoken to in six years and whom I have now written to, and if you make me tell you what is in it I will resign this post tonight." },
      { who: "cole", text: "I don't need what's in it. I need the eleven minutes." },
      { who: "roy", mood: "neutral", text: "Two until ten past. The board was covered by nobody, and nobody called, and I have felt sick about it since." },
      { text: "Eleven minutes of a woman's private business. Not a murder. The wrong secret, honestly kept." },
      { goto: "ask" },

      { label: "done" },
      { who: "roy", mood: "neutral", text: "Detective — read the book properly. People lie to you. It doesn't." },
      { exit: "roy" },
      { end: true },
    ],
  },

  /* ------------------------------------------------------------------ */
  "interview:finch": {
    id: "interview:finch",
    background: "interview-room",
    backgroundName: "The lounge, after hours",
    clock: "07:02",
    script: [
      { enter: "finch", at: "center", mood: "neutral" },
      { text: "Ambrose Finch arrives in a dressing gown he has had pressed, carrying himself like a man being consulted rather than questioned." },
      { who: "finch", mood: "neutral", text: "Detective Sergeant. I gather you have been busy all night while the rest of us were merely awake." },
      { who: "finch", mood: "neutral", text: "Ask whatever you need. I signed the form; I'm hardly going to be coy about the contents." },

      { label: "ask" },
      {
        choice: [
          { text: "Tell me about finding him.", goto: "finding", when: (s) => !s.flags.finchFinding },
          { text: "Where were you before that?", goto: "before", when: (s) => !s.flags.finchBefore },
          { text: "You wrote two-fourteen on the form.", goto: "time", when: (s) => s.flags.finchFinding },
          { text: "You saw the blood plainly, you said.", goto: "light", when: (s) => s.flags.finchFinding },
          { text: "What did Vance have on you?", goto: "blackmail", when: (s) => s.flags.knowsBlackmail && s.proven.length >= 2 },
          { text: "We'll leave it there.", goto: "done" },
        ],
      },

      { label: "finding" },
      { flag: "finchFinding" },
      { who: "finch", mood: "neutral", text: "There was a noise — a door, someone calling. I came down. Vance was at the foot of the service stairs with his head against the bottom tread." },
      { who: "finch", mood: "neutral", text: "I knelt, I checked for a pulse at the throat, and there was none. I saw the blood plainly and I saw the angle of the neck, and both told the same story." },
      { who: "finch", mood: "neutral", text: "A man in a hurry, in a blackout, on a wet staircase. I have signed a hundred of them. This was the hundred and first." },
      { goto: "ask" },

      { label: "before" },
      { flag: "finchBefore" },
      { who: "finch", mood: "neutral", text: "In the lounge until two, at the end of the bar, as Brennan will tell you and as Miss Calloway will confirm, since I asked her for a song and she was good enough to oblige." },
      { who: "cole", text: "And before the lounge?" },
      { who: "finch", mood: "neutral", text: "In my room. Asleep, from a little after midnight until the commotion. I am sixty-one, Detective. My evenings are not eventful." },
      { text: "He says it smoothly, and it is the only sentence so far he has clearly prepared." },
      { goto: "ask" },

      { label: "time" },
      { who: "cole", text: "You put the time of death at two-fourteen." },
      { who: "finch", mood: "neutral", text: "I put the time at which I examined him at two-fourteen, and he was newly dead. Warm. Quite unmistakably within minutes." },
      {
        press: {
          claim: "He was newly dead when I found him at two-fourteen.",
          accepts: "pocket-watch",
          prove: "finch-time-of-death",
          hit: "timeCaught",
          miss: "wrong",
          stand: "stand",
        },
      },

      { label: "timeCaught" },
      { text: "You put the watch on the table, face up, starred glass and stopped hands." },
      { who: "cole", mood: "cold", text: "One forty-seven. It stopped when he hit the tread. Twenty-seven minutes before you knelt down and felt for a pulse you already knew wasn't there." },
      { who: "finch", mood: "tense", text: "A watch can stop for any number of reasons. It might have stopped at noon and he never wound it." },
      { who: "cole", text: "The glass is starred, doctor. It stopped because it was struck." },
      { who: "finch", mood: "tense", text: "…Then he lay there twenty-seven minutes before anybody came. That is a tragedy of a hotel, not a confession of mine." },
      { goto: "ask" },

      { label: "light" },
      { who: "cole", text: "You said you saw the blood plainly." },
      { who: "finch", mood: "neutral", text: "I did. I have described it in some detail on the form." },
      { who: "cole", text: "By what light?" },
      { who: "finch", mood: "neutral", text: "The stairwell light, Detective. There is a fixture at the first landing." },
      {
        press: {
          claim: "I saw the blood plainly, by the stairwell light.",
          accepts: "stair-bulb",
          prove: "finch-saw-blood",
          hit: "lightCaught",
          miss: "wrong",
          stand: "stand",
        },
      },

      { label: "lightCaught" },
      { text: "You set the bulb down beside the watch. Whole filament. Clean threads. Cold as the room." },
      { who: "cole", mood: "cold", text: "Half-turned in its socket. That stairwell was black at half past one and it was black at two-fourteen, and Miss Calloway went down it by feel." },
      { who: "cole", text: "You knelt in the pitch dark and saw blood plainly." },
      { who: "finch", mood: "tense", text: "I — the torch. One of the porters had a torch." },
      { who: "cole", text: "The porters came after you called out. You had already described the scene." },
      { who: "finch", mood: "tense", text: "…" },
      { text: "The consulting manner is still there. It has simply stopped being attached to anything." },
      { goto: "ask" },

      { label: "wrong" },
      { who: "finch", mood: "neutral", text: "I fail to see the relevance, and I suspect so do you." },
      { text: "He lets the silence sit, and enjoys it, and you are the one who has to end it." },
      { goto: "ask" },

      { label: "stand" },
      { who: "finch", mood: "neutral", text: "Quite. Shall we move along?" },
      { goto: "ask" },

      { label: "blackmail" },
      { who: "cole", text: "Eleven hundred dollars crossed Brennan's bar at twenty past one. Vance called it what a man's reputation is worth." },
      { who: "cole", mood: "cold", text: "You were struck off in 'fifty-one, doctor. Vance found out. He charged you for the silence, and you paid on Tuesday." },
      { who: "finch", mood: "tense", text: "That is a considerable structure to build out of a bar ledger." },
      { who: "cole", text: "Room three-twelve placed an outside call at one fifty-two. Five minutes after that watch stopped. You told me you slept until the commotion." },
      {
        press: {
          claim: "I was asleep in my room until the commotion at two-fourteen.",
          accepts: "switchboard-log",
          prove: "finch-slept-through",
          hit: "callCaught",
          miss: "wrong",
          stand: "stand",
        },
      },

      { label: "callCaught" },
      { text: "You open Delphine Roy's notebook and turn it round for him, the way she turned it round for you." },
      { who: "cole", mood: "cold", text: "One fifty-two. Room three-twelve, outside line, four minutes. In her hand, in pencil, written at the time it happened." },
      { who: "finch", mood: "broken", text: "…Delphine keeps a book." },
      { who: "cole", text: "Delphine keeps a book." },
      { who: "finch", mood: "broken", text: "Nobody asked her to keep a book." },
      { text: "He sits down without being invited, which is the first ordinary thing he has done since he came in." },
      { who: "finch", mood: "broken", text: "He came to my room on Tuesday with a cutting from a newspaper eleven years old and a figure written on the back of it. I paid him. I thought that was the end." },
      { who: "finch", mood: "broken", text: "On Wednesday he came back and named a second figure. He was so pleased with himself. He stood in my doorway and he was so terribly pleased with himself." },
      { who: "cole", text: "So you turned the bulb." },
      { who: "finch", mood: "broken", text: "I am not going to help you with the rest of it, Detective. I have been a long time out of the profession, but I have not forgotten how to stop talking." },
      { flag: "finchCornered" },
      { goto: "ask" },

      { label: "done" },
      {
        when: (s) => s.proven.filter((id) => id.startsWith("finch-")).length >= 3,
        then: [
          { who: "finch", mood: "broken", text: "You'll want to make your telephone call, Detective. Ask Mrs Roy. She'll write down the time." },
        ],
      },
      {
        when: (s) => s.proven.filter((id) => id.startsWith("finch-")).length < 3,
        then: [
          { who: "finch", mood: "neutral", text: "Do come back if anything else occurs to you. I am not going anywhere; none of us are, in this weather." },
        ],
      },
      { exit: "finch" },
      { end: true },
    ],
  },
};

/** Interviews offered in the hub, in the order they are most useful. */
export const INTERVIEWS = [
  { id: "interview:calloway", person: "calloway", teaser: "She was under the lights for two hours. Forty people say so." },
  { id: "interview:brennan", person: "brennan", teaser: "Runs a book out of the bar and lied about it before you asked." },
  { id: "interview:roy", person: "roy", teaser: "Wrote down every call in the building, unasked, all night." },
  { id: "interview:finch", person: "finch", teaser: "Signed the form. Wrote the time. Used to be a doctor." },
];
