import type { Operation, Difficulty } from "@/constants/achievements";

export interface Question {
  a: number;
  b: number;
  op: Operation;
  answer: number;
  display: string;
}

function rnd(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const RANGES: Record<
  Difficulty,
  Record<Operation, { min: number; max: number }>
> = {
  easy: {
    add: { min: 1, max: 9 },
    sub: { min: 1, max: 9 },
    mul: { min: 2, max: 9 },
    div: { min: 2, max: 9 },
  },
  medium: {
    add: { min: 10, max: 99 },
    sub: { min: 10, max: 99 },
    mul: { min: 10, max: 99 },
    div: { min: 10, max: 99 },
  },
  hard: {
    add: { min: 100, max: 999 },
    sub: { min: 100, max: 999 },
    mul: { min: 100, max: 999 },
    div: { min: 100, max: 999 },
  },
};

export function generateQuestion(
  ops: Operation[],
  difficulty: Difficulty
): Question {
  const op = ops[Math.floor(Math.random() * ops.length)];
  const { min, max } = RANGES[difficulty][op];

  switch (op) {
    case "add": {
      const a = rnd(min, max);
      const b = rnd(min, max);
      return { a, b, op, answer: a + b, display: `${a} + ${b}` };
    }
    case "sub": {
      const a = rnd(min, max);
      const b = rnd(min, a);
      return { a, b, op, answer: a - b, display: `${a} \u2212 ${b}` };
    }
    case "mul": {
      const a = rnd(min, max);
      const b = rnd(min, max);
      return { a, b, op, answer: a * b, display: `${a} \u00d7 ${b}` };
    }
    case "div": {
      const quotient = rnd(min, max);
      const divisor = rnd(Math.max(min, 1), max);
      const dividend = quotient * divisor;
      return {
        a: dividend,
        b: divisor,
        op,
        answer: quotient,
        display: `${dividend} \u00f7 ${divisor}`,
      };
    }
  }
}

export function getOpSymbol(op: Operation): string {
  switch (op) {
    case "add":
      return "+";
    case "sub":
      return "\u2212";
    case "mul":
      return "\u00d7";
    case "div":
      return "\u00f7";
  }
}

export function getOpLabel(op: Operation): string {
  switch (op) {
    case "add":
      return "Addition";
    case "sub":
      return "Subtraction";
    case "mul":
      return "Multiplication";
    case "div":
      return "Division";
  }
}
