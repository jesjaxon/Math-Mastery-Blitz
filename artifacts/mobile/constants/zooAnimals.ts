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
}

export const ZOO_ANIMALS: ZooAnimal[] = [
  { id: "hedgehog",  name: "Hedgehog",  emoji: "🦔", price: 300,  rarity: "common",    starCoinsPerHour: 10,  description: "Spiky but sweet" },
  { id: "rabbit",    name: "Rabbit",    emoji: "🐰", price: 350,  rarity: "common",    starCoinsPerHour: 12,  description: "Hops to it every morning" },
  { id: "fox",       name: "Fox",       emoji: "🦊", price: 500,  rarity: "common",    starCoinsPerHour: 15,  description: "Clever and curious" },
  { id: "penguin",   name: "Penguin",   emoji: "🐧", price: 600,  rarity: "common",    starCoinsPerHour: 18,  description: "Always dressed for success" },
  { id: "koala",     name: "Koala",     emoji: "🐨", price: 800,  rarity: "uncommon",  starCoinsPerHour: 28,  description: "90% sleeping, 10% eating" },
  { id: "panda",     name: "Panda",     emoji: "🐼", price: 1000, rarity: "uncommon",  starCoinsPerHour: 35,  description: "Black, white, and perfect" },
  { id: "sloth",     name: "Sloth",     emoji: "🦥", price: 1000, rarity: "uncommon",  starCoinsPerHour: 30,  description: "Takes its time, every time" },
  { id: "kangaroo",  name: "Kangaroo",  emoji: "🦘", price: 1200, rarity: "uncommon",  starCoinsPerHour: 40,  description: "Built-in carry-on" },
  { id: "zebra",     name: "Zebra",     emoji: "🦓", price: 1500, rarity: "rare",      starCoinsPerHour: 55,  description: "Nature's barcode" },
  { id: "giraffe",   name: "Giraffe",   emoji: "🦒", price: 2000, rarity: "rare",      starCoinsPerHour: 70,  description: "Head in the clouds, literally" },
  { id: "rhino",     name: "Rhino",     emoji: "🦏", price: 2500, rarity: "rare",      starCoinsPerHour: 85,  description: "Ancient armor, modern attitude" },
  { id: "elephant",  name: "Elephant",  emoji: "🐘", price: 3000, rarity: "rare",      starCoinsPerHour: 100, description: "Never forgets your birthday" },
  { id: "gorilla",   name: "Gorilla",   emoji: "🦍", price: 3500, rarity: "rare",      starCoinsPerHour: 110, description: "Philosopher of the jungle" },
  { id: "lion",      name: "Lion",      emoji: "🦁", price: 5000, rarity: "legendary", starCoinsPerHour: 170, description: "The king has arrived" },
  { id: "tiger",     name: "Tiger",     emoji: "🐯", price: 6000, rarity: "legendary", starCoinsPerHour: 210, description: "Pure power, pure grace" },
];

export { RARITY_COLORS } from "./aquariumAnimals";
