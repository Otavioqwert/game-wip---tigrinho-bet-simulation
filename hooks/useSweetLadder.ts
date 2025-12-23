import { useState, useCallback } from 'react';
import {
  createInitialState,
  activateSweetLadder,
  deactivateSweetLadder,
  processMultipleHits,
  processMiss,
  isCandySymbol,
  getChainsSummary,
  getTotalBonusEarned,
  type SweetLadderState,
} from '../utils/mechanics/sweetLadder';

export interface UseSweetLadderResult {
  // Estado
  state: SweetLadderState;
  
  // Métricas agregadas
  totalChains: number;
  highestChain: number;
  totalLives: number;
  averageChain: number;
  totalBonusEarned: number;
  
  // Ações
  activateMechanic: () => void;
  deactivateMechanic: () => void;
  
  /**
   * Processa N linhas de doce acertadas em um spin
   * @param candyLinesHit - Número de linhas de doce (1-8)
   */
  onCandyLinesHit: (candyLinesHit: number) => {
    totalBonus: number;
    livesGained: number;
    chainsCreated: number;
  };
  
  /**
   * Processa miss (nenhuma linha de doce)
   */
  onMiss: () => {
    chainsBroken: number;
    livesUsed: number;
  };
  
  reset: () => void;
}

/**
 * Hook para gerenciar a mecânica Sweet Ladder (Doce Corrente) com múltiplas correntes paralelas
 * 
 * @example
 * const sweetLadder = useSweetLadder();
 * 
 * // Ao comprar pacote
 * sweetLadder.activateMechanic();
 * 
 * // A cada spin
 * if (candyLinesCount > 0) {
 *   const result = sweetLadder.onCandyLinesHit(candyLinesCount);
 *   addMoney(result.totalBonus);
 * } else {
 *   sweetLadder.onMiss();
 * }
 */
export function useSweetLadder(): UseSweetLadderResult {
  const [state, setState] = useState<SweetLadderState>(createInitialState());

  // Ativa mecânica
  const activateMechanic = useCallback(() => {
    setState(prev => activateSweetLadder(prev));
  }, []);

  // Desativa mecânica
  const deactivateMechanic = useCallback(() => {
    setState(deactivateSweetLadder(state));
  }, [state]);

  // Processa N linhas de doce acertadas
  const onCandyLinesHit = useCallback((candyLinesHit: number) => {
    if (!state.isActive || candyLinesHit <= 0) {
      return { totalBonus: 0, livesGained: 0, chainsCreated: 0 };
    }

    const result = processMultipleHits(state, candyLinesHit);
    setState(result.newState);
    
    return {
      totalBonus: result.totalBonus,
      livesGained: result.livesGained,
      chainsCreated: result.chainsCreated,
    };
  }, [state]);

  // Processa miss
  const onMiss = useCallback(() => {
    if (!state.isActive) {
      return { chainsBroken: 0, livesUsed: 0 };
    }

    const result = processMiss(state);
    setState(result.newState);
    
    return {
      chainsBroken: result.chainsBroken,
      livesUsed: result.livesUsed,
    };
  }, [state]);

  // Reset completo
  const reset = useCallback(() => {
    setState(createInitialState());
  }, []);

  const summary = getChainsSummary(state);

  return {
    state,
    totalChains: summary.totalChains,
    highestChain: summary.highestChain,
    totalLives: summary.totalLives,
    averageChain: summary.averageChain,
    totalBonusEarned: getTotalBonusEarned(state),
    activateMechanic,
    deactivateMechanic,
    onCandyLinesHit,
    onMiss,
    reset,
  };
}
