import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Difficulty, Operation } from "@/constants/achievements";

const LOCAL_LEADERBOARD_KEY = "@mathdrills_leaderboard_v1";
const MAX_LOCAL_LEADERBOARD_ENTRIES = 5000;

const apiBaseUrl = (process.env.EXPO_PUBLIC_LEADERBOARD_URL ?? "").replace(/\/$/, "");

export type LeaderboardScope = "all" | Difficulty;
export type LeaderboardBoard = "oneMinute" | "day" | "week" | "month";

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

export function isOnlineLeaderboardConfigured() {
  return apiBaseUrl.length > 0;
}

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

function boardStart(board: LeaderboardBoard) {
  const now = new Date();
  if (board === "day") return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (board === "week") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    start.setDate(start.getDate() - start.getDay());
    return start.getTime();
  }
  if (board === "month") return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  return 0;
}

function aggregateEntries(entries: LeaderboardEntry[], board: LeaderboardBoard) {
  if (board === "oneMinute") {
    const bestByPlayer = new Map<string, LeaderboardEntry>();
    entries
      .filter((entry) => entry.timeLimit === 60)
      .forEach((entry) => {
        const current = bestByPlayer.get(entry.playerId);
        if (!current || sortEntries([entry, current])[0].id === entry.id) {
          bestByPlayer.set(entry.playerId, entry);
        }
      });
    return sortEntries(Array.from(bestByPlayer.values())).slice(0, 100);
  }

  const start = boardStart(board);
  const totals = new Map<string, LeaderboardEntry>();

  entries
    .filter((entry) => entry.submittedAt >= start)
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

function scopeEntries(entries: LeaderboardEntry[], scope: LeaderboardScope, board: LeaderboardBoard) {
  const scoped = scope === "all" ? entries : entries.filter((entry) => entry.difficulty === scope);
  return aggregateEntries(scoped, board);
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

export async function fetchLeaderboard(scope: LeaderboardScope = "all", board: LeaderboardBoard = "oneMinute") {
  if (isOnlineLeaderboardConfigured()) {
    try {
      const params = new URLSearchParams({ scope, board });
      const res = await fetch(`${apiBaseUrl}/api/leaderboard?${params.toString()}`);
      if (!res.ok) throw new Error(`Leaderboard fetch failed: ${res.status}`);
      const data = (await res.json()) as { entries?: LeaderboardEntry[] };
      return { entries: sortEntries(data.entries ?? []), online: true };
    } catch {
      // Fall back to local results when the hosted service is unreachable.
    }
  }

  const local = await readLocalEntries();
  return { entries: scopeEntries(local, scope, board), online: false };
}

export function formatOperations(operations: Operation[]) {
  const labels: Record<Operation, string> = { add: "+", sub: "-", mul: "x", div: "÷" };
  return operations.map((op) => labels[op]).join(" ");
}
