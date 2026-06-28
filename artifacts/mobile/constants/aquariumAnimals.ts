import type { ImageSourcePropType } from "react-native";

export type AnimalRarity = "common" | "uncommon" | "rare" | "legendary";
export type AquariumHabitat = "reef" | "freshwater" | "tidepool" | "kelp" | "ocean";

export interface AquariumAnimal {
  id: string;
  name: string;
  emoji: string;
  asset: ImageSourcePropType;
  habitat: AquariumHabitat;
  price: number;
  rarity: AnimalRarity;
  starCoinsPerHour: number;
  description: string;
  levelRequired: number;
}

export const AQUARIUM_ANIMALS: AquariumAnimal[] = [
  { id: "fish",       name: "Goldfish",       emoji: "🐟", asset: require("@/assets/game/aquarium/fish.png"),       habitat: "freshwater", price: 30,   rarity: "common",    starCoinsPerHour: 2,  description: "A classic splash of color",             levelRequired: 1  },
  { id: "clownfish",  name: "Clownfish",      emoji: "🐠", asset: require("@/assets/game/aquarium/clownfish_safe.png"),  habitat: "reef",       price: 45,   rarity: "common",    starCoinsPerHour: 3,  description: "Found it!",                             levelRequired: 2  },
  { id: "crab",       name: "Blue Crab",      emoji: "🦀", asset: require("@/assets/game/aquarium/crab_safe.png"),       habitat: "tidepool",   price: 50,   rarity: "common",    starCoinsPerHour: 4,  description: "Pinches all the wrong answers",         levelRequired: 2  },
  { id: "shrimp",     name: "Neon Shrimp",    emoji: "🦐", asset: require("@/assets/game/aquarium/shrimp.png"),     habitat: "reef",       price: 65,   rarity: "common",    starCoinsPerHour: 4,  description: "Tiny but energetic",                    levelRequired: 3  },
  { id: "pufferfish", name: "Pufferfish",     emoji: "🐡", asset: require("@/assets/game/aquarium/pufferfish.png"), habitat: "reef",       price: 80,   rarity: "common",    starCoinsPerHour: 5,  description: "Puffs up on wrong answers",             levelRequired: 3  },
  { id: "coral",      name: "Brain Coral",    emoji: "🪸", asset: require("@/assets/game/aquarium/coral.png"),      habitat: "reef",       price: 110,  rarity: "uncommon",  starCoinsPerHour: 7,  description: "As smart as it looks",                  levelRequired: 5  },
  { id: "lobster",    name: "Lobster",        emoji: "🦞", asset: require("@/assets/game/aquarium/lobster_safe.png"),    habitat: "tidepool",   price: 110,  rarity: "uncommon",  starCoinsPerHour: 6,  description: "Red hot and unafraid",                  levelRequired: 5  },
  { id: "squid",      name: "Squid",          emoji: "🦑", asset: require("@/assets/game/aquarium/squid.png"),      habitat: "kelp",       price: 140,  rarity: "uncommon",  starCoinsPerHour: 8,  description: "Has an ink-redible memory",             levelRequired: 6  },
  { id: "octopus",    name: "Octopus",        emoji: "🐙", asset: require("@/assets/game/aquarium/octopus.png"),    habitat: "kelp",       price: 170,  rarity: "uncommon",  starCoinsPerHour: 10, description: "Eight arms, infinite hugs",             levelRequired: 7  },
  { id: "otter",      name: "Sea Otter",      emoji: "🦦", asset: require("@/assets/game/aquarium/otter.png"),      habitat: "kelp",       price: 210,  rarity: "rare",      starCoinsPerHour: 14, description: "Floats through life on its back",       levelRequired: 8  },
  { id: "seal",       name: "Seal",           emoji: "🦭", asset: require("@/assets/game/aquarium/seal.png"),       habitat: "tidepool",   price: 280,  rarity: "rare",      starCoinsPerHour: 18, description: "Claps for every correct answer",        levelRequired: 9  },
  { id: "dolphin",    name: "Dolphin",        emoji: "🐬", asset: require("@/assets/game/aquarium/dolphin.png"),    habitat: "ocean",      price: 420,  rarity: "rare",      starCoinsPerHour: 25, description: "The smartest student in the tank",      levelRequired: 11 },
  { id: "shark",      name: "Hammerhead",     emoji: "🦈", asset: require("@/assets/game/aquarium/shark.png"),      habitat: "ocean",      price: 500,  rarity: "rare",      starCoinsPerHour: 30, description: "Hammers problems just like your head",  levelRequired: 12 },
  { id: "whale",      name: "Humpback Whale", emoji: "🐋", asset: require("@/assets/game/aquarium/whale.png"),      habitat: "ocean",      price: 700,  rarity: "legendary", starCoinsPerHour: 45, description: "Makes a big splash in the classroom",   levelRequired: 14 },
  { id: "blue_whale", name: "Blue Whale",     emoji: "🐳", asset: require("@/assets/game/aquarium/blue_whale.png"), habitat: "ocean",      price: 1050, rarity: "legendary", starCoinsPerHour: 62, description: "The rarest of them all — legendary",    levelRequired: 16 },
];

export const RARITY_COLORS: Record<AnimalRarity, string> = {
  common:    "#8B8BAE",
  uncommon:  "#00D9A3",
  rare:      "#7C6FFF",
  legendary: "#FFD166",
};
