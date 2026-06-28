export type ItemSlot =
  | "wall"
  | "floor_left"
  | "floor_right"
  | "desk"
  | "ceiling"
  | "outfit"
  | "hat"
  | "accessory";

export type ItemCategory = "classroom" | "student";

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ItemCategory;
  slot: ItemSlot;
  emoji: string;
  outfitColor?: string;
  starCoinsPerHour?: number;
  levelRequired: number;
}

export const SHOP_ITEMS: ShopItem[] = [
  // ── Classroom: desk ─────────────────────────────────────
  { id: "cactus",          name: "Desk Cactus",        description: "A tiny cactus that never complains",             price: 20,  category: "classroom", slot: "desk",        emoji: "🌵", starCoinsPerHour: 2,  levelRequired: 1  },
  { id: "fox",             name: "Stuffed Fox",         description: "A fluffy study buddy",                           price: 45,  category: "classroom", slot: "desk",        emoji: "🦊", starCoinsPerHour: 4,  levelRequired: 1  },
  { id: "calculator_gold", name: "Gold Calculator",     description: "For showing off, not calculating",               price: 90,  category: "classroom", slot: "desk",        emoji: "🧮", starCoinsPerHour: 7,  levelRequired: 1  },
  { id: "computer",        name: "Classroom Computer",  description: "Runs math simulations (and games)",              price: 160, category: "classroom", slot: "desk",        emoji: "💻", starCoinsPerHour: 12, levelRequired: 1  },
  { id: "rocket_model",    name: "Rocket Model",        description: "A scale replica — inspires big dreams",          price: 280, category: "classroom", slot: "desk",        emoji: "🚀", starCoinsPerHour: 20, levelRequired: 1  },
  // ── Classroom: wall ──────────────────────────────────────
  { id: "globe",           name: "World Globe",         description: "See the whole world from your desk",             price: 50,  category: "classroom", slot: "wall",        emoji: "🌍", starCoinsPerHour: 5,  levelRequired: 1  },
  { id: "clock",           name: "Antique Clock",       description: "Every second counts",                           price: 70,  category: "classroom", slot: "wall",        emoji: "🕰️", starCoinsPerHour: 6,  levelRequired: 1  },
  { id: "bookshelf",       name: "Bookshelf",           description: "Wisdom in every spine",                          price: 80,  category: "classroom", slot: "wall",        emoji: "📚", starCoinsPerHour: 7,  levelRequired: 1  },
  { id: "space_poster",    name: "Space Poster",        description: "\"Per Aspera Ad Astra\"",                        price: 100, category: "classroom", slot: "wall",        emoji: "🪐", starCoinsPerHour: 10, levelRequired: 1  },
  { id: "map",             name: "World Map",           description: "Explore without leaving your seat",              price: 130, category: "classroom", slot: "wall",        emoji: "🗺️", starCoinsPerHour: 8,  levelRequired: 1  },
  { id: "microscope",      name: "Microscope",          description: "See what the naked eye misses",                  price: 150, category: "classroom", slot: "wall",        emoji: "🔬", starCoinsPerHour: 13, levelRequired: 1  },
  // ── Classroom: floor_left ────────────────────────────────
  { id: "plant",           name: "Corner Plant",        description: "Freshens the room right up",                     price: 40,  category: "classroom", slot: "floor_left",  emoji: "🪴", starCoinsPerHour: 4,  levelRequired: 1  },
  { id: "easel",           name: "Art Easel",           description: "Express your mathematical artistry",             price: 100, category: "classroom", slot: "floor_left",  emoji: "🎨", starCoinsPerHour: 8,  levelRequired: 1  },
  { id: "musical",         name: "Grand Piano",         description: "Math and music share the same soul",             price: 180, category: "classroom", slot: "floor_left",  emoji: "🎹", starCoinsPerHour: 13, levelRequired: 1  },
  { id: "aquarium",        name: "Classroom Aquarium",  description: "A living window to the ocean",                   price: 350, category: "classroom", slot: "floor_left",  emoji: "🐠", starCoinsPerHour: 22, levelRequired: 1 },
  // ── Classroom: floor_right ───────────────────────────────
  { id: "trophy",          name: "Trophy Case",         description: "Show off your victories",                        price: 110, category: "classroom", slot: "floor_right", emoji: "🏆", starCoinsPerHour: 8,  levelRequired: 1  },
  { id: "chemistry",       name: "Chemistry Set",       description: "Bubbling experiments in the corner",             price: 150, category: "classroom", slot: "floor_right", emoji: "🧪", starCoinsPerHour: 14, levelRequired: 1  },
  { id: "telescope",       name: "Telescope",           description: "Math is written in the stars",                   price: 210, category: "classroom", slot: "floor_right", emoji: "🔭", starCoinsPerHour: 17, levelRequired: 1  },
  { id: "robot",           name: "Robot Friend",        description: "Your very own robot assistant",                  price: 350, category: "classroom", slot: "floor_right", emoji: "🤖", starCoinsPerHour: 24, levelRequired: 1 },
  // ── Classroom: ceiling ───────────────────────────────────
  { id: "star_banner",     name: "Star Banner",         description: "You're a star student",                          price: 70,  category: "classroom", slot: "ceiling",     emoji: "⭐", starCoinsPerHour: 5,  levelRequired: 1  },
  { id: "rainbow",         name: "Rainbow",             description: "Bright ideas only",                              price: 170, category: "classroom", slot: "ceiling",     emoji: "🌈", starCoinsPerHour: 12, levelRequired: 1  },
  { id: "neon",            name: "Neon Star Sign",      description: "The classiest classroom",                        price: 350, category: "classroom", slot: "ceiling",     emoji: "🌟", starCoinsPerHour: 22, levelRequired: 1 },
  { id: "solar_system",    name: "Solar System Mobile", description: "The whole universe overhead",                    price: 550, category: "classroom", slot: "ceiling",     emoji: "🪐", starCoinsPerHour: 32, levelRequired: 1 },
  // ── Student: outfit ──────────────────────────────────────
  { id: "blue_outfit",     name: "Blue Uniform",        description: "Classic school look",                            price: 50,  category: "student",   slot: "outfit",      emoji: "🔵", outfitColor: "#4A90E2", levelRequired: 1  },
  { id: "red_outfit",      name: "Red Uniform",         description: "Bold and determined",                            price: 50,  category: "student",   slot: "outfit",      emoji: "🔴", outfitColor: "#E24A4A", levelRequired: 1  },
  { id: "green_outfit",    name: "Green Uniform",       description: "Fresh and focused",                              price: 50,  category: "student",   slot: "outfit",      emoji: "🟢", outfitColor: "#22C55E", levelRequired: 1  },
  { id: "purple_outfit",   name: "Purple Scholar",      description: "For the elite mathematician",                    price: 80,  category: "student",   slot: "outfit",      emoji: "🟣", outfitColor: "#7C6FFF", levelRequired: 1  },
  { id: "karate",          name: "Karate Gi",           description: "Math is a martial art",                          price: 120, category: "student",   slot: "outfit",      emoji: "🥋", outfitColor: "#EBEBEB", levelRequired: 1  },
  { id: "lab_coat",        name: "Lab Coat",            description: "Scientist in training",                          price: 160, category: "student",   slot: "outfit",      emoji: "🥼", outfitColor: "#F8F8F0", levelRequired: 1  },
  { id: "superhero",       name: "Superhero Suit",      description: "Faster than a speeding decimal",                 price: 280, category: "student",   slot: "outfit",      emoji: "🦸", outfitColor: "#FF4757", levelRequired: 1 },
  { id: "space_suit",      name: "Space Suit",          description: "Ready for the final frontier",                   price: 700, category: "student",   slot: "outfit",      emoji: "👨‍🚀", outfitColor: "#D0D8E0", levelRequired: 1 },
  // ── Student: hat ─────────────────────────────────────────
  { id: "top_hat",         name: "Top Hat",             description: "Mathematics in style",                           price: 40,  category: "student",   slot: "hat",         emoji: "🎩", levelRequired: 1  },
  { id: "party_hat",       name: "Party Hat",           description: "Every drill is a celebration",                   price: 45,  category: "student",   slot: "hat",         emoji: "🎉", levelRequired: 1  },
  { id: "cowboy_hat",      name: "Cowboy Hat",          description: "Wrangling equations",                            price: 60,  category: "student",   slot: "hat",         emoji: "🤠", levelRequired: 1  },
  { id: "grad_cap",        name: "Grad Cap",            description: "Already graduating",                             price: 80,  category: "student",   slot: "hat",         emoji: "🎓", levelRequired: 1  },
  { id: "wizard_hat",      name: "Wizard Hat",          description: "Cast multiplication spells",                     price: 140, category: "student",   slot: "hat",         emoji: "🧙", levelRequired: 1  },
  { id: "crown",           name: "Crown",               description: "Ruler of all equations",                         price: 400, category: "student",   slot: "hat",         emoji: "👑", levelRequired: 1 },
  // ── Student: accessory ───────────────────────────────────
  { id: "sunglasses",      name: "Sunglasses",          description: "Too cool for school? Never.",                    price: 30,  category: "student",   slot: "accessory",   emoji: "🕶️", levelRequired: 1  },
  { id: "backpack",        name: "Cool Backpack",       description: "Ready for any challenge",                        price: 40,  category: "student",   slot: "accessory",   emoji: "🎒", levelRequired: 1  },
  { id: "star_badge",      name: "Gold Star Badge",     description: "Official star student",                          price: 55,  category: "student",   slot: "accessory",   emoji: "⭐", levelRequired: 1  },
  { id: "headphones",      name: "Headphones",          description: "Focus mode: activated",                          price: 80,  category: "student",   slot: "accessory",   emoji: "🎧", levelRequired: 1  },
  { id: "medal",           name: "Gold Medal",          description: "First place in everything",                      price: 100, category: "student",   slot: "accessory",   emoji: "🥇", levelRequired: 1  },
];

export function getItemById(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.id === id);
}
