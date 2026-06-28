import type { ImageSourcePropType } from "react-native";

export interface RocketPart {
  id: string;
  name: string;
  emoji: string;
  asset: ImageSourcePropType;
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
    asset: require("@/assets/game/rocket/solar_panels.png"),
    cost: 20,
    description: "Power from the sun to fuel your journey",
    order: 1,
    levelRequired: 1,
  },
  {
    id: "fuselage",
    name: "Fuselage",
    emoji: "🛸",
    asset: require("@/assets/game/rocket/fuselage.png"),
    cost: 30,
    description: "The main body — holds everything together",
    order: 2,
    levelRequired: 1,
  },
  {
    id: "fuel_tank",
    name: "Fuel Tank",
    emoji: "⛽",
    asset: require("@/assets/game/rocket/fuel_tank.png"),
    cost: 40,
    description: "Liquid hydrogen and oxygen, fully loaded",
    order: 3,
    levelRequired: 1,
  },
  {
    id: "engine",
    name: "Engine Module",
    emoji: "🔥",
    asset: require("@/assets/game/rocket/engine.png"),
    cost: 55,
    description: "3.5 million pounds of thrust",
    order: 4,
    levelRequired: 1,
  },
  {
    id: "navigation",
    name: "Navigation System",
    emoji: "📡",
    asset: require("@/assets/game/rocket/navigation.png"),
    cost: 65,
    description: "Precise targeting to the moon and back",
    order: 5,
    levelRequired: 1,
  },
  {
    id: "command_module",
    name: "Command Module",
    emoji: "🚀",
    asset: require("@/assets/game/rocket/command_module.png"),
    cost: 80,
    description: "Your cockpit among the stars",
    order: 6,
    levelRequired: 1,
  },
];

export const ROCKET_PARTS_TOTAL_COST = ROCKET_PARTS.reduce(
  (sum, p) => sum + p.cost,
  0
);

export const ROCKET_ASSETS = {
  assemblyBay: require("@/assets/game/rocket/assembly-bay.png"),
  assembledRocket: require("@/assets/game/rocket/assembled-rocket.png"),
} satisfies Record<string, ImageSourcePropType>;
