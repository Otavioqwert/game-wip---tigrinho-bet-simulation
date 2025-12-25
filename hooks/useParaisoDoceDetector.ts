import { useState, useCallback } from 'react';
import type { SymbolKey } from '../types';

// Detecta acertos de doces no grid 3x3
export interface CandyHit {
  symbol: '🍭' | '🍦' | '🍧';
  count: number;
}

export interface ParaisoDetectorState {
  isActive: boolean;
  lastHits: CandyHit[];
  totalHits: Record<'🍭' | '🍦' | '🍧', number>;
}

export const useParaisoDoceDetector = () => {
  const [state, setState] = useState<ParaisoDetectorState>({
    isActive: false,
    lastHits: [],
    totalHits: { '🍭': 0, '🍦': 0, '🍧': 0 },
  });

  // Ativa o detector quando compra o pacote
  const activate = useCallback(() => {
    setState({
      isActive: true,
      lastHits: [],
      totalHits: { '🍭': 0, '🍦': 0, '🍧': 0 },
    });
  }, []);

  // Desativa ao fim da febre
  const deactivate = useCallback(() => {
    setState(prev => ({ ...prev, isActive: false }));
  }, []);

  // Detecta doces em um grid de 9 símbolos (3x3)
  const detectCandyHits = useCallback((grid: SymbolKey[]): CandyHit[] => {
    if (!state.isActive || grid.length !== 9) return [];

    const hits: CandyHit[] = [];
    const counts: Record<string, number> = { '🍭': 0, '🍦': 0, '🍧': 0 };

    // Linhas que podem acertar
    const lines = [
      [0, 1, 2], // Top
      [3, 4, 5], // Mid
      [6, 7, 8], // Bottom
      [0, 3, 6], // Left
      [1, 4, 7], // Center
      [2, 5, 8], // Right
      [0, 4, 8], // Diagonal \
      [2, 4, 6], // Diagonal /
    ];

    for (const line of lines) {
      const syms = line.map(i => grid[i]);
      
      // Linha com 3 iguais?
      if (syms[0] === syms[1] && syms[1] === syms[2]) {
        const sym = syms[0];
        if (sym === '🍭' || sym === '🍦' || sym === '🍧') {
          counts[sym]++;
        }
      }
    }

    // Converte para array de hits
    (['\ud83c\udf6d', '\ud83c\udf66', '\ud83c\udf67'] as const).forEach(candy => {
      if (counts[candy] > 0) {
        hits.push({ symbol: candy, count: counts[candy] });
      }
    });

    // Atualiza estado
    if (hits.length > 0) {
      setState(prev => {
        const newTotals = { ...prev.totalHits };
        hits.forEach(h => {
          newTotals[h.symbol] += h.count;
        });
        return { ...prev, lastHits: hits, totalHits: newTotals };
      });
    }

    return hits;
  }, [state.isActive]);

  return {
    isActive: state.isActive,
    activate,
    deactivate,
    detectCandyHits,
    lastHits: state.lastHits,
    totalHits: state.totalHits,
  };
};
