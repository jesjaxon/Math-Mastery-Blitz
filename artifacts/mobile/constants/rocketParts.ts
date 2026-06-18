export interface RocketPart {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  description: string;
  order: number;
  levelRequired: number;
}

export const ROCKET_PARTS: RocketPart[] = [
  {
    id: "solar_panels",
    name: "Solar Panels",
    emoji: "☀️",
    cost: 20,
    description: "Power from the sun to fuel your journey",
    order: 1,
    levelRequired: 6,
  },
  {
    id: "fuselage",
    name: "Fuselage",
    emoji: "🛸",
    cost: 30,
    description: "The main body — holds everything together",
    order: 2,
    levelRequired: 7,
  },
  {
    id: "fuel_tank",
    name: "Fuel Tank",
    emoji: "⛽",
    cost: 40,
    description: "Liquid hydrogen and oxygen, fully loaded",
    order: 3,
    levelRequired: 8,
  },
  {
    id: "engine",
    name: "Engine Module",
    emoji: "🔥",
    cost: 55,
    description: "3.5 million pounds of thrust",
    order: 4,
    levelRequired: 9,
  },
  {
    id: "navigation",
    name: "Navigation System",
    emoji: "📡",
    cost: 65,
    description: "Precise targeting to the moon and back",
    order: 5,
    levelRequired: 10,
  },
  {
    id: "command_module",
    name: "Command Module",
    emoji: "🚀",
    cost: 80,
    description: "Your cockpit among the stars",
    order: 6,
    levelRequired: 11,
  },
];

export const ROCKET_PARTS_TOTAL_COST = ROCKET_PARTS.reduce(
  (sum, p) => sum + p.cost,
  0
);
