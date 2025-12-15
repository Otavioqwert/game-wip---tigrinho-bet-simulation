
import React from 'react';
import type { ScratchCardTier, ScratchCardCell } from '../../types';
import ScratchSlot from './ScratchSlot';

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
            <div className="bg-gradient-to-br from-yellow-800 to-yellow-950 rounded-2xl p-6 shadow-2xl border-4 border-yellow-500 w-full max-w-sm text-white flex flex-col max-h-[90vh]">
                <h2 className="text-3xl font-bold text-yellow-300 neon-glow-text mb-2 text-center">Raspatinha {card.tier.name}</h2>
                <p className="text-center text-gray-300 text-sm mb-4">Raspe os campos para revelar prêmios!</p>
                
                <div className="grid grid-cols-3 gap-3 mb-5 flex-grow">
                    {card.grid.map((cell, index) => (
                        <ScratchSlot
                            key={index}
                            prize={cell.prize}
                            isRevealed={cell.revealed}
                            onReveal={() => revealSquare(index)}
                        />
                    ))}
                </div>

                <div className="mt-auto">
                    {isRevealed ? (
                        <div className="text-center animate-fade-in">
                            <p className="text-2xl font-bold mb-4">
                                {winnings > 0 ? `🎉 Você ganhou $${winnings.toFixed(2)}! 🎉` : '😕 Mais sorte da próxima vez...'}
                            </p>
                            <button onClick={closeCard} className="w-full py-3 px-4 font-bold text-stone-900 bg-yellow-400 rounded-lg hover:bg-yellow-300 transition-colors shadow-lg active:scale-95">
                                FECHAR E COLETAR
                            </button>
                        </div>
                    ) : (
                        <button onClick={revealAll} className="w-full py-3 px-4 font-bold text-stone-900 bg-white/90 rounded-lg hover:bg-white transition-colors shadow-lg active:scale-95">
                            ⚡ Raspar Tudo Automaticamente
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScratchCardModal;
