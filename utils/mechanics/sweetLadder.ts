// ==========================================
// 🔗 SWEET LADDER (DOCE CORRENTE) MECHANICS
// ==========================================

export interface SweetLadderState {
  chain: number;        // Nível atual da corrente
  lives: number;        // Vidas disponíveis
  isActive: boolean;    // Se a mecânica está ativa
}

export const SWEET_LADDER_CONFIG = {
  BONUS_PER_LEVEL: 10,     // $10 por nível de corrente
  HITS_PER_LIFE: 7,        // 7 acertos = +1 vida
  MAX_LIVES: 2,            // Máximo de 2 vidas
  CHAIN_DECAY: 0.5,        // -50% ao errar sem vida
} as const;

export const CANDY_SYMBOLS = ['🍭', '🍦', '🍧'] as const;

/**
 * Verifica se um símbolo é um doce
 */
export function isCandySymbol(symbol: string): boolean {
  return CANDY_SYMBOLS.includes(symbol as any);
}

/**
 * Cria estado inicial da Sweet Ladder
 */
export function createInitialState(): SweetLadderState {
  return {
    chain: 0,
    lives: 0,
    isActive: false,
  };
}

/**
 * Processa acerto de doce
 * @returns Novo estado + bônus ganho
 */
export function processHit(state: SweetLadderState): {
  newState: SweetLadderState;
  bonus: number;
  gainedLife: boolean;
} {
  if (!state.isActive) {
    return { newState: state, bonus: 0, gainedLife: false };
  }

  const newChain = state.chain + 1;
  const bonus = newChain * SWEET_LADDER_CONFIG.BONUS_PER_LEVEL;

  // Verifica se ganhou vida
  const shouldGainLife =
    newChain % SWEET_LADDER_CONFIG.HITS_PER_LIFE === 0 &&
    state.lives < SWEET_LADDER_CONFIG.MAX_LIVES;

  const newLives = shouldGainLife ? state.lives + 1 : state.lives;

  return {
    newState: {
      ...state,
      chain: newChain,
      lives: newLives,
    },
    bonus,
    gainedLife: shouldGainLife,
  };
}

/**
 * Processa erro (acertou símbolo que não é doce)
 * @returns Novo estado
 */
export function processMiss(state: SweetLadderState): {
  newState: SweetLadderState;
  usedLife: boolean;
} {
  if (!state.isActive || state.chain === 0) {
    return { newState: state, usedLife: false };
  }

  // Tem vida? Consome e mantém corrente
  if (state.lives > 0) {
    return {
      newState: {
        ...state,
        lives: state.lives - 1,
      },
      usedLife: true,
    };
  }

  // Sem vida? Corrente cai pela metade
  const newChain = Math.floor(state.chain * SWEET_LADDER_CONFIG.CHAIN_DECAY);

  return {
    newState: {
      ...state,
      chain: newChain,
    },
    usedLife: false,
  };
}

/**
 * Ativa a mecânica (quando compra o pacote)
 */
export function activateSweetLadder(state: SweetLadderState): SweetLadderState {
  return {
    ...state,
    isActive: true,
  };
}

/**
 * Desativa a mecânica (ao sair do fever mode)
 */
export function deactivateSweetLadder(state: SweetLadderState): SweetLadderState {
  return createInitialState();
}

/**
 * Calcula próxima vida em quantos acertos
 */
export function hitsUntilNextLife(chain: number): number {
  const { HITS_PER_LIFE } = SWEET_LADDER_CONFIG;
  return HITS_PER_LIFE - (chain % HITS_PER_LIFE);
}

/**
 * Calcula bônus total acumulado até agora
 */
export function getTotalBonusEarned(chain: number): number {
  // Soma aritmética: 1 + 2 + 3 + ... + n = n * (n + 1) / 2
  return (chain * (chain + 1) / 2) * SWEET_LADDER_CONFIG.BONUS_PER_LEVEL;
}
