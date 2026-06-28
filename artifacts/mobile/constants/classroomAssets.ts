import type { ImageSourcePropType } from "react-native";
import type { ProfileAvatarId } from "@/constants/profileAvatars";

export const CLASSROOM_BACKGROUND = require("@/assets/game/classroom/background_asset_layout_v4.png") as ImageSourcePropType;

export const CLASSROOM_ITEM_ASSETS = {
  cactus: require("@/assets/game/classroom/items/cactus.png"),
  fox: require("@/assets/game/classroom/items/fox.png"),
  calculator_gold: require("@/assets/game/classroom/items/calculator_gold.png"),
  computer: require("@/assets/game/classroom/items/computer.png"),
  rocket_model: require("@/assets/game/classroom/items/rocket_model.png"),
  globe: require("@/assets/game/classroom/items/globe.png"),
  clock: require("@/assets/game/classroom/items/clock.png"),
  bookshelf: require("@/assets/game/classroom/items/bookshelf.png"),
  space_poster: require("@/assets/game/classroom/items/space_poster.png"),
  map: require("@/assets/game/classroom/items/map.png"),
  microscope: require("@/assets/game/classroom/items/microscope.png"),
  plant: require("@/assets/game/classroom/items/plant.png"),
  easel: require("@/assets/game/classroom/items/easel.png"),
  musical: require("@/assets/game/classroom/items/musical.png"),
  aquarium: require("@/assets/game/classroom/items/aquarium.png"),
  trophy: require("@/assets/game/classroom/items/trophy.png"),
  chemistry: require("@/assets/game/classroom/items/chemistry.png"),
  telescope: require("@/assets/game/classroom/items/telescope.png"),
  robot: require("@/assets/game/classroom/items/robot.png"),
  star_banner: require("@/assets/game/classroom/items/star_banner.png"),
  rainbow: require("@/assets/game/classroom/items/rainbow.png"),
  neon: require("@/assets/game/classroom/items/neon.png"),
  solar_system: require("@/assets/game/classroom/items/solar_system.png"),
  none: require("@/assets/game/classroom/items/none.png"),
  shop_bag: require("@/assets/game/classroom/items/shop_bag_icon_generated_new.png"),
} satisfies Record<string, ImageSourcePropType>;

export const CLASSROOM_STUDENT_ASSETS = {
  student_base: require("@/assets/game/classroom/student/student_base_safe.png"),
  blue_outfit: require("@/assets/game/classroom/student/blue_outfit_clean.png"),
  red_outfit: require("@/assets/game/classroom/student/red_outfit_clean.png"),
  green_outfit: require("@/assets/game/classroom/student/green_outfit_clean.png"),
  purple_outfit: require("@/assets/game/classroom/student/purple_outfit_clean.png"),
  karate: require("@/assets/game/classroom/student/karate_clean.png"),
  lab_coat: require("@/assets/game/classroom/student/lab_coat_clean.png"),
  superhero: require("@/assets/game/classroom/student/superhero_clean.png"),
  space_suit: require("@/assets/game/classroom/student/space_suit_clean.png"),
  top_hat: require("@/assets/game/classroom/student/top_hat_clean.png"),
  party_hat: require("@/assets/game/classroom/student/party_hat_clean.png"),
  cowboy_hat: require("@/assets/game/classroom/student/cowboy_hat_clean.png"),
  grad_cap: require("@/assets/game/classroom/student/grad_cap_clean.png"),
  wizard_hat: require("@/assets/game/classroom/student/wizard_hat_clean.png"),
  crown: require("@/assets/game/classroom/student/crown_clean.png"),
  sunglasses: require("@/assets/game/classroom/student/sunglasses_clean.png"),
  backpack: require("@/assets/game/classroom/student/backpack_clean.png"),
  star_badge: require("@/assets/game/classroom/student/star_badge_clean.png"),
  headphones: require("@/assets/game/classroom/student/headphones_clean.png"),
  medal: require("@/assets/game/classroom/student/medal_clean.png"),
} satisfies Record<string, ImageSourcePropType>;

export const CLASSROOM_CHARACTER_ASSETS: Record<ProfileAvatarId, ImageSourcePropType> = {
  "black-boy": require("@/assets/game/classroom/characters/black-boy_safe.png"),
  "black-girl": require("@/assets/game/classroom/characters/black-girl_safe.png"),
  "east-asian-boy": require("@/assets/game/classroom/characters/east-asian-boy_safe.png"),
  "east-asian-girl": require("@/assets/game/classroom/characters/east-asian-girl_safe.png"),
  "south-asian-boy": require("@/assets/game/classroom/characters/south-asian-boy_safe.png"),
  "south-asian-girl": require("@/assets/game/classroom/characters/south-asian-girl_safe.png"),
  "latino-boy": require("@/assets/game/classroom/characters/latino-boy_safe.png"),
  "latina-girl": require("@/assets/game/classroom/characters/latina-girl_safe.png"),
  "middle-eastern-boy": require("@/assets/game/classroom/characters/middle-eastern-boy_safe.png"),
  "middle-eastern-girl": require("@/assets/game/classroom/characters/middle-eastern-girl_safe.png"),
  "white-boy": require("@/assets/game/classroom/characters/white-boy_safe.png"),
  "white-girl": require("@/assets/game/classroom/characters/white-girl_safe.png"),
};

export function getClassroomItemAsset(id: string | undefined) {
  return id ? CLASSROOM_ITEM_ASSETS[id as keyof typeof CLASSROOM_ITEM_ASSETS] : undefined;
}

export function getClassroomStudentAsset(id: string | undefined) {
  return id ? CLASSROOM_STUDENT_ASSETS[id as keyof typeof CLASSROOM_STUDENT_ASSETS] : undefined;
}

export function getClassroomCharacterAsset(avatar: string | null | undefined) {
  return CLASSROOM_CHARACTER_ASSETS[avatar as ProfileAvatarId] ?? CLASSROOM_STUDENT_ASSETS.student_base;
}
