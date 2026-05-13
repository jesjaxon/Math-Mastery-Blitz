import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  ACHIEVEMENTS,
  type Difficulty,
  type DrillResult,
  type Operation,
} from "@/constants/achievements";

const STORAGE_KEY = "@mathdrills_v1";

interface PerOpStats {
  totalCorrect: number;
  bestDrillScore: number;
  totalGames: number;
}

interface GameData {
  opStats: Partial<Record<Operation, PerOpStats>>;
  unlockedAchievements: Record<string, number>;
  totalGames: number;
  allTimeBest: number;
}

export interface GameSettings {
  operations: Operation[];
  timeLimit: number;
  difficulty: Difficulty;
}

const DEFAULT_SETTINGS: GameSettings = {
  operations: ["add"],
  timeLimit: 60,
  difficulty: "medium",
};

const DEFAULT_DATA: GameData = {
  opStats: {},
  unlockedAchievements: {},
  totalGames: 0,
  allTimeBest: 0,
};

interface GameContextType {
  gameData: GameData;
  settings: GameSettings;
  updateSettings: (partial: Partial<GameSettings>) => void;
  saveSession: (result: DrillResult) => string[];
  lastSession: DrillResult | null;
  setLastSession: (r: DrillResult | null) => void;
  isLoaded: boolean;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameData, setGameData] = useState<GameData>(DEFAULT_DATA);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [lastSession, setLastSession] = useState<DrillResult | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as {
            gameData?: GameData;
            settings?: GameSettings;
          };
          if (parsed.gameData) setGameData(parsed.gameData);
          if (parsed.settings) setSettings(parsed.settings);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, []);

  const persist = useCallback(
    (data: GameData, s: GameSettings) => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ gameData: data, settings: s })).catch(
        () => {}
      );
    },
    []
  );

  const updateSettings = useCallback(
    (partial: Partial<GameSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...partial };
        persist(gameData, next);
        return next;
      });
    },
    [gameData, persist]
  );

  const saveSession = useCallback(
    (result: DrillResult): string[] => {
      const newlyUnlocked: string[] = [];

      setGameData((prev) => {
        const next: GameData = {
          ...prev,
          totalGames: prev.totalGames + 1,
          allTimeBest: Math.max(prev.allTimeBest, result.score),
          opStats: { ...prev.opStats },
          unlockedAchievements: { ...prev.unlockedAchievements },
        };

        for (const op of result.operations) {
          const existing = next.opStats[op] ?? {
            totalCorrect: 0,
            bestDrillScore: 0,
            totalGames: 0,
          };
          next.opStats[op] = {
            totalCorrect:
              existing.totalCorrect + (result.correctByOp[op] ?? 0),
            bestDrillScore: Math.max(
              existing.bestDrillScore,
              result.correctByOp[op] ?? 0
            ),
            totalGames: existing.totalGames + 1,
          };
        }

        for (const ach of ACHIEVEMENTS) {
          if (!next.unlockedAchievements[ach.id] && ach.check(result)) {
            next.unlockedAchievements[ach.id] = Date.now();
            newlyUnlocked.push(ach.id);
          }
        }

        persist(next, settings);
        return next;
      });

      return newlyUnlocked;
    },
    [settings, persist]
  );

  return (
    <GameContext.Provider
      value={{
        gameData,
        settings,
        updateSettings,
        saveSession,
        lastSession,
        setLastSession,
        isLoaded,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
