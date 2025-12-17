
import React, { useMemo } from 'react';
import { 
    SCRATCH_CARD_TIERS_V3, 
    LOTERICA_INJECTION_COSTS, 
    LOTERICA_INJECTION_REDUCTIONS,
    SCRATCH_CARD_INFLATION_V3,
    SCRATCH_CARD_UNLOCK_THRESHOLDS
} from '../../constants';
import type { ScratchCardMetrics, LotericaInjectionState } from '../../types';

interface ScratchCardShopProps {
    bal: number;
    scratchMetrics: ScratchCardMetrics;
    lotericaState: LotericaInjectionState;
    calculateCurrentCost: (tier: number) => number;
    calculateCurrentRTP: (tier: number) => number;
    buyScratchCard: (tier: number) => void;
    injetarLoterica: (tier: number) => void;
    unluckyPot: number; // Added prop
}

const ScratchCardShop: React.FC<ScratchCardShopProps> = (props) => {
    const { 
        bal, scratchMetrics, lotericaState, 
        calculateCurrentCost, calculateCurrentRTP, 
        buyScratchCard, injetarLoterica, unluckyPot
    } = props;

    const formatTime = (ms: number) => {
        if (ms < 60000) return `${Math.ceil(ms / 1000)}s`;
        if (ms < 3600000) return `${Math.ceil(ms / 60000)}m`;
        return `${Math.ceil(ms / 3600000)}h`;
    };
    
    const getRTPColor = (rtp: number) => {
        if (rtp >= 2000) return 'text-purple-400 animate-pulse'; // Ultra High
        if (rtp >= 1000) return 'text-green-400';
        if (rtp >= 500) return 'text-yellow-400';
        if (rtp >= 200) return 'text-orange-400';
        return 'text-red-400';
    };

    const getBorderColor = (color: string) => {
        const map: Record<string, string> = {
            gray: 'border-gray-600', amber: 'border-amber-600', slate: 'border-slate-600',
            yellow: 'border-yellow-600', cyan: 'border-cyan-600', blue: 'border-blue-600',
            zinc: 'border-zinc-600', purple: 'border-purple-600', indigo: 'border-indigo-600',
            pink: 'border-pink-600',
        };
        return map[color] || 'border-gray-600';
    }

    // Calcula o total histórico gasto em raspadinhas (Soma de Progressão Aritmética)
    // Custo = Base + (Inflação * (k-1))
    const totalInvested = useMemo(() => {
        return SCRATCH_CARD_TIERS_V3.reduce((total, tier, index) => {
            const count = scratchMetrics.tierPurchaseCounts[index];
            if (count <= 0) return total;
            
            const base = tier.cost;
            const inflation = SCRATCH_CARD_INFLATION_V3[index];
            
            // Soma da PA: Sn = (n/2) * (2a1 + (n-1)r)
            // Onde a1 = base, r = inflation, n = count
            const sum = (count / 2) * (2 * base + (count - 1) * inflation);
            
            return total + sum;
        }, 0);
    }, [scratchMetrics.tierPurchaseCounts]);

    return (
        <div className="space-y-4">
            <div className="bg-black/30 p-4 rounded-lg text-center mb-4 border border-white/5">
                <h2 className="text-2xl font-bold text-white mb-2">🎫 Raspadinhas</h2>
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-red-900/20 p-2 rounded border border-red-500/30">
                        <p className="text-xs text-red-300 uppercase font-bold">Pote de Azar</p>
                        <p className="text-xl font-bold text-white">${unluckyPot.toFixed(2)}</p>
                    </div>
                    <div className="bg-blue-900/20 p-2 rounded border border-blue-500/30">
                        <p className="text-xs text-blue-300 uppercase font-bold">Total Investido</p>
                        <p className="text-xl font-bold text-white">${totalInvested.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    </div>
                </div>
                <p className="text-gray-400 text-xs mt-3 italic">
                    <span className="text-yellow-400 font-bold">Dica:</span> Cartões com mais slots (9 ou 12) têm vantagem matemática real!
                </p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
            {SCRATCH_CARD_TIERS_V3.map((tier, index) => {
                const purchases = scratchMetrics.tierPurchaseCounts[index];
                const currentCost = calculateCurrentCost(index);
                const currentRTP = calculateCurrentRTP(index);
                const baseCost = tier.cost;
                const inflation = currentCost - baseCost;
                const unlockThreshold = SCRATCH_CARD_UNLOCK_THRESHOLDS[index];
                
                // Tier is locked if current balance is below threshold AND user has never purchased it
                const isLocked = bal < unlockThreshold && purchases === 0;
                
                const cdRemaining = scratchMetrics.tierCooldownRemaining[index] || 0;
                const injectionCdRemaining = lotericaState.injectionCooldownRemaining[index] || 0;
                
                const injectionCost = currentCost * LOTERICA_INJECTION_COSTS[index];
                const injectionReduction = LOTERICA_INJECTION_REDUCTIONS[index];
                
                // Calculate hypothetical cost after injection for preview
                const purchasesAfter = Math.floor(purchases * (1 - injectionReduction));
                const newCostAfterInjection = baseCost + (SCRATCH_CARD_INFLATION_V3[index] * purchasesAfter);
                
                const borderColor = getBorderColor(tier.theme.color);

                return (
                    <div key={index} className={`border-2 ${borderColor} bg-black/40 rounded-xl p-4 relative overflow-hidden transition-all hover:bg-black/50 ${isLocked ? 'opacity-70 grayscale' : ''}`}>
                        {/* Background Tint */}
                        <div className={`absolute inset-0 bg-${tier.theme.color}-900/10 pointer-events-none`}></div>

                        {/* Lock Overlay */}
                        {isLocked && (
                            <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
                                <span className="text-4xl mb-2">🔒</span>
                                <h3 className="text-xl font-bold text-gray-300">Bloqueado</h3>
                                <p className="text-sm text-gray-400">Requer saldo de</p>
                                <p className="text-xl font-bold text-yellow-400">${unlockThreshold.toLocaleString()}</p>
                            </div>
                        )}

                        <div className="relative z-10">
                            {/* Header Row */}
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="text-4xl filter drop-shadow-md">{tier.theme.icon}</div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white leading-none">{tier.name}</h3>
                                        <p className="text-xs text-gray-400 mt-1 font-mono">
                                            {tier.slots} Slots 
                                            {tier.slots > 6 && <span className="text-green-400 font-bold ml-1">(Vantagem {tier.slots === 9 ? '1.5x' : '2x'})</span>}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right bg-black/40 px-3 py-1 rounded-lg border border-white/5">
                                    <div className={`text-xl font-black ${getRTPColor(currentRTP)}`}>
                                        {currentRTP.toFixed(0)}%
                                    </div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest">Retorno Real</div>
                                </div>
                            </div>
                            
                            {/* Info Stats */}
                            <div className="flex flex-wrap gap-2 mb-3 text-xs sm:text-sm">
                                <div className="bg-white/5 px-2 py-1 rounded text-gray-300">
                                    Base: <span className="font-bold text-white">${baseCost.toLocaleString()}</span>
                                </div>
                                <div className="bg-white/5 px-2 py-1 rounded text-gray-300">
                                    Inflação: <span className="font-bold text-red-400">+${inflation.toLocaleString()}</span>
                                </div>
                                <div className="bg-white/5 px-2 py-1 rounded text-gray-300">
                                    Compras: <span className="font-bold text-white">{purchases}</span>
                                </div>
                            </div>
                            
                            {/* Buy Button & Cost */}
                            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-4 bg-black/20 p-2 rounded-lg border border-white/5">
                                <div className="pl-2">
                                    <span className="text-xs text-gray-400 block">Custo Atual</span>
                                    <span className="text-2xl font-bold text-white">${currentCost.toLocaleString()}</span>
                                </div>
                                
                                {cdRemaining > 0 ? (
                                    <div className="flex-1 bg-gray-800 rounded-lg h-12 flex items-center justify-center border border-gray-700">
                                        <span className="text-gray-400 font-mono">⏳ {formatTime(cdRemaining)}</span>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => buyScratchCard(index)}
                                        disabled={bal < currentCost || isLocked}
                                        className={`flex-1 font-bold py-3 px-6 rounded-lg transition-all shadow-lg active:scale-95 ${
                                            bal >= currentCost && !isLocked
                                                ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/20' 
                                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                        }`}
                                    >
                                        COMPRAR
                                    </button>
                                )}
                            </div>
                            
                            {/* Injection Panel */}
                            {purchases >= 5 && (
                                <div className="mt-3 pt-3 border-t border-white/10">
                                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                                        <div className="text-xs text-gray-400 flex-1">
                                            <div className="flex items-center gap-1 mb-1">
                                                <span className="text-lg">🏪</span>
                                                <strong className="text-purple-300">Injeção na Lotérica</strong>
                                            </div>
                                            <p>Custo: <span className="text-red-300 font-mono">${injectionCost.toLocaleString()}</span></p>
                                            <p>Novo Preço: <span className="text-green-300 font-mono">${newCostAfterInjection.toLocaleString()}</span></p>
                                        </div>
                                        
                                        {injectionCdRemaining > 0 ? (
                                            <div className="px-4 py-2 bg-purple-900/20 border border-purple-500/30 rounded text-purple-300 text-xs font-mono whitespace-nowrap">
                                                Recarga: {formatTime(injectionCdRemaining)}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => injetarLoterica(index)}
                                                disabled={bal < injectionCost}
                                                className={`px-4 py-2 rounded text-xs font-bold border transition-colors ${
                                                    bal >= injectionCost
                                                        ? 'bg-purple-900/40 border-purple-500 text-purple-300 hover:bg-purple-800/60'
                                                        : 'bg-gray-800/50 border-gray-700 text-gray-500 cursor-not-allowed'
                                                }`}
                                            >
                                                INJETAR (-{(injectionReduction * 100).toFixed(0)}% INF)
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
            </div>
        </div>
    );
};

export default ScratchCardShop;
