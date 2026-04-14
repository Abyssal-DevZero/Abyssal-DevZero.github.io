// ============================================================
// WORLD DATA
// Add new rooms and monsters here freely — game.js handles logic.
// ============================================================

// ── MONSTERS ─────────────────────────────────────────────────

const monsters = [
  { name: "Cave Rat",    health: 15, maxHealth: 15, attack: 3,  gold: 2  },
  { name: "Giant Spider",health: 25, maxHealth: 25, attack: 6,  gold: 5  },
  { name: "Cave Troll",  health: 50, maxHealth: 50, attack: 12, gold: 15 },
];

// ── ROOMS ─────────────────────────────────────────────────────
// unlocks — button IDs that become visible when the player enters this room

const rooms = [
  {
    id: "cave-entrance",
    name: "Cave Entrance",
    x: 70,  y: 130,
    locked: false,
    progress: 0,
    explorations: 2,
    encounter: 0,
    enemies: [],
    connections: ["dark-tunnel", "mushroom-grotto"],
    unlocks: [],   // Wood gathering + Torch craft are available from the start
    flavor: "The cave mouth looms behind you. Damp air clings to your skin.",
  },
  {
    id: "dark-tunnel",
    name: "Dark Tunnel",
    x: 200, y: 60,
    locked: true,
    progress: 0,
    explorations: 5,
    encounter: 0.40,
    enemies: ["Cave Rat", "Giant Spider"],
    connections: ["cave-entrance", "underground-lake", "collapsed-shaft"],
    unlocks: ["btn-gather-stone", "btn-craft-pickaxe"],
    flavor: "The passage narrows. Cobwebs brush your face in the dark.",
  },
  {
    id: "mushroom-grotto",
    name: "Mushroom Grotto",
    x: 200, y: 200,
    locked: true,
    progress: 0,
    explorations: 4,
    encounter: 0.30,
    enemies: ["Cave Rat", "Giant Spider"],
    connections: ["cave-entrance", "collapsed-shaft"],
    unlocks: ["btn-gather-herb", "btn-craft-potion", "tab-followers"],
    flavor: "Faintly glowing mushrooms line the walls. The silence is total.",
  },
  {
    id: "underground-lake",
    name: "Underground Lake",
    x: 330, y: 60,
    locked: true,
    progress: 0,
    explorations: 6,
    encounter: 0.40,
    enemies: ["Giant Spider", "Cave Troll"],
    connections: ["dark-tunnel", "crystal-cavern"],
    unlocks: [],
    flavor: "A vast black lake stretches before you. Something stirs beneath.",
  },
  {
    id: "collapsed-shaft",
    name: "Collapsed Shaft",
    x: 330, y: 145,
    locked: true,
    progress: 0,
    explorations: 7,
    encounter: 0.45,
    enemies: ["Giant Spider", "Cave Troll"],
    connections: ["dark-tunnel", "mushroom-grotto", "crystal-cavern", "the-deep"],
    unlocks: [],
    flavor: "Broken timbers and rubble fill the air with dust. Something crushed this place.",
  },
  {
    id: "crystal-cavern",
    name: "Crystal Cavern",
    x: 460, y: 80,
    locked: true,
    progress: 0,
    explorations: 8,
    encounter: 0.50,
    enemies: ["Giant Spider", "Cave Troll"],
    connections: ["underground-lake", "collapsed-shaft", "the-deep"],
    unlocks: [],
    flavor: "Pale crystals line the walls, casting eerie light. You are not alone.",
  },
  {
    id: "the-deep",
    name: "The Deep",
    x: 460, y: 210,
    locked: true,
    progress: 0,
    explorations: 10,
    encounter: 0.65,
    enemies: ["Cave Troll"],
    connections: ["collapsed-shaft", "crystal-cavern"],
    unlocks: [],
    flavor: "There is no light here except what you carry. Something breathes nearby.",
  },
];

// ── FOLLOWERS ─────────────────────────────────────────────────
// name — shown on the card
// task — what they do, fixed. "Wood", "Stone", "Herb", or a recipe name
// unlockRoom — the room id where this follower is found

const followerDefs = [
  { name: "Mira",   task: "Wood",  unlockRoom: "mushroom-grotto" },
  { name: "Gorric", task: "Stone", unlockRoom: "dark-tunnel"     },
  { name: "Selka",  task: "Herb",  unlockRoom: "the-deep" },
  { name: "Dwyn",   task: "Torch", unlockRoom: "collapsed-shaft" },
];