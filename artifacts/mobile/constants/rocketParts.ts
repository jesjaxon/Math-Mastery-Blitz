export interface RocketPart {
  id: string;
  name: string;
  emoji: string;
  cost: number; // star coins
  description: string;
  order: number; // display order
}

export const ROCKET_PARTS: RocketPart[] = [
  {
    id: "solar_panels",
    name: "Solar Panels",
    emoji: "☀️",
    cost: 150,
    description: "Power from the sun to fuel your journey",
    order: 1,
  },
  {
    id: "fuselage",
    name: "Fuselage",
    emoji: "🛸",
    cost: 200,
    description: "The main body — holds everything together",
    order: 2,
  },
  {
    id: "fuel_tank",
    name: "Fuel Tank",
    emoji: "⛽",
    cost: 250,
    description: "Liquid hydrogen and oxygen, fully loaded",
    order: 3,
  },
  {
    id: "engine",
    name: "Engine Module",
    emoji: "🔥",
    cost: 350,
    description: "3.5 million pounds of thrust",
    order: 4,
  },
  {
    id: "navigation",
    name: "Navigation System",
    emoji: "📡",
    cost: 400,
    description: "Precise targeting to the moon and back",
    order: 5,
  },
  {
    id: "command_module",
    name: "Command Module",
    emoji: "🚀",
    cost: 500,
    description: "Your cockpit among the stars",
    order: 6,
  },
];

export const ROCKET_PARTS_TOTAL_COST = ROCKET_PARTS.reduce(
  (sum, p) => sum + p.cost,
  0
);
