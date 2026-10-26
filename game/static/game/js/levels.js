/**
 * Coin Quest — Configurable Level Data (Levels 1 to 5)
 * Distinct geometries, platforms, collectible coins, moving hazards, and themes.
 */

window.LevelData = {
  1: {
    levelNumber: 1,
    title: "Verdant Groves",
    subtitle: "The Journey Begins",
    worldWidth: 2200,
    worldHeight: 650,
    spawn: { x: 100, y: 450 },
    portal: { x: 2050, y: 390, w: 48, h: 70 },
    targetCoins: 8,
    totalCoins: 10,
    parTimeSeconds: 40,
    theme: {
      bgTop: "#0d2818",
      bgBottom: "#040f0f",
      mountainColor: "#1b4332",
      platformTop: "#2d6a4f",
      platformBody: "#1b263b",
      accent: "#52b788"
    },
    platforms: [
      // Main starting ground
      { x: 0, y: 520, w: 480, h: 130, type: "solid" },
      // Stepping platforms
      { x: 540, y: 470, w: 180, h: 30, type: "solid" },
      { x: 780, y: 410, w: 180, h: 30, type: "solid" },
      { x: 1020, y: 350, w: 200, h: 30, type: "solid" },
      // Elevated upper route
      { x: 860, y: 240, w: 150, h: 25, type: "oneway" },
      { x: 1060, y: 190, w: 150, h: 25, type: "oneway" },
      // Middle ground stretch
      { x: 1280, y: 420, w: 280, h: 40, type: "solid" },
      // Stepping stones to portal
      { x: 1620, y: 460, w: 160, h: 30, type: "solid" },
      { x: 1840, y: 460, w: 360, h: 190, type: "solid" }
    ],
    coins: [
      { id: 1, x: 220, y: 470 },
      { id: 2, x: 340, y: 470 },
      { id: 3, x: 630, y: 420 },
      { id: 4, x: 870, y: 360 },
      { id: 5, x: 930, y: 190 },
      { id: 6, x: 1130, y: 140 },
      { id: 7, x: 1120, y: 300 },
      { id: 8, x: 1360, y: 370 },
      { id: 9, x: 1470, y: 370 },
      { id: 10, x: 1700, y: 410 }
    ],
    hazards: []
  },

  2: {
    levelNumber: 2,
    title: "Crystal Caverns",
    subtitle: "Gems and Gaps",
    worldWidth: 2600,
    worldHeight: 700,
    spawn: { x: 90, y: 480 },
    portal: { x: 2440, y: 430, w: 48, h: 70 },
    targetCoins: 12,
    totalCoins: 15,
    parTimeSeconds: 55,
    theme: {
      bgTop: "#0f172a",
      bgBottom: "#030712",
      mountainColor: "#1e293b",
      platformTop: "#06b6d4",
      platformBody: "#0f172a",
      accent: "#22d3ee"
    },
    platforms: [
      { x: 0, y: 550, w: 380, h: 150, type: "solid" },
      // Gap with pit spikes below
      { x: 460, y: 500, w: 170, h: 30, type: "solid" },
      { x: 700, y: 450, w: 180, h: 30, type: "solid" },
      // High crystal ledge
      { x: 620, y: 320, w: 140, h: 25, type: "oneway" },
      { x: 820, y: 260, w: 160, h: 25, type: "oneway" },
      { x: 950, y: 450, w: 220, h: 30, type: "solid" },
      // Mid-level island
      { x: 1240, y: 480, w: 300, h: 40, type: "solid" },
      // Stepping sequence
      { x: 1600, y: 420, w: 140, h: 25, type: "solid" },
      { x: 1810, y: 360, w: 150, h: 25, type: "solid" },
      { x: 2030, y: 440, w: 160, h: 30, type: "solid" },
      // Exit base
      { x: 2260, y: 500, w: 340, h: 200, type: "solid" }
    ],
    coins: [
      { id: 1, x: 180, y: 500 },
      { id: 2, x: 280, y: 500 },
      { id: 3, x: 540, y: 450 },
      { id: 4, x: 690, y: 270 },
      { id: 5, x: 790, y: 400 },
      { id: 6, x: 900, y: 210 },
      { id: 7, x: 1040, y: 400 },
      { id: 8, x: 1320, y: 430 },
      { id: 9, x: 1410, y: 430 },
      { id: 10, x: 1500, y: 430 },
      { id: 11, x: 1670, y: 370 },
      { id: 12, x: 1880, y: 310 },
      { id: 13, x: 2100, y: 390 },
      { id: 14, x: 2320, y: 450 },
      { id: 15, x: 2390, y: 450 }
    ],
    hazards: [
      { type: "spike", x: 380, y: 670, w: 80, h: 30, direction: "up" },
      { type: "spike", x: 630, y: 670, w: 70, h: 30, direction: "up" },
      { type: "spike", x: 880, y: 670, w: 70, h: 30, direction: "up" },
      { type: "spike", x: 1380, y: 460, w: 40, h: 20, direction: "up" },
      { type: "spike", x: 1740, y: 670, w: 70, h: 30, direction: "up" }
    ]
  },

  3: {
    levelNumber: 3,
    title: "Molten Core",
    subtitle: "Lava Ledges",
    worldWidth: 2900,
    worldHeight: 720,
    spawn: { x: 100, y: 470 },
    portal: { x: 2720, y: 370, w: 48, h: 70 },
    targetCoins: 14,
    totalCoins: 18,
    parTimeSeconds: 70,
    theme: {
      bgTop: "#2d0a00",
      bgBottom: "#0b0300",
      mountainColor: "#4a1204",
      platformTop: "#ea580c",
      platformBody: "#29150d",
      accent: "#f97316"
    },
    platforms: [
      { x: 0, y: 540, w: 320, h: 180, type: "solid" },
      // Moving platform 1
      { x: 380, y: 490, w: 140, h: 26, type: "moving", vx: 1.2, rangeX: 180 },
      // Island
      { x: 740, y: 440, w: 260, h: 35, type: "solid" },
      // Upper high ledge
      { x: 920, y: 290, w: 150, h: 25, type: "oneway" },
      { x: 1120, y: 240, w: 160, h: 25, type: "oneway" },
      // Moving platform 2 (vertical)
      { x: 1100, y: 460, w: 140, h: 26, type: "moving", vy: 1.1, rangeY: 130 },
      // Middle volcanic platform
      { x: 1340, y: 460, w: 340, h: 40, type: "solid" },
      // Moving platform 3
      { x: 1740, y: 430, w: 140, h: 26, type: "moving", vx: 1.5, rangeX: 200 },
      // Next island
      { x: 2090, y: 420, w: 260, h: 35, type: "solid" },
      // Final approach
      { x: 2420, y: 440, w: 140, h: 26, type: "moving", vx: 1.2, rangeX: 120 },
      { x: 2640, y: 440, w: 260, h: 280, type: "solid" }
    ],
    coins: [
      { id: 1, x: 160, y: 490 },
      { id: 2, x: 250, y: 490 },
      { id: 3, x: 450, y: 440 },
      { id: 4, x: 800, y: 390 },
      { id: 5, x: 980, y: 240 },
      { id: 6, x: 1190, y: 190 },
      { id: 7, x: 1170, y: 380 },
      { id: 8, x: 1400, y: 410 },
      { id: 9, x: 1500, y: 410 },
      { id: 10, x: 1600, y: 410 },
      { id: 11, x: 1810, y: 380 },
      { id: 12, x: 2150, y: 370 },
      { id: 13, x: 2260, y: 370 },
      { id: 14, x: 2480, y: 390 },
      { id: 15, x: 2690, y: 390 },
      { id: 16, x: 2780, y: 390 },
      { id: 17, x: 880, y: 390 },
      { id: 18, x: 1450, y: 320 }
    ],
    hazards: [
      // Patrol slime on platform 1
      { type: "patrol", x: 770, y: 410, w: 30, h: 30, minX: 750, maxX: 980, speed: 1.2, name: "Lava Slime" },
      // Spikes in pits
      { type: "spike", x: 320, y: 690, w: 420, h: 30, direction: "up" },
      // Patrol slime on platform 2
      { type: "patrol", x: 1400, y: 430, w: 30, h: 30, minX: 1360, maxX: 1650, speed: 1.5, name: "Fire Beetle" },
      { type: "spike", x: 1680, y: 690, w: 410, h: 30, direction: "up" },
      { type: "patrol", x: 2120, y: 390, w: 30, h: 30, minX: 2100, maxX: 2330, speed: 1.4, name: "Magma Golem" }
    ]
  },

  4: {
    levelNumber: 4,
    title: "Stormy Peaks",
    subtitle: "Windblown Heights",
    worldWidth: 3200,
    worldHeight: 760,
    spawn: { x: 80, y: 520 },
    portal: { x: 3020, y: 290, w: 48, h: 70 },
    targetCoins: 16,
    totalCoins: 20,
    parTimeSeconds: 80,
    theme: {
      bgTop: "#1e1b4b",
      bgBottom: "#090514",
      mountainColor: "#312e81",
      platformTop: "#818cf8",
      platformBody: "#1e1b4b",
      accent: "#a5b4fc"
    },
    platforms: [
      { x: 0, y: 590, w: 260, h: 170, type: "solid" },
      // Ascending stair ledges
      { x: 320, y: 530, w: 120, h: 25, type: "solid" },
      { x: 490, y: 460, w: 110, h: 25, type: "solid" },
      { x: 670, y: 390, w: 110, h: 25, type: "solid" },
      // High storm plateau
      { x: 860, y: 330, w: 280, h: 30, type: "solid" },
      // Overhead hazard ceiling
      { x: 860, y: 200, w: 280, h: 25, type: "solid" },
      // Moving platform through storm gap
      { x: 1220, y: 360, w: 130, h: 25, type: "moving", vx: 1.6, rangeX: 210 },
      // Middle cloud island
      { x: 1580, y: 390, w: 260, h: 30, type: "solid" },
      // Steeper drop & recover
      { x: 1910, y: 480, w: 120, h: 25, type: "solid" },
      { x: 2100, y: 420, w: 130, h: 25, type: "moving", vy: 1.4, rangeY: 140 },
      { x: 2320, y: 350, w: 220, h: 30, type: "solid" },
      // Moving sky ferry
      { x: 2620, y: 340, w: 130, h: 25, type: "moving", vx: 1.5, rangeX: 180 },
      // Final mountain peak
      { x: 2920, y: 360, w: 280, h: 400, type: "solid" }
    ],
    coins: [
      { id: 1, x: 140, y: 540 },
      { id: 2, x: 370, y: 480 },
      { id: 3, x: 540, y: 410 },
      { id: 4, x: 720, y: 340 },
      { id: 5, x: 920, y: 280 },
      { id: 6, x: 1000, y: 280 },
      { id: 7, x: 1080, y: 280 },
      { id: 8, x: 1300, y: 310 },
      { id: 9, x: 1640, y: 340 },
      { id: 10, x: 1740, y: 340 },
      { id: 11, x: 1960, y: 430 },
      { id: 12, x: 2160, y: 350 },
      { id: 13, x: 2380, y: 300 },
      { id: 14, x: 2460, y: 300 },
      { id: 15, x: 2700, y: 290 },
      { id: 16, x: 2970, y: 310 },
      { id: 17, x: 3080, y: 310 },
      { id: 18, x: 960, y: 150 },
      { id: 19, x: 1700, y: 260 },
      { id: 20, x: 2420, y: 230 }
    ],
    hazards: [
      // Ceiling spikes on the low tunnel
      { type: "spike", x: 910, y: 225, w: 180, h: 20, direction: "down" },
      // Patrol storm drone on middle island
      { type: "patrol", x: 1620, y: 360, w: 30, h: 30, minX: 1600, maxX: 1820, speed: 1.6, name: "Storm Drone" },
      // Spikes in bottom chasm
      { type: "spike", x: 260, y: 730, w: 600, h: 30, direction: "up" },
      { type: "spike", x: 1840, y: 730, w: 480, h: 30, direction: "up" },
      // Patrol storm sentry on final stretch
      { type: "patrol", x: 2360, y: 320, w: 30, h: 30, minX: 2330, maxX: 2520, speed: 1.5, name: "Electro Sentry" }
    ]
  },

  5: {
    levelNumber: 5,
    title: "The Neon Citadel",
    subtitle: "The Ultimate Gauntlet",
    worldWidth: 3600,
    worldHeight: 800,
    spawn: { x: 90, y: 550 },
    portal: { x: 3420, y: 290, w: 50, h: 72 },
    targetCoins: 20,
    totalCoins: 25,
    parTimeSeconds: 95,
    theme: {
      bgTop: "#18022e",
      bgBottom: "#05000a",
      mountainColor: "#3b0764",
      platformTop: "#d946ef",
      platformBody: "#1a0826",
      accent: "#f0abfc"
    },
    platforms: [
      // Entry dock
      { x: 0, y: 620, w: 280, h: 180, type: "solid" },
      // Stepping cyber beams
      { x: 340, y: 560, w: 100, h: 25, type: "solid" },
      { x: 500, y: 500, w: 110, h: 25, type: "solid" },
      // Patrol sector 1
      { x: 670, y: 440, w: 280, h: 30, type: "solid" },
      // High cyber conduit
      { x: 800, y: 310, w: 150, h: 22, type: "oneway" },
      { x: 1000, y: 260, w: 140, h: 22, type: "oneway" },
      // Dual moving platforms
      { x: 1040, y: 470, w: 120, h: 25, type: "moving", vx: 1.4, rangeX: 180 },
      { x: 1330, y: 420, w: 120, h: 25, type: "moving", vy: 1.5, rangeY: 130 },
      // Central Citadel Hub
      { x: 1540, y: 410, w: 380, h: 35, type: "solid" },
      // Floating neon blocks
      { x: 1980, y: 450, w: 90, h: 25, type: "solid" },
      { x: 2140, y: 390, w: 90, h: 25, type: "solid" },
      { x: 2300, y: 330, w: 110, h: 25, type: "solid" },
      // Moving ferry across core abyss
      { x: 2480, y: 360, w: 130, h: 25, type: "moving", vx: 1.7, rangeX: 240 },
      // Pre-boss spire
      { x: 2820, y: 370, w: 260, h: 30, type: "solid" },
      // Final ascents to throne
      { x: 3140, y: 340, w: 110, h: 25, type: "moving", vy: 1.3, rangeY: 100 },
      { x: 3320, y: 360, w: 280, h: 440, type: "solid" }
    ],
    coins: [
      { id: 1, x: 150, y: 570 },
      { id: 2, x: 390, y: 510 },
      { id: 3, x: 550, y: 450 },
      { id: 4, x: 720, y: 390 },
      { id: 5, x: 820, y: 390 },
      { id: 6, x: 870, y: 260 },
      { id: 7, x: 1060, y: 210 },
      { id: 8, x: 1120, y: 420 },
      { id: 9, x: 1380, y: 360 },
      { id: 10, x: 1600, y: 360 },
      { id: 11, x: 1700, y: 360 },
      { id: 12, x: 1800, y: 360 },
      { id: 13, x: 1900, y: 360 },
      { id: 14, x: 2020, y: 400 },
      { id: 15, x: 2180, y: 340 },
      { id: 16, x: 2350, y: 280 },
      { id: 17, x: 2560, y: 310 },
      { id: 18, x: 2870, y: 320 },
      { id: 19, x: 2950, y: 320 },
      { id: 20, x: 3030, y: 320 },
      { id: 21, x: 3190, y: 270 },
      { id: 22, x: 3370, y: 310 },
      { id: 23, x: 3460, y: 310 },
      { id: 24, x: 760, y: 210 },
      { id: 25, x: 2240, y: 200 }
    ],
    hazards: [
      // Patrol droid 1
      { type: "patrol", x: 700, y: 410, w: 30, h: 30, minX: 680, maxX: 930, speed: 1.6, name: "Neon Stalker" },
      // Central hub sentry
      { type: "patrol", x: 1620, y: 380, w: 30, h: 30, minX: 1560, maxX: 1900, speed: 1.7, name: "Citadel Guardian" },
      // Bottom spikes
      { type: "spike", x: 280, y: 770, w: 760, h: 30, direction: "up" },
      { type: "spike", x: 1980, y: 770, w: 840, h: 30, direction: "up" },
      // Pre-portal sentry
      { type: "patrol", x: 2860, y: 340, w: 30, h: 30, minX: 2840, maxX: 3060, speed: 1.8, name: "Core Overlord" }
    ]
  }
};
