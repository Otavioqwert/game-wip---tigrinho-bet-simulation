import { useMemo } from 'react';
import type { UseSpinLogicResult } from './useSpinLogic';

interface Props {
  bal: number;
  betVal: number;
  febreDocesAtivo: boolean;
  febreDocesGiros: number;
  isSpinning: boolean;
  quickSpinQueue: number;
  starBonusState: UseSpinLogicResult['starBonusState'];
  coinFlipState: UseSpinLogicResult['coinFlipState'];
  paraisoDetector: { activeAnimation: any };
  cashbackMultiplier: number;
  handleSpend: (cost: number) => boolean;
}

export interface QuickSpinStatus {
  available: boolean;
  reason: string | null;
}

export const useQuickSpinAvailability = (props: Props): QuickSpinStatus => {
  const {
    bal, betVal, febreDocesAtivo, febreDocesGiros,
    isSpinning, quickSpinQueue, starBonusState, coinFlipState, paraisoDetector,
    cashbackMultiplier, handleSpend
  } = props;

  // 🍬 FREEZE ABSOLUTO: Prioridade máxima para animações do Paraíso Doce
  const isParaisoAnimating = paraisoDetector.activeAnimation !== null;
  
  // Bloqueios gerais que aplicam a ambos os modos
  const hasActiveAnimation = isSpinning || starBonusState.isActive || coinFlipState.isActive;
  const hasQueue = quickSpinQueue > 0;

  // Modo FEBRE: Disponibilidade baseada em giros restantes
  const isAvailableFebre = useMemo(() => {
    if (isParaisoAnimating) return { available: false, reason: "⏸️ Animação do Paraíso Doce ativa" };
    if (hasActiveAnimation) return { available: false, reason: "⏳ Giro em andamento..." };
    if (hasQueue) return { available: false, reason: "⏭️ Fila de giros rápidos ativa" };
    if (febreDocesGiros <= 0) return { available: false, reason: "❌ Giros da febre esgotados" };
    
    return { available: true, reason: null };
  }, [febreDocesGiros, hasActiveAnimation, hasQueue, isParaisoAnimating]);

  // Modo NORMAL: Disponibilidade baseada em saldo
  const isAvailableNormal = useMemo(() => {
    if (isParaisoAnimating) return { available: false, reason: "⏸️ Animação do Paraíso Doce ativa" };
    if (hasActiveAnimation) return { available: false, reason: "⏳ Giro em andamento..." };
    if (hasQueue) return { available: false, reason: "⏭️ Fila de giros rápidos ativa" };
    
    const cost = betVal * (1 - cashbackMultiplier);
    if (!handleSpend(cost)) return { available: false, reason: "💰 Saldo insuficiente" };
    
    return { available: true, reason: null };
  }, [bal, betVal, cashbackMultiplier, hasActiveAnimation, hasQueue, isParaisoAnimating]);

  // Retorna estado baseado no modo atual
  return febreDocesAtivo ? isAvailableFebre : isAvailableNormal;
};