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

const STORAGE_KEY = "@mathdrills_v2";

interface PerOpStats {
  totalCorrect: number;
  bestDrillScore: number;
  totalGames: number;
}

export interface GameData {
  opStats: Partial<Record<Operation, PerOpStats>>;
  unlockedAchievements: Record<string, number>; // id -> timestamp
  unclaimedBonuses: Record<string, number>; // achievementId -> pts
  points: number; // current spendable balance
  ownedItems: string[]; // shop item ids
  equippedItems: Record<string, string>; // slot -> itemId
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
  unclaimedBonuses: {},
  points: 0,
  ownedItems: [],
  equippedItems: {},
  totalGames: 0,
  allTimeBest: 0,
};

export interface SaveSessionResult {
  newAchievements: string[];
  pointsEarned: number;
}

interface GameContextType {
  gameData: GameData;
  settings: GameSettings;
  updateSettings: (partial: Partial<GameSettings>) => void;
  saveSession: (result: DrillResult) => SaveSessionResult;
  lastSession: (DrillResult & { newAchievements: string[]; pointsEarned: number }) | null;
  setLastSession: (r: GameContextType["lastSession"]) => void;
  claimBonus: (achievementId: string) => number;
  purchaseItem: (itemId: string) => boolean;
  equipItem: (slot: string, itemId: string | null) => void;
  isLoaded: boolean;
}

const GameContext = createContext<GameContextType | null>(null);

function calculateDrillPoints(
  score: number,
  difficulty: Difficulty,
  maxStreak: number
): number {
  const base = score * ({ easy: 10, medium: 15, hard: 25 }[difficulty] ?? 10);
  const mult =
    maxStreak >= 20 ? 1.5 : maxStreak >= 10 ? 1.25 : maxStreak >= 5 ? 1.1 : 1;
  return Math.round(base * mult);
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameData, setGameData] = useState<GameData>(DEFAULT_DATA);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [lastSession, setLastSession] =
    useState<GameContextType["lastSession"]>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as {
            gameData?: Partial<GameData>;
            settings?: Partial<GameSettings>;
          };
          if (parsed.gameData)
            setGameData({ ...DEFAULT_DATA, ...parsed.gameData });
          if (parsed.settings)
            setSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
        }
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, []);

  const persist = useCallback((data: GameData, s: GameSettings) => {
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ gameData: data, settings: s })
    ).catch(() => {});
  }, []);

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
    (result: DrillResult): SaveSessionResult => {
      const pointsEarned = calculateDrillPoints(
        result.score,
        result.difficulty,
        result.maxStreak
      );
      const newlyUnlocked: string[] = [];

      setGameData((prev) => {
        const next: GameData = {
          ...prev,
          totalGames: prev.totalGames + 1,
          allTimeBest: Math.max(prev.allTimeBest, result.score),
          points: prev.points + pointsEarned,
          opStats: { ...prev.opStats },
          unlockedAchievements: { ...prev.unlockedAchievements },
          unclaimedBonuses: { ...prev.unclaimedBonuses },
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
            next.unclaimedBonuses[ach.id] = ach.bonusPoints;
            newlyUnlocked.push(ach.id);
          }
        }

        persist(next, settings);
        return next;
      });

      return { newAchievements: newlyUnlocked, pointsEarned };
    },
    [settings, persist]
  );

  const claimBonus = useCallback(
    (achievementId: string): number => {
      let claimed = 0;
      setGameData((prev) => {
        const bonus = prev.unclaimedBonuses[achievementId] ?? 0;
        if (!bonus) return prev;
        claimed = bonus;
        const next: GameData = {
          ...prev,
          points: prev.points + bonus,
          unclaimedBonuses: { ...prev.unclaimedBonuses },
        };
        delete next.unclaimedBonuses[achievementId];
        persist(next, settings);
        return next;
      });
      return claimed;
    },
    [settings, persist]
  );

  const purchaseItem = useCallback(
    (itemId: string): boolean => {
      let success = false;
      setGameData((prev) => {
        // Dynamically import to avoid circular dep issues at module level
        const { SHOP_ITEMS } =
          require("@/constants/shopItems") as typeof import("@/constants/shopItems");
        const item = SHOP_ITEMS.find((i) => i.id === itemId);
        if (!item) return prev;
        if (prev.ownedItems.includes(itemId)) return prev;
        if (prev.points < item.price) return prev;
        success = true;
        const next: GameData = {
          ...prev,
          points: prev.points - item.price,
          ownedItems: [...prev.ownedItems, itemId],
        };
        persist(next, settings);
        return next;
      });
      return success;
    },
    [settings, persist]
  );

  const equipItem = useCallback(
    (slot: string, itemId: string | null) => {
      setGameData((prev) => {
        const next: GameData = {
          ...prev,
          equippedItems: { ...prev.equippedItems },
        };
        if (itemId === null) {
          delete next.equippedItems[slot];
        } else {
          next.equippedItems[slot] = itemId;
        }
        persist(next, settings);
        return next;
      });
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
        claimBonus,
        purchaseItem,
        equipItem,
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
