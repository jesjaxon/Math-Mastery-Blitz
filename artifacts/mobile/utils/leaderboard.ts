import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Difficulty, Operation } from "@/constants/achievements";

const LOCAL_LEADERBOARD_KEY = "@mathdrills_leaderboard_v1";
const MAX_LOCAL_LEADERBOARD_ENTRIES = 5000;

const apiBaseUrl = (process.env.EXPO_PUBLIC_LEADERBOARD_URL ?? "").replace(/\/$/, "");

export type LeaderboardScope = "all" | Difficulty;
export type LeaderboardBoard = "oneMinute" | "day" | "week" | "month";

export interface LeaderboardSeason {
  id: string;
  startsAt: number;
  endsAt: number;
}

export interface LeaderboardPrize {
  rank: number;
  points: number;
  starCoins: number;
  label: string;
  zooAnimalId?: string;
}

export type LeaderboardPrizeConfig = Record<LeaderboardBoard, LeaderboardPrize[]>;

export interface LeaderboardEntry {
  id: string;
  playerId: string;
  playerName: string;
  avatar: string;
  score: number;
  difficulty: Difficulty;
  operations: Operation[];
  timeLimit: number;
  maxStreak: number;
  pointsEarned: number;
  starCoinsEarned: number;
  submittedAt: number;
}

export interface LeaderboardSubmitInput {
  playerId: string;
  playerName: string;
  avatar: string;
  score: number;
  difficulty: Difficulty;
  operations: Operation[];
  timeLimit: number;
  maxStreak: number;
  pointsEarned: number;
  starCoinsEarned: number;
}

export interface LeaderboardPrizeAward extends LeaderboardPrize {
  id: string;
  board: LeaderboardBoard;
  scope: Exclude<LeaderboardScope, "all">;
  season: LeaderboardSeason;
}

export function isOnlineLeaderboardConfigured() {
  return apiBaseUrl.length > 0;
}

export const LEADERBOARD_PRIZES: LeaderboardPrizeConfig = {
  oneMinute: [
    { rank: 1, points: 500, starCoins: 250, label: "Monthly 1-Minute Champion" },
    { rank: 2, points: 300, starCoins: 150, label: "Monthly 1-Minute Runner-Up" },
    { rank: 3, points: 150, starCoins: 75, label: "Monthly 1-Minute Top 3" },
  ],
  day: [
    { rank: 1, points: 100, starCoins: 40, label: "Daily Question Champion" },
    { rank: 2, points: 60, starCoins: 25, label: "Daily Runner-Up" },
    { rank: 3, points: 30, starCoins: 10, label: "Daily Top 3" },
  ],
  week: [
    { rank: 1, points: 350, starCoins: 150, label: "Weekly Question Champion" },
    { rank: 2, points: 200, starCoins: 90, label: "Weekly Runner-Up" },
    { rank: 3, points: 100, starCoins: 40, label: "Weekly Top 3" },
  ],
  month: [
    { rank: 1, points: 900, starCoins: 400, label: "Monthly Question Champion" },
    { rank: 2, points: 550, starCoins: 240, label: "Monthly Runner-Up" },
    { rank: 3, points: 275, starCoins: 120, label: "Monthly Top 3" },
  ],
};

function cleanName(name: string) {
  return name.trim().slice(0, 24) || "Player";
}

function sortEntries(entries: LeaderboardEntry[]) {
  return [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.maxStreak !== a.maxStreak) return b.maxStreak - a.maxStreak;
    if (a.timeLimit !== b.timeLimit) return a.timeLimit - b.timeLimit;
    return b.submittedAt - a.submittedAt;
  });
}

export function getLeaderboardSeason(board: LeaderboardBoard, at = Date.now()): LeaderboardSeason {
  const now = new Date(at);
  if (board === "day") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { id: `day:${start.toISOString().slice(0, 10)}`, startsAt: start.getTime(), endsAt: end.getTime() };
  }
  if (board === "week") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { id: `week:${start.toISOString().slice(0, 10)}`, startsAt: start.getTime(), endsAt: end.getTime() };
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return {
    id: `${board === "oneMinute" ? "oneMinute" : "month"}:${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
    startsAt: start.getTime(),
    endsAt: end.getTime(),
  };
}

function aggregateEntries(entries: LeaderboardEntry[], board: LeaderboardBoard, at?: number) {
  const season = getLeaderboardSeason(board, at);
  if (board === "oneMinute") {
    const bestByPlayer = new Map<string, LeaderboardEntry>();
    entries
      .filter((entry) => entry.timeLimit === 60 && entry.submittedAt >= season.startsAt && entry.submittedAt < season.endsAt)
      .forEach((entry) => {
        const current = bestByPlayer.get(entry.playerId);
        if (!current || sortEntries([entry, current])[0].id === entry.id) {
          bestByPlayer.set(entry.playerId, entry);
        }
      });
    return sortEntries(Array.from(bestByPlayer.values())).slice(0, 100);
  }

  const totals = new Map<string, LeaderboardEntry>();

  entries
    .filter((entry) => entry.submittedAt >= season.startsAt && entry.submittedAt < season.endsAt)
    .forEach((entry) => {
      const key = entry.playerId;
      const current = totals.get(key);
      if (!current) {
        totals.set(key, { ...entry });
        return;
      }
      totals.set(key, {
        ...current,
        id: `${board}_${key}`,
        score: current.score + entry.score,
        maxStreak: Math.max(current.maxStreak, entry.maxStreak),
        pointsEarned: current.pointsEarned + entry.pointsEarned,
        starCoinsEarned: current.starCoinsEarned + entry.starCoinsEarned,
        operations: Array.from(new Set([...current.operations, ...entry.operations])),
        submittedAt: Math.max(current.submittedAt, entry.submittedAt),
      });
    });

  return sortEntries(Array.from(totals.values())).slice(0, 100);
}

function scopeEntries(entries: LeaderboardEntry[], scope: LeaderboardScope, board: LeaderboardBoard, at?: number) {
  const scoped = scope === "all" ? entries : entries.filter((entry) => entry.difficulty === scope);
  return aggregateEntries(scoped, board, at);
}

async function readLocalEntries() {
  const raw = await AsyncStorage.getItem(LOCAL_LEADERBOARD_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as LeaderboardEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveLocalEntry(entry: LeaderboardEntry) {
  const entries = await readLocalEntries();
  const next = [entry, ...entries]
    .sort((a, b) => b.submittedAt - a.submittedAt)
    .slice(0, MAX_LOCAL_LEADERBOARD_ENTRIES);
  await AsyncStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(next));
  return next;
}

function mergeVisibleEntries(onlineEntries: LeaderboardEntry[], localEntries: LeaderboardEntry[]) {
  const bestByPlayer = new Map<string, LeaderboardEntry>();
  [...onlineEntries, ...localEntries].forEach((entry) => {
    const current = bestByPlayer.get(entry.playerId);
    if (!current || sortEntries([entry, current])[0].id === entry.id) {
      bestByPlayer.set(entry.playerId, entry);
    }
  });
  return sortEntries(Array.from(bestByPlayer.values())).slice(0, 100);
}

export async function submitLeaderboardScore(input: LeaderboardSubmitInput) {
  const entry: LeaderboardEntry = {
    id: `${input.playerId}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    playerId: input.playerId,
    playerName: cleanName(input.playerName),
    avatar: input.avatar,
    score: Math.max(0, Math.floor(input.score)),
    difficulty: input.difficulty,
    operations: input.operations,
    timeLimit: input.timeLimit,
    maxStreak: Math.max(0, Math.floor(input.maxStreak)),
    pointsEarned: input.pointsEarned,
    starCoinsEarned: input.starCoinsEarned,
    submittedAt: Date.now(),
  };

  await saveLocalEntry(entry);

  if (!isOnlineLeaderboardConfigured()) {
    return { entry, online: false };
  }

  try {
    const res = await fetch(`${apiBaseUrl}/api/leaderboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error(`Leaderboard submit failed: ${res.status}`);
    const saved = (await res.json()) as LeaderboardEntry;
    return { entry: saved, online: true };
  } catch {
    return { entry, online: false };
  }
}

export async function fetchLeaderboard(scope: LeaderboardScope = "all", board: LeaderboardBoard = "oneMinute", at?: number) {
  const local = await readLocalEntries();
  const localEntries = scopeEntries(local, scope, board, at);
  const season = getLeaderboardSeason(board, at);

  if (isOnlineLeaderboardConfigured()) {
    try {
      const params = new URLSearchParams({ scope, board });
      if (typeof at === "number") params.set("at", String(Math.floor(at)));
      const res = await fetch(`${apiBaseUrl}/api/leaderboard?${params.toString()}`);
      if (!res.ok) throw new Error(`Leaderboard fetch failed: ${res.status}`);
      const data = (await res.json()) as { entries?: LeaderboardEntry[]; season?: LeaderboardSeason; prizes?: LeaderboardPrize[] };
      return {
        entries: mergeVisibleEntries(data.entries ?? [], localEntries),
        online: true,
        season: data.season ?? getLeaderboardSeason(board),
        prizes: data.prizes ?? LEADERBOARD_PRIZES[board],
      };
    } catch {
      // Fall back to local results when the hosted service is unreachable.
    }
  }

  return {
    entries: localEntries,
    online: false,
    season,
    prizes: LEADERBOARD_PRIZES[board],
  };
}

export async function fetchFinishedLeaderboardPrizeAwards(playerId: string, prizes: LeaderboardPrizeConfig = LEADERBOARD_PRIZES) {
  const awards: LeaderboardPrizeAward[] = [];
  const boards: LeaderboardBoard[] = ["oneMinute", "day", "week", "month"];
  const scopes: Array<Exclude<LeaderboardScope, "all">> = ["easy", "medium", "hard"];

  for (const board of boards) {
    const currentSeason = getLeaderboardSeason(board);
    const previousAt = currentSeason.startsAt - 1;
    for (const scope of scopes) {
      const result = await fetchLeaderboard(scope, board, previousAt);
      const rankIndex = result.entries.findIndex((entry) => entry.playerId === playerId);
      if (rankIndex < 0) continue;
      const rank = rankIndex + 1;
      const prize = (prizes[board] ?? LEADERBOARD_PRIZES[board]).find((item) => item.rank === rank);
      if (!prize) continue;
      awards.push({
        ...prize,
        id: `${board}:${scope}:${result.season.id}:rank-${rank}`,
        board,
        scope,
        season: result.season,
      });
    }
  }

  return awards;
}

export function formatOperations(operations: Operation[]) {
  const labels: Record<Operation, string> = { add: "+", sub: "-", mul: "x", div: "÷" };
  return operations.map((op) => labels[op]).join(" ");
}
