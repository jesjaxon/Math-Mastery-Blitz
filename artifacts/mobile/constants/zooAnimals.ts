import type { AnimalRarity } from "./aquariumAnimals";
export type { AnimalRarity };

export interface ZooAnimal {
  id: string;
  name: string;
  emoji: string;
  price: number;
  rarity: AnimalRarity;
  starCoinsPerHour: number;
  description: string;
  levelRequired: number;
}

export const ZOO_ANIMALS: ZooAnimal[] = [
  { id: "hedgehog",  name: "Hedgehog",  emoji: "🦔", price: 35,   rarity: "common",    starCoinsPerHour: 3,  description: "Spiky but sweet",                  levelRequired: 1  },
  { id: "rabbit",    name: "Rabbit",    emoji: "🐰", price: 45,   rarity: "common",    starCoinsPerHour: 3,  description: "Hops to it every morning",          levelRequired: 2  },
  { id: "fox",       name: "Fox",       emoji: "🦊", price: 65,   rarity: "common",    starCoinsPerHour: 4,  description: "Clever and curious",                levelRequired: 3  },
  { id: "penguin",   name: "Penguin",   emoji: "🐧", price: 80,   rarity: "common",    starCoinsPerHour: 5,  description: "Always dressed for success",        levelRequired: 3  },
  { id: "koala",     name: "Koala",     emoji: "🐨", price: 110,  rarity: "uncommon",  starCoinsPerHour: 7,  description: "90% sleeping, 10% eating",          levelRequired: 5  },
  { id: "sloth",     name: "Sloth",     emoji: "🦥", price: 140,  rarity: "uncommon",  starCoinsPerHour: 8,  description: "Takes its time, every time",        levelRequired: 6  },
  { id: "panda",     name: "Panda",     emoji: "🐼", price: 140,  rarity: "uncommon",  starCoinsPerHour: 9,  description: "Black, white, and perfect",         levelRequired: 6  },
  { id: "kangaroo",  name: "Kangaroo",  emoji: "🦘", price: 170,  rarity: "uncommon",  starCoinsPerHour: 10, description: "Built-in carry-on",                 levelRequired: 7  },
  { id: "zebra",     name: "Zebra",     emoji: "🦓", price: 210,  rarity: "rare",      starCoinsPerHour: 14, description: "Nature's barcode",                  levelRequired: 8  },
  { id: "giraffe",   name: "Giraffe",   emoji: "🦒", price: 280,  rarity: "rare",      starCoinsPerHour: 18, description: "Head in the clouds, literally",     levelRequired: 9  },
  { id: "rhino",     name: "Rhino",     emoji: "🦏", price: 350,  rarity: "rare",      starCoinsPerHour: 21, description: "Ancient armor, modern attitude",    levelRequired: 10 },
  { id: "elephant",  name: "Elephant",  emoji: "🐘", price: 420,  rarity: "rare",      starCoinsPerHour: 25, description: "Never forgets your birthday",       levelRequired: 11 },
  { id: "gorilla",   name: "Gorilla",   emoji: "🦍", price: 490,  rarity: "rare",      starCoinsPerHour: 28, description: "Philosopher of the jungle",         levelRequired: 12 },
  { id: "lion",      name: "Lion",      emoji: "🦁", price: 700,  rarity: "legendary", starCoinsPerHour: 42, description: "The king has arrived",              levelRequired: 14 },
  { id: "tiger",     name: "Tiger",     emoji: "🐯", price: 850,  rarity: "legendary", starCoinsPerHour: 52, description: "Pure power, pure grace",            levelRequired: 15 },
];

export { RARITY_COLORS } from "./aquariumAnimals";
