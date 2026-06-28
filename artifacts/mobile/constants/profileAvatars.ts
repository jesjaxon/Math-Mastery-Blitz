import type { ImageSourcePropType } from "react-native";

export const PROFILE_AVATAR_IDS = [
  "black-boy",
  "black-girl",
  "east-asian-boy",
  "east-asian-girl",
  "south-asian-boy",
  "south-asian-girl",
  "latino-boy",
  "latina-girl",
  "middle-eastern-boy",
  "middle-eastern-girl",
  "white-boy",
  "white-girl",
] as const;

export type ProfileAvatarId = (typeof PROFILE_AVATAR_IDS)[number];

export const PROFILE_AVATAR_ASSETS: Record<ProfileAvatarId, ImageSourcePropType> = {
  "black-boy": require("@/assets/game/avatars/black-boy.png"),
  "black-girl": require("@/assets/game/avatars/black-girl.png"),
  "east-asian-boy": require("@/assets/game/avatars/east-asian-boy.png"),
  "east-asian-girl": require("@/assets/game/avatars/east-asian-girl.png"),
  "south-asian-boy": require("@/assets/game/avatars/south-asian-boy.png"),
  "south-asian-girl": require("@/assets/game/avatars/south-asian-girl.png"),
  "latino-boy": require("@/assets/game/avatars/latino-boy.png"),
  "latina-girl": require("@/assets/game/avatars/latina-girl.png"),
  "middle-eastern-boy": require("@/assets/game/avatars/middle-eastern-boy.png"),
  "middle-eastern-girl": require("@/assets/game/avatars/middle-eastern-girl.png"),
  "white-boy": require("@/assets/game/avatars/white-boy.png"),
  "white-girl": require("@/assets/game/avatars/white-girl.png"),
};

export function getProfileAvatarAsset(avatar: string | null | undefined) {
  return PROFILE_AVATAR_ASSETS[avatar as ProfileAvatarId];
}
