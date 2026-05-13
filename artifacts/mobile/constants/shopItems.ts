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
}

export const SHOP_ITEMS: ShopItem[] = [
  // ── Classroom: desk ─────────────────────────────────────
  {
    id: "cactus",
    name: "Desk Cactus",
    description: "A tiny cactus that never complains",
    price: 50,
    category: "classroom",
    slot: "desk",
    emoji: "🌵",
  },
  {
    id: "fox",
    name: "Stuffed Fox",
    description: "A fluffy study buddy",
    price: 100,
    category: "classroom",
    slot: "desk",
    emoji: "🦊",
  },
  {
    id: "calculator_gold",
    name: "Gold Calculator",
    description: "For showing off, not calculating",
    price: 200,
    category: "classroom",
    slot: "desk",
    emoji: "🧮",
  },

  // ── Classroom: wall ──────────────────────────────────────
  {
    id: "globe",
    name: "World Globe",
    description: "See the whole world from your desk",
    price: 100,
    category: "classroom",
    slot: "wall",
    emoji: "🌍",
  },
  {
    id: "bookshelf",
    name: "Bookshelf",
    description: "Wisdom in every spine",
    price: 150,
    category: "classroom",
    slot: "wall",
    emoji: "📚",
  },
  {
    id: "clock",
    name: "Antique Clock",
    description: "Every second counts",
    price: 150,
    category: "classroom",
    slot: "wall",
    emoji: "🕰️",
  },
  {
    id: "map",
    name: "World Map",
    description: "Explore without leaving your seat",
    price: 225,
    category: "classroom",
    slot: "wall",
    emoji: "🗺️",
  },

  // ── Classroom: floor_left ────────────────────────────────
  {
    id: "plant",
    name: "Corner Plant",
    description: "Freshens the room right up",
    price: 75,
    category: "classroom",
    slot: "floor_left",
    emoji: "🪴",
  },
  {
    id: "easel",
    name: "Art Easel",
    description: "Express your mathematical artistry",
    price: 175,
    category: "classroom",
    slot: "floor_left",
    emoji: "🎨",
  },
  {
    id: "aquarium",
    name: "Fish Aquarium",
    description: "The fish watch you solve problems",
    price: 400,
    category: "classroom",
    slot: "floor_left",
    emoji: "🐠",
  },

  // ── Classroom: floor_right ───────────────────────────────
  {
    id: "trophy",
    name: "Trophy Case",
    description: "Show off your victories",
    price: 200,
    category: "classroom",
    slot: "floor_right",
    emoji: "🏆",
  },
  {
    id: "telescope",
    name: "Telescope",
    description: "Math is written in the stars",
    price: 300,
    category: "classroom",
    slot: "floor_right",
    emoji: "🔭",
  },
  {
    id: "robot",
    name: "Robot Friend",
    description: "Your very own robot assistant",
    price: 450,
    category: "classroom",
    slot: "floor_right",
    emoji: "🤖",
  },

  // ── Classroom: ceiling ───────────────────────────────────
  {
    id: "star_banner",
    name: "Star Banner",
    description: "You're a star student",
    price: 125,
    category: "classroom",
    slot: "ceiling",
    emoji: "⭐",
  },
  {
    id: "rainbow",
    name: "Rainbow",
    description: "Bright ideas only",
    price: 275,
    category: "classroom",
    slot: "ceiling",
    emoji: "🌈",
  },
  {
    id: "neon",
    name: "Neon Star Sign",
    description: "The classiest classroom",
    price: 500,
    category: "classroom",
    slot: "ceiling",
    emoji: "🌟",
  },

  // ── Student: outfit ──────────────────────────────────────
  {
    id: "blue_outfit",
    name: "Blue Uniform",
    description: "Classic school look",
    price: 100,
    category: "student",
    slot: "outfit",
    emoji: "🔵",
    outfitColor: "#4A90E2",
  },
  {
    id: "red_outfit",
    name: "Red Uniform",
    description: "Bold and determined",
    price: 100,
    category: "student",
    slot: "outfit",
    emoji: "🔴",
    outfitColor: "#E24A4A",
  },
  {
    id: "green_outfit",
    name: "Green Uniform",
    description: "Fresh and focused",
    price: 100,
    category: "student",
    slot: "outfit",
    emoji: "🟢",
    outfitColor: "#22C55E",
  },
  {
    id: "purple_outfit",
    name: "Purple Scholar",
    description: "For the elite mathematician",
    price: 150,
    category: "student",
    slot: "outfit",
    emoji: "🟣",
    outfitColor: "#7C6FFF",
  },
  {
    id: "karate",
    name: "Karate Gi",
    description: "Math is a martial art",
    price: 200,
    category: "student",
    slot: "outfit",
    emoji: "🥋",
    outfitColor: "#E8E8E8",
  },
  {
    id: "superhero",
    name: "Superhero Suit",
    description: "Faster than a speeding decimal",
    price: 350,
    category: "student",
    slot: "outfit",
    emoji: "🦸",
    outfitColor: "#FF4757",
  },

  // ── Student: hat ─────────────────────────────────────────
  {
    id: "top_hat",
    name: "Top Hat",
    description: "Mathematics in style",
    price: 75,
    category: "student",
    slot: "hat",
    emoji: "🎩",
  },
  {
    id: "grad_cap",
    name: "Grad Cap",
    description: "Already graduating",
    price: 150,
    category: "student",
    slot: "hat",
    emoji: "🎓",
  },
  {
    id: "wizard_hat",
    name: "Wizard Hat",
    description: "Cast multiplication spells",
    price: 250,
    category: "student",
    slot: "hat",
    emoji: "🧙",
  },
  {
    id: "crown",
    name: "Crown",
    description: "Ruler of all equations",
    price: 500,
    category: "student",
    slot: "hat",
    emoji: "👑",
  },

  // ── Student: accessory ───────────────────────────────────
  {
    id: "sunglasses",
    name: "Sunglasses",
    description: "Too cool for school? Never.",
    price: 50,
    category: "student",
    slot: "accessory",
    emoji: "🕶️",
  },
  {
    id: "backpack",
    name: "Cool Backpack",
    description: "Ready for any challenge",
    price: 75,
    category: "student",
    slot: "accessory",
    emoji: "🎒",
  },
  {
    id: "star_badge",
    name: "Gold Star Badge",
    description: "Official star student",
    price: 100,
    category: "student",
    slot: "accessory",
    emoji: "⭐",
  },
  {
    id: "medal",
    name: "Gold Medal",
    description: "First place in everything",
    price: 175,
    category: "student",
    slot: "accessory",
    emoji: "🥇",
  },
];

export function getItemById(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.id === id);
}
