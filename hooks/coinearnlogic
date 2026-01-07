import type { CoinFlipState } from './types';

// Inicializa o estado do jogo
export function inicializarCoinFlip(aposta: number, giros: number): CoinFlipState {
  return {
    isActive: true,
    flipsRemaining: giros,
    currentMultiplier: 1,
    currentBet: aposta,
    history: [],
    lastResult: null,
    isAnimating: false,
  };
}

// Calcula o ganho atual
export function calcularGanho(state: CoinFlipState): number {
  return state.currentBet * state.currentMultiplier;
}

// Processa um palpite
export function processarPalpite(
  state: CoinFlipState,
  guess: 'heads' | 'tails'
): CoinFlipState {
  const resultado: 'heads' | 'tails' = Math.random() < 0.5 ? 'heads' : 'tails';
  const acertou = resultado === guess;

  return {
    ...state,
    flipsRemaining: Math.max(state.flipsRemaining - 1, 0),
    lastResult: resultado,
    currentMultiplier: acertou ? state.currentMultiplier * 2 : 0,
    isAnimating: true,
    history: [...state.history, resultado],
  };
}

// Finaliza e retorna o ganho total
export function finalizarJogo(state: CoinFlipState): number {
  return calcularGanho(state);
}
