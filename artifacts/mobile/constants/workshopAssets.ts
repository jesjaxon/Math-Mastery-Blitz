import type { ImageSourcePropType } from "react-native";

export const WORKSHOP_ASSETS = {
  background: require("@/assets/game/workshop/background.png"),
};

export const GEM_ASSETS: Record<string, ImageSourcePropType> = {
  moon: require("@/assets/game/workshop/gems/moon.png"),
  mercury: require("@/assets/game/workshop/gems/mercury.png"),
  venus: require("@/assets/game/workshop/gems/venus.png"),
  mars: require("@/assets/game/workshop/gems/mars.png"),
  jupiter: require("@/assets/game/workshop/gems/jupiter.png"),
  io: require("@/assets/game/space/planets/io.png"),
  europa: require("@/assets/game/space/planets/europa.png"),
  ganymede: require("@/assets/game/space/planets/ganymede.png"),
  callisto: require("@/assets/game/space/planets/callisto.png"),
  saturn: require("@/assets/game/workshop/gems/saturn.png"),
  uranus: require("@/assets/game/workshop/gems/uranus.png"),
  neptune: require("@/assets/game/workshop/gems/neptune.png"),
};

export const INVENTION_ASSETS: Record<string, ImageSourcePropType> = {
  lunar_lamp: require("@/assets/game/workshop/inventions/lunar_lamp.png"),
  rust_drill: require("@/assets/game/workshop/inventions/rust_drill.png"),
  acid_flask: require("@/assets/game/workshop/inventions/acid_flask.png"),
  graphite_pencil: require("@/assets/game/workshop/inventions/graphite_pencil.png"),
  sapphire_lens: require("@/assets/game/workshop/inventions/sapphire_lens.png"),
  gravity_boots: require("@/assets/game/workshop/inventions/gravity_boots.png"),
  solar_amplifier: require("@/assets/game/workshop/inventions/solar_amplifier.png"),
  frost_lens: require("@/assets/game/workshop/inventions/frost_lens.png"),
  gas_reactor: require("@/assets/game/workshop/inventions/gas_reactor.png"),
  topaz_crown: require("@/assets/game/workshop/inventions/topaz_crown.png"),
  deep_compass: require("@/assets/game/workshop/inventions/deep_compass.png"),
  star_map: require("@/assets/game/workshop/inventions/star_map.png"),
  plasma_engine: require("@/assets/game/workshop/inventions/plasma_engine.png"),
  ring_forge: require("@/assets/game/workshop/inventions/ring_forge.png"),
  nebula_jar: require("@/assets/game/workshop/inventions/nebula_jar.png"),
  crimson_shield: require("@/assets/game/workshop/inventions/crimson_shield.png"),
  ice_core: require("@/assets/game/workshop/inventions/ice_core.png"),
  cosmic_engine: require("@/assets/game/workshop/inventions/cosmic_engine.png"),
  void_prism: require("@/assets/game/workshop/inventions/void_prism.png"),
  grand_orrery: require("@/assets/game/workshop/inventions/grand_orrery.png"),
  infinity_core: require("@/assets/game/workshop/inventions/infinity_core.png"),
};
