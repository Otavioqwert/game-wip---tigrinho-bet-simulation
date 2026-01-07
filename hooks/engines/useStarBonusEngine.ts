/**
 * STAR BONUS ENGINE
 * 
 * Pure logic for:
 * - Star bonus spin generation
 * - Line detection during bonus
 * - Bonus payout calculation
 * 
 * Completely independent from normal spin logic.
 */

import { createWeightSnapshot, spinFromSnapshot } from '../../utils/spinCalculations';
import type { SymbolKey, Inventory };

export interface StarBonusEngineInput {
  starLinesFound: number;
  currentBet: number;
  inv: Inventory;
  availableKeys: SymbolKey[];
  starStreak: number;
  midMultiplierValue: (sym: SymbolKey) => number;
}

export interface StarBonusResult {
  uid: string;
  symbols: SymbolKey[];
  win: number;
  isWin: boolean;
}

export interface StarBonusEngineOutput {
  results: StarBonusResult[];
  totalRawWin: number;
  extraLinesTriggered: number; // From coin logic
}

/**
 * Check if three symbols match in bonus
 */
const checkBonusWin = (symbols: SymbolKey[]): SymbolKey | null => {
  const wilds = symbols.filter(s => s === '⭐').length;
  const nonWilds = symbols.filter(s => s !== '⭐');

  // All coins = win
  if (symbols.every(s => s === '🪙')) {
    return '🪙';
  }

  // Wilds + matching non-wilds = win
  if (wilds > 0 && nonWilds.length > 0) {
    const firstNonWild = nonWilds[0];
    if (nonWilds.every(s => s === firstNonWild)) {
      return firstNonWild;
    }
  }

  // Triple wilds = win
  if (wilds === 3) {
    return '⭐';
  }

  // Three matching = win
  if (wilds === 0 && symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
    return symbols[0];
  }

  return null;
};

/**
 * MAIN ENGINE: Generate star bonus spins
 */
export const generateStarBonusSpins = (
  input: StarBonusEngineInput
): StarBonusEngineOutput => {
  const {
    starLinesFound,
    currentBet,
    inv,
    availableKeys,
    starStreak,
    midMultiplierValue,
  } = input;

  const results: StarBonusResult[] = [];
  let totalRawWin = 0;
  let extraLinesTriggered = 0;

  // Bonus lines per hit = 90 + 5 per consecutive star hit
  const bonusLinesPerHit = 90 + starStreak * 5;
  let spinsToProcess = bonusLinesPerHit * starLinesFound;

  const snapshot = createWeightSnapshot(inv, availableKeys);
  const sessionId = Date.now().toString();

  let i = 0;
  while (i < spinsToProcess) {
    // Generate three symbols
    const symbols = [
      spinFromSnapshot(snapshot),
      spinFromSnapshot(snapshot),
      spinFromSnapshot(snapshot),
    ] as SymbolKey[];

    const winSymbol = checkBonusWin(symbols);
    const isWin = winSymbol !== null;

    let win = 0;

    // Coin logic: 50% chance to add extra lines
    if (isWin && winSymbol === '🪙') {
      if (Math.random() < 0.5) {
        const r = Math.random() * 100;
        let extraLines = 0;
        if (r < 53.33) extraLines = 2;
        else if (r < 80) extraLines = 4;
        else if (r < 93.33) extraLines = 8;
        else extraLines = 16;

        if (extraLines > 0) {
          spinsToProcess += extraLines;
          extraLinesTriggered += extraLines;
        }
      }
    }
    // Non-star/non-coin wins pay 5% of normal
    else if (isWin && winSymbol !== '⭐') {
      win = currentBet * midMultiplierValue(winSymbol) * 0.05;
    }

    results.push({
      uid: `${sessionId}-${i}`,
      symbols,
      win,
      isWin,
    });

    totalRawWin += win;
    i++;
  }

  return {
    results,
    totalRawWin,
    extraLinesTriggered,
  };
};
