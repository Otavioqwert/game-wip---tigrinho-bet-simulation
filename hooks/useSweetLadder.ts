import { useState, useCallback } from 'react';
import {
  createInitialState,
  activateSweetLadder,
  deactivateSweetLadder,
  processHit,
  processMiss,
  isCandySymbol,
  hitsUntilNextLife,
  getTotalBonusEarned,
  type SweetLadderState,
} from '../utils/mechanics/sweetLadder';

export interface UseSweetLadderResult {
  // Estado
  state: SweetLadderState;
  
  // Métricas
  hitsUntilNextLife: number;
  totalBonusEarned: number;
  
  // Ações
  activateMechanic: () => void;
  deactivateMechanic: () => void;
  onSymbolHit: (symbol: string) => {
    bonus: number;
    gainedLife: boolean;
    usedLife: boolean;
  };
  reset: () => void;
}

/**
 * Hook para gerenciar a mecânica Sweet Ladder (Doce Corrente)
 * 
 * @example
 * const sweetLadder = useSweetLadder();
 * 
 * // Ao comprar pacote
 * sweetLadder.activateMechanic();
 * 
 * // A cada spin
 * const result = sweetLadder.onSymbolHit('🍭');
 * if (result.bonus > 0) {
 *   addMoney(result.bonus);
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

  // Processa símbolo acertado
  const onSymbolHit = useCallback((symbol: string) => {
    if (!state.isActive) {
      return { bonus: 0, gainedLife: false, usedLife: false };
    }

    const isCandy = isCandySymbol(symbol);

    if (isCandy) {
      // Acertou doce
      const result = processHit(state);
      setState(result.newState);
      return {
        bonus: result.bonus,
        gainedLife: result.gainedLife,
        usedLife: false,
      };
    } else {
      // Errou (não é doce)
      const result = processMiss(state);
      setState(result.newState);
      return {
        bonus: 0,
        gainedLife: false,
        usedLife: result.usedLife,
      };
    }
  }, [state]);

  // Reset completo
  const reset = useCallback(() => {
    setState(createInitialState());
  }, []);

  return {
    state,
    hitsUntilNextLife: hitsUntilNextLife(state.chain),
    totalBonusEarned: getTotalBonusEarned(state.chain),
    activateMechanic,
    deactivateMechanic,
    onSymbolHit,
    reset,
  };
}
