import React, { useState } from 'react';
import {
    SCRATCH_CARD_TIERS_V3,
    LOTERICA_INJECTION_CONFIG_V2,
    SCRATCH_CARD_UNLOCK_THRESHOLDS,
    SCRATCH_PRIZE_TIERS,
    SCRATCH_SCHEDULE_DELAY_MS,
    SCRATCH_QUEUE_MAX,
} from '../../constants';
import {
    getServiceFeeRate,
    WITHDRAW_EFFICIENCY,
    WITHDRAW_FEE_MAX,
    WITHDRAW_COOLDOWN,
} from '../../hooks/useScratchCardLogic';
import type { ScratchCardMetrics, LotericaInjectionState, QueueEntry } from '../../hooks/useScratchCardLogic';
import type { ScratchCardMetrics as SCM, LotericaInjectionState as LIS } from '../../types';

interface ScratchCardShopProps {
    bal: number;
    unluckyPot: number;
    scratchMetrics: SCM;
    lotericaState: LIS;
    calculateCurrentCost: (tier: number, extra?: number) => number;
    calculateCurrentRTP: (tier: number) => number;
    buyScratchCard: (tier: number) => void;
    injetarLoterica: (tier: number) => void;
    // saque
    withdrawUnluckyPot: (pct: number) => void;
    getCurrentWithdrawFee: () => number;
    withdrawCount: number;
    withdrawCooldownRem: number;
    // agendamento
    scheduleCards: (tier: number, qty: number) => void;
    scheduleQueue: QueueEntry[];
    scheduleQty: number[];
    setScheduleQty: React.Dispatch<React.SetStateAction<number[]>>;
}

const ScratchCardShop: React.FC<ScratchCardShopProps> = (props) => {
    const {
        bal, unluckyPot, scratchMetrics, lotericaState,
        calculateCurrentCost, calculateCurrentRTP,
        buyScratchCard, injetarLoterica,
        withdrawUnluckyPot, getCurrentWithdrawFee, withdrawCount, withdrawCooldownRem,
        scheduleCards, scheduleQueue, scheduleQty, setScheduleQty,
    } = props;

    const [activeInfoCard, setActiveInfoCard] = useState<number | null>(null);
    const [withdrawPct, setWithdrawPct] = useState(20);

    const formatTime = (ms: number) => {
        if (ms < 60000)  return `${Math.ceil(ms / 1000)}s`;
        if (ms < 3600000) return `${Math.ceil(ms / 60000)}m`;
        return `${(ms / 3600000).toFixed(1)}h`;
    };

    const getTierTheme = (color: string) => {
        const themes: Record<string, { bg: string; border: string; text: string; shadow: string }> = {
            gray:   { bg: 'from-gray-700 to-gray-900',     border: 'border-gray-500',   text: 'text-gray-300',   shadow: 'shadow-gray-900/50' },
            amber:  { bg: 'from-orange-700 to-amber-900',  border: 'border-amber-500',  text: 'text-amber-300',  shadow: 'shadow-amber-900/50' },
            slate:  { bg: 'from-slate-500 to-slate-800',   border: 'border-slate-300',  text: 'text-slate-200',  shadow: 'shadow-slate-900/50' },
            yellow: { bg: 'from-yellow-500 to-yellow-800', border: 'border-yellow-400', text: 'text-yellow-100', shadow: 'shadow-yellow-500/30' },
            cyan:   { bg: 'from-cyan-600 to-cyan-900',     border: 'border-cyan-400',   text: 'text-cyan-100',   shadow: 'shadow-cyan-500/30' },
            blue:   { bg: 'from-blue-600 to-blue-900',     border: 'border-blue-400',   text: 'text-blue-100',   shadow: 'shadow-blue-500/30' },
            zinc:   { bg: 'from-zinc-500 to-zinc-800',     border: 'border-zinc-300',   text: 'text-zinc-100',   shadow: 'shadow-zinc-500/30' },
            purple: { bg: 'from-purple-600 to-purple-950', border: 'border-purple-400', text: 'text-purple-100', shadow: 'shadow-purple-500/30' },
            indigo: { bg: 'from-indigo-700 to-indigo-950', border: 'border-indigo-400', text: 'text-indigo-100', shadow: 'shadow-indigo-500/30' },
            pink:   { bg: 'from-pink-500 to-rose-900',     border: 'border-pink-400',   text: 'text-pink-100',   shadow: 'shadow-pink-500/30' },
        };
        return themes[color] || themes.gray;
    };

    // preview saque
    const currentFee  = getCurrentWithdrawFee();
    const nextFee     = Math.min(currentFee + 0.005, WITHDRAW_FEE_MAX);
    const potSlice    = unluckyPot * (withdrawPct / 100);
    const grossCash   = potSlice * WITHDRAW_EFFICIENCY;
    const feeAmount   = grossCash * currentFee;
    const netCash     = grossCash - feeAmount;
    const canWithdraw = withdrawCooldownRem === 0 && unluckyPot > 0;

    return (
        <div className="space-y-6 pb-10">

            {/* ── Header + Pote ── */}
            <div className="bg-gradient-to-br from-red-900 via-black to-red-950 p-5 rounded-2xl border-2 border-red-500/40 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10 text-8xl">🎫</div>
                <h2 className="text-3xl font-black text-white italic tracking-tighter mb-4 flex items-center gap-2">
                    <span className="bg-red-600 text-white px-2 rounded shadow-lg">LOTO</span> TIGRINHO
                </h2>

                <div className="flex items-center gap-4 bg-black/60 p-4 rounded-xl border border-red-500/20 backdrop-blur-sm mb-4">
                    <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-pulse">🏺</div>
                    <div>
                        <p className="text-[10px] text-red-400 uppercase font-black tracking-widest">Saldo de Azar Acumulado</p>
                        <p className="text-3xl font-black text-white tabular-nums">${unluckyPot.toFixed(2)}</p>
                    </div>
                </div>

                {/* ── Painel de Saque ── */}
                <div className="bg-black/50 border border-yellow-500/30 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-yellow-400 uppercase tracking-wider">💸 Converter Pote em Dinheiro</span>
                        <span className="text-[10px] text-gray-400">
                            Taxa: <span className="text-yellow-300 font-bold">{(currentFee * 100).toFixed(1)}%</span>
                            {withdrawCount > 0 && <span className="text-red-400 ml-1">(próx: {(nextFee * 100).toFixed(1)}%)</span>}
                        </span>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-gray-400">
                            <span>Sacar <span className="text-white font-bold">{withdrawPct}%</span> do pote</span>
                            <span className="text-gray-500">${potSlice.toFixed(0)} do pote</span>
                        </div>
                        <input type="range" min={1} max={100} value={withdrawPct}
                            onChange={e => setWithdrawPct(Number(e.target.value))}
                            className="w-full accent-yellow-400 cursor-pointer" />
                        <div className="flex gap-2">
                            {[10, 25, 50, 75, 100].map(pct => (
                                <button key={pct} onClick={() => setWithdrawPct(pct)}
                                    className={`flex-1 text-[10px] font-bold py-1 rounded transition-colors ${
                                        withdrawPct === pct ? 'bg-yellow-500 text-black' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                    }`}>{pct}%</button>
                            ))}
                        </div>
                    </div>
                    <div className="bg-black/40 rounded-lg p-3 text-xs space-y-1 border border-white/5">
                        <div className="flex justify-between text-gray-400">
                            <span>Bruto (15% do pote)</span>
                            <span className="text-green-300 font-bold">${grossCash.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                            <span>Taxa ({(currentFee * 100).toFixed(1)}%)</span>
                            <span className="text-red-400 font-bold">-${feeAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t border-white/10 pt-1">
                            <span className="font-bold text-white">Líquido</span>
                            <span className="font-black text-yellow-300">${netCash.toFixed(2)}</span>
                        </div>
                    </div>
                    {withdrawCooldownRem > 0 ? (
                        <div className="text-center text-xs text-gray-400 bg-black/30 py-2 rounded-lg">
                            ⏳ Próximo saque em <span className="text-yellow-300 font-bold">{formatTime(withdrawCooldownRem)}</span>
                        </div>
                    ) : (
                        <button onClick={() => withdrawUnluckyPot(withdrawPct)}
                            disabled={!canWithdraw || netCash <= 0}
                            className="w-full py-2.5 rounded-xl font-black text-sm uppercase bg-yellow-500 hover:bg-yellow-400 text-black active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                            Sacar ${netCash.toFixed(0)} líquido
                        </button>
                    )}
                    <p className="text-[9px] text-gray-600 text-center">
                        Cada saque +0.5% taxa (máx {(WITHDRAW_FEE_MAX * 100).toFixed(0)}%) • Cooldown {WITHDRAW_COOLDOWN / 60000}min
                    </p>
                </div>
            </div>

            {/* ── Grid de Cards ── */}
            <div className="grid grid-cols-1 gap-6">
                {SCRATCH_CARD_TIERS_V3.map((tier, index) => {
                    const purchases     = scratchMetrics.tierPurchaseCounts[index];
                    const currentCost   = calculateCurrentCost(index);
                    const currentRTP    = calculateCurrentRTP(index);
                    const expectedValue = (currentCost * currentRTP) / 100;
                    const feeRate       = getServiceFeeRate(index);
                    const serviceFee    = Math.ceil(currentCost * feeRate);
                    const unlockThreshold = SCRATCH_CARD_UNLOCK_THRESHOLDS[index];
                    const isLocked      = bal < unlockThreshold && purchases === 0;
                    const canAfford1    = unluckyPot >= currentCost && bal >= serviceFee;
                    const theme         = getTierTheme(tier.theme.color);
                    const cdRemaining   = scratchMetrics.tierCooldownRemaining[index] || 0;
                    const isInfoOpen    = activeInfoCard === index;
                    const injectionCd   = lotericaState.injectionCooldownRemaining[index] || 0;

                    // fila deste tier
                    const tierQueue     = scheduleQueue.filter(e => e.tier === index);
                    const inQueue       = tierQueue.length;
                    const nextDelivery  = tierQueue.length > 0 ? Math.min(...tierQueue.map(e => e.deliverAt)) : null;
                    const qty           = scheduleQty[index];

                    // custo total do agendamento (preview)
                    let previewPot = 0, previewFee = 0;
                    for (let i = 0; i < qty; i++) {
                        const c = calculateCurrentCost(index, i);
                        previewPot += c;
                        previewFee += Math.ceil(c * feeRate);
                    }
                    const canAffordQueue = unluckyPot >= previewPot && bal >= previewFee
                        && (inQueue + qty) <= SCRATCH_QUEUE_MAX;

                    const delayMs      = SCRATCH_SCHEDULE_DELAY_MS[index];
                    const deliveryTime = SCRATCH_CARD_TIERS_V3[index].cooldown + delayMs;

                    const linear         = index * 0.15;
                    const scaled         = index > 0 ? Math.pow(index / 9, 0.7) * 0.40 : 0;
                    const tierLuckFactor = 1 + linear + scaled;
                    const baseSlotValue  = tier.cost / tier.slots;
                    const availablePrizes = SCRATCH_PRIZE_TIERS.filter(p => index >= p.minTier);
                    const totalWinProb   = availablePrizes.reduce((s, p) => s + p.prob * tierLuckFactor, 0);
                    const lossProb       = Math.max(0, 1 - totalWinProb);

                    return (
                        <div key={index} className={`relative group ${isLocked && !isInfoOpen ? 'grayscale opacity-75' : ''}`}>
                            <div className={`relative bg-gradient-to-br ${theme.bg} ${theme.border} border-2 rounded-2xl p-4 shadow-xl transition-all duration-300 ${theme.shadow}`}>

                                <div className="absolute top-1/2 -left-2 w-4 h-8 bg-[#1a0e0e] rounded-full -translate-y-1/2 border-r-2 border-inherit" />
                                <div className="absolute top-1/2 -right-2 w-4 h-8 bg-[#1a0e0e] rounded-full -translate-y-1/2 border-l-2 border-inherit" />

                                {/* botão info */}
                                <button onClick={(e) => { e.stopPropagation(); setActiveInfoCard(isInfoOpen ? null : index); }}
                                    className="absolute top-2 right-2 z-50 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 transition-all hover:scale-110">
                                    {isInfoOpen ? '✕' : 'ℹ️'}
                                </button>

                                {/* overlay de stats */}
                                {isInfoOpen && (
                                    <div className="absolute inset-0 z-40 bg-black/95 rounded-2xl p-4 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200">
                                        <h4 className="text-white font-bold mb-1 uppercase tracking-wider text-sm">Estatísticas {tier.name}</h4>
                                        <div className="flex justify-between w-full px-4 mb-2 text-xs border-b border-white/10 pb-2">
                                            <span className="text-green-400">🍀 Sorte: x{tierLuckFactor.toFixed(2)}</span>
                                            <span className="text-blue-400">⚡ Eficiência: x{tier.efficiency.toFixed(3)}</span>
                                        </div>
                                        <div className="w-full overflow-y-auto max-h-[65%] custom-scrollbar">
                                            <table className="w-full text-xs text-left">
                                                <thead>
                                                    <tr className="border-b border-white/20 text-gray-500">
                                                        <th className="py-1">Prêmio</th>
                                                        <th className="py-1 text-right">Valor ($)</th>
                                                        <th className="py-1 text-right">Chance</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="font-mono">
                                                    {availablePrizes.map(p => {
                                                        const ap = p.prob * tierLuckFactor;
                                                        const em = p.mult * tier.efficiency;
                                                        const pv = baseSlotValue * em;
                                                        return (
                                                            <tr key={p.id} className="border-b border-white/5">
                                                                <td className={`py-1 font-bold ${p.color}`}>{p.name}</td>
                                                                <td className="py-1 text-right text-green-300">
                                                                    ${pv >= 1000 ? (pv/1000).toFixed(1)+'k' : pv.toFixed(0)}
                                                                    <span className="text-[9px] text-gray-500 ml-1">({em.toFixed(0)}x)</span>
                                                                </td>
                                                                <td className="py-1 text-right text-white">{(ap * 100).toFixed(4)}%</td>
                                                            </tr>
                                                        );
                                                    })}
                                                    <tr className="text-gray-500 italic">
                                                        <td className="py-1">Vazio</td>
                                                        <td className="py-1 text-right text-red-900">$0</td>
                                                        <td className="py-1 text-right">{(lossProb * 100).toFixed(4)}%</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                        <p className="text-[9px] text-gray-500 mt-2 text-center">*Prêmios fixos baseados no custo original: ${tier.cost.toLocaleString()}</p>
                                    </div>
                                )}

                                {/* cabeçalho do card */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-3">
                                        <div className="text-5xl bg-black/20 p-2 rounded-lg backdrop-blur-sm border border-white/10">{tier.theme.icon}</div>
                                        <div>
                                            <h3 className="text-xl font-black text-white uppercase italic leading-none">{tier.name}</h3>
                                            <span className="text-[10px] font-bold text-white/60 bg-black/30 px-2 py-0.5 rounded-full mt-1 inline-block uppercase">{tier.slots} CHANCES</span>
                                        </div>
                                    </div>
                                    <div className="text-right pr-8">
                                        <div className="text-[9px] font-black text-white/40 uppercase">Retorno Estimado</div>
                                        <div className="text-lg font-black text-green-300 tabular-nums">
                                            ~${expectedValue >= 1000 ? (expectedValue/1000).toFixed(1)+'k' : expectedValue.toFixed(0)}
                                        </div>
                                        <div className={`text-xs font-bold ${currentRTP > 100 ? 'text-yellow-400' : 'text-gray-400'}`}>({currentRTP.toFixed(0)}%)</div>
                                    </div>
                                </div>

                                {/* preço + compra normal */}
                                <div className="flex items-center gap-3 bg-black/40 p-3 rounded-xl border border-white/5 relative z-20">
                                    <div className="flex-grow">
                                        <span className="text-[9px] font-black text-red-400 uppercase block mb-0.5">Preço do Ticket</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xs font-bold text-red-400">🏺</span>
                                            <span className="text-2xl font-black text-white">{currentCost.toLocaleString()}</span>
                                        </div>
                                        <div className="text-[9px] text-yellow-400/80 mt-0.5">
                                            + <span className="font-bold">${serviceFee.toFixed(0)}</span> taxa ({(feeRate * 100).toFixed(1)}% em $)
                                        </div>
                                    </div>
                                    {cdRemaining > 0 ? (
                                        <div className="bg-gray-800/80 px-4 py-2 rounded-lg border border-white/5 font-mono text-xs text-yellow-500 font-bold">
                                            RECARGA: {formatTime(cdRemaining)}
                                        </div>
                                    ) : (
                                        <button onClick={() => buyScratchCard(index)}
                                            disabled={!canAfford1 || isLocked}
                                            className={`px-8 py-3 rounded-xl font-black uppercase text-sm shadow-lg transition-all ${
                                                isLocked ? 'bg-transparent text-transparent cursor-default'
                                                    : canAfford1 ? 'bg-white text-black hover:bg-yellow-400 active:scale-95'
                                                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                            }`}>
                                            {canAfford1 ? 'COMPRAR' : 'SEM SALDO'}
                                        </button>
                                    )}
                                </div>

                                {/* ── Painel de Agendamento ── */}
                                {!isLocked && (
                                    <div className="mt-3 bg-black/30 border border-white/10 rounded-xl p-3 space-y-2 relative z-20">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-white/60 uppercase tracking-wider">📋 Agendar em Lote</span>
                                            <span className="text-[9px] text-gray-500">
                                                entrega em {formatTime(deliveryTime)}
                                                {inQueue > 0 && <span className="text-orange-400 ml-1">({inQueue}/{SCRATCH_QUEUE_MAX} na fila)</span>}
                                            </span>
                                        </div>

                                        {/* seletor de quantidade */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setScheduleQty(q => q.map((v, i) => i === index ? Math.max(2, v - 1) : v))}
                                                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-black flex items-center justify-center transition-colors">−</button>
                                            <span className="flex-1 text-center text-white font-black tabular-nums">{qty}x</span>
                                            <button
                                                onClick={() => setScheduleQty(q => q.map((v, i) => i === index ? Math.min(SCRATCH_QUEUE_MAX - inQueue, v + 1) : v))}
                                                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-black flex items-center justify-center transition-colors">+</button>
                                            <div className="flex gap-1 ml-1">
                                                {[2, 5, 10].map(n => (
                                                    <button key={n}
                                                        onClick={() => setScheduleQty(q => q.map((v, i) => i === index ? Math.min(SCRATCH_QUEUE_MAX - inQueue, n) : v))}
                                                        className={`text-[9px] font-bold px-2 py-1 rounded transition-colors ${
                                                            qty === n ? 'bg-white/30 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                                        }`}>{n}x</button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* preview de custo */}
                                        <div className="flex justify-between text-[9px] text-gray-400 bg-black/20 px-2 py-1 rounded-lg">
                                            <span>🏺 {previewPot.toLocaleString()} pote + ${previewFee.toFixed(0)} taxa</span>
                                            <span className="text-orange-300 font-bold">
                                                +{qty - 1} nível{qty > 2 ? 's' : ''} inflação
                                            </span>
                                        </div>

                                        {/* fila ativa */}
                                        {inQueue > 0 && nextDelivery && (
                                            <div className="flex items-center gap-2 bg-orange-900/20 border border-orange-500/20 rounded-lg px-2 py-1">
                                                <span className="text-orange-400 text-sm">⏱</span>
                                                <span className="text-[9px] text-orange-300">
                                                    {inQueue} raspadinha{inQueue > 1 ? 's' : ''} na fila •
                                                    próxima em {formatTime(Math.max(0, nextDelivery - Date.now()))}
                                                </span>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => scheduleCards(index, qty)}
                                            disabled={!canAffordQueue || isLocked}
                                            className="w-full py-2 rounded-xl font-black text-xs uppercase transition-all bg-orange-600 hover:bg-orange-500 text-white active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
                                            {canAffordQueue ? `AGENDAR ${qty}x` : 'SALDO INSUFICIENTE'}
                                        </button>
                                    </div>
                                )}

                                {/* lotérica */}
                                {!isLocked && purchases >= 5 && (
                                    <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center relative z-20">
                                        <div className="text-[10px] text-white/50 font-bold uppercase">
                                            Estratégia: <span className="text-purple-400">Lotérica {lotericaState.totalInjections[index]}x</span>
                                        </div>
                                        {injectionCd > 0 ? (
                                            <span className="text-[10px] font-mono text-gray-500 font-bold bg-black/40 px-2 py-1 rounded">⏳ {formatTime(injectionCd)}</span>
                                        ) : (
                                            <button onClick={() => injetarLoterica(index)}
                                                className="text-[10px] font-black text-purple-300 hover:text-purple-100 transition-colors uppercase underline underline-offset-2">
                                                💉 Injetar (-{(LOTERICA_INJECTION_CONFIG_V2[index].reduction * 100).toFixed(0)}% inflação)
                                                <span className="block text-[9px] text-gray-400 no-underline">
                                                    ${(currentCost * LOTERICA_INJECTION_CONFIG_V2[index].costMultiplier).toLocaleString()}
                                                </span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

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
