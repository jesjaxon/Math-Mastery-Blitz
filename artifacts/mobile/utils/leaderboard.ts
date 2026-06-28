import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Difficulty, Operation } from "@/constants/achievements";

const LOCAL_LEADERBOARD_KEY = "@mathdrills_leaderboard_v1";

const apiBaseUrl = (process.env.EXPO_PUBLIC_LEADERBOARD_URL ?? "").replace(/\/$/, "");

export type LeaderboardScope = "all" | Difficulty;

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

function scopeEntries(entries: LeaderboardEntry[], scope: LeaderboardScope) {
  const scoped = scope === "all" ? entries : entries.filter((entry) => entry.difficulty === scope);
  return sortEntries(scoped).slice(0, 100);
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
  const next = sortEntries([entry, ...entries]).slice(0, 200);
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

export async function fetchLeaderboard(scope: LeaderboardScope = "all") {
  if (isOnlineLeaderboardConfigured()) {
    try {
      const res = await fetch(`${apiBaseUrl}/api/leaderboard?scope=${encodeURIComponent(scope)}`);
      if (!res.ok) throw new Error(`Leaderboard fetch failed: ${res.status}`);
      const data = (await res.json()) as { entries?: LeaderboardEntry[] };
      return { entries: sortEntries(data.entries ?? []), online: true };
    } catch {
      // Fall back to local results when the hosted service is unreachable.
    }
  }

  const local = await readLocalEntries();
  return { entries: scopeEntries(local, scope), online: false };
}

export function formatOperations(operations: Operation[]) {
  const labels: Record<Operation, string> = { add: "+", sub: "-", mul: "x", div: "÷" };
  return operations.map((op) => labels[op]).join(" ");
}
