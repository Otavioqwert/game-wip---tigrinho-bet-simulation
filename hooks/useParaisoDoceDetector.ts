import { useState, useCallback, useRef } from 'react';
import type { SymbolKey } from '../types';

type CandySymbol = '🍭' | '🍦' | '🍧';

export interface CandyHit {
  symbol: CandySymbol;
  count: number;
  isBlocked?: boolean;
  requiredLevel?: number;
}

export interface ParaisoDetectorState {
  isActive: boolean;
  lastHits: CandyHit[];
  totalHits: Record<CandySymbol, number>;
  progress: Record<CandySymbol, number>;
  rainbowTriggered: boolean;
  activeAnimation: CandySymbol | 'rainbow' | null;

  level: number;
  totalCandyLevels: number; 
  unlockedCandy: {
    '🍭': boolean;
    '🍦': boolean;
    '🍧': boolean;
    'rainbow': boolean;
  };

  rainbowLevel: number;        
  rainbowHitsThisLevel: number; 
}

export interface ParaisoDetectorRewards {
  CANDY: Record<CandySymbol, number>;
  BASE_RAINBOW: number;
}

const CANDY_REWARDS: Record<CandySymbol, number> = {
  '🍭': 150,
  '🍦': 300,
  '🍧': 2500,
};

// --- NOVOS REQUISITOS DE NÍVEL ---
const CANDY_UNLOCK_LEVELS: Record<CandySymbol | 'rainbow', number> = {
  '🍭': 0,
  '🍦': 25,     // Antigo: 10
  '🍧': 100,    // Antigo: 25
  'rainbow': 300 // Antigo: 50
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

  const detectCandyHits = useCallback((grid: SymbolKey[], showMsg?: (msg: string, d?: number, e?: boolean) => void): CandyHit[] => {
    if (!stateRef.current.isActive || grid.length !== 9) return [];

    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    const candies: CandySymbol[] = ['🍭', '🍦', '🍧'];
    const counts: Record<CandySymbol, number> = { '🍭': 0, '🍦': 0, '🍧': 0 };

    for (const line of lines) {
      const syms = line.map(i => grid[i]);
      for (const candy of candies) {
        if (syms.every(s => s === candy) || (syms.filter(s => s === candy).length === 2 && syms.includes('⭐'))) {
          counts[candy]++;
        }
      }
    }

    const hits: CandyHit[] = candies
      .filter(c => counts[c] > 0)
      .map(c => {
        const isBlocked = !stateRef.current.unlockedCandy[c];
        return { 
          symbol: c, 
          count: counts[c], 
          isBlocked, 
          requiredLevel: CANDY_UNLOCK_LEVELS[c] 
        };
      });

    if (hits.length === 0) return [];

    hits.forEach(h => {
        if (h.isBlocked && showMsg) {
            showMsg(`Bloqueado até nível ${h.requiredLevel} 🔒`, 2000, true);
        }
    });

    setState(prev => {
      const newTotals = { ...prev.totalHits };
      const newProgress = { ...prev.progress };
      let triggerAnimation: CandySymbol | 'rainbow' | null = prev.activeAnimation;
      const levelWeights: Record<CandySymbol, number> = { '🍭': 1, '🍦': 2, '🍧': 3 };
      let levelsGainedThisSpin = 0;

      hits.forEach(h => {
        if (!h.isBlocked) {
            newTotals[h.symbol] += h.count;
            newProgress[h.symbol] = Math.min(3, prev.progress[h.symbol] + h.count);
            levelsGainedThisSpin += h.count * levelWeights[h.symbol];
        }
      });

      const newTotalCandyLevels = prev.totalCandyLevels + levelsGainedThisSpin;
      const newLevel = newTotalCandyLevels;

      const newUnlocked = { ...prev.unlockedCandy };
      if (newLevel >= CANDY_UNLOCK_LEVELS['🍦']) newUnlocked['🍦'] = true;
      if (newLevel >= CANDY_UNLOCK_LEVELS['🍧']) newUnlocked['🍧'] = true;
      if (newLevel >= CANDY_UNLOCK_LEVELS['rainbow']) newUnlocked['rainbow'] = true;

      const unblockedHits = hits.filter(h => !h.isBlocked);
      const hasAllThreeCandies = unblockedHits.length === 3 && newUnlocked['rainbow'];

      let newRainbowHitsThisLevel = prev.rainbowHitsThisLevel;
      if (hasAllThreeCandies) newRainbowHitsThisLevel += 1;

      if (hasAllThreeCandies && !prev.activeAnimation) {
        triggerAnimation = 'rainbow';
      }
      else if (!hasAllThreeCandies && !prev.activeAnimation) {
        for (const h of unblockedHits) {
          if (newProgress[h.symbol] === 3 && prev.progress[h.symbol] < 3) {
            triggerAnimation = h.symbol;
            break;
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

  const checkPendingCompletions = useCallback(() => {
    const candies: CandySymbol[] = ['🍭', '🍦', '🍧'];
    setState(prev => {
      if (prev.activeAnimation) return prev;
      for (const candy of candies) {
        if (prev.progress[candy] === 3 && prev.unlockedCandy[candy]) {
          return { ...prev, activeAnimation: candy };
        }
      }
      return prev;
    });
  }, []);

  const resetCandy = useCallback((candy: CandySymbol): number => {
    const reward = CANDY_REWARDS[candy];
    setState(prev => ({
      ...prev,
      progress: { ...prev.progress, [candy]: 0 },
      activeAnimation: null,
    }));
    setTimeout(checkPendingCompletions, 100);
    return reward;
  }, [checkPendingCompletions]);

  const resetRainbowProgress = useCallback((): number => {
    const prev = stateRef.current;
    const requiredHits = prev.rainbowLevel + 1;
    if (prev.rainbowHitsThisLevel < requiredHits) return 0;

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