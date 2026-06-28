import type { ImageSourcePropType } from "react-native";

export const PROFILE_UI_ASSETS = {
  playerBadge: require("@/assets/game/profile-ui/player-badge.png"),
  addPlayer: require("@/assets/game/profile-ui/add-player-safe.png"),
  edit: require("@/assets/game/profile-ui/edit.png"),
  delete: require("@/assets/game/profile-ui/delete.png"),
  playingNow: require("@/assets/game/profile-ui/playing-now.png"),
  createPlay: require("@/assets/game/profile-ui/create-play.png"),
  nameTag: require("@/assets/game/profile-ui/name-tag.png"),
  selectedRing: require("@/assets/game/profile-ui/selected-ring.png"),
} satisfies Record<string, ImageSourcePropType>;
