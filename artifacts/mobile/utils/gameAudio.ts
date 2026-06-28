import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import { useEffect } from "react";
import { Platform } from "react-native";

type SoundKey = "keyTap" | "correct" | "wrong" | "spaceThruster" | "spacePlanetMined" | "spaceReturnEarth";
export type MusicTrack = "main" | "space";
export type MusicTrackOption = { id: string; label: string; mode: MusicTrack };

const AUDIO_ASSETS = {
  mainMusic: {
    "main-1": require("@/assets/game/audio/kid-space-beat.wav"),
    "main-2": require("@/assets/game/audio/kid-space-beat-2.wav"),
    "main-3": require("@/assets/game/audio/kid-space-beat-3.wav"),
  },
  spaceMusic: {
    "space-1": require("@/assets/game/audio/space-ambient-loop.wav"),
    "space-2": require("@/assets/game/audio/space-dark-ambient-1.wav"),
    "space-3": require("@/assets/game/audio/space-chill-ambient-beat.wav"),
    "space-4": require("@/assets/game/audio/space-dark-ambient-2.wav"),
    "space-5": require("@/assets/game/audio/space-ether-rhythm.wav"),
  },
  keyTap: require("@/assets/game/audio/key-tap.wav"),
  correct: require("@/assets/game/audio/correct.wav"),
  wrong: require("@/assets/game/audio/wrong.wav"),
  spaceThruster: require("@/assets/game/audio/space-thruster.wav"),
  spacePlanetMined: require("@/assets/game/audio/space-planet-mined.wav"),
  spaceReturnEarth: require("@/assets/game/audio/space-return-earth.wav"),
};

export const MAIN_MUSIC_TRACKS: MusicTrackOption[] = [
  { id: "main-1", label: "Space Math Beat", mode: "main" },
  { id: "main-2", label: "Rocket Recess Beat", mode: "main" },
  { id: "main-3", label: "Star Hopper Beat", mode: "main" },
];

export const SPACE_MUSIC_TRACKS: MusicTrackOption[] = [
  { id: "space-1", label: "Deep Orbit Ambient", mode: "space" },
  { id: "space-2", label: "Low Orbit Drift", mode: "space" },
  { id: "space-3", label: "Cosmic Drift Beat", mode: "space" },
  { id: "space-4", label: "Nebula Sleepwave", mode: "space" },
  { id: "space-5", label: "Ether Rhythm", mode: "space" },
];

function getMusicSources(track: MusicTrack, enabledIds: string[]) {
  const catalog = track === "space" ? SPACE_MUSIC_TRACKS : MAIN_MUSIC_TRACKS;
  const assets = track === "space" ? AUDIO_ASSETS.spaceMusic : AUDIO_ASSETS.mainMusic;
  const selected = catalog
    .filter((item) => enabledIds.includes(item.id))
    .map((item) => assets[item.id as keyof typeof assets])
    .filter(Boolean);
  return selected.length > 0
    ? selected
    : catalog.map((item) => assets[item.id as keyof typeof assets]).filter(Boolean);
}

const soundCache: Partial<Record<SoundKey, AudioPlayer>> = {};
const loopingSoundCache: Partial<Record<SoundKey, AudioPlayer>> = {};
const SOUND_VOLUME: Record<SoundKey, number> = {
  keyTap: 0.3,
  correct: 0.3,
  wrong: 0.35,
  spaceThruster: 0.32,
  spacePlanetMined: 0.38,
  spaceReturnEarth: 0.4,
};

export async function playGameSound(key: SoundKey, enabled: boolean, volume = 1) {
  if (!enabled || Platform.OS === "web") return;
  try {
    let sound = soundCache[key];
    if (!sound) {
      sound = createAudioPlayer(AUDIO_ASSETS[key], { keepAudioSessionActive: true });
      soundCache[key] = sound;
    }
    sound.volume = SOUND_VOLUME[key] * Math.max(0, Math.min(1, volume));
    await sound.seekTo(0);
    sound.play();
  } catch {
    // Audio is a nice-to-have; never let playback failures interrupt a drill.
  }
}

export function startLoopingGameSound(key: SoundKey, enabled: boolean, volume = 1) {
  if (!enabled || Platform.OS === "web") return;
  try {
    let sound = loopingSoundCache[key];
    if (!sound) {
      sound = createAudioPlayer(AUDIO_ASSETS[key], { keepAudioSessionActive: true });
      sound.loop = true;
      loopingSoundCache[key] = sound;
    }
    sound.volume = SOUND_VOLUME[key] * Math.max(0, Math.min(1, volume));
    sound.play();
  } catch {
    // Audio is a nice-to-have; never let playback failures interrupt the game.
  }
}

export function stopLoopingGameSound(key: SoundKey) {
  try {
    loopingSoundCache[key]?.pause();
  } catch {
    // Stopping optional audio should never interrupt gameplay.
  }
}

export function useGameMusic(enabled: boolean, track: MusicTrack = "main", volume = 1, enabledTrackIds: string[] = []) {
  useEffect(() => {
    if (!enabled || Platform.OS === "web") return;
    let isMounted = true;
    let music: AudioPlayer | null = null;
    let rotateTimer: ReturnType<typeof setInterval> | null = null;
    let trackIndex = 0;
    const musicVolume = Math.max(0, Math.min(1, volume));
    const sources = getMusicSources(track, enabledTrackIds);

    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: "mixWithOthers",
    }).catch(() => {});

    try {
      const player = createAudioPlayer(sources[trackIndex]);
      player.loop = true;
      player.volume = (track === "space" ? 0.3 : 0.22) * musicVolume;
      if (isMounted) {
        music = player;
        player.play();
        if (sources.length > 1) {
          rotateTimer = setInterval(() => {
            if (!music) return;
            trackIndex = (trackIndex + 1) % sources.length;
            try {
              music.replace(sources[trackIndex]);
              music.loop = true;
              music.volume = (track === "space" ? 0.3 : 0.22) * musicVolume;
              music.play();
            } catch {}
          }, 24000);
        }
      } else {
        player.remove();
      }
    } catch {
      // Music is optional; the game should keep running if the audio session is unavailable.
    }

    return () => {
      isMounted = false;
      if (rotateTimer) clearInterval(rotateTimer);
      if (music) {
        music.pause();
        music.remove();
      }
    };
  }, [enabled, track, volume, enabledTrackIds.join("|")]);
}
