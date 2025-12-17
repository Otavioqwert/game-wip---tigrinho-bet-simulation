
import React, { useState, useCallback, useMemo } from 'react';
import type { ActiveScratchCard } from '../../types';
import { SCRATCH_CARD_TIERS_V3 } from '../../constants';
import ScratchSlot from './ScratchSlot';

interface Props {
    card: ActiveScratchCard;
    onClose: () => void;
}

const ScratchCardModal: React.FC<Props> = ({ card, onClose }) => {
    const [revealedState, setRevealedState] = useState<boolean[]>(
        new Array(card.cells.length).fill(false)
    );
    const [forcedReveal, setForcedReveal] = useState(false);
    
    const tierData = SCRATCH_CARD_TIERS_V3[card.tier];
    
    const revealedCount = useMemo(() => revealedState.filter(v => v).length, [revealedState]);
    const progress = (revealedCount / card.cells.length) * 100;
    const allRevealed = revealedCount === card.cells.length;

    const handleReveal = useCallback((index: number) => {
        setRevealedState(prev => {
            if (prev[index]) return prev;
            const newState = [...prev];
            newState[index] = true;
            return newState;
        });
    }, []);

    const rasparTudo = () => {
        setForcedReveal(true);
        setRevealedState(new Array(card.cells.length).fill(true));
    };

    return (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] p-4 backdrop-blur-2xl animate-in fade-in duration-500">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-red-900/20 to-transparent pointer-events-none"></div>

            <div className="relative max-w-lg w-full flex flex-col gap-6">
                
                {/* Header do Ticket */}
                <div className="flex justify-between items-center px-2">
                    <div className="flex flex-col">
                        <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">
                            <span className="text-red-500">TICKET</span> {tierData.name}
                        </h2>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">Série Limitada</span>
                            <span className="text-[10px] font-mono text-white/30">#{Math.floor(Math.random()*1000000)}</span>
                        </div>
                    </div>
                    {!allRevealed && (
                        <button 
                            onClick={rasparTudo}
                            className="bg-yellow-500 text-black text-[11px] font-black px-4 py-2 rounded-xl hover:bg-yellow-400 active:scale-95 transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)]"
                        >
                            LIMPAR TUDO ⚡
                        </button>
                    )}
                </div>

                {/* Corpo do Ticket Estilizado */}
                <div className="bg-[#120e0e] border-2 border-white/10 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden group">
                    {/* Barra de Progresso Discreta */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-white/5 overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-red-600 via-yellow-500 to-green-500 transition-all duration-700 ease-out" 
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <div className={`grid ${card.cells.length <= 6 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-3 sm:grid-cols-4'} gap-4 mt-2`}>
                        {card.cells.map((cell, index) => (
                            <ScratchSlot
                                key={index}
                                prize={cell.prize}
                                isRevealed={revealedState[index]}
                                onReveal={() => handleReveal(index)}
                                isJackpot={cell.isJackpot}
                                revealAllTrigger={forcedReveal}
                            />
                        ))}
                    </div>

                    {/* Decoração Serrilhada lateral */}
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-black rounded-full border-r-2 border-white/10"></div>
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-black rounded-full border-l-2 border-white/10"></div>
                </div>

                {/* Área de Resgate Dinâmica */}
                <div className="min-h-[140px] flex flex-col items-center justify-center px-2">
                    {allRevealed ? (
                        <div className="w-full text-center animate-in zoom-in slide-in-from-bottom-8 duration-700 ease-out">
                            <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em] mb-3">Total a Receber</p>
                            <div className="bg-gradient-to-b from-white/10 to-transparent p-5 rounded-[2rem] border border-white/10 mb-6 backdrop-blur-sm">
                                <span className={`text-6xl font-black tabular-nums tracking-tighter ${card.totalWin > 0 ? 'text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.4)]' : 'text-gray-600'}`}>
                                    ${card.totalWin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-6 rounded-3xl shadow-[0_15px_40px_rgba(22,163,74,0.4)] active:scale-[0.98] transition-all text-2xl uppercase tracking-tighter flex items-center justify-center gap-3"
                            >
                                <span>COLETAR FORTUNA</span>
                                <span className="text-3xl">💰</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 opacity-60">
                            <div className="w-12 h-12 border-4 border-white/10 border-t-yellow-500 rounded-full animate-spin"></div>
                            <p className="text-white/50 font-black uppercase text-[10px] tracking-widest animate-pulse">
                                Raspe {card.cells.length - revealedCount} slots restantes...
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScratchCardModal;
