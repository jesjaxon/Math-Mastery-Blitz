export type AnimalRarity = "common" | "uncommon" | "rare" | "legendary";

export interface AquariumAnimal {
  id: string;
  name: string;
  emoji: string;
  price: number;
  rarity: AnimalRarity;
  starCoinsPerHour: number;
  description: string;
}

export const AQUARIUM_ANIMALS: AquariumAnimal[] = [
  { id: "fish",       name: "Little Fish",    emoji: "🐟", price: 250,  rarity: "common",    starCoinsPerHour: 8,   description: "Just swimming around" },
  { id: "clownfish",  name: "Clownfish",      emoji: "🐠", price: 350,  rarity: "common",    starCoinsPerHour: 12,  description: "Very friendly, very orange" },
  { id: "crab",       name: "Crab",           emoji: "🦀", price: 400,  rarity: "common",    starCoinsPerHour: 14,  description: "Walks sideways always" },
  { id: "shrimp",     name: "Shrimp",         emoji: "🦐", price: 500,  rarity: "common",    starCoinsPerHour: 16,  description: "Surprisingly good company" },
  { id: "pufferfish", name: "Pufferfish",     emoji: "🐡", price: 600,  rarity: "common",    starCoinsPerHour: 18,  description: "Don't make it angry" },
  { id: "coral",      name: "Coral Colony",   emoji: "🪸", price: 800,  rarity: "uncommon",  starCoinsPerHour: 28,  description: "A whole ecosystem at home" },
  { id: "lobster",    name: "Lobster",        emoji: "🦞", price: 800,  rarity: "uncommon",  starCoinsPerHour: 25,  description: "The oversized shrimp" },
  { id: "squid",      name: "Squid",          emoji: "🦑", price: 1000, rarity: "uncommon",  starCoinsPerHour: 32,  description: "Jet-propelled genius" },
  { id: "octopus",    name: "Octopus",        emoji: "🐙", price: 1200, rarity: "uncommon",  starCoinsPerHour: 40,  description: "Eight arms, infinite possibilities" },
  { id: "otter",      name: "Sea Otter",      emoji: "🦦", price: 1500, rarity: "rare",      starCoinsPerHour: 55,  description: "Holds hands while sleeping" },
  { id: "seal",       name: "Seal",           emoji: "🦭", price: 2000, rarity: "rare",      starCoinsPerHour: 70,  description: "Professional entertainer" },
  { id: "dolphin",    name: "Dolphin",        emoji: "🐬", price: 3000, rarity: "rare",      starCoinsPerHour: 100, description: "Smarter than you think" },
  { id: "shark",      name: "Shark",          emoji: "🦈", price: 3500, rarity: "rare",      starCoinsPerHour: 120, description: "Actually quite misunderstood" },
  { id: "whale",      name: "Humpback Whale", emoji: "🐳", price: 5000, rarity: "legendary", starCoinsPerHour: 180, description: "The gentle giant of the deep" },
  { id: "blue_whale", name: "Blue Whale",     emoji: "🐋", price: 7500, rarity: "legendary", starCoinsPerHour: 250, description: "Largest creature ever known" },
];

export const RARITY_COLORS: Record<AnimalRarity, string> = {
  common:    "#8B8BAE",
  uncommon:  "#00D9A3",
  rare:      "#7C6FFF",
  legendary: "#FFD166",
};
