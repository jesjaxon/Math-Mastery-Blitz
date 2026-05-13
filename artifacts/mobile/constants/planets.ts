export interface CelestialBody {
  id: string;
  name: string;
  emoji: string;
  radius: number;        // visual + crash radius (world units)
  captureRadius: number; // proximity to trigger "at planet" event
  mu: number;            // gravitational parameter
  soi: number;           // sphere of influence radius (gravity only within this)
  color: string;         // accent/glow color
  x: number;             // world x (Sun at origin)
  y: number;             // world y
  isSun?: boolean;
  isEarth?: boolean;
  gem?: string;          // gem emoji collected on visit
  gemName?: string;
  launchCost: number;    // star coins to attempt mission
  travelHint: string;    // rough travel-time label for UI
}

// World layout: Sun at origin, Earth at (2000, 0).
// 1 world unit ≈ 1 screen pixel at zoom 1.0.
// Escape velocity from Earth orbit (~160 wu) with mu=5000: ~7.9 wu/tick.
// Max slingshot (90px × 0.1 scale) = 9 wu/tick — just enough to escape.

export const SOLAR_SYSTEM: CelestialBody[] = [
  {
    id: "sun",
    name: "Sun",
    emoji: "☀️",
    radius: 200,
    captureRadius: 0,
    mu: 2000,
    soi: 999999,
    color: "#FFE033",
    x: 0,
    y: 0,
    isSun: true,
    launchCost: 0,
    travelHint: "",
  },
  {
    id: "mercury",
    name: "Mercury",
    emoji: "🪨",
    radius: 28,
    captureRadius: 90,
    mu: 400,
    soi: 280,
    color: "#9E9E9E",
    x: 1300,
    y: -900,
    gem: "🩶",
    gemName: "Graphite Crystal",
    launchCost: 300,
    travelHint: "~8 sec",
  },
  {
    id: "venus",
    name: "Venus",
    emoji: "🌑",
    radius: 50,
    captureRadius: 130,
    mu: 800,
    soi: 420,
    color: "#E8B86D",
    x: -400,
    y: -1600,
    gem: "🟡",
    gemName: "Sulfur Stone",
    launchCost: 600,
    travelHint: "~14 sec",
  },
  {
    id: "earth",
    name: "Earth",
    emoji: "🌍",
    radius: 65,
    captureRadius: 120,
    mu: 5000,
    soi: 700,
    color: "#1B6B3A",
    x: 2000,
    y: 0,
    isEarth: true,
    launchCost: 0,
    travelHint: "",
  },
  {
    id: "moon",
    name: "Moon",
    emoji: "🌕",
    radius: 38,
    captureRadius: 110,
    mu: 900,
    soi: 330,
    color: "#AAAAAA",
    x: 2380,
    y: -420,
    gem: "🌙",
    gemName: "Moonstone",
    launchCost: 100,
    travelHint: "~4 sec",
  },
  {
    id: "mars",
    name: "Mars",
    emoji: "🔴",
    radius: 36,
    captureRadius: 110,
    mu: 600,
    soi: 380,
    color: "#C1440E",
    x: 4500,
    y: 1200,
    gem: "❤️‍🔥",
    gemName: "Fire Ruby",
    launchCost: 900,
    travelHint: "~18 sec",
  },
  {
    id: "jupiter",
    name: "Jupiter",
    emoji: "🟠",
    radius: 110,
    captureRadius: 250,
    mu: 5000,
    soi: 1100,
    color: "#C88B3A",
    x: -5200,
    y: 900,
    gem: "💛",
    gemName: "Golden Topaz",
    launchCost: 2500,
    travelHint: "~38 sec",
  },
  {
    id: "saturn",
    name: "Saturn",
    emoji: "🪐",
    radius: 85,
    captureRadius: 200,
    mu: 4000,
    soi: 950,
    color: "#E8D5A3",
    x: 5800,
    y: -5500,
    gem: "💎",
    gemName: "Diamond Ring",
    launchCost: 4000,
    travelHint: "~55 sec",
  },
  {
    id: "uranus",
    name: "Uranus",
    emoji: "🔵",
    radius: 65,
    captureRadius: 170,
    mu: 2500,
    soi: 800,
    color: "#7FD8E8",
    x: -3000,
    y: -8000,
    gem: "🩵",
    gemName: "Frost Aquamarine",
    launchCost: 6500,
    travelHint: "~1.2 min",
  },
  {
    id: "neptune",
    name: "Neptune",
    emoji: "🌀",
    radius: 60,
    captureRadius: 160,
    mu: 3000,
    soi: 850,
    color: "#4169E1",
    x: 2500,
    y: 10500,
    gem: "💙",
    gemName: "Deep Space Sapphire",
    launchCost: 9000,
    travelHint: "~2 min",
  },
];

export const EARTH_BODY = SOLAR_SYSTEM.find((b) => b.isEarth)!;
export const SUN_BODY = SOLAR_SYSTEM.find((b) => b.isSun)!;
