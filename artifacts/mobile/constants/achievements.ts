export type Operation = "add" | "sub" | "mul" | "div";
export type Difficulty = "easy" | "medium" | "hard";

export interface DrillResult {
  score: number;
  correctByOp: Partial<Record<Operation, number>>;
  maxStreak: number;
  operations: Operation[];
  timeLimit: number;
  difficulty: Difficulty;
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
  // Addition tier
  {
    id: "add_1",
    title: "Adding Up",
    description: "Get 5 additions correct in one drill",
    icon: "plus-circle",
    color: "#7C6FFF",
    bonusPoints: 50,
    check: (r) => (r.correctByOp.add ?? 0) >= 5,
  },
  {
    id: "add_2",
    title: "Addition Pro",
    description: "Get 15 additions correct in one drill",
    icon: "plus-circle",
    color: "#7C6FFF",
    bonusPoints: 150,
    check: (r) => (r.correctByOp.add ?? 0) >= 15,
  },
  {
    id: "add_3",
    title: "Addition Master",
    description: "Get 30 additions correct in one drill",
    icon: "award",
    color: "#FFD166",
    bonusPoints: 500,
    check: (r) => (r.correctByOp.add ?? 0) >= 30,
  },
  // Subtraction tier
  {
    id: "sub_1",
    title: "Taking Away",
    description: "Get 5 subtractions correct in one drill",
    icon: "minus-circle",
    color: "#FF6B9D",
    bonusPoints: 50,
    check: (r) => (r.correctByOp.sub ?? 0) >= 5,
  },
  {
    id: "sub_2",
    title: "Subtraction Pro",
    description: "Get 15 subtractions correct in one drill",
    icon: "minus-circle",
    color: "#FF6B9D",
    bonusPoints: 150,
    check: (r) => (r.correctByOp.sub ?? 0) >= 15,
  },
  {
    id: "sub_3",
    title: "Subtraction Master",
    description: "Get 30 subtractions correct in one drill",
    icon: "award",
    color: "#FFD166",
    bonusPoints: 500,
    check: (r) => (r.correctByOp.sub ?? 0) >= 30,
  },
  // Multiplication tier
  {
    id: "mul_1",
    title: "Times Tables",
    description: "Get 5 multiplications correct in one drill",
    icon: "x-circle",
    color: "#00D9A3",
    bonusPoints: 50,
    check: (r) => (r.correctByOp.mul ?? 0) >= 5,
  },
  {
    id: "mul_2",
    title: "Multiplication Pro",
    description: "Get 15 multiplications correct in one drill",
    icon: "x-circle",
    color: "#00D9A3",
    bonusPoints: 150,
    check: (r) => (r.correctByOp.mul ?? 0) >= 15,
  },
  {
    id: "mul_3",
    title: "Multiplication Master",
    description: "Get 30 multiplications correct in one drill",
    icon: "award",
    color: "#FFD166",
    bonusPoints: 500,
    check: (r) => (r.correctByOp.mul ?? 0) >= 30,
  },
  // Division tier
  {
    id: "div_1",
    title: "Divide & Conquer",
    description: "Get 5 divisions correct in one drill",
    icon: "circle",
    color: "#FF9F43",
    bonusPoints: 50,
    check: (r) => (r.correctByOp.div ?? 0) >= 5,
  },
  {
    id: "div_2",
    title: "Division Pro",
    description: "Get 15 divisions correct in one drill",
    icon: "circle",
    color: "#FF9F43",
    bonusPoints: 150,
    check: (r) => (r.correctByOp.div ?? 0) >= 15,
  },
  {
    id: "div_3",
    title: "Division Master",
    description: "Get 30 divisions correct in one drill",
    icon: "award",
    color: "#FFD166",
    bonusPoints: 500,
    check: (r) => (r.correctByOp.div ?? 0) >= 30,
  },
  // Score milestones
  {
    id: "score_10",
    title: "Quick Thinker",
    description: "Score 10 correct in one drill",
    icon: "target",
    color: "#7C6FFF",
    bonusPoints: 100,
    check: (r) => r.score >= 10,
  },
  {
    id: "score_25",
    title: "Math Sprint",
    description: "Score 25 correct in one drill",
    icon: "target",
    color: "#00D9A3",
    bonusPoints: 250,
    check: (r) => r.score >= 25,
  },
  {
    id: "score_50",
    title: "Math Machine",
    description: "Score 50 correct in one drill",
    icon: "zap",
    color: "#FFD166",
    bonusPoints: 1000,
    check: (r) => r.score >= 50,
  },
  // Streak
  {
    id: "streak_5",
    title: "On a Roll",
    description: "Answer 5 in a row without a wrong key",
    icon: "trending-up",
    color: "#7C6FFF",
    bonusPoints: 75,
    check: (r) => r.maxStreak >= 5,
  },
  {
    id: "streak_10",
    title: "Unstoppable",
    description: "Answer 10 in a row without a wrong key",
    icon: "trending-up",
    color: "#00D9A3",
    bonusPoints: 200,
    check: (r) => r.maxStreak >= 10,
  },
  {
    id: "streak_20",
    title: "Math Wizard",
    description: "Answer 20 in a row without a wrong key",
    icon: "zap",
    color: "#FFD166",
    bonusPoints: 500,
    check: (r) => r.maxStreak >= 20,
  },
  // Special
  {
    id: "all_ops",
    title: "All-Rounder",
    description: "Complete a drill using all 4 operations",
    icon: "star",
    color: "#FFD166",
    bonusPoints: 300,
    check: (r) =>
      r.operations.includes("add") &&
      r.operations.includes("sub") &&
      r.operations.includes("mul") &&
      r.operations.includes("div"),
  },
  {
    id: "speed_demon",
    title: "Speed Demon",
    description: "Score 20 correct in 30 seconds",
    icon: "clock",
    color: "#FF6B9D",
    bonusPoints: 400,
    check: (r) => r.score >= 20 && r.timeLimit <= 30,
  },
];
