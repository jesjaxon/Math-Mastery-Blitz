import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ACHIEVEMENTS,
  type Difficulty,
  type DrillResult,
  type Operation,
} from "@/constants/achievements";

const STORAGE_KEY = "@mathdrills_v3";

interface PerOpStats {
  totalCorrect: number;
  bestDrillScore: number;
  totalGames: number;
}

export interface GameData {
  opStats: Partial<Record<Operation, PerOpStats>>;
  unlockedAchievements: Record<string, number>;
  unclaimedBonuses: Record<string, number>;
  points: number;
  ownedItems: string[];
  equippedItems: Record<string, string>;
  starCoins: number;
  lastPassiveCheck: number;
  aquariumAnimals: string[];
  displayedAquariumAnimals: string[];
  zooAnimals: string[];
  displayedZooAnimals: string[];
  rocketPartsOwned: string[];
  launchComplete: boolean;
  planetGems: Record<string, number>;
  totalGames: number;
  allTimeBest: number;
}

export interface GameSettings {
  operations: Operation[];
  timeLimit: number;
  difficulty: Difficulty;
  devUnlimitedMoney: boolean;
}

export interface SaveSessionResult {
  newAchievements: string[];
  pointsEarned: number;
}

const DEFAULT_SETTINGS: GameSettings = {
  operations: ["add"],
  timeLimit: 60,
  difficulty: "medium",
  devUnlimitedMoney: false,
};

const DEFAULT_DATA: GameData = {
  opStats: {},
  unlockedAchievements: {},
  unclaimedBonuses: {},
  points: 0,
  ownedItems: [],
  equippedItems: {},
  starCoins: 0,
  lastPassiveCheck: Date.now(),
  aquariumAnimals: [],
  displayedAquariumAnimals: [],
  zooAnimals: [],
  displayedZooAnimals: [],
  rocketPartsOwned: [],
  launchComplete: false,
  planetGems: {},
  totalGames: 0,
  allTimeBest: 0,
};

function getPassiveRate(data: GameData): number {
  const { SHOP_ITEMS } =
    require("@/constants/shopItems") as typeof import("@/constants/shopItems");
  const { AQUARIUM_ANIMALS } =
    require("@/constants/aquariumAnimals") as typeof import("@/constants/aquariumAnimals");
  const { ZOO_ANIMALS } =
    require("@/constants/zooAnimals") as typeof import("@/constants/zooAnimals");

  let rate = 0;
  for (const itemId of Object.values(data.equippedItems)) {
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (item?.starCoinsPerHour) rate += item.starCoinsPerHour;
  }
  for (const id of data.displayedAquariumAnimals) {
    const a = AQUARIUM_ANIMALS.find((x) => x.id === id);
    if (a?.starCoinsPerHour) rate += a.starCoinsPerHour;
  }
  for (const id of data.displayedZooAnimals) {
    const a = ZOO_ANIMALS.find((x) => x.id === id);
    if (a?.starCoinsPerHour) rate += a.starCoinsPerHour;
  }
  return rate;
}

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

function applyPassiveTick(prev: GameData): GameData {
  const now = Date.now();
  const elapsed = (now - prev.lastPassiveCheck) / 3600000;
  const rate = getPassiveRate(prev);
  const earned = Math.floor(elapsed * rate);
  if (earned <= 0) return { ...prev, lastPassiveCheck: now };
  return { ...prev, starCoins: prev.starCoins + earned, lastPassiveCheck: now };
}

function createDefaultGameData(): GameData {
  return {
    ...DEFAULT_DATA,
    lastPassiveCheck: Date.now(),
  };
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
  buyAnimal: (id: string, type: "aquarium" | "zoo") => boolean;
  toggleDisplayAnimal: (id: string, type: "aquarium" | "zoo") => void;
  buyRocketPart: (partId: string) => boolean;
  completeLaunch: () => void;
  addPlanetGem: (planetId: string) => void;
  spendStarCoins: (amount: number) => boolean;
  unlockAchievement: (id: string) => void;
  getPassiveRate: () => number;
  resetGameProgress: () => void;
  resetAchievements: () => void;
  setDevUnlimitedMoney: (enabled: boolean) => void;
  isLoaded: boolean;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameData, setGameData] = useState<GameData>(DEFAULT_DATA);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [lastSession, setLastSession] =
    useState<GameContextType["lastSession"]>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const persist = useCallback((data: GameData, s: GameSettings) => {
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ gameData: data, settings: s })
    ).catch(() => {});
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as {
            gameData?: Partial<GameData>;
            settings?: Partial<GameSettings>;
          };
          if (parsed.gameData) {
            const loaded = { ...DEFAULT_DATA, ...parsed.gameData };
            setGameData(applyPassiveTick(loaded));
          }
          if (parsed.settings)
            setSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
        }
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const interval = setInterval(() => {
      setGameData((prev) => {
        const next = applyPassiveTick(prev);
        if (next === prev) return prev;
        persist(next, settingsRef.current);
        return next;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [isLoaded, persist]);

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

  const checkExternalAchievements = useCallback(
    (data: GameData): string[] => {
      const newly: string[] = [];
      if (!data.unlockedAchievements["first_shop"] && data.ownedItems.length >= 1)
        newly.push("first_shop");
      const totalAnimals = data.aquariumAnimals.length + data.zooAnimals.length;
      if (!data.unlockedAchievements["animal_collector"] && totalAnimals >= 10)
        newly.push("animal_collector");
      if (!data.unlockedAchievements["astronaut"] && data.launchComplete)
        newly.push("astronaut");
      return newly;
    },
    []
  );

  const applyExternalAchievements = useCallback(
    (prev: GameData, ids: string[]): GameData => {
      if (ids.length === 0) return prev;
      const next = {
        ...prev,
        unlockedAchievements: { ...prev.unlockedAchievements },
        unclaimedBonuses: { ...prev.unclaimedBonuses },
      };
      for (const id of ids) {
        const ach = ACHIEVEMENTS.find((a) => a.id === id);
        if (!ach || next.unlockedAchievements[id]) continue;
        next.unlockedAchievements[id] = Date.now();
        next.unclaimedBonuses[id] = ach.bonusPoints;
      }
      return next;
    },
    []
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
        let next: GameData = {
          ...prev,
          totalGames: prev.totalGames + 1,
          allTimeBest: Math.max(prev.allTimeBest, result.score),
          points: prev.points + pointsEarned,
          opStats: { ...prev.opStats },
          unlockedAchievements: { ...prev.unlockedAchievements },
          unclaimedBonuses: { ...prev.unclaimedBonuses },
        };

        for (const op of result.operations) {
          const existing = next.opStats[op] ?? { totalCorrect: 0, bestDrillScore: 0, totalGames: 0 };
          next.opStats[op] = {
            totalCorrect: existing.totalCorrect + (result.correctByOp[op] ?? 0),
            bestDrillScore: Math.max(existing.bestDrillScore, result.correctByOp[op] ?? 0),
            totalGames: existing.totalGames + 1,
          };
        }

        const fullResult = { ...result, totalGames: next.totalGames };
        for (const ach of ACHIEVEMENTS) {
          if (!next.unlockedAchievements[ach.id] && ach.check(fullResult)) {
            next.unlockedAchievements[ach.id] = Date.now();
            next.unclaimedBonuses[ach.id] = ach.bonusPoints;
            newlyUnlocked.push(ach.id);
          }
        }

        persist(next, settingsRef.current);
        return next;
      });

      return { newAchievements: newlyUnlocked, pointsEarned };
    },
    [persist]
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
        persist(next, settingsRef.current);
        return next;
      });
      return claimed;
    },
    [persist]
  );

  const purchaseItem = useCallback(
    (itemId: string): boolean => {
      let success = false;
      setGameData((prev) => {
        const { SHOP_ITEMS } =
          require("@/constants/shopItems") as typeof import("@/constants/shopItems");
        const item = SHOP_ITEMS.find((i) => i.id === itemId);
        if (!item || prev.ownedItems.includes(itemId)) return prev;
        if (!settingsRef.current.devUnlimitedMoney && prev.points < item.price) return prev;
        success = true;
        let next: GameData = {
          ...prev,
          points: settingsRef.current.devUnlimitedMoney ? prev.points : prev.points - item.price,
          ownedItems: [...prev.ownedItems, itemId],
        };
        const extIds = checkExternalAchievements(next);
        next = applyExternalAchievements(next, extIds);
        persist(next, settingsRef.current);
        return next;
      });
      return success;
    },
    [persist, checkExternalAchievements, applyExternalAchievements]
  );

  const equipItem = useCallback(
    (slot: string, itemId: string | null) => {
      setGameData((prev) => {
        const next: GameData = {
          ...prev,
          equippedItems: { ...prev.equippedItems },
        };
        if (itemId === null) delete next.equippedItems[slot];
        else next.equippedItems[slot] = itemId;
        persist(next, settingsRef.current);
        return next;
      });
    },
    [persist]
  );

  const buyAnimal = useCallback(
    (id: string, type: "aquarium" | "zoo"): boolean => {
      let success = false;
      setGameData((prev) => {
        const { AQUARIUM_ANIMALS } =
          require("@/constants/aquariumAnimals") as typeof import("@/constants/aquariumAnimals");
        const { ZOO_ANIMALS } =
          require("@/constants/zooAnimals") as typeof import("@/constants/zooAnimals");
        const animal =
          type === "aquarium"
            ? AQUARIUM_ANIMALS.find((a) => a.id === id)
            : ZOO_ANIMALS.find((a) => a.id === id);
        if (!animal) return prev;
        const ownedKey = type === "aquarium" ? "aquariumAnimals" : "zooAnimals";
        if (prev[ownedKey].includes(id)) return prev;
        if (!settingsRef.current.devUnlimitedMoney && prev.points < animal.price)
          return prev;
        success = true;
        let next: GameData = {
          ...prev,
          points: settingsRef.current.devUnlimitedMoney ? prev.points : prev.points - animal.price,
          [ownedKey]: [...prev[ownedKey], id],
        };
        const extIds = checkExternalAchievements(next);
        next = applyExternalAchievements(next, extIds);
        persist(next, settingsRef.current);
        return next;
      });
      return success;
    },
    [persist, checkExternalAchievements, applyExternalAchievements]
  );

  const toggleDisplayAnimal = useCallback(
    (id: string, type: "aquarium" | "zoo") => {
      setGameData((prev) => {
        const displayKey =
          type === "aquarium" ? "displayedAquariumAnimals" : "displayedZooAnimals";
        const current = prev[displayKey];
        const isDisplayed = current.includes(id);
        const next: GameData = {
          ...prev,
          [displayKey]: isDisplayed
            ? current.filter((x) => x !== id)
            : [...current, id],
        };
        persist(next, settingsRef.current);
        return next;
      });
    },
    [persist]
  );

  const buyRocketPart = useCallback(
    (partId: string): boolean => {
      let success = false;
      setGameData((prev) => {
        const { ROCKET_PARTS } =
          require("@/constants/rocketParts") as typeof import("@/constants/rocketParts");
        const part = ROCKET_PARTS.find((p) => p.id === partId);
        if (!part || prev.rocketPartsOwned.includes(partId)) return prev;
        if (!settingsRef.current.devUnlimitedMoney && prev.starCoins < part.cost)
          return prev;
        success = true;
        const next: GameData = {
          ...prev,
          starCoins: settingsRef.current.devUnlimitedMoney ? prev.starCoins : prev.starCoins - part.cost,
          rocketPartsOwned: [...prev.rocketPartsOwned, partId],
        };
        persist(next, settingsRef.current);
        return next;
      });
      return success;
    },
    [persist]
  );

  const completeLaunch = useCallback(() => {
    setGameData((prev) => {
      if (prev.launchComplete) return prev;
      let next: GameData = { ...prev, launchComplete: true };
      const extIds = checkExternalAchievements(next);
      next = applyExternalAchievements(next, extIds);
      persist(next, settingsRef.current);
      return next;
    });
  }, [persist, checkExternalAchievements, applyExternalAchievements]);

  const addPlanetGem = useCallback(
    (planetId: string) => {
      setGameData((prev) => {
        const next: GameData = {
          ...prev,
          planetGems: { ...prev.planetGems, [planetId]: (prev.planetGems[planetId] ?? 0) + 1 },
        };
        persist(next, settingsRef.current);
        return next;
      });
    },
    [persist]
  );

  const spendStarCoins = useCallback(
    (amount: number): boolean => {
      let success = false;
      setGameData((prev) => {
        if (!settingsRef.current.devUnlimitedMoney && prev.starCoins < amount) return prev;
        success = true;
        const next: GameData = {
          ...prev,
          starCoins: settingsRef.current.devUnlimitedMoney ? prev.starCoins : prev.starCoins - amount,
        };
        persist(next, settingsRef.current);
        return next;
      });
      return success;
    },
    [persist]
  );

  const unlockAchievement = useCallback(
    (id: string) => {
      const ach = ACHIEVEMENTS.find((a) => a.id === id);
      if (!ach) return;
      setGameData((prev) => {
        if (prev.unlockedAchievements[id]) return prev;
        const next: GameData = {
          ...prev,
          unlockedAchievements: { ...prev.unlockedAchievements, [id]: Date.now() },
          unclaimedBonuses: { ...prev.unclaimedBonuses, [id]: ach.bonusPoints },
        };
        persist(next, settingsRef.current);
        return next;
      });
    },
    [persist]
  );

  const resetGameProgress = useCallback(() => {
    setGameData((prev) => {
      const next = createDefaultGameData();
      persist(next, settingsRef.current);
      return { ...next, lastPassiveCheck: prev.lastPassiveCheck };
    });
  }, [persist]);

  const resetAchievements = useCallback(() => {
    setGameData((prev) => {
      const next: GameData = {
        ...prev,
        unlockedAchievements: {},
        unclaimedBonuses: {},
      };
      persist(next, settingsRef.current);
      return next;
    });
  }, [persist]);

  const setDevUnlimitedMoney = useCallback(
    (enabled: boolean) => {
      setSettings((prev) => {
        const next = { ...prev, devUnlimitedMoney: enabled };
        const nextData = enabled
          ? { ...gameData, starCoins: Math.max(gameData.starCoins, 100000) }
          : gameData;
        persist(nextData, next);
        return next;
      });
      if (enabled) {
        setGameData((prev) => {
          if (prev.starCoins >= 100000) return prev;
          const next = { ...prev, starCoins: 100000 };
          persist(next, { ...settingsRef.current, devUnlimitedMoney: true });
          return next;
        });
      }
    },
    [gameData, persist]
  );

  const getRate = useCallback(() => getPassiveRate(gameData), [gameData]);

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
        buyAnimal,
        toggleDisplayAnimal,
        buyRocketPart,
        completeLaunch,
        addPlanetGem,
        spendStarCoins,
        unlockAchievement,
        getPassiveRate: getRate,
        resetGameProgress,
        resetAchievements,
        setDevUnlimitedMoney,
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
