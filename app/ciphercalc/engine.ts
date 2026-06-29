/* ═══════════════════════════════════════════
   CipherCalc — Game Engine
   Pure logic: no React, no DOM, no side effects.
   ═══════════════════════════════════════════ */

export type Operation = '+' | '-' | '*' | '/';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Puzzle {
  numbers: number[];       // 4 single-digit numbers (the answer)
  operations: Operation[]; // 3 operations
  target: number;          // the result of the equation
}

export interface CheckResult {
  correct: boolean;
  offset: number;
  message: string;
}

const ALL_OPS: Operation[] = ['+', '-', '*', '/'];

/**
 * Evaluate an expression: n0 op0 n1 op1 n2 op2 n3
 * Respects operator precedence (* / before + -).
 * Division is integer (floored towards zero via Math.trunc).
 * Division by zero yields 0.
 */
export function evaluate(numbers: number[], operations: Operation[]): number {
  if (numbers.length !== 4 || operations.length !== 3) {
    throw new Error('Expected 4 numbers and 3 operations');
  }

  // Clone to avoid mutation
  const nums = [...numbers];
  const ops = [...operations];

  // First pass: handle * and /
  let i = 0;
  while (i < ops.length) {
    if (ops[i] === '*' || ops[i] === '/') {
      const left = nums[i];
      const right = nums[i + 1];
      let result: number;

      if (ops[i] === '*') {
        result = left * right;
      } else {
        result = right === 0 ? 0 : Math.trunc(left / right);
      }

      nums.splice(i, 2, result);
      ops.splice(i, 1);
    } else {
      i++;
    }
  }

  // Second pass: handle + and -
  i = 0;
  while (i < ops.length) {
    const left = nums[i];
    const right = nums[i + 1];
    let result: number;

    if (ops[i] === '+') {
      result = left + right;
    } else {
      result = left - right;
    }

    nums.splice(i, 2, result);
    ops.splice(i, 1);
  }

  const final = nums[0];
  return isFinite(final) ? final : 0;
}

/**
 * Check player's numbers against the target.
 */
export function checkAnswer(
  playerNumbers: number[],
  operations: Operation[],
  target: number
): CheckResult {
  const result = evaluate(playerNumbers, operations);
  const correct = result === target;
  const offset = Math.abs(target - result);

  return {
    correct,
    offset,
    message: correct ? 'CORRECT' : `OFF BY ${offset}`,
  };
}

/**
 * Generate 4 unique single-digit numbers (0-9).
 */
function generateUniqueNumbers(): number[] {
  const pool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 4);
}

/**
 * Generate 3 random operations.
 */
function generateOperations(): Operation[] {
  return Array.from({ length: 3 }, () => ALL_OPS[Math.floor(Math.random() * ALL_OPS.length)]);
}

/**
 * Generate a complete puzzle. Ensures the target is non-zero
 * and that numbers are unique.
 */
export function generatePuzzle(): Puzzle {
  let numbers: number[];
  let operations: Operation[];
  let target: number;

  do {
    numbers = generateUniqueNumbers();
    operations = generateOperations();
    target = evaluate(numbers, operations);
  } while (target === 0);

  return { numbers, operations, target };
}

/**
 * Get the display symbol for an operation.
 */
export function opSymbol(op: Operation): string {
  return op === '*' ? '×' : op === '/' ? '÷' : op;
}

/**
 * Determine which operations are hidden based on difficulty.
 * Returns indices of hidden operations.
 */
export function getHiddenOps(difficulty: Difficulty): number[] {
  switch (difficulty) {
    case 'easy':
      return [];
    case 'medium':
      return [1]; // middle op hidden
    case 'hard':
      return [0, 2]; // first and last hidden, middle visible
  }
}

/**
 * Whether the target is visible for a given difficulty.
 */
export function isTargetVisible(difficulty: Difficulty): boolean {
  return difficulty === 'easy';
}
