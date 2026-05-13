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
  starCoinsPerHour?: number; // passive currency (classroom items only)
}

export const SHOP_ITEMS: ShopItem[] = [
  // ── Classroom: desk ─────────────────────────────────────
  { id: "cactus",          name: "Desk Cactus",       description: "A tiny cactus that never complains",                price: 150,  category: "classroom", slot: "desk",        emoji: "🌵", starCoinsPerHour: 8  },
  { id: "fox",             name: "Stuffed Fox",        description: "A fluffy study buddy",                              price: 300,  category: "classroom", slot: "desk",        emoji: "🦊", starCoinsPerHour: 15 },
  { id: "calculator_gold", name: "Gold Calculator",    description: "For showing off, not calculating",                  price: 600,  category: "classroom", slot: "desk",        emoji: "🧮", starCoinsPerHour: 25 },
  { id: "computer",        name: "Classroom Computer", description: "Runs math simulations (and games)",                 price: 1200, category: "classroom", slot: "desk",        emoji: "💻", starCoinsPerHour: 50 },
  { id: "rocket_model",    name: "Rocket Model",       description: "A scale replica — inspires big dreams",             price: 2000, category: "classroom", slot: "desk",        emoji: "🚀", starCoinsPerHour: 80 },
  // ── Classroom: wall ──────────────────────────────────────
  { id: "globe",           name: "World Globe",        description: "See the whole world from your desk",                price: 350,  category: "classroom", slot: "wall",        emoji: "🌍", starCoinsPerHour: 20 },
  { id: "bookshelf",       name: "Bookshelf",          description: "Wisdom in every spine",                             price: 600,  category: "classroom", slot: "wall",        emoji: "📚", starCoinsPerHour: 28 },
  { id: "clock",           name: "Antique Clock",      description: "Every second counts",                               price: 550,  category: "classroom", slot: "wall",        emoji: "🕰️", starCoinsPerHour: 25 },
  { id: "map",             name: "World Map",          description: "Explore without leaving your seat",                 price: 900,  category: "classroom", slot: "wall",        emoji: "🗺️", starCoinsPerHour: 35 },
  { id: "space_poster",    name: "Space Poster",       description: "\"Per Aspera Ad Astra\"",                           price: 700,  category: "classroom", slot: "wall",        emoji: "🪐", starCoinsPerHour: 45 },
  { id: "microscope",      name: "Microscope",         description: "See what the naked eye misses",                     price: 1000, category: "classroom", slot: "wall",        emoji: "🔬", starCoinsPerHour: 55 },
  // ── Classroom: floor_left ────────────────────────────────
  { id: "plant",           name: "Corner Plant",       description: "Freshens the room right up",                        price: 300,  category: "classroom", slot: "floor_left",  emoji: "🪴", starCoinsPerHour: 15 },
  { id: "easel",           name: "Art Easel",          description: "Express your mathematical artistry",                price: 700,  category: "classroom", slot: "floor_left",  emoji: "🎨", starCoinsPerHour: 35 },
  { id: "musical",         name: "Grand Piano",        description: "Math and music share the same soul",                price: 1200, category: "classroom", slot: "floor_left",  emoji: "🎹", starCoinsPerHour: 55 },
  { id: "aquarium",        name: "Classroom Aquarium", description: "A living window to the ocean",                      price: 2500, category: "classroom", slot: "floor_left",  emoji: "🐠", starCoinsPerHour: 90 },
  // ── Classroom: floor_right ───────────────────────────────
  { id: "trophy",          name: "Trophy Case",        description: "Show off your victories",                           price: 800,  category: "classroom", slot: "floor_right", emoji: "🏆", starCoinsPerHour: 35 },
  { id: "chemistry",       name: "Chemistry Set",      description: "Bubbling experiments in the corner",                price: 1000, category: "classroom", slot: "floor_right", emoji: "🧪", starCoinsPerHour: 60 },
  { id: "telescope",       name: "Telescope",          description: "Math is written in the stars",                      price: 1500, category: "classroom", slot: "floor_right", emoji: "🔭", starCoinsPerHour: 70 },
  { id: "robot",           name: "Robot Friend",       description: "Your very own robot assistant",                     price: 2500, category: "classroom", slot: "floor_right", emoji: "🤖", starCoinsPerHour: 100},
  // ── Classroom: ceiling ───────────────────────────────────
  { id: "star_banner",     name: "Star Banner",        description: "You're a star student",                             price: 500,  category: "classroom", slot: "ceiling",     emoji: "⭐", starCoinsPerHour: 20 },
  { id: "rainbow",         name: "Rainbow",            description: "Bright ideas only",                                 price: 1200, category: "classroom", slot: "ceiling",     emoji: "🌈", starCoinsPerHour: 50 },
  { id: "neon",            name: "Neon Star Sign",     description: "The classiest classroom",                           price: 2500, category: "classroom", slot: "ceiling",     emoji: "🌟", starCoinsPerHour: 90 },
  { id: "solar_system",    name: "Solar System Mobile",description: "The whole universe overhead",                       price: 4000, category: "classroom", slot: "ceiling",     emoji: "🪐", starCoinsPerHour: 130},
  // ── Student: outfit ──────────────────────────────────────
  { id: "blue_outfit",     name: "Blue Uniform",       description: "Classic school look",                               price: 400,  category: "student",   slot: "outfit",      emoji: "🔵", outfitColor: "#4A90E2" },
  { id: "red_outfit",      name: "Red Uniform",        description: "Bold and determined",                               price: 400,  category: "student",   slot: "outfit",      emoji: "🔴", outfitColor: "#E24A4A" },
  { id: "green_outfit",    name: "Green Uniform",      description: "Fresh and focused",                                 price: 400,  category: "student",   slot: "outfit",      emoji: "🟢", outfitColor: "#22C55E" },
  { id: "purple_outfit",   name: "Purple Scholar",     description: "For the elite mathematician",                       price: 600,  category: "student",   slot: "outfit",      emoji: "🟣", outfitColor: "#7C6FFF" },
  { id: "karate",          name: "Karate Gi",          description: "Math is a martial art",                             price: 900,  category: "student",   slot: "outfit",      emoji: "🥋", outfitColor: "#EBEBEB" },
  { id: "lab_coat",        name: "Lab Coat",           description: "Scientist in training",                             price: 1200, category: "student",   slot: "outfit",      emoji: "🥼", outfitColor: "#F8F8F0" },
  { id: "superhero",       name: "Superhero Suit",     description: "Faster than a speeding decimal",                    price: 2000, category: "student",   slot: "outfit",      emoji: "🦸", outfitColor: "#FF4757" },
  { id: "space_suit",      name: "Space Suit",         description: "Ready for the final frontier",                      price: 5000, category: "student",   slot: "outfit",      emoji: "👨‍🚀", outfitColor: "#D0D8E0" },
  // ── Student: hat ─────────────────────────────────────────
  { id: "top_hat",         name: "Top Hat",            description: "Mathematics in style",                              price: 300,  category: "student",   slot: "hat",         emoji: "🎩" },
  { id: "cowboy_hat",      name: "Cowboy Hat",         description: "Wrangling equations",                               price: 450,  category: "student",   slot: "hat",         emoji: "🤠" },
  { id: "party_hat",       name: "Party Hat",          description: "Every drill is a celebration",                      price: 350,  category: "student",   slot: "hat",         emoji: "🎉" },
  { id: "grad_cap",        name: "Grad Cap",           description: "Already graduating",                                price: 600,  category: "student",   slot: "hat",         emoji: "🎓" },
  { id: "wizard_hat",      name: "Wizard Hat",         description: "Cast multiplication spells",                        price: 1000, category: "student",   slot: "hat",         emoji: "🧙" },
  { id: "crown",           name: "Crown",              description: "Ruler of all equations",                            price: 3000, category: "student",   slot: "hat",         emoji: "👑" },
  // ── Student: accessory ───────────────────────────────────
  { id: "sunglasses",      name: "Sunglasses",         description: "Too cool for school? Never.",                       price: 200,  category: "student",   slot: "accessory",   emoji: "🕶️" },
  { id: "backpack",        name: "Cool Backpack",      description: "Ready for any challenge",                           price: 300,  category: "student",   slot: "accessory",   emoji: "🎒" },
  { id: "star_badge",      name: "Gold Star Badge",    description: "Official star student",                             price: 400,  category: "student",   slot: "accessory",   emoji: "⭐" },
  { id: "headphones",      name: "Headphones",         description: "Focus mode: activated",                             price: 600,  category: "student",   slot: "accessory",   emoji: "🎧" },
  { id: "medal",           name: "Gold Medal",         description: "First place in everything",                         price: 700,  category: "student",   slot: "accessory",   emoji: "🥇" },
];

export function getItemById(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.id === id);
}
