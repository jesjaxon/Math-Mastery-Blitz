import type { ImageSourcePropType } from "react-native";

export const SPACE_ASSETS = {
  background: require("@/assets/game/space/background.png"),
  rocket: require("@/assets/game/rocket/assembled-rocket.png"),
};

export const PLANET_ASSETS: Record<string, ImageSourcePropType> = {
  sun: require("@/assets/game/space/planets/sun.png"),
  mercury: require("@/assets/game/space/planets/mercury.png"),
  venus: require("@/assets/game/space/planets/venus.png"),
  earth: require("@/assets/game/space/planets/earth.png"),
  moon: require("@/assets/game/space/planets/moon.png"),
  mars: require("@/assets/game/space/planets/mars.png"),
  jupiter: require("@/assets/game/space/planets/jupiter.png"),
  io: require("@/assets/game/space/planets/io.png"),
  europa: require("@/assets/game/space/planets/europa.png"),
  ganymede: require("@/assets/game/space/planets/ganymede.png"),
  callisto: require("@/assets/game/space/planets/callisto.png"),
  saturn: require("@/assets/game/space/planets/saturn.png"),
  uranus: require("@/assets/game/space/planets/uranus.png"),
  neptune: require("@/assets/game/space/planets/neptune.png"),
};
