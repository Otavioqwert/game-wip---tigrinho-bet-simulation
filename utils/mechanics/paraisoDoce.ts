// Paraiso Doce 2.0 - Divine Paradise Jackpot Mechanic
// 3x3 grid with escalating symbols and progressive bars

export interface ParaisoDoceState {
  gridSymbols: number[][];
  bars: {
    cyan: number;
    yellow: number;
    magenta: number;
  };
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
  barIncrementPerSymbol: 1, // +1 per symbol match
  maxBarLevel: 10, // Max 10 per bar
  symbolWeights: [50, 30, 15, 5], // 0=empty, 1=cyan, 2=yellow, 3=magenta
  payoutMultipliers: {
    line3: 2.5,
    corners4: 5.0,
    full9: 50.0,
  },
};

export function initializeParaisoDoce(): ParaisoDoceState {
  return {
    gridSymbols: Array(3).fill(null).map(() => Array(3).fill(0)),
    bars: {
      cyan: 0,
      yellow: 0,
      magenta: 0
    },
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
  
  // Update bars based on symbols (1=cyan, 2=yellow, 3=magenta)
  const cyanCount = countSymbolMatches(state.gridSymbols, 1);
  const yellowCount = countSymbolMatches(state.gridSymbols, 2);
  const magentaCount = countSymbolMatches(state.gridSymbols, 3);
  
  if (cyanCount > 0) {
    state.bars.cyan = Math.min(
      state.bars.cyan + cyanCount * DEFAULT_CONFIG.barIncrementPerSymbol,
      DEFAULT_CONFIG.maxBarLevel
    );
  }
  
  if (yellowCount > 0) {
    state.bars.yellow = Math.min(
      state.bars.yellow + yellowCount * DEFAULT_CONFIG.barIncrementPerSymbol,
      DEFAULT_CONFIG.maxBarLevel
    );
  }
  
  if (magentaCount > 0) {
    state.bars.magenta = Math.min(
      state.bars.magenta + magentaCount * DEFAULT_CONFIG.barIncrementPerSymbol,
      DEFAULT_CONFIG.maxBarLevel
    );
  }
  
  // Check for bar completions and calculate payouts
  if (state.bars.cyan >= DEFAULT_CONFIG.maxBarLevel) {
    payout += DEFAULT_CONFIG.payoutMultipliers.line3;
    state.bars.cyan = 0; // Reset after payout
  }
  
  if (state.bars.yellow >= DEFAULT_CONFIG.maxBarLevel) {
    payout += DEFAULT_CONFIG.payoutMultipliers.corners4;
    state.bars.yellow = 0; // Reset after payout
  }
  
  if (state.bars.magenta >= DEFAULT_CONFIG.maxBarLevel) {
    payout += DEFAULT_CONFIG.payoutMultipliers.full9;
    state.bars.magenta = 0; // Reset after payout
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
  for (let symbol = 1; symbol <= 3; symbol++) {
    if (countSymbolMatches(state.gridSymbols, symbol) === 9) {
      payout = DEFAULT_CONFIG.payoutMultipliers.full9;
      break;
    }
  }
  
  // Update RTP multiplier based on bars
  const avgBar = (state.bars.cyan + state.bars.yellow + state.bars.magenta) / 3;
  state.rtpMultiplier = Math.min(
    DEFAULT_CONFIG.baseRTP + (avgBar / DEFAULT_CONFIG.maxBarLevel) * 2.0,
    3.0
  );
  
  state.lastSpinTime = Date.now();
  
  return { payout, rtpMultiplier: state.rtpMultiplier };
}

export { ParaisoDoceState, ParaisoDoceConfig };