// ==========================================
// 🔗 SWEET LADDER (DOCE CORRENTE) MECHANICS
// ==========================================

export interface ChainData {
  chain: number;      // Nível da corrente
  lives: number;      // Vidas dessa corrente
  hits: number;       // Acertos consecutivos (para ganhar vida)
}

export interface SweetLadderState {
  chains: ChainData[];  // Array de correntes paralelas
  isActive: boolean;    // Se a mecânica está ativa
}

export const SWEET_LADDER_CONFIG = {
  BONUS_PER_LEVEL: 10,     // $10 por nível de corrente
  HITS_PER_LIFE: 10,       // 10 acertos = +1 vida
  MAX_LIVES: 2,            // Máximo de 2 vidas por corrente
  BASE_SLOTS: 1,           // Começa com apenas 1 slot de corrente
  SLOTS_PER_MILESTONE: 1,  // Ganha +1 slot a cada milestone
  SLOT_MILESTONE: 5,       // A cada 5 níveis de chain ganha +1 slot
  MAX_SLOTS: 8,            // Máximo absoluto de slots
  CHAIN_DECAY: 1.0,        // Quebra total ao errar (100% decay = chain vai para 0)
  MIN_CHAIN: 0,            // Corrente zera completamente ao errar sem vida
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
    chains: [],
    isActive: false,
  };
}

/**
 * Calcula quantos slots de corrente estão disponíveis baseado no nível máximo
 * Fórmula: 1 slot base + 1 slot a cada 5 níveis de chain
 * Ex: chain 0-4 = 1 slot, chain 5-9 = 2 slots, chain 10-14 = 3 slots, etc
 */
function calculateAvailableSlots(highestChainLevel: number): number {
  const { BASE_SLOTS, SLOTS_PER_MILESTONE, SLOT_MILESTONE, MAX_SLOTS } = SWEET_LADDER_CONFIG;
  const milestones = Math.floor(highestChainLevel / SLOT_MILESTONE);
  const totalSlots = BASE_SLOTS + (milestones * SLOTS_PER_MILESTONE);
  return Math.min(totalSlots, MAX_SLOTS);
}

/**
 * Processa acerto de N linhas de doce
 * @param candyLinesHit - Número de linhas de doce acertadas (1-8)
 * @returns Novo estado + bônus total ganho + vidas ganhas
 */
export function processMultipleHits(
  state: SweetLadderState,
  candyLinesHit: number
): {
  newState: SweetLadderState;
  totalBonus: number;
  livesGained: number;
  chainsCreated: number;
  slotsUnlocked: number;
} {
  if (!state.isActive || candyLinesHit <= 0) {
    return { newState: state, totalBonus: 0, livesGained: 0, chainsCreated: 0, slotsUnlocked: 0 };
  }

  let totalBonus = 0;
  let livesGained = 0;
  const newChains: ChainData[] = [];

  // Calcula slots disponíveis ANTES de avançar
  const highestChainBefore = state.chains.length > 0 
    ? Math.max(...state.chains.map(c => c.chain)) 
    : 0;
  const slotsBefore = calculateAvailableSlots(highestChainBefore);

  // 1. AVANÇA todas as correntes existentes
  for (const chainData of state.chains) {
    const newChainLevel = chainData.chain + 1;
    const newHits = chainData.hits + 1;
    
    // Calcula bônus dessa corrente
    const bonus = newChainLevel * SWEET_LADDER_CONFIG.BONUS_PER_LEVEL;
    totalBonus += bonus;

    // Verifica se ganhou vida
    let newLives = chainData.lives;
    if (newHits % SWEET_LADDER_CONFIG.HITS_PER_LIFE === 0 && newLives < SWEET_LADDER_CONFIG.MAX_LIVES) {
      newLives++;
      livesGained++;
    }

    newChains.push({
      chain: newChainLevel,
      lives: newLives,
      hits: newHits,
    });
  }

  // Calcula slots disponíveis DEPOIS de avançar
  const highestChainAfter = newChains.length > 0 
    ? Math.max(...newChains.map(c => c.chain)) 
    : 0;
  const slotsAfter = calculateAvailableSlots(highestChainAfter);
  const slotsUnlocked = Math.max(0, slotsAfter - slotsBefore);

  // 2. CRIA novas correntes (até o limite de slots)
  const chainsToCreate = Math.min(
    candyLinesHit,
    slotsAfter - newChains.length
  );

  for (let i = 0; i < chainsToCreate; i++) {
    // Nova corrente começa em nível 1 (já conta o primeiro acerto)
    const bonus = 1 * SWEET_LADDER_CONFIG.BONUS_PER_LEVEL;
    totalBonus += bonus;

    newChains.push({
      chain: 1,
      lives: 0,
      hits: 1,
    });
  }

  return {
    newState: {
      ...state,
      chains: newChains,
    },
    totalBonus,
    livesGained,
    chainsCreated: chainsToCreate,
    slotsUnlocked,
  };
}

/**
 * Processa erro (não acertou linha de doce)
 * @returns Novo estado + correntes quebradas + vidas usadas
 */
export function processMiss(state: SweetLadderState): {
  newState: SweetLadderState;
  chainsBroken: number;
  livesUsed: number;
} {
  if (!state.isActive) {
    return { newState: state, chainsBroken: 0, livesUsed: 0 };
  }

  let chainsBroken = 0;
  let livesUsed = 0;
  const survivingChains: ChainData[] = [];

  // Processa cada corrente
  for (const chainData of state.chains) {
    if (chainData.chain === 0) {
      // Corrente ainda não começou, ignora
      continue;
    }

    if (chainData.lives > 0) {
      // Tem vida: consome e mantém corrente
      survivingChains.push({
        ...chainData,
        lives: chainData.lives - 1,
      });
      livesUsed++;
    } else {
      // Sem vida: corrente QUEBRA
      chainsBroken++;
    }
  }

  return {
    newState: {
      ...state,
      chains: survivingChains,
    },
    chainsBroken,
    livesUsed,
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
 * Retorna informações agregadas sobre todas as correntes
 */
export function getChainsSummary(state: SweetLadderState): {
  totalChains: number;
  highestChain: number;
  totalLives: number;
  averageChain: number;
  availableSlots: number;
  nextSlotAt: number;
} {
  if (state.chains.length === 0) {
    return {
      totalChains: 0,
      highestChain: 0,
      totalLives: 0,
      averageChain: 0,
      availableSlots: SWEET_LADDER_CONFIG.BASE_SLOTS,
      nextSlotAt: SWEET_LADDER_CONFIG.SLOT_MILESTONE,
    };
  }

  const highestChain = Math.max(...state.chains.map(c => c.chain));
  const totalLives = state.chains.reduce((sum, c) => sum + c.lives, 0);
  const averageChain = state.chains.reduce((sum, c) => sum + c.chain, 0) / state.chains.length;
  const availableSlots = calculateAvailableSlots(highestChain);
  
  // Calcula quando vem o próximo slot
  const { SLOT_MILESTONE, MAX_SLOTS } = SWEET_LADDER_CONFIG;
  const nextMilestone = Math.floor(highestChain / SLOT_MILESTONE) + 1;
  const nextSlotAt = availableSlots >= MAX_SLOTS ? -1 : nextMilestone * SLOT_MILESTONE;

  return {
    totalChains: state.chains.length,
    highestChain,
    totalLives,
    averageChain,
    availableSlots,
    nextSlotAt,
  };
}

/**
 * Calcula bônus total acumulado de todas as correntes
 */
export function getTotalBonusEarned(state: SweetLadderState): number {
  let total = 0;
  for (const chainData of state.chains) {
    // Soma aritmética: 1 + 2 + 3 + ... + n = n * (n + 1) / 2
    total += (chainData.chain * (chainData.chain + 1) / 2) * SWEET_LADDER_CONFIG.BONUS_PER_LEVEL;
  }
  return total;
}