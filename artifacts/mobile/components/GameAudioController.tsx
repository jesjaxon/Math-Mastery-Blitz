import React from "react";
import { usePathname } from "expo-router";
import { useGame } from "@/context/GameContext";
import { useGameMusic } from "@/utils/gameAudio";

export function GameAudioController() {
  const { settings } = useGame();
  const pathname = usePathname();
  const musicTrack = pathname === "/launch" || pathname === "/rocket" ? "space" : "main";
  useGameMusic(
    settings.musicEnabled,
    musicTrack,
    settings.musicVolume,
    musicTrack === "space" ? settings.spaceMusicTracks : settings.mainMusicTracks
  );
  return null;
}
