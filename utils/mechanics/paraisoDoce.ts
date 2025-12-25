// Paraiso Doce 2.0 - Divine Paradise Jackpot Mechanic
// 3x3 grid with escalating symbols and progressive bars

export interface ParaisoDoceState {
  gridSymbols: number[][];
  barLevels: number[];
  rtpMultiplier: number;
  particleSpawn: Array<{x: number; y: number; type: string}>;
  lastSpinTime: number;
}

export interface ParaisoDoceConfig {
  baseRTP: number;
  barIncrementPerSymbol: number;
  maxBarLevel: number;
  symbolWeights: number[];
  payoutMultipliers: {
    line3: number;
    corners4: number;
    full9: number;
  };
}

const DEFAULT_CONFIG: ParaisoDoceConfig = {
  baseRTP: 0.95,
  barIncrementPerSymbol: 0.05,
  maxBarLevel: 3.0,
  symbolWeights: [50, 30, 15, 5],
  payoutMultipliers: {
    line3: 2.5,
    corners4: 5.0,
    full9: 50.0,
  },
};

export function initializeParaisoDoce(): ParaisoDoceState {
  return {
    gridSymbols: Array(3).fill(null).map(() => Array(3).fill(0)),
    barLevels: [0, 0, 0],
    rtpMultiplier: DEFAULT_CONFIG.baseRTP,
    particleSpawn: [],
    lastSpinTime: 0,
  };
}

function getRandomSymbol(): number {
  const rand = Math.random() * 100;
  const weights = DEFAULT_CONFIG.symbolWeights;
  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (rand <= cumulative) return i;
  }
  return weights.length - 1;
}

function countSymbolMatches(grid: number[][], symbol: number): number {
  let count = 0;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (grid[row][col] === symbol) count++;
    }
  }
  return count;
}

function detectWinPatterns(grid: number[][]): string[] {
  const patterns: string[] = [];
  
  // Check rows
  for (let row = 0; row < 3; row++) {
    if (grid[row][0] === grid[row][1] && grid[row][1] === grid[row][2] && grid[row][0] !== 0) {
      patterns.push('row_' + row);
    }
  }
  
  // Check columns
  for (let col = 0; col < 3; col++) {
    if (grid[0][col] === grid[1][col] && grid[1][col] === grid[2][col] && grid[0][col] !== 0) {
      patterns.push('col_' + col);
    }
  }
  
  // Check diagonals
  if (grid[0][0] === grid[1][1] && grid[1][1] === grid[2][2] && grid[0][0] !== 0) {
    patterns.push('diag_main');
  }
  if (grid[0][2] === grid[1][1] && grid[1][1] === grid[2][0] && grid[0][2] !== 0) {
    patterns.push('diag_anti');
  }
  
  // Check corners
  if (grid[0][0] === grid[0][2] && grid[0][0] === grid[2][0] && grid[0][0] === grid[2][2] && grid[0][0] !== 0) {
    patterns.push('corners4');
  }
  
  return patterns;
}

export function spinParaisoDoce(state: ParaisoDoceState): { payout: number; rtpMultiplier: number } {
  // Spin new grid
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      state.gridSymbols[row][col] = getRandomSymbol();
    }
  }
  
  const patterns = detectWinPatterns(state.gridSymbols);
  let payout = 0;
  
  // Update bars based on symbols
  for (let symbol = 0; symbol <= 3; symbol++) {
    const count = countSymbolMatches(state.gridSymbols, symbol);
    if (count > 0) {
      state.barLevels[Math.floor(symbol / 2)] = Math.min(
        state.barLevels[Math.floor(symbol / 2)] + count * DEFAULT_CONFIG.barIncrementPerSymbol,
        DEFAULT_CONFIG.maxBarLevel
      );
    }
  }
  
  // Calculate payout based on patterns
  patterns.forEach(pattern => {
    if (pattern.startsWith('row_') || pattern.startsWith('col_')) {
      payout += DEFAULT_CONFIG.payoutMultipliers.line3;
    } else if (pattern === 'corners4') {
      payout += DEFAULT_CONFIG.payoutMultipliers.corners4;
    }
  });
  
  // Jackpot: all 9 same symbol
  for (let symbol = 0; symbol <= 3; symbol++) {
    if (countSymbolMatches(state.gridSymbols, symbol) === 9) {
      payout = DEFAULT_CONFIG.payoutMultipliers.full9;
      break;
    }
  }
  
  // Update RTP multiplier based on bars
  const avgBar = (state.barLevels[0] + state.barLevels[1] + state.barLevels[2]) / 3;
  state.rtpMultiplier = Math.min(
    DEFAULT_CONFIG.baseRTP + avgBar,
    DEFAULT_CONFIG.maxBarLevel
  );
  
  state.lastSpinTime = Date.now();
  
  return { payout, rtpMultiplier: state.rtpMultiplier };
}

export { ParaisoDoceState, ParaisoDoceConfig };
