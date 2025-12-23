/**
 * 🍰 Paraíso Doce 2.0 - Neon Sweets Paradise
 * 
 * Mecânica: Roleta 3×3 com 3 barras progressivas paralelas
 * Custo: $3.000
 * RTP Alvo: 6.07%
 * Hit Frequency: ~70%
 * 
 * Baseado em: docs/PARAISO_DOCE_2_0_DESIGN.md
 */

// ============================================================================
// TIPOS
// ============================================================================

export interface ParaisoDoceState {
  isActive: boolean;
  
  // Grid 3×3 de símbolos (🍧=cyan, 🍦=yellow, 🍭=magenta)
  grid: string[];  // Array de 9 elementos
  
  // Barras progressivas (0-10)
  bars: {
    cyan: number;      // 🍧 Sorvete Cyan
    yellow: number;    // 🍦 Sorvete Yellow
    magenta: number;   // 🍭 Pirulito Magenta
  };
  
  // Métricas da sessão
  totalSpins: number;
  totalPayout: number;
  barsCompleted: number;
  
  // Partículas visuais (para UI)
  particles: ParticleEffect[];
}

export interface ParticleEffect {
  id: string;
  x: number;
  y: number;
  color: string;
  velocity: { x: number; y: number };
  rotation: number;
  scale: number;
  alpha: number;
  timestamp: number;
}

export interface SpinResult {
  grid: string[];
  barsIncremented: {
    cyan: number;
    yellow: number;
    magenta: number;
  };
  barsCompleted: string[];  // ['cyan', 'yellow', 'magenta']
  payout: number;
  isJackpot: boolean;
  particles: ParticleEffect[];
}

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const SYMBOLS = {
  CYAN: '🍧',
  YELLOW: '🍦', 
  MAGENTA: '🍭',
} as const;

const CONFIG = {
  // Custo do pacote
  COST: 3000,
  
  // Probabilidades (33.33% cada símbolo)
  PROBABILITIES: {
    [SYMBOLS.CYAN]: 0.333,
    [SYMBOLS.YELLOW]: 0.333,
    [SYMBOLS.MAGENTA]: 0.334,
  },
  
  // Barras
  MAX_BAR_LEVEL: 10,
  
  // Recompensas
  PAYOUTS: {
    SINGLE_BAR: {
      CYAN: 200,      // 25% prob de completar
      YELLOW: 150,    // 33% prob
      MAGENTA: 150,   // 33% prob
    },
    TWO_BARS_BONUS: 200,
    THREE_BARS_JACKPOT: 400,
  },
  
  // Probabilidades de completar barra (aproximadas)
  COMPLETION_PROBS: {
    CYAN: 0.25,
    YELLOW: 0.33,
    MAGENTA: 0.33,
  },
  
  // Visuais
  PARTICLE_COUNT: 12,
  PARTICLE_SPEED: 300,  // px/s
  PARTICLE_SPREAD_ANGLE: 120,  // graus
  GRAVITY: 0.5,  // px/s²
  
  // Luminância igual (ético)
  LUMINANCE: {
    CYAN: 0.93,
    YELLOW: 0.92,
    MAGENTA: 0.93,
  },
} as const;

// ============================================================================
// FUNÇÕES PURAS
// ============================================================================

/**
 * Cria estado inicial do Paraíso Doce
 */
export function createInitialState(): ParaisoDoceState {
  return {
    isActive: false,
    grid: Array(9).fill(''),
    bars: {
      cyan: 0,
      yellow: 0,
      magenta: 0,
    },
    totalSpins: 0,
    totalPayout: 0,
    barsCompleted: 0,
    particles: [],
  };
}

/**
 * Ativa o Paraíso Doce
 */
export function activate(state: ParaisoDoceState): ParaisoDoceState {
  return {
    ...createInitialState(),
    isActive: true,
  };
}

/**
 * Desativa e reseta o Paraíso Doce
 */
export function deactivate(state: ParaisoDoceState): ParaisoDoceState {
  return createInitialState();
}

/**
 * Gera um símbolo aleatório baseado nas probabilidades
 */
function getRandomSymbol(): string {
  const rand = Math.random();
  
  if (rand < CONFIG.PROBABILITIES[SYMBOLS.CYAN]) {
    return SYMBOLS.CYAN;
  } else if (rand < CONFIG.PROBABILITIES[SYMBOLS.CYAN] + CONFIG.PROBABILITIES[SYMBOLS.YELLOW]) {
    return SYMBOLS.YELLOW;
  } else {
    return SYMBOLS.MAGENTA;
  }
}

/**
 * Gera um grid 3×3 de símbolos aleatórios
 */
function generateGrid(): string[] {
  return Array(9).fill(null).map(() => getRandomSymbol());
}

/**
 * Verifica se uma linha horizontal tem 3 símbolos iguais
 */
function checkLine(grid: string[], row: number): string | null {
  const idx = row * 3;
  const symbol = grid[idx];
  
  if (!symbol || symbol === '') return null;
  
  if (grid[idx] === grid[idx + 1] && grid[idx + 1] === grid[idx + 2]) {
    return symbol;
  }
  
  return null;
}

/**
 * Analisa o grid e retorna quais linhas completaram e com qual símbolo
 */
function analyzeGrid(grid: string[]): { [key: string]: number } {
  const counts = {
    [SYMBOLS.CYAN]: 0,
    [SYMBOLS.YELLOW]: 0,
    [SYMBOLS.MAGENTA]: 0,
  };
  
  // Verifica cada linha horizontal (0, 1, 2)
  for (let row = 0; row < 3; row++) {
    const lineSymbol = checkLine(grid, row);
    if (lineSymbol) {
      counts[lineSymbol]++;
    }
  }
  
  return counts;
}

/**
 * Cria partículas de comemoração quando uma barra completa
 */
function createParticles(color: string, barIndex: number): ParticleEffect[] {
  const particles: ParticleEffect[] = [];
  const baseX = 100 + barIndex * 150;  // Posição X da barra
  const baseY = 300;
  
  for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
    const angle = (Math.random() * CONFIG.PARTICLE_SPREAD_ANGLE - CONFIG.PARTICLE_SPREAD_ANGLE / 2) * (Math.PI / 180);
    const speed = CONFIG.PARTICLE_SPEED * (0.8 + Math.random() * 0.4);
    
    particles.push({
      id: `particle_${Date.now()}_${i}`,
      x: baseX,
      y: baseY,
      color,
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      },
      rotation: Math.random() * 360,
      scale: 0.8 + Math.random() * 0.4,
      alpha: 1.0,
      timestamp: Date.now(),
    });
  }
  
  return particles;
}

/**
 * Calcula payout baseado em barras completadas
 */
function calculatePayout(barsCompleted: string[]): number {
  if (barsCompleted.length === 0) return 0;
  
  let payout = 0;
  
  // Payout individual de cada barra
  barsCompleted.forEach(bar => {
    if (bar === 'cyan') {
      payout += CONFIG.PAYOUTS.SINGLE_BAR.CYAN;
    } else if (bar === 'yellow') {
      payout += CONFIG.PAYOUTS.SINGLE_BAR.YELLOW;
    } else if (bar === 'magenta') {
      payout += CONFIG.PAYOUTS.SINGLE_BAR.MAGENTA;
    }
  });
  
  // Bônus por múltiplas barras simultâneas
  if (barsCompleted.length === 2) {
    payout += CONFIG.PAYOUTS.TWO_BARS_BONUS;
  } else if (barsCompleted.length === 3) {
    payout += CONFIG.PAYOUTS.THREE_BARS_JACKPOT;
  }
  
  return payout;
}

/**
 * Executa um spin no Paraíso Doce
 */
export function spin(state: ParaisoDoceState): { newState: ParaisoDoceState; result: SpinResult } {
  if (!state.isActive) {
    throw new Error('Paraíso Doce não está ativo');
  }
  
  // Gera novo grid
  const newGrid = generateGrid();
  
  // Analisa linhas completadas
  const lineMatches = analyzeGrid(newGrid);
  
  // Atualiza barras
  const newBars = { ...state.bars };
  const barsIncremented = {
    cyan: 0,
    yellow: 0,
    magenta: 0,
  };
  
  // Incrementa barras baseado nas linhas completadas
  if (lineMatches[SYMBOLS.CYAN] > 0) {
    const increment = lineMatches[SYMBOLS.CYAN];
    newBars.cyan = Math.min(newBars.cyan + increment, CONFIG.MAX_BAR_LEVEL);
    barsIncremented.cyan = increment;
  }
  
  if (lineMatches[SYMBOLS.YELLOW] > 0) {
    const increment = lineMatches[SYMBOLS.YELLOW];
    newBars.yellow = Math.min(newBars.yellow + increment, CONFIG.MAX_BAR_LEVEL);
    barsIncremented.yellow = increment;
  }
  
  if (lineMatches[SYMBOLS.MAGENTA] > 0) {
    const increment = lineMatches[SYMBOLS.MAGENTA];
    newBars.magenta = Math.min(newBars.magenta + increment, CONFIG.MAX_BAR_LEVEL);
    barsIncremented.magenta = increment;
  }
  
  // Verifica barras completadas
  const barsCompleted: string[] = [];
  const particles: ParticleEffect[] = [];
  
  if (newBars.cyan >= CONFIG.MAX_BAR_LEVEL) {
    barsCompleted.push('cyan');
    particles.push(...createParticles('#00FFFF', 0));
    newBars.cyan = 0;  // Reset após completar
  }
  
  if (newBars.yellow >= CONFIG.MAX_BAR_LEVEL) {
    barsCompleted.push('yellow');
    particles.push(...createParticles('#FFFF00', 1));
    newBars.yellow = 0;
  }
  
  if (newBars.magenta >= CONFIG.MAX_BAR_LEVEL) {
    barsCompleted.push('magenta');
    particles.push(...createParticles('#FF00FF', 2));
    newBars.magenta = 0;
  }
  
  // Calcula payout
  const payout = calculatePayout(barsCompleted);
  const isJackpot = barsCompleted.length === 3;
  
  // Novo estado
  const newState: ParaisoDoceState = {
    ...state,
    grid: newGrid,
    bars: newBars,
    totalSpins: state.totalSpins + 1,
    totalPayout: state.totalPayout + payout,
    barsCompleted: state.barsCompleted + barsCompleted.length,
    particles: [...state.particles, ...particles],
  };
  
  const result: SpinResult = {
    grid: newGrid,
    barsIncremented,
    barsCompleted,
    payout,
    isJackpot,
    particles,
  };
  
  return { newState, result };
}

/**
 * Calcula estatísticas da sessão
 */
export function getSessionStats(state: ParaisoDoceState) {
  const avgPayoutPerSpin = state.totalSpins > 0 ? state.totalPayout / state.totalSpins : 0;
  const roi = state.totalPayout / CONFIG.COST;
  const hitRate = state.totalSpins > 0 ? (state.barsCompleted / state.totalSpins) : 0;
  
  return {
    totalSpins: state.totalSpins,
    totalPayout: state.totalPayout,
    barsCompleted: state.barsCompleted,
    avgPayoutPerSpin,
    roi,
    hitRate,
    cost: CONFIG.COST,
    netProfit: state.totalPayout - CONFIG.COST,
  };
}

/**
 * Verifica se o Paraíso Doce está próximo de completar alguma barra
 */
export function getBarProgress(state: ParaisoDoceState) {
  return {
    cyan: {
      current: state.bars.cyan,
      max: CONFIG.MAX_BAR_LEVEL,
      percentage: (state.bars.cyan / CONFIG.MAX_BAR_LEVEL) * 100,
      remaining: CONFIG.MAX_BAR_LEVEL - state.bars.cyan,
    },
    yellow: {
      current: state.bars.yellow,
      max: CONFIG.MAX_BAR_LEVEL,
      percentage: (state.bars.yellow / CONFIG.MAX_BAR_LEVEL) * 100,
      remaining: CONFIG.MAX_BAR_LEVEL - state.bars.yellow,
    },
    magenta: {
      current: state.bars.magenta,
      max: CONFIG.MAX_BAR_LEVEL,
      percentage: (state.bars.magenta / CONFIG.MAX_BAR_LEVEL) * 100,
      remaining: CONFIG.MAX_BAR_LEVEL - state.bars.magenta,
    },
  };
}

/**
 * Exporta configuração para referência
 */
export function getConfig() {
  return {
    cost: CONFIG.COST,
    symbols: SYMBOLS,
    payouts: CONFIG.PAYOUTS,
    maxBarLevel: CONFIG.MAX_BAR_LEVEL,
    probabilities: CONFIG.PROBABILITIES,
  };
}
