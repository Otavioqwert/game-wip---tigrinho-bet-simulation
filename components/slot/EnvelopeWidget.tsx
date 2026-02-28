import React, { useState } from 'react';
import { SCRATCH_CARD_TIERS_V3 } from '../../constants';
import type { ScratchCardInventory } from '../../types';

interface EnvelopeWidgetProps {
    cooldownRemaining: number;
    fmtCooldown: (ms: number) => string;
    openEnvelope: () => void;
    scratchCardInventory: ScratchCardInventory;
    totalOpened: number;
}

const EnvelopeWidget: React.FC<EnvelopeWidgetProps> = ({
    cooldownRemaining,
    fmtCooldown,
    openEnvelope,
    scratchCardInventory,
    totalOpened,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const isReady = cooldownRemaining <= 0;
    const totalCards = scratchCardInventory.reduce((s, n) => s + n, 0);

    return (
        <>
            {/* Botao lateral esquerdo - espelho do ProbabilityWidget */}
            <button
                onClick={() => setIsOpen(true)}
                className="absolute -left-12 top-4 w-10 h-10 bg-yellow-900/80 hover:bg-yellow-800 border-2 border-yellow-500 rounded-lg shadow-lg flex flex-col items-center justify-center transition-all active:scale-95 z-20 group backdrop-blur-sm"
                title="Envelopes e Raspadinhas"
            >
                <span className="text-lg leading-none group-hover:scale-110 transition-transform">
                    {isReady ? '\uD83D\uDCEC' : '\u23F3'}
                </span>
                {totalCards > 0 && (
                    <span className="text-[9px] font-black text-yellow-300 leading-none">{totalCards}</span>
                )}
            </button>

            {/* Modal */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="bg-gradient-to-br from-slate-900 to-black border-4 border-yellow-600 rounded-2xl max-w-sm w-full p-6 shadow-[0_0_50px_rgba(202,138,4,0.3)] flex flex-col gap-4 relative animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold transition-colors"
                        >
                            &times;
                        </button>

                        {/* Header */}
                        <div className="text-center">
                            <div className="text-5xl mb-1">{isReady ? '\uD83D\uDCEC' : '\u23F3'}</div>
                            <h2 className="text-xl font-black text-yellow-400">Envelopes</h2>
                            <p className="text-xs text-gray-400 mt-1">
                                Abra um envelope a cada 2 minutos e receba raspadinhas no inventario.
                            </p>
                        </div>

                        {/* Botao de abrir */}
                        <button
                            onClick={() => { openEnvelope(); if (isReady) setIsOpen(false); }}
                            disabled={!isReady}
                            className={`w-full py-4 rounded-xl font-black text-lg shadow-lg transition-all active:scale-95 ${
                                isReady
                                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black shadow-yellow-500/40'
                                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            {isReady
                                ? '\uD83D\uDCEC Abrir Envelope!'
                                : `\u23F3 ${fmtCooldown(cooldownRemaining)}`}
                        </button>

                        {/* Inventario de cartas */}
                        <div className="bg-black/40 rounded-xl p-3 border border-white/10">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Suas Raspadinhas</span>
                                <span className="text-xs text-yellow-400 font-bold">{totalCards} cartas</span>
                            </div>

                            {totalCards === 0 ? (
                                <p className="text-center text-gray-500 text-sm py-2 italic">
                                    Nenhuma carta \u2014 abra um envelope!
                                </p>
                            ) : (
                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                    {scratchCardInventory.map((qty, tier) => {
                                        if (qty === 0) return null;
                                        const t = SCRATCH_CARD_TIERS_V3[tier];
                                        return (
                                            <div
                                                key={tier}
                                                className="flex justify-between items-center bg-white/5 rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors"
                                            >
                                                <span className="text-sm font-bold">
                                                    {t.theme.icon} {t.name}
                                                </span>
                                                <span className="text-yellow-300 font-black text-sm">
                                                    x{qty}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Rodape */}
                        <p className="text-center text-[10px] text-gray-600">
                            {totalOpened} envelopes abertos no total
                        </p>

                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-full py-3 bg-yellow-700 hover:bg-yellow-600 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
                        >
                            FECHAR
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default EnvelopeWidget;
