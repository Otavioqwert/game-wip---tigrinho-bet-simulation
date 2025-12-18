
import React, { useState } from 'react';
import { 
    SCRATCH_CARD_TIERS_V3, 
    LOTERICA_INJECTION_COSTS, 
    LOTERICA_INJECTION_REDUCTIONS,
    SCRATCH_CARD_UNLOCK_THRESHOLDS,
    SCRATCH_PRIZE_TIERS
} from '../../constants';
import type { ScratchCardMetrics, LotericaInjectionState } from '../../types';

interface ScratchCardShopProps {
    bal: number;
    unluckyPot: number;
    scratchMetrics: ScratchCardMetrics;
    lotericaState: LotericaInjectionState;
    calculateCurrentCost: (tier: number) => number;
    calculateCurrentRTP: (tier: number) => number;
    buyScratchCard: (tier: number) => void;
    injetarLoterica: (tier: number) => void;
}

const ScratchCardShop: React.FC<ScratchCardShopProps> = (props) => {
    const { 
        bal, unluckyPot, scratchMetrics, lotericaState, 
        calculateCurrentCost, calculateCurrentRTP, 
        buyScratchCard, injetarLoterica
    } = props;

    const [activeInfoCard, setActiveInfoCard] = useState<number | null>(null);

    const formatTime = (ms: number) => {
        if (ms < 60000) return `${Math.ceil(ms / 1000)}s`;
        if (ms < 3600000) return `${Math.ceil(ms / 60000)}m`;
        return `${Math.ceil(ms / 3600000)}h`;
    };

    const getTierTheme = (color: string) => {
        const themes: Record<string, { bg: string, border: string, text: string, shadow: string }> = {
            gray: { bg: 'from-gray-700 to-gray-900', border: 'border-gray-500', text: 'text-gray-300', shadow: 'shadow-gray-900/50' },
            amber: { bg: 'from-orange-700 to-amber-900', border: 'border-amber-500', text: 'text-amber-300', shadow: 'shadow-amber-900/50' },
            slate: { bg: 'from-slate-500 to-slate-800', border: 'border-slate-300', text: 'text-slate-200', shadow: 'shadow-slate-900/50' },
            yellow: { bg: 'from-yellow-500 to-yellow-800', border: 'border-yellow-400', text: 'text-yellow-100', shadow: 'shadow-yellow-500/30' },
            cyan: { bg: 'from-cyan-600 to-cyan-900', border: 'border-cyan-400', text: 'text-cyan-100', shadow: 'shadow-cyan-500/30' },
            blue: { bg: 'from-blue-600 to-blue-900', border: 'border-blue-400', text: 'text-blue-100', shadow: 'shadow-blue-500/30' },
            zinc: { bg: 'from-zinc-500 to-zinc-800', border: 'border-zinc-300', text: 'text-zinc-100', shadow: 'shadow-zinc-500/30' },
            purple: { bg: 'from-purple-600 to-purple-950', border: 'border-purple-400', text: 'text-purple-100', shadow: 'shadow-purple-500/30' },
            indigo: { bg: 'from-indigo-700 to-indigo-950', border: 'border-indigo-400', text: 'text-indigo-100', shadow: 'shadow-indigo-500/30' },
            pink: { bg: 'from-pink-500 to-rose-900', border: 'border-pink-400', text: 'text-pink-100', shadow: 'shadow-pink-500/30' },
        };
        return themes[color] || themes.gray;
    };

    return (
        <div className="space-y-6 pb-10">
            {/* Header Dashboard */}
            <div className="bg-gradient-to-br from-red-900 via-black to-red-950 p-5 rounded-2xl border-2 border-red-500/40 shadow-2xl shadow-red-950/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10 text-8xl">🎫</div>
                <h2 className="text-3xl font-black text-white italic tracking-tighter mb-4 flex items-center gap-2">
                    <span className="bg-red-600 text-white px-2 rounded shadow-lg">LOTO</span> TIGRINHO
                </h2>
                
                <div className="flex items-center gap-4 bg-black/60 p-4 rounded-xl border border-red-500/20 backdrop-blur-sm">
                    <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-pulse">
                        🏺
                    </div>
                    <div>
                        <p className="text-[10px] text-red-400 uppercase font-black tracking-widest">Saldo de Azar Acumulado</p>
                        <p className="text-3xl font-black text-white tabular-nums">${unluckyPot.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Grid de Cards */}
            <div className="grid grid-cols-1 gap-6">
                {SCRATCH_CARD_TIERS_V3.map((tier, index) => {
                    const purchases = scratchMetrics.tierPurchaseCounts[index];
                    const currentCost = calculateCurrentCost(index);
                    const currentRTP = calculateCurrentRTP(index);
                    const unlockThreshold = SCRATCH_CARD_UNLOCK_THRESHOLDS[index];
                    const isLocked = bal < unlockThreshold && purchases === 0;
                    const canAfford = unluckyPot >= currentCost;
                    const theme = getTierTheme(tier.theme.color);
                    const cdRemaining = scratchMetrics.tierCooldownRemaining[index] || 0;
                    const isInfoOpen = activeInfoCard === index;

                    // Luck Factor: +20% chance per tier level
                    const tierLuckFactor = 1 + (index * 0.20);

                    // Filter prizes available for this tier
                    const availablePrizes = SCRATCH_PRIZE_TIERS.filter(p => index >= p.minTier);
                    
                    // Calculate ADJUSTED probabilities based on tier luck
                    const totalWinProb = availablePrizes.reduce((sum, p) => sum + (p.prob * tierLuckFactor), 0);
                    const lossProb = Math.max(0, 1 - totalWinProb);

                    return (
                        <div key={index} className={`relative group ${isLocked && !isInfoOpen ? 'grayscale opacity-75' : ''}`}>
                            {/* Visual de Ticket Físico */}
                            <div className={`relative bg-gradient-to-br ${theme.bg} ${theme.border} border-2 rounded-2xl p-4 shadow-xl transition-all duration-300 ${theme.shadow}`}>
                                
                                {/* Serrilhado lateral simulação */}
                                <div className="absolute top-1/2 -left-2 w-4 h-8 bg-[#1a0e0e] rounded-full -translate-y-1/2 border-r-2 border-inherit"></div>
                                <div className="absolute top-1/2 -right-2 w-4 h-8 bg-[#1a0e0e] rounded-full -translate-y-1/2 border-l-2 border-inherit"></div>

                                {/* INFO BUTTON (Always Accessible) */}
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setActiveInfoCard(isInfoOpen ? null : index); }}
                                    className="absolute top-2 right-2 z-50 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 transition-all hover:scale-110"
                                >
                                    {isInfoOpen ? '✕' : 'ℹ️'}
                                </button>

                                {/* PROBABILITY OVERLAY TABLE */}
                                {isInfoOpen && (
                                    <div className="absolute inset-0 z-40 bg-black/95 rounded-2xl p-4 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200">
                                        <h4 className="text-white font-bold mb-1 uppercase tracking-wider text-sm">Estatísticas {tier.name}</h4>
                                        <p className="text-xs text-green-400 font-bold mb-3">Sorte: +{((tierLuckFactor - 1) * 100).toFixed(0)}% | Eficiência: +{((tier.efficiency - 1) * 100).toFixed(0)}%</p>
                                        
                                        <div className="w-full overflow-y-auto max-h-[70%] custom-scrollbar">
                                            <table className="w-full text-xs text-left">
                                                <thead>
                                                    <tr className="border-b border-white/20 text-gray-500">
                                                        <th className="py-1">Prêmio</th>
                                                        <th className="py-1 text-right">Mult.</th>
                                                        <th className="py-1 text-right">Chance</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="font-mono">
                                                    {availablePrizes.map(p => {
                                                        const adjustedProb = p.prob * tierLuckFactor;
                                                        return (
                                                            <tr key={p.id} className="border-b border-white/5">
                                                                <td className={`py-1 font-bold ${p.color}`}>{p.name}</td>
                                                                <td className="py-1 text-right text-gray-300">{p.mult}x</td>
                                                                <td className="py-1 text-right text-white">{(adjustedProb * 100).toFixed(4)}%</td>
                                                            </tr>
                                                        );
                                                    })}
                                                    <tr className="text-gray-500 italic">
                                                        <td className="py-1">Vazio</td>
                                                        <td className="py-1 text-right">0x</td>
                                                        <td className="py-1 text-right">{(lossProb * 100).toFixed(4)}%</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                        <p className="text-[9px] text-gray-500 mt-2 text-center">
                                            *Chances aumentadas pelo Nível do Cartão.
                                        </p>
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-3">
                                        <div className="text-5xl bg-black/20 p-2 rounded-lg backdrop-blur-sm border border-white/10">{tier.theme.icon}</div>
                                        <div>
                                            <h3 className="text-xl font-black text-white uppercase italic leading-none">{tier.name}</h3>
                                            <span className="text-[10px] font-bold text-white/60 bg-black/30 px-2 py-0.5 rounded-full mt-1 inline-block uppercase">
                                                {tier.slots} CHANCES
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right pr-8"> {/* Padding Right for Info Button */}
                                        <div className="text-[9px] font-black text-white/40 uppercase">Retorno Estimado</div>
                                        <div className={`text-xl font-black ${currentRTP > 1000 ? 'text-green-400' : 'text-yellow-400'}`}>
                                            {currentRTP.toFixed(0)}%
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 bg-black/40 p-3 rounded-xl border border-white/5 relative z-20">
                                    <div className="flex-grow">
                                        <span className="text-[9px] font-black text-red-400 uppercase block mb-1">Preço do Ticket</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xs font-bold text-red-400">🏺</span>
                                            <span className="text-2xl font-black text-white">{currentCost.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    
                                    {cdRemaining > 0 ? (
                                        <div className="bg-gray-800/80 px-4 py-2 rounded-lg border border-white/5 font-mono text-xs text-yellow-500 font-bold">
                                            RECARGA: {formatTime(cdRemaining)}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => buyScratchCard(index)}
                                            disabled={!canAfford || isLocked}
                                            className={`px-8 py-3 rounded-xl font-black uppercase text-sm shadow-lg transition-all ${
                                                isLocked 
                                                ? 'bg-transparent text-transparent cursor-default' // Hide text if locked overlay exists, but keep layout
                                                : canAfford 
                                                    ? 'bg-white text-black hover:bg-yellow-400 active:scale-95' 
                                                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                            }`}
                                        >
                                            {canAfford ? 'COMPRAR' : 'SEM SALDO'}
                                        </button>
                                    )}
                                </div>

                                {/* Seção de Injeção (Unlock Advanced) */}
                                {!isLocked && purchases >= 5 && (
                                    <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center relative z-20">
                                        <div className="text-[10px] text-white/50 font-bold uppercase">
                                            Estratégia: <span className="text-purple-400">Lotérica {lotericaState.totalInjections[index]}x</span>
                                        </div>
                                        <button 
                                            onClick={() => injetarLoterica(index)}
                                            className="text-[10px] font-black text-purple-300 hover:text-purple-100 transition-colors uppercase underline underline-offset-2"
                                        >
                                            Injetar Capital (-{(LOTERICA_INJECTION_REDUCTIONS[index] * 100).toFixed(0)}% inflação)
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Overlay de Bloqueio - Agora abaixo do info modal (z-10 vs z-40) */}
                            {isLocked && !isInfoOpen && (
                                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 rounded-2xl backdrop-blur-[2px] border-2 border-dashed border-gray-600 pointer-events-none">
                                    <span className="text-4xl mb-2">🔒</span>
                                    <p className="text-[10px] font-black uppercase text-gray-400">Meta de Desbloqueio</p>
                                    <p className="text-xl font-black text-yellow-500">${unlockThreshold.toLocaleString()}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ScratchCardShop;
