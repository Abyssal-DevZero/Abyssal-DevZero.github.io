// Player State
const player = {
  health: 100,
  maxHealth: 100,
  mana: 50,
  maxMana: 50,
  gold: 0,
  attack: 5,
  resources: {
    wood: 0,
    stone: 0,
    herb: 0,
  },
  tools: [],
  inCombat: false,
  currentEnemy: null,
};

// Follower System
//====
const activeFollowers = [];

//Mitglieder
function recruitFollower(defName) {
  const def = followerDefs.find(f => f.name === defName);
  if (!def) return;
  if (activeFollowers.find(f => f.name === def.name)) return; //Duplicate guard

  const follower = {
    name: def.name,
    task: def.task,
    progress: 0,
    intervalId: null,
  };
  activeFollowers.push(follower);
  startFollowerLoop(follower);
  renderFollowers();
  print(`<strong>${follower.name}</strong> has joined you. They will gather ${follower.task}.`, "#c89a5a");
}

function startFollowerLoop(follower) {
  follower.intervalId = setInterval(() => {
    follower.progress += 5;
    if (follower.progress >= 100) {
      follower.progress = 0;
      runFollowerTask(follower);
    }
    renderFollowers();
  }, 100);
}

function runFollowerTask(follower) {
  switch (follower.task) {
    case "Wood":
      player.resources.wood += player.tools.includes("Pickaxe") ? 3 : 1;
      break;
    case "Stone":
      player.resources.stone += player.tools.includes("Pickaxe") ? 3 : 1;
      break;
    case "Herb":
      if (Math.random() > 0.4) player.resources.herb += 1;
      break;
    default:
      // Crafting task — consume resources and produce the item if affordable
      const recipe = recipes.find(r => r.name === follower.task);
      if (recipe) {
        const canDo = Object.entries(recipe.cost).every(
          ([res, amt]) => player.resources[res] >= amt
        );
        if (canDo) {
          for (const [res, amt] of Object.entries(recipe.cost)) {
            player.resources[res] -= amt;
          }
          if (recipe.gives.tool) player.tools.push(recipe.gives.tool);
          if (recipe.gives.heal) {
            player.health = Math.min(player.maxHealth, player.health + recipe.gives.heal);
          }
        }
      }
  }
  updateUI();
}

function renderFollowers() {
  const container = document.getElementById("followers-list");
  if (!container) return;

  container.innerHTML = "";

  if (activeFollowers.length === 0) {
    container.innerHTML = '<p style="color:var(--text-dim);font-size:12px;">No followers yet.</p>';
    return;
  }

  activeFollowers.forEach(follower => {
    const card = document.createElement("div");
    card.className = "follower-card";
    card.innerHTML = `
      <div class="follower-header">
        <span class="follower-name">${follower.name}</span>
        <span class="follower-task">${follower.task}</span>
      </div>
      <div class="follower-track">
        <div class="follower-fill" style="width:${follower.progress}%"></div>
      </div>
    `;
    container.appendChild(card);
  });
}

// rooms and monsters are defined in world.js (loaded before this file)

// The id of the room the player is currently in
let currentRoomId = "cave-entrance";

// Helper: get the room object for the current room
function getCurrentRoom() {
  return rooms.find(r => r.id === currentRoomId);
}

// Helper: get a room by id
function getRoom(id) {
  return rooms.find(r => r.id === id);
}

// Helper: show or hide an element by id
function setVisible(id, visible) {
  const el = document.getElementById(id);
  if (el) el.style.display = visible ? "" : "none";
}

// Helper: enable or disable a button by id
function setEnabled(id, enabled) {
  const el = document.getElementById(id);
  if (el) el.disabled = !enabled;
}

// Helper: returns true if the player can afford a recipe by name
function canAfford(recipeName) {
  const recipe = recipes.find(r => r.name === recipeName);
  if (!recipe) return false;
  for (const resource in recipe.cost) {
    if (player.resources[resource] < recipe.cost[resource]) return false;
  }
  return true;
}

// ============================================================
// CRAFTING RECIPES
// cost = what you need,  gives = what you get
// ============================================================
const recipes = [
  {
    name: "Torch",
    cost: { wood: 2 },
    gives: { tool: "Torch" },
    description: "Lights the darkness.",
  },
  {
    name: "Pickaxe",
    cost: { wood: 3, stone: 2 },
    gives: { tool: "Pickaxe" },
    description: "Mine stone faster.",
  },
  {
    name: "Health Potion",
    cost: { herb: 3 },
    gives: { heal: 30 },
    description: "Restores 30 health.",
  },
];

// PRINT — your main way to show text to the player
function print(text, color) {
  const log = document.getElementById("log");
  const p = document.createElement("p");
  p.innerHTML = text;
  if (color) p.style.color = color;
  log.appendChild(p);
  // Auto-scroll to the bottom
  log.scrollTop = log.scrollHeight;
}

// UPDATE UI — refreshes the sidebar numbers and tool list

function updateUI() {
  // Resources
  document.getElementById("res-health").textContent =
    player.health + " / " + player.maxHealth;
  document.getElementById("res-mana").textContent =
    player.mana + " / " + player.maxMana;
  document.getElementById("res-gold").textContent   = player.gold;
  document.getElementById("res-wood").textContent   = player.resources.wood;
  document.getElementById("res-stone").textContent  = player.resources.stone;
  document.getElementById("res-herb").textContent   = player.resources.herb;

  // Map — room name and progress bar
  const room = getCurrentRoom();
  document.getElementById("map-room-name").textContent = room.name;
  document.getElementById("map-progress-fill").style.width = room.progress + "%";
  document.getElementById("map-progress-pct").textContent  = room.progress + "%";

  // Re-draw the node map
  renderMap();

  // Time — ??:?? until the player has a Sundial
  const hasTime = player.tools.includes("Sundial");
  document.getElementById("time-display").textContent = hasTime ? getGameTime() : "??:??";

  // Tools list
  const toolsPanel = document.getElementById("tools-list");
  if (player.tools.length === 0) {
    toolsPanel.textContent = "None";
  } else {
    toolsPanel.textContent = player.tools.join(", ");
  }

  // Show buttons unlocked by visited rooms
  // A room is "visited" once the player has entered it (progress > 0 or it's current)
  rooms.forEach(room => {
    const visited = room.id === currentRoomId || room.progress > 0;
    if (visited) {
      room.unlocks.forEach(btnId => setVisible(btnId, true));
    }
  });

  // Disable buttons when conditions aren't met
  setEnabled("btn-craft-torch",   canAfford("Torch"));
  setEnabled("btn-craft-pickaxe", canAfford("Pickaxe"));
  setEnabled("btn-craft-potion",  canAfford("Health Potion"));
  setEnabled("btn-explore",       player.tools.includes("Torch"));

  // Show/hide combat vs explore — only when cave tab is active
  const onCaveTab = document.querySelector('.tab[data-tab="cave"]')?.classList.contains("active");
  if (onCaveTab) {
    document.getElementById("combat-section").style.display  = player.inCombat ? "block" : "none";
    document.getElementById("explore-section").style.display = player.inCombat ? "none"  : "block";
  }
}

// ============================================================
// ACTIONS — things the player can do
// ============================================================

// ============================================================
// WITH DELAY — runs an action after a 2-second button fill
// btn  = the button element (pass `this` from onclick)
// fn   = the function to call when the timer is up
// ============================================================
function withDelay(btn, fn, ms = 2000) {
  if (btn.classList.contains("loading")) return;
  btn.style.setProperty("--fill-duration", ms + "ms");
  btn.classList.add("loading");
  btn.disabled = true;
  setTimeout(() => {
    btn.classList.remove("loading");
    btn.style.removeProperty("--fill-duration");
    btn.disabled = false;
    fn();
  }, ms);
}

// -- Gathering --

function gatherWood() {
  const amount = player.tools.includes("Pickaxe") ? 3 : 1;
  player.resources.wood += amount;
  print(`You gather ${amount} wood.`);
  updateUI();
}

function gatherStone() {
  const amount = player.tools.includes("Pickaxe") ? 3 : 1;
  player.resources.stone += amount;
  print(`You chip away ${amount} stone.`);
  updateUI();
}

function gatherHerb() {
  const found = Math.random() > 0.4; // 60% chance to find a herb
  if (found) {
    player.resources.herb += 1;
    print(`You find a glowing herb tucked in the rocks.`, "#6aaa6a");
  } else {
    print(`You search but find no herbs here.`);
  }
  updateUI();
}

// -- Crafting --

function craft(recipeName) {
  // Find the recipe by name
  const recipe = recipes.find(r => r.name === recipeName);
  if (!recipe) return;

  // Check if we already have this tool
  if (recipe.gives.tool && player.tools.includes(recipe.gives.tool)) {
    print(`You already have a ${recipe.gives.tool}.`);
    return;
  }

  // Check we have enough resources
  for (const resource in recipe.cost) {
    if (player.resources[resource] < recipe.cost[resource]) {
      print(
        `Not enough ${resource}. Need ${recipe.cost[resource]}, have ${player.resources[resource]}.`,
        "#aa4444"
      );
      return;
    }
  }

  // Deduct the cost
  for (const resource in recipe.cost) {
    player.resources[resource] -= recipe.cost[resource];
  }

  // Apply the reward
  if (recipe.gives.tool) {
    player.tools.push(recipe.gives.tool);
    print(`You craft a <strong>${recipe.gives.tool}</strong>. ${recipe.description}`, "#c89a5a");
  }
  if (recipe.gives.heal) {
    player.health = Math.min(player.maxHealth, player.health + recipe.gives.heal);
    print(`You drink the potion and recover ${recipe.gives.heal} health.`, "#6aaa6a");
  }

  updateUI();
}

// -- Exploring --

function explore() {
  const room = getCurrentRoom();

  // Exploring costs 1 torch
  if (!player.tools.includes("Torch")) {
    print("You need a <strong>Torch</strong> to venture into the dark.", "#aa4444");
    return;
  }
  // Remove one torch from tools
  player.tools.splice(player.tools.indexOf("Torch"), 1);

  // Already fully explored — prompt the player to move via the map
  if (room.progress >= 100) {
    print(`You have explored all of <strong>${room.name}</strong>. Check the Map to move on.`);
    return;
  }

  // Advance progress and game time by 10% per action
  const step = 100 / room.explorations;
  room.progress = Math.min(100, room.progress + step);
  gameTotalMinutes += 15;

  // At 100%, unlock all connected rooms and tell the player
  if (room.progress === 100) {
    room.connections.forEach(id => {
      const neighbour = getRoom(id);
      if (neighbour.locked) {
        neighbour.locked = false;
        print(`A passage to <strong>${neighbour.name}</strong> has opened.`, "#c89a5a");
      }
    });
    print(`You have fully explored <strong>${room.name}</strong>. Open the Map to travel.`, "#c89a5a");
    updateUI();
    return;
  }

  // Roll for a monster encounter
  if (Math.random() < room.encounter) {
    startCombat();
    return;
  }

  // No fight — ambient event
  const roll = Math.random();
  if (roll < 0.35) {
    const amount = Math.floor(Math.random() * 6) + 1;
    player.gold += amount;
    print(`You find ${amount} gold coins in a crevice.`, "#c89a5a");
  } else {
    const messages = [
      "You press deeper. Dripping water echoes around you.",
      "A cold breeze passes through. The darkness presses in.",
      "You find old bones but nothing useful.",
      "The tunnel twists and turns. You find nothing.",
    ];
    print(messages[Math.floor(Math.random() * messages.length)]);
  }
  updateUI();
}

// Move the player to a different room (called by clicking a node on the map)
function travelTo(id) {
  const current = getCurrentRoom();
  const target  = getRoom(id);

  if (!target) return;
  if (target.locked) { print(`That passage is not yet open.`); return; }
  if (id === currentRoomId) { print(`You are already here.`); return; }
  if (!current.connections.includes(id)) { print(`There is no direct path there.`); return; }

  currentRoomId = id;
  print(`You travel to <strong>${target.name}</strong>.`, "#c89a5a");
  print(target.flavor);

  // Check if a follower is found in this room
  const found = followerDefs.find(f => f.unlockRoom === id);
  if (found && !activeFollowers.find(f => f.name === found.name)) {
    recruitFollower(found.name);
  }

  updateUI();
}

// ============================================================
// COMBAT
// ============================================================

function startCombat() {
  // Pick a random enemy name from the current room's enemy list
  const room = getCurrentRoom();
  const enemyName = room.enemies[Math.floor(Math.random() * room.enemies.length)];

  // Find the matching monster template and copy it (so each fight is fresh)
  const template = monsters.find(m => m.name === enemyName);
  player.currentEnemy = { ...template };
  player.inCombat = true;

  print(`⚔️ A <strong>${player.currentEnemy.name}</strong> leaps from the shadows!`, "#aa4444");
  updateUI();
}

function playerAttack() {
  if (!player.inCombat) return;

  const enemy = player.currentEnemy;

  // Player hits enemy
  const dmg = player.attack + Math.floor(Math.random() * 4); // attack + 0-3 random
  enemy.health -= dmg;
  print(`You strike the ${enemy.name} for <strong>${dmg}</strong> damage.`);

  // Check if enemy is dead
  if (enemy.health <= 0) {
    print(`The ${enemy.name} collapses. You earn ${enemy.gold} gold.`, "#c89a5a");
    player.gold += enemy.gold;
    player.inCombat = false;
    player.currentEnemy = null;
    updateUI();
    return;
  }

  // Enemy hits back
  const enemyDmg = enemy.attack + Math.floor(Math.random() * 3);
  player.health -= enemyDmg;
  print(
    `The ${enemy.name} hits you for <strong>${enemyDmg}</strong> damage.`,
    "#aa4444"
  );

  // Check if player is dead
  if (player.health <= 0) {
    player.health = 0;
    print(`☠️ You have been defeated...`, "#aa4444");
    player.inCombat = false;
    player.currentEnemy = null;
    // Disable all buttons
    document.querySelectorAll(".btn").forEach(btn => (btn.disabled = true));
  }

  updateUI();
}

function playerFlee() {
  if (!player.inCombat) return;

  // 50% chance to flee
  if (Math.random() > 0.5) {
    print(`You manage to escape from the ${player.currentEnemy.name}!`);
    player.inCombat = false;
    player.currentEnemy = null;
  } else {
    const dmg = player.currentEnemy.attack;
    player.health -= dmg;
    print(
      `You try to flee but the ${player.currentEnemy.name} strikes you for ${dmg} damage!`,
      "#aa4444"
    );
    if (player.health <= 0) {
      player.health = 0;
      print(`☠️ You have been defeated...`, "#aa4444");
      player.inCombat = false;
      player.currentEnemy = null;
      document.querySelectorAll(".btn").forEach(btn => (btn.disabled = true));
    }
  }
  updateUI();
}

// ============================================================
// ============================================================
// GAME TIME
// Each explore advances time by 15 minutes (game time)
// ============================================================
let gameTotalMinutes = 360; // start at 06:00

function getGameTime() {
  const h = Math.floor(gameTotalMinutes / 60) % 24;
  const m = gameTotalMinutes % 60;
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}


// ============================================================
// MAP RENDERING
// Draws the node graph into #map-content inside the overlay SVG.
// Called every time updateUI() runs.
// ============================================================
// ============================================================
// MAP PAN STATE
// ============================================================
let mapPanX = 0;
let mapPanY = 0;

function initMapDrag() {
  const overlay = document.getElementById("map-overlay");
  if (!overlay) return;

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startPanX = 0;
  let startPanY = 0;

  overlay.addEventListener("mousedown", e => {
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startPanX = mapPanX;
    startPanY = mapPanY;
    e.preventDefault(); // stops text selection while dragging
  });

  window.addEventListener("mousemove", e => {
    if (!dragging) return;
    mapPanX = startPanX + (e.clientX - startX);
    mapPanY = startPanY + (e.clientY - startY);
    applyMapPan();
  });

  window.addEventListener("mouseup", () => { dragging = false; });
}

function resetMapView() {
  mapPanX = 0;
  mapPanY = 0;
  applyMapPan();
}

function applyMapPan() {
  const g = document.getElementById("map-content");
  if (g) g.setAttribute("transform", `translate(${mapPanX}, ${mapPanY})`);
}

function renderMap() {
  const g = document.getElementById("map-content");
  if (!g) return;

  // Clear previous render — only the content group, not the whole SVG
  g.innerHTML = "";

  // Only draw rooms the player knows about (not locked)
  const visibleRooms = rooms.filter(r => !r.locked);

  // ── Helper: create a namespaced SVG element ──
  function el(tag, attrs) {
    const e = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  }

  // ── Draw connection lines first (so nodes sit on top) ──
  const drawn = new Set();
  visibleRooms.forEach(room => {
    room.connections.forEach(targetId => {
      const target = getRoom(targetId);
      if (!target || target.locked) return; // only draw lines between known rooms
      const key = [room.id, targetId].sort().join("-");
      if (drawn.has(key)) return;
      drawn.add(key);

      g.appendChild(el("line", {
        x1: room.x,   y1: room.y,
        x2: target.x, y2: target.y,
        stroke: "#2e2e2e",
        "stroke-width": "1",
      }));
    });
  });

  // ── Draw each visible room as a node ──
  const NODE = 9;

  visibleRooms.forEach(room => {
    const isCurrent  = room.id === currentRoomId;
    const isAdjacent = !isCurrent && getCurrentRoom().connections.includes(room.id);

    let fill       = "#181818";
    let stroke     = "#333";
    let labelColor = "#444";
    let cursor     = "default";

    if (isCurrent) {
      fill       = "#8a6a3a";
      stroke     = "#c89a5a";
      labelColor = "#c89a5a";
    } else if (isAdjacent) {
      fill       = "#1e1e1e";
      stroke     = "#555";
      labelColor = "#aaa";
      cursor     = "pointer";
    }

    const group = el("g", { cursor });
    if (isAdjacent) group.addEventListener("click", () => travelTo(room.id));

    group.appendChild(el("rect", {
      x: room.x - NODE, y: room.y - NODE,
      width: NODE * 2,  height: NODE * 2,
      rx: "2", fill, stroke, "stroke-width": "1",
    }));

    const label = el("text", {
      x: room.x, y: room.y + NODE + 10,
      "text-anchor": "middle",
      "font-family": "'Share Tech Mono', monospace",
      "font-size": "8",
      fill: labelColor,
    });
    label.textContent = room.name;
    group.appendChild(label);

    g.appendChild(group);
  });
}

// ============================================================
// TAB SWITCHING
// ============================================================
function showTab(name) {
  document.getElementById("explore-section").style.display = name === "cave"      ? "block" : "none";
  document.getElementById("combat-section").style.display  = name === "cave"      ? ""      : "none";
  document.getElementById("followers-panel").style.display = name === "followers" ? "block" : "none";

  document.querySelectorAll(".tab").forEach(t => {
    t.classList.toggle("active", t.dataset.tab === name);
  });
}

// START THE GAME
// ============================================================
print("You wake up in a dark cave...");
print("The air is cold. Something moves in the shadows.");
print("Gather resources, craft tools, and survive.");
initMapDrag();
updateUI();

// Recruit any follower whose unlockRoom is the starting room
followerDefs
  .filter(f => f.unlockRoom === currentRoomId)
  .forEach(f => recruitFollower(f.name));
