import { useState, useCallback, useRef } from 'react';
import type { SymbolKey } from '../types';

type CandySymbol = '🍭' | '🍦' | '🍧';

export interface CandyHit {
  symbol: CandySymbol;
  count: number;
}

export interface ParaisoDetectorState {
  isActive: boolean;
  lastHits: CandyHit[];
  totalHits: Record<CandySymbol, number>;
  progress: Record<CandySymbol, number>;
  rainbowTriggered: boolean;
  activeAnimation: CandySymbol | 'rainbow' | null;

  // Sistema de níveis global da run de febre
  level: number;
  totalCandyLevels: number; // soma ponderada: 🍭=1, 🍦=2, 🍧=3
  unlockedCandy: {
    '🍭': boolean;
    '🍦': boolean;
    '🍧': boolean;
    'rainbow': boolean;
  };

  // Sistema de níveis específico do arco-íris
  rainbowLevel: number;        // nível atual de 🌈
  rainbowHitsThisLevel: number; // quantos acertos 🌈 neste nível
}

export interface ParaisoDetectorRewards {
  CANDY: Record<CandySymbol, number>;
  BASE_RAINBOW: number;
}

// 💰 RECOMPENSAS POR RESET
const CANDY_REWARDS: Record<CandySymbol, number> = {
  '🍭': 150,
  '🍦': 300,
  '🍧': 2500,
};

const BASE_RAINBOW_REWARD = 49999;

export const useParaisoDoceDetector = () => {
  const [state, setState] = useState<ParaisoDetectorState>({
    isActive: false,
    lastHits: [],
    totalHits: { '🍭': 0, '🍦': 0, '🍧': 0 },
    progress: { '🍭': 0, '🍦': 0, '🍧': 0 },
    rainbowTriggered: false,
    activeAnimation: null,
    level: 0,
    totalCandyLevels: 0,
    unlockedCandy: { '🍭': true, '🍦': false, '🍧': false, 'rainbow': false },
    rainbowLevel: 0,
    rainbowHitsThisLevel: 0,
  });
  
  const stateRef = useRef(state);
  stateRef.current = state;

  const activate = useCallback(() => {
    setState({
      isActive: true,
      lastHits: [],
      totalHits: { '🍭': 0, '🍦': 0, '🍧': 0 },
      progress: { '🍭': 0, '🍦': 0, '🍧': 0 },
      rainbowTriggered: false,
      activeAnimation: null,
      level: 0,
      totalCandyLevels: 0,
      unlockedCandy: { '🍭': true, '🍦': false, '🍧': false, 'rainbow': false },
      rainbowLevel: 0,
      rainbowHitsThisLevel: 0,
    });
  }, []);

  const deactivate = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false,
      activeAnimation: null,
      level: 0,
      totalCandyLevels: 0,
      unlockedCandy: { '🍭': true, '🍦': false, '🍧': false, 'rainbow': false },
      rainbowLevel: 0,
      rainbowHitsThisLevel: 0,
    }));
  }, []);

  const detectCandyHits = useCallback((grid: SymbolKey[]): CandyHit[] => {
    if (!stateRef.current.isActive || grid.length !== 9) return [];

    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // horizontais
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // verticais
      [0, 4, 8], [2, 4, 6]              // diagonais
    ];

    const candies: CandySymbol[] = ['🍭', '🍦', '🍧'];
    const counts: Record<CandySymbol, number> = { '🍭': 0, '🍦': 0, '🍧': 0 };

    for (const line of lines) {
      const syms = line.map(i => grid[i]);
      
      for (const candy of candies) {
        // Linha pura de um doce
        if (syms.every(s => s === candy)) {
          counts[candy]++;
        }
        // Linha com 2 doces + 1 wild (⭐)
        else if (syms.filter(s => s === candy).length === 2 && syms.includes('⭐')) {
          counts[candy]++;
        }
      }
    }

    const hits: CandyHit[] = candies
      .filter(c => counts[c] > 0)
      .map(c => ({ symbol: c, count: counts[c] }));

    if (hits.length === 0) return [];

    // Atualiza progresso, níveis e detecta completações
    setState(prev => {
      const newTotals = { ...prev.totalHits };
      const newProgress = { ...prev.progress };
      let triggerAnimation: CandySymbol | 'rainbow' | null = prev.activeAnimation;

      // pesos de nível por doce
      const levelWeights: Record<CandySymbol, number> = { '🍭': 1, '🍦': 2, '🍧': 3 };
      let levelsGainedThisSpin = 0;

      hits.forEach(h => {
        newTotals[h.symbol] += h.count;
        newProgress[h.symbol] = Math.min(3, prev.progress[h.symbol] + h.count);
        levelsGainedThisSpin += h.count * levelWeights[h.symbol];
      });

      const newTotalCandyLevels = prev.totalCandyLevels + levelsGainedThisSpin;
      const newLevel = newTotalCandyLevels; // 1 nível por ponto acumulado

      // desbloqueios por nível
      const newUnlocked = { ...prev.unlockedCandy };
      if (newLevel >= 10) newUnlocked['🍦'] = true;
      if (newLevel >= 25) newUnlocked['🍧'] = true;
      if (newLevel >= 50) newUnlocked['rainbow'] = true;

      // 🌈 TRIGGER: 3 doces diferentes no mesmo giro + rainbow desbloqueado
      const uniqueCandiesHit = hits.length;
      const hasAllThreeCandies = uniqueCandiesHit === 3 && newUnlocked['rainbow'];

      // contabiliza hits de arco-íris para o sistema de nível de 🌈
      let newRainbowHitsThisLevel = prev.rainbowHitsThisLevel;
      if (hasAllThreeCandies) {
        newRainbowHitsThisLevel += 1;
      }

      if (hasAllThreeCandies && !prev.activeAnimation) {
        triggerAnimation = 'rainbow';
      }
      // Animação individual (só se não tiver rainbow)
      else if (!hasAllThreeCandies && !prev.activeAnimation) {
        for (const h of hits) {
          const oldProg = prev.progress[h.symbol];
          if (newProgress[h.symbol] === 3 && oldProg < 3) {
            // Só permite animação de 🍦/🍧 se estiverem desbloqueados
            if (h.symbol === '🍭' || newUnlocked[h.symbol]) {
              triggerAnimation = h.symbol;
              break; // Apenas o primeiro que completar
            }
          }
        }
      }

      return { 
        ...prev, 
        lastHits: hits, 
        totalHits: newTotals,
        progress: newProgress,
        rainbowTriggered: hasAllThreeCandies || prev.rainbowTriggered,
        activeAnimation: triggerAnimation,
        totalCandyLevels: newTotalCandyLevels,
        level: newLevel,
        unlockedCandy: newUnlocked,
        rainbowHitsThisLevel: newRainbowHitsThisLevel,
      };
    });

    return hits;
  }, []);

  // 🔍 Verifica se há barras completas aguardando processamento
  const checkPendingCompletions = useCallback(() => {
    const candies: CandySymbol[] = ['🍭', '🍦', '🍧'];
    
    setState(prev => {
      // Se já tem animação ativa, não faz nada
      if (prev.activeAnimation) return prev;
      
      // Procura por barras 3/3 que ainda não dispararam animação
      for (const candy of candies) {
        if (prev.progress[candy] === 3) {
          if (candy === '🍭' || prev.unlockedCandy[candy]) {
            return { ...prev, activeAnimation: candy };
          }
        }
      }
      
      return prev;
    });
  }, []);

  // 💰 Reset individual candy COM RECOMPENSA FIXA
  const resetCandy = useCallback((candy: CandySymbol): number => {
    const reward = CANDY_REWARDS[candy];
    setState(prev => ({
      ...prev,
      progress: { ...prev.progress, [candy]: 0 },
      activeAnimation: null,
    }));
    
    // 🔍 Agenda verificação de outras barras completas
    setTimeout(checkPendingCompletions, 100);
    
    return reward;
  }, [checkPendingCompletions]);

  // 💰 Reset all (para arco-íris) COM RECOMPENSA ESCALONADA POR NÍVEL DE 🌈
  const resetRainbowProgress = useCallback((): number => {
    const prev = stateRef.current;

    // quantidade de hits exigida neste nível
    const requiredHits = prev.rainbowLevel + 1;
    if (prev.rainbowHitsThisLevel < requiredHits) {
      // ainda não cumpriu a condição deste nível
      return 0;
    }

    const extraReward = BASE_RAINBOW_REWARD * prev.rainbowLevel;
    const reward = BASE_RAINBOW_REWARD + extraReward;

    setState({
      ...prev,
      progress: { '🍭': 0, '🍦': 0, '🍧': 0 },
      rainbowTriggered: false,
      activeAnimation: null,
      rainbowLevel: prev.rainbowLevel + 1,
      rainbowHitsThisLevel: 0,
    });

    return reward;
  }, []);

  return {
    isActive: state.isActive,
    progress: state.progress,
    totalHits: state.totalHits,
    lastHits: state.lastHits,
    activeAnimation: state.activeAnimation,
    isRainbowAnimating: state.activeAnimation === 'rainbow',
    isCandyAnimating: state.activeAnimation !== null && state.activeAnimation !== 'rainbow',
    currentAnimatingCandy: state.activeAnimation !== 'rainbow' ? state.activeAnimation : null,
    level: state.level,
    totalCandyLevels: state.totalCandyLevels,
    unlockedCandy: state.unlockedCandy,
    rainbowLevel: state.rainbowLevel,
    rainbowHitsThisLevel: state.rainbowHitsThisLevel,
    activate,
    deactivate,
    detectCandyHits,
    resetCandy,
    resetRainbowProgress,
    checkPendingCompletions,
    REWARDS: {
      CANDY: CANDY_REWARDS,
      BASE_RAINBOW: BASE_RAINBOW_REWARD,
    } as ParaisoDetectorRewards,
  };
};