import type { ImageSourcePropType } from "react-native";

export const ACHIEVEMENT_ASSETS = {
  hero: require("@/assets/game/achievements/hero.png"),
  reward: require("@/assets/game/achievements/badges/reward.png"),
  locked: require("@/assets/game/achievements/badges/locked.png"),
};

export const ACHIEVEMENT_BADGE_ASSETS: Record<string, ImageSourcePropType> = {
  add: require("@/assets/game/achievements/badges/addition.png"),
  sub: require("@/assets/game/achievements/badges/subtraction.png"),
  mul: require("@/assets/game/achievements/badges/multiplication.png"),
  div: require("@/assets/game/achievements/badges/division.png"),
  score: require("@/assets/game/achievements/badges/score.png"),
  streak: require("@/assets/game/achievements/badges/streak.png"),
  drills: require("@/assets/game/achievements/badges/drills.png"),
  special: require("@/assets/game/achievements/badges/special.png"),
};
