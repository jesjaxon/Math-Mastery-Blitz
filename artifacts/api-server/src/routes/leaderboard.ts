import { promises as fs } from "node:fs";
import path from "node:path";
import { Router, type IRouter } from "express";

type Difficulty = "easy" | "medium" | "hard";
type Operation = "add" | "sub" | "mul" | "div";
type LeaderboardBoard = "oneMinute" | "day" | "week" | "month";

interface LeaderboardSeason {
  id: string;
  startsAt: number;
  endsAt: number;
}

interface LeaderboardPrize {
  rank: number;
  points: number;
  starCoins: number;
  label: string;
}

interface LeaderboardEntry {
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

const router: IRouter = Router();
const leaderboardFile = process.env["LEADERBOARD_FILE"] ?? path.join(process.cwd(), "leaderboard.json");
const supabaseUrl = process.env["SUPABASE_URL"]?.replace(/\/$/, "");
const supabaseServiceRoleKey =
  process.env["SUPABASE_SERVICE_ROLE_KEY"] ??
  process.env["SUPABASE_SECRET_KEY"] ??
  process.env["SUPABASE_KEY"];
const difficulties = new Set<Difficulty>(["easy", "medium", "hard"]);
const operations = new Set<Operation>(["add", "sub", "mul", "div"]);
const boards = new Set<LeaderboardBoard>(["oneMinute", "day", "week", "month"]);

const leaderboardPrizes: Record<LeaderboardBoard, LeaderboardPrize[]> = {
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

function cleanName(name: unknown) {
  return String(name ?? "Player").trim().slice(0, 24) || "Player";
}

function toNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function sortEntries(entries: LeaderboardEntry[]) {
  const seen = new Set<string>();
  const unique = entries.filter((entry) => {
    if (entry.id.startsWith("codex_probe_") || entry.playerId === "codex") return false;
    if (seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  });
  return unique.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.maxStreak !== a.maxStreak) return b.maxStreak - a.maxStreak;
    if (a.timeLimit !== b.timeLimit) return a.timeLimit - b.timeLimit;
    return b.submittedAt - a.submittedAt;
  });
}

function getLeaderboardSeason(board: LeaderboardBoard, at = Date.now()): LeaderboardSeason {
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
        totals.set(key, { ...entry, id: `${board}_${key}` });
        return;
      }
      totals.set(key, {
        ...current,
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

async function readEntries() {
  try {
    const raw = await fs.readFile(leaderboardFile, "utf8");
    const parsed = JSON.parse(raw) as LeaderboardEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeEntries(entries: LeaderboardEntry[]) {
  await fs.mkdir(path.dirname(leaderboardFile), { recursive: true });
  await fs.writeFile(leaderboardFile, JSON.stringify(entries, null, 2));
}

function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabaseServiceRoleKey);
}

function supabaseHeaders(extra?: Record<string, string>) {
  const headers: Record<string, string> = {
    apikey: supabaseServiceRoleKey!,
    ...extra,
  };
  if (!supabaseServiceRoleKey?.startsWith("sb_secret_")) {
    headers["Authorization"] = `Bearer ${supabaseServiceRoleKey}`;
  }
  return headers;
}

function toDbEntry(entry: LeaderboardEntry) {
  return {
    id: entry.id,
    player_id: entry.playerId,
    player_name: entry.playerName,
    avatar: entry.avatar,
    score: entry.score,
    difficulty: entry.difficulty,
    operations: entry.operations,
    time_limit: entry.timeLimit,
    max_streak: entry.maxStreak,
    points_earned: entry.pointsEarned,
    star_coins_earned: entry.starCoinsEarned,
    submitted_at: new Date(entry.submittedAt).toISOString(),
  };
}

function toNumericTimestampDbEntry(entry: LeaderboardEntry) {
  return {
    ...toDbEntry(entry),
    submitted_at: entry.submittedAt,
  };
}

function toSubmittedAt(value: unknown) {
  if (typeof value === "number") return Math.floor(value);
  if (typeof value === "string") {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return Math.floor(numeric);
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return Date.now();
}

function fromDbEntry(row: Record<string, unknown>): LeaderboardEntry {
  return {
    id: String(row["id"]),
    playerId: String(row["player_id"]),
    playerName: String(row["player_name"]),
    avatar: String(row["avatar"] ?? ""),
    score: Math.floor(toNumber(row["score"])),
    difficulty: row["difficulty"] as Difficulty,
    operations: Array.isArray(row["operations"]) ? (row["operations"] as Operation[]) : [],
    timeLimit: Math.floor(toNumber(row["time_limit"], 60)),
    maxStreak: Math.floor(toNumber(row["max_streak"])),
    pointsEarned: toNumber(row["points_earned"]),
    starCoinsEarned: toNumber(row["star_coins_earned"]),
    submittedAt: toSubmittedAt(row["submitted_at"]),
  };
}

async function fetchSupabaseLeaderboard(scope: string) {
  if (!hasSupabaseConfig()) return null;
  const params = new URLSearchParams({
    select: "*",
    order: "score.desc,max_streak.desc,time_limit.asc,submitted_at.desc",
    limit: "1000",
  });
  if (difficulties.has(scope as Difficulty)) params.set("difficulty", `eq.${scope}`);

  const res = await fetch(`${supabaseUrl}/rest/v1/leaderboard_scores?${params.toString()}`, {
    headers: supabaseHeaders(),
  });
  if (!res.ok) throw new Error(`Supabase leaderboard fetch failed: ${res.status}`);
  const rows = (await res.json()) as Array<Record<string, unknown>>;
  return rows.map(fromDbEntry);
}

async function postSupabaseLeaderboardEntry(payload: Record<string, unknown>) {
  if (!hasSupabaseConfig()) return null;
  const res = await fetch(`${supabaseUrl}/rest/v1/leaderboard_scores`, {
    method: "POST",
    headers: supabaseHeaders({
      "Content-Type": "application/json",
      Prefer: "return=representation",
    }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Supabase leaderboard save failed: ${res.status} ${body}`);
  }
  const rows = (await res.json()) as Array<Record<string, unknown>>;
  return rows[0] ? fromDbEntry(rows[0]) : null;
}

async function saveSupabaseLeaderboardEntry(entry: LeaderboardEntry) {
  if (!hasSupabaseConfig()) return null;
  try {
    return (await postSupabaseLeaderboardEntry(toDbEntry(entry))) ?? entry;
  } catch (isoError) {
    try {
      return (await postSupabaseLeaderboardEntry(toNumericTimestampDbEntry(entry))) ?? entry;
    } catch (numericError) {
      throw new Error(
        `Supabase leaderboard save failed with ISO and numeric timestamps. ISO: ${
          isoError instanceof Error ? isoError.message : String(isoError)
        } Numeric: ${numericError instanceof Error ? numericError.message : String(numericError)}`
      );
    }
  }
}

async function saveFallbackEntry(entry: LeaderboardEntry) {
  const entries = await readEntries();
  const next = sortEntries([entry, ...entries]).slice(0, 1000);
  await writeEntries(next);
  return entry;
}

function normalizeEntry(body: Record<string, unknown>): LeaderboardEntry | null {
  const difficulty = body["difficulty"];
  if (!difficulties.has(difficulty as Difficulty)) return null;

  const rawOperations = Array.isArray(body["operations"]) ? body["operations"] : [];
  const cleanOperations = rawOperations.filter((op): op is Operation => operations.has(op as Operation));
  if (cleanOperations.length === 0) return null;

  const score = Math.max(0, Math.floor(toNumber(body["score"])));
  return {
    id: String(body["id"] ?? `score_${Date.now()}_${Math.random().toString(36).slice(2)}`),
    playerId: String(body["playerId"] ?? "unknown").slice(0, 80),
    playerName: cleanName(body["playerName"]),
    avatar: String(body["avatar"] ?? "").slice(0, 80),
    score,
    difficulty: difficulty as Difficulty,
    operations: cleanOperations,
    timeLimit: Math.max(1, Math.floor(toNumber(body["timeLimit"], 60))),
    maxStreak: Math.max(0, Math.floor(toNumber(body["maxStreak"]))),
    pointsEarned: Math.max(0, toNumber(body["pointsEarned"])),
    starCoinsEarned: Math.max(0, toNumber(body["starCoinsEarned"])),
    submittedAt: Math.max(0, Math.floor(toNumber(body["submittedAt"], Date.now()))),
  };
}

router.get("/leaderboard", async (req, res) => {
  const scope = String(req.query["scope"] ?? "all");
  const rawBoard = String(req.query["board"] ?? "oneMinute");
  const board = boards.has(rawBoard as LeaderboardBoard) ? (rawBoard as LeaderboardBoard) : "oneMinute";
  const at = Number.isFinite(Number(req.query["at"])) ? Number(req.query["at"]) : undefined;
  try {
    const supabaseEntries = await fetchSupabaseLeaderboard(scope);
    if (supabaseEntries) {
      const localEntries = await readEntries();
      const allEntries = [...supabaseEntries, ...localEntries];
      const filtered = difficulties.has(scope as Difficulty)
        ? allEntries.filter((entry) => entry.difficulty === scope)
        : allEntries;
      res.json({ entries: aggregateEntries(filtered, board, at), season: getLeaderboardSeason(board, at), prizes: leaderboardPrizes[board] });
      return;
    }
    const entries = await readEntries();
    const filtered = difficulties.has(scope as Difficulty)
      ? entries.filter((entry) => entry.difficulty === scope)
      : entries;
    res.json({ entries: aggregateEntries(filtered, board, at), season: getLeaderboardSeason(board, at), prizes: leaderboardPrizes[board] });
  } catch (error) {
    req.log.error({ err: error }, "Failed to fetch leaderboard");
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

router.get("/leaderboard/status", (_req, res) => {
  const keyType = supabaseServiceRoleKey?.startsWith("sb_secret_") ? "secret" : supabaseServiceRoleKey ? "jwt" : "missing";
  res.json({
    supabaseConfigured: hasSupabaseConfig(),
    keyType,
    durableWritesExpected: keyType === "secret",
  });
});

router.post("/leaderboard", async (req, res) => {
  const entry = normalizeEntry(req.body as Record<string, unknown>);
  if (!entry) {
    res.status(400).json({ error: "Invalid leaderboard score" });
    return;
  }

  try {
    try {
      const supabaseEntry = await saveSupabaseLeaderboardEntry(entry);
      if (supabaseEntry) {
        res.status(201).json(supabaseEntry);
        return;
      }
    } catch (error) {
      req.log.error({ err: error }, "Supabase save failed");
      req.log.warn("Using fallback leaderboard file; scores will update now but are not durable until Supabase uses a secret key");
    }
    const fallbackEntry = await saveFallbackEntry(entry);
    res.status(201).json(fallbackEntry);
  } catch (error) {
    req.log.error({ err: error }, "Failed to save leaderboard score");
    res.status(500).json({ error: "Failed to save leaderboard score" });
  }
});

export default router;
