import type { ImageSourcePropType } from "react-native";

export const START_DRILL_ASSETS = {
  startYellow: require("@/assets/game/start-drill/start-drill-yellow.png"),
  startPurple: require("@/assets/game/start-drill/start-drill-purple.png"),
  missionBadge: require("@/assets/game/start-drill/mission-badge.png"),
  selectAll: require("@/assets/game/start-drill/select-all.png"),
  operationAdd: require("@/assets/game/start-drill/operation-add.png"),
  operationSubtract: require("@/assets/game/start-drill/operation-subtract.png"),
  operationMultiply: require("@/assets/game/start-drill/operation-multiply.png"),
  operationDivide: require("@/assets/game/start-drill/operation-divide.png"),
  selectedRing: require("@/assets/game/start-drill/selected-ring.png"),
  backButton: require("@/assets/game/start-drill/back-button.png"),
  timeLimit: require("@/assets/game/start-drill/time-limit.png"),
  difficulty: require("@/assets/game/start-drill/difficulty.png"),
} satisfies Record<string, ImageSourcePropType>;
