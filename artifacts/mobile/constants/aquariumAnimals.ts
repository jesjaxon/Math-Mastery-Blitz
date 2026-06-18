export type AnimalRarity = "common" | "uncommon" | "rare" | "legendary";

export interface AquariumAnimal {
  id: string;
  name: string;
  emoji: string;
  price: number;
  rarity: AnimalRarity;
  starCoinsPerHour: number;
  description: string;
  levelRequired: number;
}

export const AQUARIUM_ANIMALS: AquariumAnimal[] = [
  { id: "fish",       name: "Goldfish",       emoji: "🐟", price: 30,   rarity: "common",    starCoinsPerHour: 2,  description: "A classic splash of color",             levelRequired: 1  },
  { id: "clownfish",  name: "Clownfish",      emoji: "🐠", price: 45,   rarity: "common",    starCoinsPerHour: 3,  description: "Found it!",                             levelRequired: 2  },
  { id: "crab",       name: "Blue Crab",      emoji: "🦀", price: 50,   rarity: "common",    starCoinsPerHour: 4,  description: "Pinches all the wrong answers",         levelRequired: 2  },
  { id: "shrimp",     name: "Neon Shrimp",    emoji: "🦐", price: 65,   rarity: "common",    starCoinsPerHour: 4,  description: "Tiny but energetic",                    levelRequired: 3  },
  { id: "pufferfish", name: "Pufferfish",     emoji: "🐡", price: 80,   rarity: "common",    starCoinsPerHour: 5,  description: "Puffs up on wrong answers",             levelRequired: 3  },
  { id: "coral",      name: "Brain Coral",    emoji: "🪸", price: 110,  rarity: "uncommon",  starCoinsPerHour: 7,  description: "As smart as it looks",                  levelRequired: 5  },
  { id: "lobster",    name: "Lobster",        emoji: "🦞", price: 110,  rarity: "uncommon",  starCoinsPerHour: 6,  description: "Red hot and unafraid",                  levelRequired: 5  },
  { id: "squid",      name: "Squid",          emoji: "🦑", price: 140,  rarity: "uncommon",  starCoinsPerHour: 8,  description: "Has an ink-redible memory",             levelRequired: 6  },
  { id: "octopus",    name: "Octopus",        emoji: "🐙", price: 170,  rarity: "uncommon",  starCoinsPerHour: 10, description: "Eight arms, infinite hugs",             levelRequired: 7  },
  { id: "otter",      name: "Sea Otter",      emoji: "🦦", price: 210,  rarity: "rare",      starCoinsPerHour: 14, description: "Floats through life on its back",       levelRequired: 8  },
  { id: "seal",       name: "Seal",           emoji: "🦭", price: 280,  rarity: "rare",      starCoinsPerHour: 18, description: "Claps for every correct answer",        levelRequired: 9  },
  { id: "dolphin",    name: "Dolphin",        emoji: "🐬", price: 420,  rarity: "rare",      starCoinsPerHour: 25, description: "The smartest student in the tank",      levelRequired: 11 },
  { id: "shark",      name: "Hammerhead",     emoji: "🦈", price: 500,  rarity: "rare",      starCoinsPerHour: 30, description: "Hammers problems just like your head",  levelRequired: 12 },
  { id: "whale",      name: "Humpback Whale", emoji: "🐋", price: 700,  rarity: "legendary", starCoinsPerHour: 45, description: "Makes a big splash in the classroom",   levelRequired: 14 },
  { id: "blue_whale", name: "Blue Whale",     emoji: "🐳", price: 1050, rarity: "legendary", starCoinsPerHour: 62, description: "The rarest of them all — legendary",    levelRequired: 16 },
];

export const RARITY_COLORS: Record<AnimalRarity, string> = {
  common:    "#8B8BAE",
  uncommon:  "#00D9A3",
  rare:      "#7C6FFF",
  legendary: "#FFD166",
};
