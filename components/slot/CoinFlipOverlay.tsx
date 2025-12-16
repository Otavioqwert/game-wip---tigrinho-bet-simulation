
import React from 'react';
import type { CoinFlipState } from '../../types';

interface CoinFlipOverlayProps {
    coinState: CoinFlipState;
    onGuess: (guess: 'heads' | 'tails') => void;
    onComplete: () => void;
}

const CoinFlipOverlay: React.FC<CoinFlipOverlayProps> = ({ coinState, onGuess, onComplete }) => {
    const { flipsRemaining, currentMultiplier, currentBet, isAnimating, lastResult } = coinState;

    const currentWin = currentBet * currentMultiplier;
    const isGameOver = flipsRemaining === 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-gradient-to-b from-gray-800 to-black p-6 rounded-3xl border-4 border-slate-400 shadow-[0_0_50px_rgba(255,255,255,0.2)] text-center max-w-sm w-full relative overflow-hidden">
                
                {/* Header Info */}
                <div className="mb-6">
                    <h2 className="text-2xl font-black text-slate-200 uppercase tracking-widest mb-1">Cara ou Coroa</h2>
                    <p className="text-gray-400 text-sm">Adivinhe para DOBRAR!</p>
                </div>

                {/* Coin Visual */}
                <div className="h-48 flex items-center justify-center mb-6 perspective-1000">
                    <div className={`w-32 h-32 rounded-full relative transform-style-3d transition-transform duration-[2000ms] ${isAnimating ? 'animate-flip' : ''}`}>
                        {/* Front (Heads) */}
                        <div className={`absolute inset-0 bg-gradient-to-br from-slate-300 to-slate-500 rounded-full flex items-center justify-center border-4 border-slate-200 shadow-xl backface-hidden ${lastResult === 'tails' && !isAnimating ? 'hidden' : ''}`}>
                             <span className="text-6xl grayscale">🤴</span>
                        </div>
                        {/* Back (Tails) - Simulated by swapping content if not using true 3d CSS due to Tailwind limits, or just using animation state */}
                         <div className={`absolute inset-0 bg-gradient-to-br from-slate-300 to-slate-500 rounded-full flex items-center justify-center border-4 border-slate-200 shadow-xl backface-hidden ${lastResult !== 'tails' && !isAnimating ? 'hidden' : ''}`}>
                             <span className="text-6xl grayscale">🦅</span>
                        </div>
                    </div>
                </div>

                {/* Status / Multiplier */}
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-600 mb-6">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-400 text-xs">Aposta Base</span>
                        <span className="text-white font-bold">${currentBet.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-400 text-xs">Multiplicador Atual</span>
                        <span className="text-yellow-400 font-bold text-xl">{currentMultiplier}x</span>
                    </div>
                    <div className="border-t border-slate-700 mt-2 pt-2 flex justify-between items-center">
                        <span className="text-gray-300">Ganho Potencial</span>
                        <span className="text-green-400 font-black text-2xl">${currentWin.toFixed(2)}</span>
                    </div>
                </div>

                {/* Controls */}
                {!isGameOver ? (
                    <div className="space-y-3">
                         <div className="text-sm text-slate-300 mb-2">
                            Giros Restantes: <span className="font-bold text-white">{flipsRemaining}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => onGuess('heads')}
                                disabled={isAnimating}
                                className="py-4 bg-slate-200 text-slate-900 rounded-xl font-bold shadow-[0_4px_0_#94a3b8] active:translate-y-[4px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                CARA 🤴
                            </button>
                            <button 
                                onClick={() => onGuess('tails')}
                                disabled={isAnimating}
                                className="py-4 bg-slate-200 text-slate-900 rounded-xl font-bold shadow-[0_4px_0_#94a3b8] active:translate-y-[4px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                COROA 🦅
                            </button>
                        </div>
                        
                        {/* Botão de Saída Antecipada */}
                        <button
                            onClick={onComplete}
                            disabled={isAnimating}
                            className="w-full py-3 mt-4 bg-yellow-600/80 hover:bg-yellow-500 text-white rounded-xl font-bold text-sm border border-yellow-400/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            {currentMultiplier > 0 
                                ? `💰 PARAR E RESGATAR $${currentWin.toFixed(2)}` 
                                : '🚪 SAIR AGORA'}
                        </button>
                    </div>
                ) : (
                    <div>
                         <div className="mb-4">
                            {currentMultiplier > 0 ? (
                                <p className="text-green-400 font-bold text-lg animate-pulse">🎉 PARABÉNS! 🎉</p>
                            ) : (
                                <p className="text-red-400 font-bold text-lg">💔 QUE PENA! 💔</p>
                            )}
                        </div>
                        <button 
                            onClick={onComplete}
                            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg hover:brightness-110 active:scale-95 transition-all"
                        >
                            {currentMultiplier > 0 ? 'COLETAR GANHOS' : 'FECHAR'}
                        </button>
                    </div>
                )}
            </div>
            
            <style>{`
                .perspective-1000 { perspective: 1000px; }
                .transform-style-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                @keyframes flipCoin {
                    0% { transform: rotateY(0); }
                    100% { transform: rotateY(1800deg); }
                }
                .animate-flip {
                    animation: flipCoin 2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default CoinFlipOverlay;
