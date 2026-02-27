import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    SCRATCH_CARD_TIERS_V3,
    SCRATCH_INFLATION_CONFIG_V2,
    SCRATCH_CARD_UNLOCK_THRESHOLDS,
    LOTERICA_INJECTION_CONFIG_V2,
    SCRATCH_PRIZE_TIERS,
    SCRATCH_SCHEDULE_DELAY_MS,
    SCRATCH_QUEUE_MAX,
} from '../constants';
import type { ScratchCardMetrics, LotericaInjectionState, ActiveScratchCard } from '../types';

// ── Taxa de serviço ──────────────────────────────────────────
export const getServiceFeeRate = (tier: number): number =>
    0.10 * Math.pow(0.9, tier);

// ── Saque do pote ────────────────────────────────────────────
export const WITHDRAW_BASE_FEE   = 0.02;
export const WITHDRAW_FEE_STEP   = 0.005;
export const WITHDRAW_FEE_MAX    = 0.15;
export const WITHDRAW_EFFICIENCY = 0.15;
export const WITHDRAW_COOLDOWN   = 10 * 60 * 1000;

// ── Fila de agendamento ──────────────────────────────────────
export interface QueueEntry {
    tier: number;
    inflaOffset: number;  // quantas compras extras já foram precificadas neste slot
    deliverAt: number;    // timestamp em que esta raspadinha fica pronta
    potCost: number;      // custo em pote já descontado na hora de agendar
    serviceFee: number;   // taxa já descontada em bal na hora de agendar
}

interface ScratchCardLogicProps {
    bal: number;
    setBal: React.Dispatch<React.SetStateAction<number>>;
    unluckyPot: number;
    setUnluckyPot: React.Dispatch<React.SetStateAction<number>>;
    scratchMetrics: ScratchCardMetrics;
    setScratchMetrics: React.Dispatch<React.SetStateAction<ScratchCardMetrics>>;
    lotericaState: LotericaInjectionState;
    setLotericaState: React.Dispatch<React.SetStateAction<LotericaInjectionState>>;
    applyFinalGain: (baseAmount: number) => number;
    showMsg: (msg: string, duration?: number, isExtra?: boolean) => void;
}

export const useScratchCardLogic = (props: ScratchCardLogicProps) => {
    const {
        bal, setBal, unluckyPot, setUnluckyPot,
        scratchMetrics, setScratchMetrics,
        lotericaState, setLotericaState,
        applyFinalGain, showMsg
    } = props;

    const [activeScratchCard, setActiveScratchCard] = useState<ActiveScratchCard | null>(null);

    // ── estado de saque ──────────────────────────────────────
    const [withdrawCount,       setWithdrawCount]       = useState(0);
    const [lastWithdrawTime,    setLastWithdrawTime]    = useState(0);
    const [withdrawCooldownRem, setWithdrawCooldownRem] = useState(0);

    // ── fila de agendamento ──────────────────────────────────
    const [scheduleQueue, setScheduleQueue] = useState<QueueEntry[]>([]);
    const [scheduleQty,   setScheduleQty]   = useState<number[]>(Array(SCRATCH_CARD_TIERS_V3.length).fill(1));
    const processingRef = useRef<Set<number>>(new Set()); // evita duplo-disparo no tick

    // ── helpers ──────────────────────────────────────────────
    const formatTimeSec = (ms: number) => {
        if (ms < 60000)  return `${Math.ceil(ms / 1000)}s`;
        if (ms < 3600000) return `${Math.ceil(ms / 60000)}m`;
        return `${(ms / 3600000).toFixed(1)}h`;
    };

    const getTierLuckFactor = (tier: number) => {
        const linear = tier * 0.15;
        const scaled = tier > 0 ? Math.pow(tier / 9, 0.7) * 0.40 : 0;
        return 1 + linear + scaled;
    };

    // ── tick global (cooldowns + fila) ───────────────────────
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();

            // cooldowns normais
            setScratchMetrics(prev => ({
                ...prev,
                tierCooldownRemaining: prev.tierLastPurchase.map((lastTime, i) =>
                    Math.max(0, (SCRATCH_CARD_TIERS_V3[i]?.cooldown || 0) - (now - lastTime))
                )
            }));
            setLotericaState(prev => ({
                ...prev,
                injectionCooldownRemaining: prev.lastInjectionTime.map((lastTime, i) =>
                    Math.max(0, LOTERICA_INJECTION_CONFIG_V2[i].cooldown - (now - lastTime))
                )
            }));

            // cooldown de saque
            setWithdrawCooldownRem(prev =>
                Math.max(0, WITHDRAW_COOLDOWN - (now - lastWithdrawTime))
            );

            // processar fila: raspadinhas prontas
            setScheduleQueue(prev => {
                const ready = prev.filter(e => e.deliverAt <= now && !processingRef.current.has(e.deliverAt));
                if (ready.length === 0) return prev;

                ready.forEach(entry => {
                    processingRef.current.add(entry.deliverAt);
                    // sortear prêmios e creditar
                    const tierData = SCRATCH_CARD_TIERS_V3[entry.tier];
                    const baseSlotValue = tierData.cost / tierData.slots;
                    const luck = getTierLuckFactor(entry.tier);
                    let totalWin = 0;

                    for (let i = 0; i < tierData.slots; i++) {
                        const roll = Math.random();
                        let threshold = 0;
                        let mult = 0;
                        for (const p of SCRATCH_PRIZE_TIERS) {
                            if (entry.tier < p.minTier) continue;
                            const ep = p.prob * luck;
                            if (roll < threshold + ep) { mult = p.mult; break; }
                            threshold += ep;
                        }
                        if (mult > 0) totalWin += baseSlotValue * mult * tierData.efficiency;
                    }

                    const finalWin = applyFinalGain(totalWin);
                    if (finalWin > 0) {
                        setBal(b => b + finalWin);
                        showMsg(`🎫 Raspadinha ${tierData.name} entregue! +$${finalWin.toFixed(2)}`, 3000, true);
                    } else {
                        showMsg(`🎫 Raspadinha ${tierData.name} entregue — sem prêmio.`, 2000, true);
                    }

                    // registrar compra pra inflação
                    setScratchMetrics(m => ({
                        ...m,
                        tierPurchaseCounts: m.tierPurchaseCounts.map((c, i) =>
                            i === entry.tier ? c + 1 : c
                        ),
                        tierLastPurchase: m.tierLastPurchase.map((t, i) =>
                            i === entry.tier ? now : t
                        )
                    }));
                });

                return prev.filter(e => e.deliverAt > now);
            });
        }, 500);
        return () => clearInterval(interval);
    }, [setScratchMetrics, setLotericaState, lastWithdrawTime, applyFinalGain, setBal, showMsg]);

    // ── custo / RTP ──────────────────────────────────────────
    const calculateCurrentCost = useCallback((tier: number, extraPurchases = 0): number => {
        const baseCost = SCRATCH_CARD_TIERS_V3[tier].cost;
        const config   = SCRATCH_INFLATION_CONFIG_V2[tier];
        const purchases = scratchMetrics.tierPurchaseCounts[tier] + extraPurchases;
        if (purchases === 0) return baseCost;
        let cost = baseCost;
        for (let i = 0; i < purchases; i++) {
            cost = cost * (1 + config.percentPerPurchase);
            cost += baseCost * config.flatPerPurchase;
        }
        return Math.round(cost);
    }, [scratchMetrics.tierPurchaseCounts]);

    const calculateCurrentRTP = useCallback((tier: number): number => {
        const tierData = SCRATCH_CARD_TIERS_V3[tier];
        const currentCost = calculateCurrentCost(tier);
        const baseSlotValue = tierData.cost / tierData.slots;
        const luck = getTierLuckFactor(tier);
        let ev = 0;
        for (const p of SCRATCH_PRIZE_TIERS) {
            if (tier >= p.minTier)
                ev += (p.prob * luck) * (baseSlotValue * p.mult * tierData.efficiency);
        }
        const totalEV = ev * tierData.slots;
        return currentCost > 0 ? (totalEV / currentCost) * 100 : 0;
    }, [calculateCurrentCost]);

    // ── compra normal (1 raspadinha, sem agendamento) ─────────
    const buyScratchCard = useCallback((tier: number) => {
        const now = Date.now();
        const lastPurchase    = scratchMetrics.tierLastPurchase[tier];
        const cooldown        = SCRATCH_CARD_TIERS_V3[tier].cooldown;
        const unlockThreshold = SCRATCH_CARD_UNLOCK_THRESHOLDS[tier];
        const currentCost     = calculateCurrentCost(tier);
        const feeRate         = getServiceFeeRate(tier);
        const serviceFee      = Math.ceil(currentCost * feeRate);

        if (bal < unlockThreshold && scratchMetrics.tierPurchaseCounts[tier] === 0) {
            showMsg(`🔒 Bloqueado! Requer $${unlockThreshold.toLocaleString()}.`, 2000, true); return;
        }
        if (now - lastPurchase < cooldown) {
            showMsg('⏳ Aguarde o tempo de recarga!', 1500, true); return;
        }
        if (unluckyPot < currentCost) {
            showMsg(`🏺 Pote insuficiente! Requer ${currentCost.toFixed(0)}`, 1500, true); return;
        }
        if (bal < serviceFee) {
            showMsg(`💸 Taxa de serviço: $${serviceFee} (${(feeRate*100).toFixed(1)}%). Saldo insuficiente!`, 2000, true); return;
        }

        setUnluckyPot(p => p - currentCost);
        setBal(p => p - serviceFee);

        const tierData      = SCRATCH_CARD_TIERS_V3[tier];
        const baseSlotValue = tierData.cost / tierData.slots;
        const luck          = getTierLuckFactor(tier);
        const prizes: number[] = [];

        for (let i = 0; i < tierData.slots; i++) {
            const roll = Math.random();
            let threshold = 0, mult = 0;
            for (const p of SCRATCH_PRIZE_TIERS) {
                if (tier < p.minTier) continue;
                const ep = p.prob * luck;
                if (roll < threshold + ep) { mult = p.mult; break; }
                threshold += ep;
            }
            prizes.push(mult > 0 ? baseSlotValue * mult * tierData.efficiency : 0);
        }

        const finalWin = applyFinalGain(prizes.reduce((s, p) => s + p, 0));
        setActiveScratchCard({
            tier,
            cells: prizes.map(p => ({
                prize: applyFinalGain(p),
                revealed: false,
                isJackpot: p >= baseSlotValue * 50
            })),
            totalWin: finalWin,
            isRevealing: true
        });

        setScratchMetrics(prev => ({
            ...prev,
            tierPurchaseCounts: prev.tierPurchaseCounts.map((c, i) => i === tier ? c + 1 : c),
            tierLastPurchase:   prev.tierLastPurchase.map((t, i)   => i === tier ? now : t)
        }));

        showMsg(`🎫 Raspadinha comprada! Taxa: -$${serviceFee.toFixed(0)}`, 2000, true);
    }, [bal, unluckyPot, setUnluckyPot, setBal, calculateCurrentCost, scratchMetrics, setScratchMetrics, showMsg, applyFinalGain]);

    const finishScratchCard = useCallback(() => {
        if (!activeScratchCard) return;
        if (activeScratchCard.totalWin > 0) {
            setBal(p => p + activeScratchCard.totalWin);
            showMsg(`Ganhou $${activeScratchCard.totalWin.toFixed(2)}!`, 2000, true);
        }
        setActiveScratchCard(null);
    }, [activeScratchCard, setBal, showMsg]);

    // ── agendamento (2–10 raspadinhas) ───────────────────────
    const scheduleCards = useCallback((tier: number, qty: number) => {
        const now             = Date.now();
        const unlockThreshold = SCRATCH_CARD_UNLOCK_THRESHOLDS[tier];
        const clampedQty      = Math.max(2, Math.min(SCRATCH_QUEUE_MAX, qty));
        const delayMs         = SCRATCH_SCHEDULE_DELAY_MS[tier];
        const cooldown        = SCRATCH_CARD_TIERS_V3[tier].cooldown;
        const feeRate         = getServiceFeeRate(tier);

        if (bal < unlockThreshold && scratchMetrics.tierPurchaseCounts[tier] === 0) {
            showMsg(`🔒 Bloqueado! Requer $${unlockThreshold.toLocaleString()}.`, 2000, true); return;
        }

        // checar slots disponíveis na fila
        const inQueue = scheduleQueue.filter(e => e.tier === tier).length;
        if (inQueue + clampedQty > SCRATCH_QUEUE_MAX) {
            showMsg(`📋 Fila cheia! Máximo ${SCRATCH_QUEUE_MAX} por tier.`, 2000, true); return;
        }

        // calcular custo total de todas as raspadinhas (com inflação incremental)
        const basePurchases = scratchMetrics.tierPurchaseCounts[tier];
        let totalPot = 0;
        let totalFee = 0;
        const costs: number[] = [];

        for (let i = 0; i < clampedQty; i++) {
            const cost = calculateCurrentCost(tier, i); // +i níveis de inflação
            const fee  = Math.ceil(cost * feeRate);
            totalPot  += cost;
            totalFee  += fee;
            costs.push(cost);
        }

        if (unluckyPot < totalPot) {
            showMsg(`🏺 Pote insuficiente! Precisa de ${totalPot.toFixed(0)} no pote.`, 2000, true); return;
        }
        if (bal < totalFee) {
            showMsg(`💸 Taxa total: $${totalFee.toFixed(0)}. Saldo insuficiente!`, 2000, true); return;
        }

        // descontar tudo de uma vez
        setUnluckyPot(p => p - totalPot);
        setBal(p => p - totalFee);

        // montar entradas da fila
        // a 1ª entrega = cooldown normal; o delay de agendamento
        // é adicionado ao tempo de entrega de TODAS (pois é o custo de agendar em lote)
        const newEntries: QueueEntry[] = costs.map((cost, i) => ({
            tier,
            inflaOffset: i,
            deliverAt: now + cooldown + delayMs + i * 1000, // pequeno gap entre entregas
            potCost:   cost,
            serviceFee: Math.ceil(cost * feeRate),
        }));

        setScheduleQueue(prev => [...prev, ...newEntries]);

        showMsg(
            `📋 ${clampedQty}x ${SCRATCH_CARD_TIERS_V3[tier].name} agendadas! Entrega em ${formatTimeSec(cooldown + delayMs)}. Taxa: -$${totalFee.toFixed(0)}`,
            4000, true
        );
    }, [bal, unluckyPot, setUnluckyPot, setBal, calculateCurrentCost, scratchMetrics, scheduleQueue, showMsg]);

    // ── saque do pote ─────────────────────────────────────────
    const getCurrentWithdrawFee = useCallback((): number =>
        Math.min(WITHDRAW_BASE_FEE + withdrawCount * WITHDRAW_FEE_STEP, WITHDRAW_FEE_MAX)
    , [withdrawCount]);

    const withdrawUnluckyPot = useCallback((percentToWithdraw: number) => {
        if (unluckyPot <= 0) { showMsg('🏺 Pote vazio!', 1500, true); return; }
        if (withdrawCooldownRem > 0) {
            showMsg(`⏳ Saque disponível em ${formatTimeSec(withdrawCooldownRem)}`, 2000, true); return;
        }
        const pct       = Math.max(1, Math.min(100, percentToWithdraw));
        const potSlice  = unluckyPot * (pct / 100);
        const gross     = potSlice * WITHDRAW_EFFICIENCY;
        const fee       = gross * getCurrentWithdrawFee();
        const net       = gross - fee;
        if (net <= 0) { showMsg('❌ Valor muito baixo.', 1500, true); return; }
        setUnluckyPot(p => p - potSlice);
        setBal(p => p + net);
        setWithdrawCount(c => c + 1);
        setLastWithdrawTime(Date.now());
        showMsg(`💸 +$${net.toFixed(2)} (${pct}% do pote, taxa ${(getCurrentWithdrawFee()*100).toFixed(1)}%)`, 4000, true);
    }, [unluckyPot, withdrawCooldownRem, getCurrentWithdrawFee, setUnluckyPot, setBal, showMsg]);

    // ── lotérica ─────────────────────────────────────────────
    const injetarLoterica = useCallback((tier: number) => {
        const now         = Date.now();
        const config      = LOTERICA_INJECTION_CONFIG_V2[tier];
        const lastInj     = lotericaState.lastInjectionTime[tier];
        const currentCost = calculateCurrentCost(tier);
        const injCost     = Math.round(currentCost * config.costMultiplier);

        if (now - lastInj < config.cooldown) {
            showMsg(`⏳ Recarga em ${formatTimeSec(config.cooldown - (now - lastInj))}`, 2000, true); return;
        }
        if (bal < injCost) {
            showMsg(`💸 Precisa de $${injCost.toLocaleString()} para injetar!`, 2000, true); return;
        }
        setBal(p => p - injCost);
        const newCount = Math.floor(scratchMetrics.tierPurchaseCounts[tier] * (1 - config.reduction));
        setScratchMetrics(prev => ({
            ...prev,
            tierPurchaseCounts: prev.tierPurchaseCounts.map((c, i) => i === tier ? newCount : c)
        }));
        setLotericaState(prev => ({
            ...prev,
            lastInjectionTime: prev.lastInjectionTime.map((t, i) => i === tier ? now : t),
            totalInjections:   prev.totalInjections.map((c, i)   => i === tier ? c + 1 : c)
        }));
        const prev = scratchMetrics.tierPurchaseCounts[tier];
        showMsg(`✅ Lotérica! ${prev} → ${newCount} compras (-${(config.reduction*100).toFixed(0)}%)`, 3000, true);
    }, [bal, calculateCurrentCost, scratchMetrics, lotericaState, setBal, setScratchMetrics, setLotericaState, showMsg]);

    return {
        activeScratchCard,
        buyScratchCard,
        finishScratchCard,
        injetarLoterica,
        calculateCurrentCost,
        calculateCurrentRTP,
        // saque
        withdrawUnluckyPot,
        getCurrentWithdrawFee,
        withdrawCount,
        withdrawCooldownRem,
        // agendamento
        scheduleCards,
        scheduleQueue,
        scheduleQty,
        setScheduleQty,
    };
};
