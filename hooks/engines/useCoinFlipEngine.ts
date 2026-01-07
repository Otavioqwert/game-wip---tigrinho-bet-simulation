/**
 * COIN FLIP ENGINE
 * 
 * Pure logic for:
 * - Coin flip result generation
 * - Multiplier calculation
 * - Win/loss tracking
 * 
 * Completely independent from spin and bonus logic.
 */

export interface CoinFlipEngineInput {
  flipsRemaining: number;
  currentBet: number;
  currentMultiplier: number;
  guess: 'heads' | 'tails';
}

export interface CoinFlipEngineOutput {
  result: 'heads' | 'tails';
  isCorrect: boolean;
  nextMultiplier: number;
  flipsRemainingAfter: number;
  payout: number; // Only if all flips done
}

/**
 * MAIN ENGINE: Process single coin flip
 */
export const processCoinFlip = (
  input: CoinFlipEngineInput
): CoinFlipEngineOutput => {
  const { flipsRemaining, currentBet, currentMultiplier, guess } = input;

  // Generate random result
  const result: 'heads' | 'tails' = Math.random() < 0.5 ? 'heads' : 'tails';
  const isCorrect = guess === result;

  // Calculate next multiplier
  // Correct: double it (or start at 2 if 0)
  // Wrong: reset to 0
  const nextMultiplier = isCorrect
    ? currentMultiplier === 0
      ? 2
      : currentMultiplier * 2
    : 0;

  // Calculate flips remaining
  const flipsRemainingAfter = isCorrect ? flipsRemaining - 1 : 0;

  // Calculate payout (only if no flips left)
  const payout = flipsRemainingAfter === 0 ? currentBet * nextMultiplier : 0;

  return {
    result,
    isCorrect,
    nextMultiplier,
    flipsRemainingAfter,
    payout,
  };
};

/**
 * Calculate total payout after all flips done
 */
export const calculateCoinFlipPayout = (
  bet: number,
  finalMultiplier: number
): number => {
  return bet * finalMultiplier;
};
