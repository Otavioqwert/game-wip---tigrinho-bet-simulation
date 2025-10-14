
import React from 'react';
import type { ScratchCardTier, ScratchCardCell } from '../../types';

interface ScratchCardModalProps {
    card: { tier: ScratchCardTier, grid: ScratchCardCell[] };
    winnings: number | null;
    revealSquare: (index: number) => void;
    revealAll: () => void;
    closeCard: () => void;
}

const ScratchCardModal: React.FC<ScratchCardModalProps> = ({ card, winnings, revealSquare, revealAll, closeCard }) => {
    const isRevealed = winnings !== null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-yellow-800 to-yellow-950 rounded-2xl p-6 shadow-2xl border-4 border-yellow-500 w-full max-w-sm text-white">
                <h2 className="text-3xl font-bold text-yellow-300 neon-glow-text mb-4 text-center">Raspatinha {card.tier.name}</h2>
                <div className="grid grid-cols-3 gap-3 mb-5">
                    {card.grid.map((cell, index) => (
                        <button
                            key={index}
                            onClick={() => revealSquare(index)}
                            disabled={cell.revealed || isRevealed}
                            className={`aspect-square rounded-lg transition-all duration-300 flex items-center justify-center text-xl font-bold
                            ${cell.revealed
                                ? 'bg-black/40 text-yellow-300'
                                : 'bg-yellow-500 text-stone-900 hover:scale-105 cursor-pointer'
                            }`}
                        >
                            {cell.revealed ? (cell.prize > 0 ? `$${cell.prize.toFixed(2)}` : '❌') : '❔'}
                        </button>
                    ))}
                </div>
                {isRevealed ? (
                    <div className="text-center">
                        <p className="text-2xl font-bold mb-4">
                            {winnings > 0 ? `🎉 Você ganhou $${winnings.toFixed(2)}! 🎉` : '😕 Mais sorte da próxima vez...'}
                        </p>
                        <button onClick={closeCard} className="w-full py-3 px-4 font-bold text-stone-900 bg-yellow-400 rounded-lg hover:bg-yellow-300 transition-colors">
                            OK
                        </button>
                    </div>
                ) : (
                    <button onClick={revealAll} className="w-full py-3 px-4 font-bold text-stone-900 bg-yellow-400 rounded-lg hover:bg-yellow-300 transition-colors">
                        Raspar Tudo
                    </button>
                )}
            </div>
        </div>
    );
};

export default ScratchCardModal;
