/**
 * Places the detective can travel to during the night.
 *
 * Coordinates are percentages on the illustrated map. Keeping navigation in
 * data makes adding another building or room no more complicated than adding
 * another scene.
 */
export const LOCATIONS = [
  {
    id: "station",
    name: "Muttrah station",
    kicker: "Nightwatch base",
    description: "Your desk, the evidence wall, and the form that ends the night.",
    x: 17,
    y: 72,
    building: "Royal Oman Police",
    background: "precinct-desk",
    actions: ["board", "accuse"],
    people: [],
  },
  {
    id: "lobby",
    name: "Al-Manar lobby",
    kicker: "Ground floor",
    description: "The night counter, switchboard and front doors. Everyone passes through here eventually.",
    x: 62,
    y: 69,
    building: "Al-Manar Hotel",
    background: "rain-street",
    people: ["zadjali", "hinai", "maskari"],
  },
  {
    id: "stairs",
    name: "Service stairs",
    kicker: "Crime scene",
    description: "Four dark flights, a body at the bottom, and anything the first search missed.",
    x: 72,
    y: 51,
    building: "Al-Manar Hotel",
    background: "hotel-stairs",
    scene: "scene:stairs",
    people: ["kindi"],
  },
  {
    id: "banquet",
    name: "Banquet floor",
    kicker: "First floor",
    description: "Wedding flowers, stacked chairs, and forty witnesses slowly going home.",
    x: 55,
    y: 42,
    building: "Al-Manar Hotel",
    background: "interview-room",
    people: ["lawati"],
  },
  {
    id: "room214",
    name: "Room 214",
    kicker: "Second floor",
    description: "A guest room sharing one thin wall with the service stairwell.",
    x: 68,
    y: 31,
    building: "Al-Manar Hotel",
    background: "interview-room",
    people: ["busaidi"],
  },
  {
    id: "room312",
    name: "Room 312",
    kicker: "Third floor",
    description: "The house doctor's room. The telephone was used after he says he fell asleep.",
    x: 57,
    y: 20,
    building: "Al-Manar Hotel",
    background: "interview-room",
    people: ["sharif"],
  },
];

export const locationById = (id) => LOCATIONS.find((location) => location.id === id);
