/**
 * SPIN ENGINE
 * 
 * Pure business logic for:
 * - Spin result calculation
 * - Line detection and win calculation
 * - Symbol matching logic
 * 
 * ZERO side effects. Pure functions only.
 * Takes input, returns output.
 */

import { MID } from '../../constants';
import { calculateMidMultiplierValue } from '../../utils/spinCalculations';
import type { SymbolKey, MidSymbolKey, Inventory, Multipliers };

export interface SpinEngineInput {
  grid: SymbolKey[];
  bet: number;
  inv: Inventory;
  mult: Multipliers;
  bonusMult: Multipliers;
  multUpgradeBonus: number;
  skillLevels: Record<string, number>;
}

export interface SpinEngineOutput {
  totalSweetWin: number;
  totalOtherWin: number;
  hitCount: number;
  sweetLinesCount: number;
  starLinesFound: number;
  tokenLinesFound: number;
  winLines: Array<{
    lineIndex: number[];
    symbol: SymbolKey;
    win: number;
  }>;
}

/**
 * Get effective multiplier for symbol (base + bonus)
 */
const getEffectiveMultiplier = (
  sym: SymbolKey,
  mult: Multipliers,
  bonusMult: Multipliers,
  multUpgradeBonus: number
): number => {
  const baseVal = calculateMidMultiplierValue(sym, mult);
  const bonusVal = calculateMidMultiplierValue(sym, bonusMult);
  const totalMult = baseVal + bonusVal;
  
  const isUpgradeable = !['⭐', '🪙'].includes(sym);
  return isUpgradeable ? totalMult * multUpgradeBonus : totalMult;
};

/**
 * Check if three symbols match for a win
 */
const checkWinOnLine = (
  symbols: SymbolKey[],
  isCaminhoEstelarActive: boolean,
  isCaminhoFichaActive: boolean
): SymbolKey | null => {
  const wilds = symbols.filter(s => s === '⭐').length;
  const nonWilds = symbols.filter(s => s !== '⭐');

  // All coins = win if skill active
  if (symbols.every(s => s === '🪙')) {
    return isCaminhoFichaActive ? '🪙' : null;
  }

  // Wilds + non-wilds matching = win
  if (wilds > 0 && nonWilds.length > 0) {
    const firstNonWild = nonWilds[0];
    if (nonWilds.every(s => s === firstNonWild)) {
      return firstNonWild;
    }
  }

  // Triple wilds = win if skill active
  if (wilds === 3 && isCaminhoEstelarActive) {
    return '⭐';
  }

  // Three matching = win
  if (wilds === 0 && symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
    return symbols[0];
  }

  return null;
};

/**
 * MAIN ENGINE: Calculate spin result
 */
export const calculateSpinResult = (input: SpinEngineInput): SpinEngineOutput => {
  const { grid, bet, mult, bonusMult, multUpgradeBonus, skillLevels } = input;

  // Define all 8 lines
  const lines = [
    [0, 1, 2], // horizontal top
    [3, 4, 5], // horizontal middle
    [6, 7, 8], // horizontal bottom
    [0, 3, 6], // vertical left
    [1, 4, 7], // vertical middle
    [2, 5, 8], // vertical right
    [0, 4, 8], // diagonal top-left to bottom-right
    [2, 4, 6], // diagonal top-right to bottom-left
  ];

  let totalSweetWin = 0;
  let totalOtherWin = 0;
  let hitCount = 0;
  let sweetLinesCount = 0;
  let starLinesFound = 0;
  let tokenLinesFound = 0;

  const isCaminhoEstelarActive = skillLevels['caminhoEstelar'] > 0;
  const isCaminhoFichaActive = skillLevels['caminhoFicha'] > 0;

  const winLines: SpinEngineOutput['winLines'] = [];

  // Check each line
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const symbols = line.map(i => grid[i]);

    const winSymbol = checkWinOnLine(symbols, isCaminhoEstelarActive, isCaminhoFichaActive);

    if (!winSymbol) continue;

    // Calculate win amount
    const lineWin = bet * getEffectiveMultiplier(winSymbol, mult, bonusMult, multUpgradeBonus);

    // Categorize win
    if (MID.includes(winSymbol as MidSymbolKey)) {
      totalSweetWin += lineWin;
      sweetLinesCount++;
    } else if (winSymbol !== '🪙' && winSymbol !== '⭐') {
      totalOtherWin += lineWin;
    }

    // Track special symbols
    if (winSymbol === '⭐' && isCaminhoEstelarActive) {
      starLinesFound++;
    }
    if (winSymbol === '🪙' && isCaminhoFichaActive) {
      tokenLinesFound++;
    }

    hitCount++;

    // Record win line
    winLines.push({
      lineIndex: line,
      symbol: winSymbol,
      win: lineWin,
    });
  }

  return {
    totalSweetWin,
    totalOtherWin,
    hitCount,
    sweetLinesCount,
    starLinesFound,
    tokenLinesFound,
    winLines,
  };
};
