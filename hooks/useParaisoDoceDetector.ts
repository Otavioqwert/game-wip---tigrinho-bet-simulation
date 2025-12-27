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
  // NEW: Track which candy/rainbow is animating
  activeAnimation: CandySymbol | 'rainbow' | null;
}

export const useParaisoDoceDetector = () => {
  const [state, setState] = useState<ParaisoDetectorState>({
    isActive: false,
    lastHits: [],
    totalHits: { '🍭': 0, '🍦': 0, '🍧': 0 },
    progress: { '🍭': 0, '🍦': 0, '🍧': 0 },
    rainbowTriggered: false,
    activeAnimation: null,
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
    });
  }, []);

  const deactivate = useCallback(() => {
    setState(prev => ({ ...prev, isActive: false, activeAnimation: null }));
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

    // Atualiza progresso e detecta completações
    setState(prev => {
      const newTotals = { ...prev.totalHits };
      const newProgress = { ...prev.progress };
      let triggerAnimation: CandySymbol | 'rainbow' | null = prev.activeAnimation;
      
      hits.forEach(h => {
        newTotals[h.symbol] += h.count;
        const oldProg = newProgress[h.symbol];
        newProgress[h.symbol] = Math.min(3, oldProg + h.count);
        
        // Individual candy completion (NOVO)
        if (newProgress[h.symbol] === 3 && oldProg < 3 && !prev.activeAnimation) {
          triggerAnimation = h.symbol;
        }
      });

      // Rainbow completion (prioridade sobre individual)
      const allComplete = candies.every(c => newProgress[c] === 3);
      const wasComplete = candies.every(c => prev.progress[c] === 3);
      
      if (allComplete && !wasComplete) {
        triggerAnimation = 'rainbow';
      }

      return { 
        ...prev, 
        lastHits: hits, 
        totalHits: newTotals,
        progress: newProgress,
        rainbowTriggered: allComplete,
        activeAnimation: triggerAnimation,
      };
    });

    return hits;
  }, []);

  // Reset individual candy
  const resetCandy = useCallback((candy: CandySymbol) => {
    setState(prev => ({
      ...prev,
      progress: { ...prev.progress, [candy]: 0 },
      activeAnimation: null,
    }));
  }, []);

  // Reset all (for rainbow)
  const resetRainbowProgress = useCallback(() => {
    setState(prev => ({
      ...prev,
      progress: { '🍭': 0, '🍦': 0, '🍧': 0 },
      rainbowTriggered: false,
      activeAnimation: null,
    }));
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
    activate,
    deactivate,
    detectCandyHits,
    resetCandy,
    resetRainbowProgress,
  };
};
