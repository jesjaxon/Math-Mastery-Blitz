export type Operation = "add" | "sub" | "mul" | "div";
export type Difficulty = "easy" | "medium" | "hard";

export interface DrillResult {
  score: number;
  correctByOp: Partial<Record<Operation, number>>;
  maxStreak: number;
  operations: Operation[];
  timeLimit: number;
  difficulty: Difficulty;
  totalGames: number;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  bonusPoints: number;
  check: (result: DrillResult) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // ── Addition ────────────────────────────────────────────
  { id: "add_1", title: "Adding Up", description: "5 additions correct in one drill", icon: "plus-circle", color: "#7C6FFF", bonusPoints: 50, check: r => (r.correctByOp.add ?? 0) >= 5 },
  { id: "add_2", title: "Addition Pro", description: "15 additions correct in one drill", icon: "plus-circle", color: "#7C6FFF", bonusPoints: 200, check: r => (r.correctByOp.add ?? 0) >= 15 },
  { id: "add_3", title: "Addition Master", description: "30 additions correct in one drill", icon: "award", color: "#FFD166", bonusPoints: 600, check: r => (r.correctByOp.add ?? 0) >= 30 },
  { id: "add_4", title: "Addition Legend", description: "50 additions correct in one drill", icon: "award", color: "#FF9F43", bonusPoints: 2000, check: r => (r.correctByOp.add ?? 0) >= 50 },
  // ── Subtraction ─────────────────────────────────────────
  { id: "sub_1", title: "Taking Away", description: "5 subtractions correct in one drill", icon: "minus-circle", color: "#FF6B9D", bonusPoints: 50, check: r => (r.correctByOp.sub ?? 0) >= 5 },
  { id: "sub_2", title: "Subtraction Pro", description: "15 subtractions correct in one drill", icon: "minus-circle", color: "#FF6B9D", bonusPoints: 200, check: r => (r.correctByOp.sub ?? 0) >= 15 },
  { id: "sub_3", title: "Subtraction Master", description: "30 subtractions correct in one drill", icon: "award", color: "#FFD166", bonusPoints: 600, check: r => (r.correctByOp.sub ?? 0) >= 30 },
  { id: "sub_4", title: "Subtraction Legend", description: "50 subtractions correct in one drill", icon: "award", color: "#FF9F43", bonusPoints: 2000, check: r => (r.correctByOp.sub ?? 0) >= 50 },
  // ── Multiplication ──────────────────────────────────────
  { id: "mul_1", title: "Times Tables", description: "5 multiplications correct in one drill", icon: "x-circle", color: "#00D9A3", bonusPoints: 50, check: r => (r.correctByOp.mul ?? 0) >= 5 },
  { id: "mul_2", title: "Multiplication Pro", description: "15 multiplications correct in one drill", icon: "x-circle", color: "#00D9A3", bonusPoints: 200, check: r => (r.correctByOp.mul ?? 0) >= 15 },
  { id: "mul_3", title: "Multiplication Master", description: "30 multiplications correct in one drill", icon: "award", color: "#FFD166", bonusPoints: 600, check: r => (r.correctByOp.mul ?? 0) >= 30 },
  { id: "mul_4", title: "Multiplication Legend", description: "50 multiplications correct in one drill", icon: "award", color: "#FF9F43", bonusPoints: 2000, check: r => (r.correctByOp.mul ?? 0) >= 50 },
  // ── Division ────────────────────────────────────────────
  { id: "div_1", title: "Divide & Conquer", description: "5 divisions correct in one drill", icon: "circle", color: "#FF9F43", bonusPoints: 50, check: r => (r.correctByOp.div ?? 0) >= 5 },
  { id: "div_2", title: "Division Pro", description: "15 divisions correct in one drill", icon: "circle", color: "#FF9F43", bonusPoints: 200, check: r => (r.correctByOp.div ?? 0) >= 15 },
  { id: "div_3", title: "Division Master", description: "30 divisions correct in one drill", icon: "award", color: "#FFD166", bonusPoints: 600, check: r => (r.correctByOp.div ?? 0) >= 30 },
  { id: "div_4", title: "Division Legend", description: "50 divisions correct in one drill", icon: "award", color: "#FF9F43", bonusPoints: 2000, check: r => (r.correctByOp.div ?? 0) >= 50 },
  // ── Score Milestones ────────────────────────────────────
  { id: "score_10",  title: "Quick Thinker",   description: "Score 10 correct in one drill",  icon: "target", color: "#7C6FFF", bonusPoints: 100,  check: r => r.score >= 10  },
  { id: "score_25",  title: "Math Sprint",      description: "Score 25 correct in one drill",  icon: "target", color: "#00D9A3", bonusPoints: 300,  check: r => r.score >= 25  },
  { id: "score_50",  title: "Math Machine",     description: "Score 50 correct in one drill",  icon: "zap",    color: "#FFD166", bonusPoints: 1000, check: r => r.score >= 50  },
  { id: "score_100", title: "Centurion",        description: "Score 100 correct in one drill", icon: "zap",    color: "#FF9F43", bonusPoints: 3000, check: r => r.score >= 100 },
  { id: "score_200", title: "Math God",         description: "Score 200 correct in one drill", icon: "star",   color: "#FFD166", bonusPoints: 10000,check: r => r.score >= 200 },
  // ── Streak ──────────────────────────────────────────────
  { id: "streak_5",  title: "On a Roll",        description: "5 correct in a row",  icon: "trending-up", color: "#7C6FFF", bonusPoints: 75,   check: r => r.maxStreak >= 5  },
  { id: "streak_10", title: "Unstoppable",      description: "10 correct in a row", icon: "trending-up", color: "#00D9A3", bonusPoints: 250,  check: r => r.maxStreak >= 10 },
  { id: "streak_20", title: "Math Wizard",      description: "20 correct in a row", icon: "zap",         color: "#FFD166", bonusPoints: 750,  check: r => r.maxStreak >= 20 },
  { id: "streak_30", title: "Supernatural",     description: "30 correct in a row", icon: "star",        color: "#FF9F43", bonusPoints: 2000, check: r => r.maxStreak >= 30 },
  // ── Drill Count ─────────────────────────────────────────
  { id: "drills_10",  title: "Getting Started", description: "Complete 10 drills",  icon: "book-open", color: "#7C6FFF", bonusPoints: 200,  check: r => r.totalGames >= 10  },
  { id: "drills_50",  title: "Dedicated",       description: "Complete 50 drills",  icon: "book-open", color: "#00D9A3", bonusPoints: 800,  check: r => r.totalGames >= 50  },
  { id: "drills_100", title: "Math Veteran",    description: "Complete 100 drills", icon: "book-open", color: "#FFD166", bonusPoints: 2500, check: r => r.totalGames >= 100 },
  // ── Special ─────────────────────────────────────────────
  { id: "all_ops",       title: "All-Rounder",     description: "Use all 4 operations in one drill",  icon: "star",    color: "#FFD166", bonusPoints: 400,  check: r => r.operations.includes("add") && r.operations.includes("sub") && r.operations.includes("mul") && r.operations.includes("div") },
  { id: "speed_demon",   title: "Speed Demon",     description: "Score 20 correct in 30 seconds",     icon: "clock",   color: "#FF6B9D", bonusPoints: 600,  check: r => r.score >= 20 && r.timeLimit <= 30 },
  { id: "mix_master",    title: "Mix Master",      description: "Use 3+ operations in one drill",     icon: "layers",  color: "#00D9A3", bonusPoints: 200,  check: r => r.operations.length >= 3 },
  { id: "hard_hero",     title: "Hard Mode Hero",  description: "Score 20+ on Hard difficulty",       icon: "shield",  color: "#FF4757", bonusPoints: 500,  check: r => r.difficulty === "hard" && r.score >= 20 },
  { id: "marathon",      title: "Marathon",        description: "Score 40+ in a 3-minute drill",      icon: "activity",color: "#7C6FFF", bonusPoints: 1000, check: r => r.timeLimit >= 180 && r.score >= 40 },
  { id: "perfect_start", title: "First Flight",    description: "Complete your first drill",          icon: "play",    color: "#00D9A3", bonusPoints: 100,  check: r => r.totalGames >= 1 },
  // ── External / Special unlocks (checked outside drills) ─
  { id: "first_shop",      title: "First Purchase",  description: "Buy your first shop item",        icon: "shopping-bag", color: "#FF9F43", bonusPoints: 150, check: () => false },
  { id: "animal_collector",title: "Animal Lover",    description: "Own 10 animals across zoo & aquarium", icon: "heart", color: "#FF6B9D", bonusPoints: 500, check: () => false },
  { id: "astronaut",       title: "Astronaut",       description: "Complete the space slingshot launch!", icon: "send", color: "#00D9A3", bonusPoints: 5000, check: () => false },
];
