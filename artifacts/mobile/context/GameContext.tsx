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
  type DrillQuestionAnalyticsEntry,
  type DrillResult,
  type Operation,
} from "@/constants/achievements";

const DEFAULT_STORAGE_KEY = "@mathdrills_v4";

export const LEVEL_THRESHOLDS = [
  0, 40, 100, 200, 350, 550, 800, 1100, 1500, 2000, 2700, 3600, 4700, 6000,
  7500, 9500, 12000, 15000, 19000, 24000,
];

export const LEVEL_TITLES = [
  "Math Spark",
  "Number Scout",
  "Math Novice",
  "Fact Finder",
  "Equation Explorer",
  "Puzzle Pilot",
  "Times Table Ranger",
  "Fraction Flyer",
  "Problem Solver",
  "Math Mechanic",
  "Equation Engineer",
  "Calculation Captain",
  "Algebra Adventurer",
  "Logic Commander",
  "Rocket Reasoner",
  "Cosmic Calculator",
  "Number Navigator",
  "Math Champion",
  "Math Master",
  "Grand Math Master",
];

export const MAX_ITEM_LEVEL = 4;
const POINTS_PER_CORRECT: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 5,
};
const roundCurrency = (value: number) => Math.round(value * 100) / 100;
export const getStoredItemLevel = (levels: Record<string, number> | undefined, itemId: string) =>
  Math.min(MAX_ITEM_LEVEL, Math.max(1, levels?.[itemId] ?? 1));
export const getItemUpgradeCost = (basePrice: number, currentLevel: number) =>
  Math.ceil(basePrice * currentLevel);
export type AnimalCollectionType = "aquarium" | "zoo";
export const getAnimalLevelKey = (type: AnimalCollectionType, id: string) => `${type}:${id}`;

export interface ClassroomItemLayout {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  inTray?: boolean;
  gravityAmount?: number;
  gravityAngle?: number;
  showBorders?: boolean;
  customBorders?: Array<{ id: string; x: number; y: number; w: number; h: number; rotation: number }>;
}

export interface LaunchRocketSave {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: Array<{ x: number; y: number }>;
  visited: string[];
  inZone: string[];
  minedIds: string[];
  status: "flying" | "win" | "crash" | "lost";
  flightTraj: Array<{ x: number; y: number }>;
  tickCount: number;
}

export interface LaunchGameState {
  phase: "select" | "aim" | "flying";
  cam: { x: number; y: number; zoom: number };
  selectedId: string | null;
  activeIdx: number;
  nextRocketId: number;
  rockets: LaunchRocketSave[];
  updatedAt: number;
}

export function getLevel(points: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (points >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return level;
}

export interface LevelInfo {
  level: number;
  title: string;
  currentXp: number;
  levelStartXp: number;
  nextLevelXp: number | null;
  xpIntoLevel: number;
  xpNeededForLevel: number | null;
  xpToNext: number;
  progress: number;
  isMaxLevel: boolean;
}

export function getLevelInfo(points: number): LevelInfo {
  const currentXp = Math.max(0, Math.floor(points));
  const level = getLevel(currentXp);
  const levelIndex = level - 1;
  const levelStartXp = LEVEL_THRESHOLDS[levelIndex] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const nextLevelXp = LEVEL_THRESHOLDS[levelIndex + 1] ?? null;
  const title = LEVEL_TITLES[levelIndex] ?? LEVEL_TITLES[LEVEL_TITLES.length - 1];
  const xpNeededForLevel = nextLevelXp === null ? null : nextLevelXp - levelStartXp;
  const xpIntoLevel = Math.max(0, currentXp - levelStartXp);
  const xpToNext = nextLevelXp === null ? 0 : Math.max(0, nextLevelXp - currentXp);
  const progress =
    nextLevelXp === null || !xpNeededForLevel
      ? 1
      : Math.min(1, Math.max(0, xpIntoLevel / xpNeededForLevel));
  return {
    level,
    title,
    currentXp,
    levelStartXp,
    nextLevelXp,
    xpIntoLevel,
    xpNeededForLevel,
    xpToNext,
    progress,
    isMaxLevel: nextLevelXp === null,
  };
}

interface PerOpStats {
  totalCorrect: number;
  bestDrillScore: number;
  totalGames: number;
}

export interface QuestionAnalyticsStats {
  questionKey: string;
  display: string;
  op: Operation;
  difficulty: Difficulty;
  answer: number;
  attempts: number;
  correct: number;
  wrong: number;
  totalResponseMs: number;
  slowestResponseMs: number;
  lastResponseMs: number;
  lastSeen: number;
}

export interface GameData {
  opStats: Partial<Record<Operation, PerOpStats>>;
  unlockedAchievements: Record<string, number>;
  unclaimedBonuses: Record<string, number>;
  points: number;
  ownedItems: string[];
  equippedItems: Record<string, string>;
  classroomLayout: Record<string, ClassroomItemLayout>;
  itemLevels: Record<string, number>;
  starCoins: number;
  lastPassiveCheck: number;
  aquariumAnimals: string[];
  displayedAquariumAnimals: string[];
  zooAnimals: string[];
  displayedZooAnimals: string[];
  rocketPartsOwned: string[];
  launchComplete: boolean;
  launchGameState: LaunchGameState | null;
  planetGems: Record<string, number>;
  craftedInventions: string[];
  totalGames: number;
  allTimeBest: number;
  questionAnalytics: Record<string, QuestionAnalyticsStats>;
}

export interface GameSettings {
  operations: Operation[];
  timeLimit: number;
  difficulty: Difficulty;
  devUnlimitedMoney: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  musicEnabled: boolean;
  musicVolume: number;
  mainMusicTracks: string[];
  spaceMusicTracks: string[];
  soundtrackVersion: number;
  hapticsEnabled: boolean;
}

export interface SaveSessionResult {
  newAchievements: string[];
  pointsEarned: number;
  starCoinsEarned: number;
  planetGemsEarned: Record<string, number>;
}

const DEFAULT_SETTINGS: GameSettings = {
  operations: ["add"],
  timeLimit: 60,
  difficulty: "medium",
  devUnlimitedMoney: false,
  soundEnabled: true,
  soundVolume: 0.8,
  musicEnabled: true,
  musicVolume: 0.75,
  mainMusicTracks: ["main-1", "main-2", "main-3"],
  spaceMusicTracks: ["space-1", "space-2", "space-3", "space-4", "space-5"],
  soundtrackVersion: 3,
  hapticsEnabled: true,
};

const DEFAULT_DATA: GameData = {
  opStats: {},
  unlockedAchievements: {},
  unclaimedBonuses: {},
  points: 0,
  ownedItems: [],
  equippedItems: {},
  classroomLayout: {},
  itemLevels: {},
  starCoins: 0,
  lastPassiveCheck: Date.now(),
  aquariumAnimals: [],
  displayedAquariumAnimals: [],
  zooAnimals: [],
  displayedZooAnimals: [],
  rocketPartsOwned: [],
  launchComplete: false,
  launchGameState: null,
  planetGems: {},
  craftedInventions: [],
  totalGames: 0,
  allTimeBest: 0,
  questionAnalytics: {},
};

function mergeTrackDefaults(saved: string[] | undefined, defaults: string[]) {
  const merged = [...(saved ?? [])];
  for (const id of defaults) {
    if (!merged.includes(id)) merged.push(id);
  }
  return merged;
}

function normalizeSettings(settings: Partial<GameSettings> | undefined): GameSettings {
  const merged = { ...DEFAULT_SETTINGS, ...settings };
  const shouldUpgradeTrackLists = (settings?.soundtrackVersion ?? 1) < DEFAULT_SETTINGS.soundtrackVersion;
  return {
    ...merged,
    mainMusicTracks: shouldUpgradeTrackLists
      ? mergeTrackDefaults(settings?.mainMusicTracks, DEFAULT_SETTINGS.mainMusicTracks)
      : merged.mainMusicTracks,
    spaceMusicTracks: shouldUpgradeTrackLists
      ? mergeTrackDefaults(settings?.spaceMusicTracks, DEFAULT_SETTINGS.spaceMusicTracks)
      : merged.spaceMusicTracks,
    soundtrackVersion: DEFAULT_SETTINGS.soundtrackVersion,
  };
}

function getPassiveRate(data: GameData): number {
  const { SHOP_ITEMS } =
    require("@/constants/shopItems") as typeof import("@/constants/shopItems");
  const { AQUARIUM_ANIMALS } =
    require("@/constants/aquariumAnimals") as typeof import("@/constants/aquariumAnimals");
  const { ZOO_ANIMALS } =
    require("@/constants/zooAnimals") as typeof import("@/constants/zooAnimals");
  const { INVENTIONS } =
    require("@/constants/inventions") as typeof import("@/constants/inventions");

  let rate = 0;
  const passiveClassroomItemIds = [
    ...data.ownedItems,
    ...Object.values(data.equippedItems),
  ];
  const countedItemIds = new Set<string>();
  for (const itemId of passiveClassroomItemIds) {
    if (countedItemIds.has(itemId)) continue;
    countedItemIds.add(itemId);
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (item?.starCoinsPerHour) {
      rate += item.starCoinsPerHour * getStoredItemLevel(data.itemLevels, itemId);
    }
  }
  for (const id of data.aquariumAnimals) {
    const a = AQUARIUM_ANIMALS.find((x) => x.id === id);
    if (a?.starCoinsPerHour) {
      rate += a.starCoinsPerHour * getStoredItemLevel(data.itemLevels, getAnimalLevelKey("aquarium", id));
    }
  }
  for (const id of data.zooAnimals) {
    const a = ZOO_ANIMALS.find((x) => x.id === id);
    if (a?.starCoinsPerHour) {
      rate += a.starCoinsPerHour * getStoredItemLevel(data.itemLevels, getAnimalLevelKey("zoo", id));
    }
  }
  for (const id of (data.craftedInventions ?? [])) {
    const inv = INVENTIONS.find((i) => i.id === id);
    if (inv?.effect.starCoinsPerHour) rate += inv.effect.starCoinsPerHour;
  }
  return rate;
}

function getDrillMultiplier(data: GameData): number {
  const { INVENTIONS } =
    require("@/constants/inventions") as typeof import("@/constants/inventions");
  let mult = 1;
  for (const id of (data.craftedInventions ?? [])) {
    const inv = INVENTIONS.find((i) => i.id === id);
    if (inv?.effect.multiplier) mult *= inv.effect.multiplier;
  }
  return mult;
}

function getDrillCoinBonus(data: GameData): number {
  const { INVENTIONS } =
    require("@/constants/inventions") as typeof import("@/constants/inventions");
  let bonus = 0;
  for (const id of (data.craftedInventions ?? [])) {
    const inv = INVENTIONS.find((i) => i.id === id);
    if (inv?.effect.coinsPerAnswer) bonus += inv.effect.coinsPerAnswer;
  }
  return bonus;
}

function createDefaultGameData(): GameData {
  return {
    ...DEFAULT_DATA,
    lastPassiveCheck: Date.now(),
  };
}

function normalizeQuestionAnalyticsEntry(
  entry: DrillQuestionAnalyticsEntry
): QuestionAnalyticsStats {
  const responseMs = entry.responseMs ?? 0;
  return {
    questionKey: entry.questionKey,
    display: entry.display,
    op: entry.op,
    difficulty: entry.difficulty,
    answer: entry.answer,
    attempts: 1,
    correct: entry.correct ? 1 : 0,
    wrong: entry.correct ? 0 : 1,
    totalResponseMs: entry.correct ? responseMs : 0,
    slowestResponseMs: entry.correct ? responseMs : 0,
    lastResponseMs: entry.correct ? responseMs : 0,
    lastSeen: Date.now(),
  };
}

function mergeQuestionAnalytics(
  current: Record<string, QuestionAnalyticsStats> | undefined,
  entries: DrillQuestionAnalyticsEntry[] | undefined
) {
  if (!entries?.length) return current ?? {};
  const next = { ...(current ?? {}) };
  for (const entry of entries) {
    const existing = next[entry.questionKey];
    if (!existing) {
      next[entry.questionKey] = normalizeQuestionAnalyticsEntry(entry);
      continue;
    }
    const responseMs = entry.responseMs ?? 0;
    next[entry.questionKey] = {
      ...existing,
      display: entry.display,
      op: entry.op,
      difficulty: entry.difficulty,
      answer: entry.answer,
      attempts: existing.attempts + 1,
      correct: existing.correct + (entry.correct ? 1 : 0),
      wrong: existing.wrong + (entry.correct ? 0 : 1),
      totalResponseMs: existing.totalResponseMs + (entry.correct ? responseMs : 0),
      slowestResponseMs: entry.correct
        ? Math.max(existing.slowestResponseMs, responseMs)
        : existing.slowestResponseMs,
      lastResponseMs: entry.correct ? responseMs : existing.lastResponseMs,
      lastSeen: Date.now(),
    };
  }
  return next;
}

interface GameContextType {
  gameData: GameData;
  settings: GameSettings;
  updateSettings: (partial: Partial<GameSettings>) => void;
  saveSession: (result: DrillResult) => SaveSessionResult;
  addDrillTickRewards: (points: number, starCoins: number) => void;
  lastSession: (DrillResult & {
    newAchievements: string[];
    pointsEarned: number;
    starCoinsEarned: number;
    planetGemsEarned?: Record<string, number>;
  }) | null;
  setLastSession: (r: GameContextType["lastSession"]) => void;
  claimBonus: (achievementId: string) => number;
  purchaseItem: (itemId: string) => boolean;
  upgradeItem: (itemId: string) => boolean;
  equipItem: (slot: string, itemId: string | null) => void;
  updateClassroomLayout: (layout: Record<string, ClassroomItemLayout>) => void;
  buyAnimal: (id: string, type: "aquarium" | "zoo") => boolean;
  upgradeAnimal: (id: string, type: "aquarium" | "zoo") => boolean;
  toggleDisplayAnimal: (id: string, type: "aquarium" | "zoo") => void;
  buyRocketPart: (partId: string) => boolean;
  updateLaunchGameState: (state: LaunchGameState | null) => void;
  completeLaunch: () => void;
  addPlanetGem: (planetId: string) => void;
  spendStarCoins: (amount: number) => boolean;
  unlockAchievement: (id: string) => void;
  craftInvention: (id: string) => boolean;
  getPassiveRate: () => number;
  getDrillMultiplier: () => number;
  getDrillCoinBonus: () => number;
  getLevel: (points: number) => number;
  getLevelInfo: (points: number) => LevelInfo;
  resetGameProgress: () => void;
  resetAchievements: () => void;
  setDevUnlimitedMoney: (enabled: boolean) => void;
  isLoaded: boolean;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({
  children,
  storageKey = DEFAULT_STORAGE_KEY,
}: {
  children: React.ReactNode;
  storageKey?: string;
}) {
  const [gameData, setGameData] = useState<GameData>(DEFAULT_DATA);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [lastSession, setLastSession] =
    useState<GameContextType["lastSession"]>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const settingsRef = useRef(settings);
  const storageKeyRef = useRef(storageKey);

  useEffect(() => {
    storageKeyRef.current = storageKey;
  }, [storageKey]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const persist = useCallback((data: GameData, s: GameSettings) => {
    AsyncStorage.setItem(
      storageKeyRef.current,
      JSON.stringify({ gameData: data, settings: s })
    ).catch(() => {});
  }, []);

  useEffect(() => {
    setIsLoaded(false);
    setGameData(DEFAULT_DATA);
    setSettings(DEFAULT_SETTINGS);
    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as {
            gameData?: Partial<GameData>;
            settings?: Partial<GameSettings>;
          };
          if (parsed.gameData) {
            setGameData({ ...DEFAULT_DATA, ...parsed.gameData });
          }
          if (parsed.settings)
            setSettings(normalizeSettings(parsed.settings));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, [storageKey]);

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
      const newlyUnlocked: string[] = [];
      let starCoinsEarned = 0;
      let pointsEarned = 0;
      let planetGemsEarned: Record<string, number> = {};

      setGameData((prev) => {
        const multiplier = getDrillMultiplier(prev);
        const coinBonus = getDrillCoinBonus(prev);
        const basePoints = result.score * POINTS_PER_CORRECT[result.difficulty];
        pointsEarned = Math.round(basePoints * multiplier);
        starCoinsEarned = coinBonus * result.score;

        let next: GameData = {
          ...prev,
          totalGames: prev.totalGames + 1,
          allTimeBest: Math.max(prev.allTimeBest, result.score),
          points: roundCurrency(prev.points + pointsEarned),
          starCoins: roundCurrency(prev.starCoins + starCoinsEarned),
          opStats: { ...prev.opStats },
          questionAnalytics: mergeQuestionAnalytics(prev.questionAnalytics, result.questionAnalytics),
          unlockedAchievements: { ...prev.unlockedAchievements },
          unclaimedBonuses: { ...prev.unclaimedBonuses },
          planetGems: { ...prev.planetGems },
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

      return { newAchievements: newlyUnlocked, pointsEarned, starCoinsEarned, planetGemsEarned };
    },
    [persist]
  );

  const addDrillTickRewards = useCallback(
    (points: number, starCoins: number) => {
      if (points <= 0 && starCoins <= 0) return;
      setGameData((prev) => {
        const next: GameData = {
          ...prev,
          points: roundCurrency(prev.points + points),
          starCoins: roundCurrency(prev.starCoins + starCoins),
        };
        persist(next, settingsRef.current);
        return next;
      });
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
          itemLevels: { ...prev.itemLevels, [itemId]: getStoredItemLevel(prev.itemLevels, itemId) },
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

  const upgradeItem = useCallback(
    (itemId: string): boolean => {
      let success = false;
      setGameData((prev) => {
        const { SHOP_ITEMS } =
          require("@/constants/shopItems") as typeof import("@/constants/shopItems");
        const item = SHOP_ITEMS.find((i) => i.id === itemId);
        if (!item || !item.starCoinsPerHour || !prev.ownedItems.includes(itemId)) return prev;
        const currentLevel = getStoredItemLevel(prev.itemLevels, itemId);
        if (currentLevel >= MAX_ITEM_LEVEL) return prev;
        const cost = getItemUpgradeCost(item.price, currentLevel);
        if (!settingsRef.current.devUnlimitedMoney && prev.points < cost) return prev;
        success = true;
        const next: GameData = {
          ...prev,
          points: settingsRef.current.devUnlimitedMoney ? prev.points : prev.points - cost,
          itemLevels: { ...prev.itemLevels, [itemId]: currentLevel + 1 },
        };
        persist(next, settingsRef.current);
        return next;
      });
      return success;
    },
    [persist]
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

  const updateClassroomLayout = useCallback(
    (layout: Record<string, ClassroomItemLayout>) => {
      setGameData((prev) => {
        const next: GameData = {
          ...prev,
          classroomLayout: layout,
        };
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
        const levelKey = getAnimalLevelKey(type, id);
        let next: GameData = {
          ...prev,
          points: settingsRef.current.devUnlimitedMoney ? prev.points : prev.points - animal.price,
          [ownedKey]: [...prev[ownedKey], id],
          itemLevels: {
            ...prev.itemLevels,
            [levelKey]: getStoredItemLevel(prev.itemLevels, levelKey),
          },
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

  const upgradeAnimal = useCallback(
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
        if (!prev[ownedKey].includes(id)) return prev;
        const levelKey = getAnimalLevelKey(type, id);
        const currentLevel = getStoredItemLevel(prev.itemLevels, levelKey);
        if (currentLevel >= MAX_ITEM_LEVEL) return prev;
        const cost = getItemUpgradeCost(animal.price, currentLevel);
        if (!settingsRef.current.devUnlimitedMoney && prev.points < cost) return prev;
        success = true;
        const next: GameData = {
          ...prev,
          points: settingsRef.current.devUnlimitedMoney ? prev.points : prev.points - cost,
          itemLevels: { ...prev.itemLevels, [levelKey]: currentLevel + 1 },
        };
        persist(next, settingsRef.current);
        return next;
      });
      return success;
    },
    [persist]
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

  const updateLaunchGameState = useCallback(
    (state: LaunchGameState | null) => {
      setGameData((prev) => {
        const next: GameData = {
          ...prev,
          launchGameState: state,
        };
        persist(next, settingsRef.current);
        return next;
      });
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

  const craftInvention = useCallback(
    (inventionId: string): boolean => {
      let success = false;
      setGameData((prev) => {
        const { INVENTIONS } =
          require("@/constants/inventions") as typeof import("@/constants/inventions");
        const invention = INVENTIONS.find((i) => i.id === inventionId);
        if (!invention) return prev;
        if ((prev.craftedInventions ?? []).includes(inventionId)) return prev;
        if (getLevel(prev.points) < invention.levelRequired) return prev;
        for (const [planetId, needed] of Object.entries(invention.recipe)) {
          if ((prev.planetGems[planetId] ?? 0) < (needed as number)) return prev;
        }
        const newGems = { ...prev.planetGems };
        for (const [planetId, needed] of Object.entries(invention.recipe)) {
          newGems[planetId] = (newGems[planetId] ?? 0) - (needed as number);
        }
        success = true;
        const next: GameData = {
          ...prev,
          planetGems: newGems,
          craftedInventions: [...(prev.craftedInventions ?? []), inventionId],
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
  const getDrillMultiplierCallback = useCallback(() => getDrillMultiplier(gameData), [gameData]);
  const getDrillCoinBonusCallback = useCallback(() => getDrillCoinBonus(gameData), [gameData]);
  const getLevelInfoCallback = useCallback((points: number) => getLevelInfo(points), []);

  return (
    <GameContext.Provider
      value={{
        gameData,
        settings,
        updateSettings,
        saveSession,
        addDrillTickRewards,
        lastSession,
        setLastSession,
        claimBonus,
        purchaseItem,
        upgradeItem,
        equipItem,
        updateClassroomLayout,
        buyAnimal,
        upgradeAnimal,
        toggleDisplayAnimal,
        buyRocketPart,
        updateLaunchGameState,
        completeLaunch,
        addPlanetGem,
        spendStarCoins,
        unlockAchievement,
        craftInvention,
        getPassiveRate: getRate,
        getDrillMultiplier: getDrillMultiplierCallback,
        getDrillCoinBonus: getDrillCoinBonusCallback,
        getLevel,
        getLevelInfo: getLevelInfoCallback,
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
