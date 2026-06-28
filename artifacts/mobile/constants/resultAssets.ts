import type { ImageSourcePropType } from "react-native";

export const RESULT_ASSETS = {
  trophy: require("@/assets/game/results/trophy.png"),
  points: require("@/assets/game/results/points.png"),
  starCoins: require("@/assets/game/results/star-coins.png"),
  personalBest: require("@/assets/game/results/personal-best.png"),
  streak: require("@/assets/game/results/streak.png"),
  operations: require("@/assets/game/results/operations.png"),
  badges: require("@/assets/game/results/badges.png"),
  playAgain: require("@/assets/game/results/play-again.png"),
} satisfies Record<string, ImageSourcePropType>;
