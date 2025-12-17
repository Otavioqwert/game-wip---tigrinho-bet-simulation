
import React, { useState, useEffect } from 'react';
import type { ActiveScratchCard } from '../../types';
import { SCRATCH_CARD_TIERS_V3 } from '../../constants';
import ScratchSlot from './ScratchSlot';

interface Props {
    card: ActiveScratchCard;
    onClose: () => void;
}

const ScratchCardModal: React.FC<Props> = ({ card, onClose }) => {
    // Estado para rastrear quais células foram raspadas individualmente
    const [revealedState, setRevealedState] = useState<boolean[]>(
        new Array(card.cells.length).fill(false)
    );
    
    const tierData = SCRATCH_CARD_TIERS_V3[card.tier];
    
    // Tailwind dynamic classes hack
    const getColorClass = (color: string, type: 'bg' | 'border' | 'text') => {
        const map: Record<string, string> = {
            gray: `${type}-gray-500`,
            amber: `${type}-amber-500`,
            slate: `${type}-slate-500`,
            yellow: `${type}-yellow-500`,
            cyan: `${type}-cyan-500`,
            blue: `${type}-blue-500`,
            zinc: `${type}-zinc-500`,
            purple: `${type}-purple-500`,
            indigo: `${type}-indigo-500`,
            pink: `${type}-pink-500`,
        };
        return map[color] || `${type}-gray-500`;
    };

    const getBgGradient = (color: string) => {
        const map: Record<string, string> = {
            gray: `from-gray-900 to-gray-950`,
            amber: `from-amber-900 to-amber-950`,
            slate: `from-slate-900 to-slate-950`,
            yellow: `from-yellow-900 to-yellow-950`,
            cyan: `from-cyan-900 to-cyan-950`,
            blue: `from-blue-900 to-blue-950`,
            zinc: `from-zinc-900 to-zinc-950`,
            purple: `from-purple-900 to-purple-950`,
            indigo: `from-indigo-900 to-indigo-950`,
            pink: `from-pink-900 to-pink-950`,
        };
        return map[color] || `from-gray-900 to-gray-950`;
    }
    
    const handleReveal = (index: number) => {
        setRevealedState(prev => {
            const newState = [...prev];
            newState[index] = true;
            return newState;
        });
    };
    
    const allRevealed = revealedState.every(r => r === true);
    const borderColor = getColorClass(tierData.theme.color, 'border');
    const bgGradient = getBgGradient(tierData.theme.color);
    
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm select-none">
            <div className={`bg-gradient-to-br ${bgGradient} border-4 ${borderColor} rounded-2xl p-6 max-w-lg w-full ${tierData.theme.glow || ''} shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto`}>
                {/* Header */}
                <div className="text-center mb-6 shrink-0">
                    <div className="text-5xl mb-2 filter drop-shadow-lg">{tierData.theme.icon}</div>
                    <h2 className="text-3xl font-black text-white mb-1 tracking-wide uppercase">
                        {tierData.name}
                    </h2>
                    <p className="text-gray-300 font-mono text-sm">
                        {allRevealed ? 'Raspadinha Completa!' : 'Use o mouse/dedo para raspar!'}
                    </p>
                </div>
                
                {/* Grid de células */}
                <div className={`grid ${card.cells.length <= 6 ? 'grid-cols-3' : card.cells.length <= 9 ? 'grid-cols-3' : 'grid-cols-4'} gap-4 mb-6 shrink-0`}>
                    {card.cells.map((cell, index) => (
                        <ScratchSlot
                            key={index}
                            prize={cell.prize}
                            isRevealed={revealedState[index]}
                            onReveal={() => handleReveal(index)}
                            isJackpot={cell.isJackpot}
                        />
                    ))}
                </div>
                
                {/* Total */}
                {allRevealed && (
                    <div className="bg-black/40 rounded-xl p-4 mb-4 text-center border border-white/10 animate-in fade-in zoom-in duration-300">
                        <p className="text-gray-300 mb-1 text-xs uppercase tracking-widest">Total Ganho</p>
                        <p className={`text-4xl font-black ${card.totalWin > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                            ${card.totalWin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                )}
                
                {/* Botão fechar */}
                {allRevealed && (
                    <button
                        onClick={onClose}
                        className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-bold py-4 rounded-xl hover:brightness-110 transition-all shadow-lg active:scale-95 text-lg animate-bounce"
                    >
                        COLOCAR NO BOLSO
                    </button>
                )}
            </div>
        </div>
    );
};

export default ScratchCardModal;
