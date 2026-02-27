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

// ── Tipos de agendamento ─────────────────────────────────

// Um slot agendado individual dentro da série
export interface ScheduledSlot {
    tier: number;
    inflaOffset: number;   // nível de inflação aplicado na precificação
    deliverAt: number;     // timestamp de entrega
    processed: boolean;    // já foi resolvido?
}

// Série ativa por tier (1 por vez)
export interface ScheduleSeries {
    tier: number;
    slots: ScheduledSlot[];
    seriesEndsAt: number;  // timestamp da última entrega da série
    totalQty: number;
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

    // ── séries agendadas (1 por tier) ────────────────────────
    // null = tier livre para novo agendamento
    const [scheduleSeries, setScheduleSeries] = useState<(ScheduleSeries | null)[]>(
        Array(SCRATCH_CARD_TIERS_V3.length).fill(null)
    );
    const [scheduleQty, setScheduleQty] = useState<number[]>(
        Array(SCRATCH_CARD_TIERS_V3.length).fill(2)
    );
    const processingRef = useRef<Set<string>>(new Set()); // chave: `tier-deliverAt`

    // ── helpers ──────────────────────────────────────────────
    const formatTimeSec = (ms: number) => {
        if (ms <= 0)      return '0s';
        if (ms < 60000)   return `${Math.ceil(ms / 1000)}s`;
        if (ms < 3600000) return `${Math.ceil(ms / 60000)}m`;
        return `${(ms / 3600000).toFixed(1)}h`;
    };

    const getTierLuckFactor = (tier: number) => {
        const linear = tier * 0.15;
        const scaled = tier > 0 ? Math.pow(tier / 9, 0.7) * 0.40 : 0;
        return 1 + linear + scaled;
    };

    const rollScratchCard = useCallback((tier: number): number => {
        const tierData      = SCRATCH_CARD_TIERS_V3[tier];
        const baseSlotValue = tierData.cost / tierData.slots;
        const luck          = getTierLuckFactor(tier);
        let totalWin = 0;
        for (let i = 0; i < tierData.slots; i++) {
            const roll = Math.random();
            let threshold = 0, mult = 0;
            for (const p of SCRATCH_PRIZE_TIERS) {
                if (tier < p.minTier) continue;
                const ep = p.prob * luck;
                if (roll < threshold + ep) { mult = p.mult; break; }
                threshold += ep;
            }
            if (mult > 0) totalWin += baseSlotValue * mult * tierData.efficiency;
        }
        return applyFinalGain(totalWin);
    }, [applyFinalGain]);

    // ── tick global ──────────────────────────────────────────
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();

            // cooldowns normais de compra avulsa
            setScratchMetrics(prev => ({
                ...prev,
                tierCooldownRemaining: prev.tierLastPurchase.map((lastTime, i) =>
                    Math.max(0, (SCRATCH_CARD_TIERS_V3[i]?.cooldown || 0) - (now - lastTime))
                )
            }));

            // cooldowns de lotérica
            setLotericaState(prev => ({
                ...prev,
                injectionCooldownRemaining: prev.lastInjectionTime.map((lastTime, i) =>
                    Math.max(0, LOTERICA_INJECTION_CONFIG_V2[i].cooldown - (now - lastTime))
                )
            }));

            // cooldown de saque
            setWithdrawCooldownRem(
                prev => Math.max(0, WITHDRAW_COOLDOWN - (now - lastWithdrawTime))
            );

            // processar séries: entregar slots prontos
            setScheduleSeries(prev => {
                let changed = false;
                const next = prev.map(series => {
                    if (!series) return null;

                    let seriesChanged = false;
                    const updatedSlots = series.slots.map(slot => {
                        if (slot.processed || slot.deliverAt > now) return slot;
                        const key = `${slot.tier}-${slot.deliverAt}`;
                        if (processingRef.current.has(key)) return slot;
                        processingRef.current.add(key);

                        // sortear e creditar
                        const win = rollScratchCard(slot.tier);
                        if (win > 0) {
                            setBal(b => b + win);
                            showMsg(
                                `🎫 ${SCRATCH_CARD_TIERS_V3[slot.tier].name} entregue! +$${win.toFixed(2)}`,
                                3000, true
                            );
                        } else {
                            showMsg(
                                `🎫 ${SCRATCH_CARD_TIERS_V3[slot.tier].name} entregue — sem prêmio.`,
                                2000, true
                            );
                        }

                        // conta como compra para inflação
                        setScratchMetrics(m => ({
                            ...m,
                            tierPurchaseCounts: m.tierPurchaseCounts.map((c, i) =>
                                i === slot.tier ? c + 1 : c
                            ),
                            tierLastPurchase: m.tierLastPurchase.map((t, i) =>
                                i === slot.tier ? now : t
                            ),
                        }));

                        seriesChanged = true;
                        return { ...slot, processed: true };
                    });

                    if (seriesChanged) changed = true;

                    // série concluída quando todos os slots foram processados
                    const allDone = updatedSlots.every(s => s.processed);
                    if (allDone) {
                        changed = true;
                        return null; // libera o slot de agendamento do tier
                    }

                    return seriesChanged ? { ...series, slots: updatedSlots } : series;
                });

                return changed ? next : prev;
            });
        }, 500);

        return () => clearInterval(interval);
    }, [
        setScratchMetrics, setLotericaState,
        lastWithdrawTime, rollScratchCard,
        setBal, showMsg,
    ]);

    // ── custo / RTP ──────────────────────────────────────────
    const calculateCurrentCost = useCallback((tier: number, extraPurchases = 0): number => {
        const baseCost  = SCRATCH_CARD_TIERS_V3[tier].cost;
        const config    = SCRATCH_INFLATION_CONFIG_V2[tier];
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
        const tierData      = SCRATCH_CARD_TIERS_V3[tier];
        const currentCost   = calculateCurrentCost(tier);
        const baseSlotValue = tierData.cost / tierData.slots;
        const luck          = getTierLuckFactor(tier);
        let ev = 0;
        for (const p of SCRATCH_PRIZE_TIERS) {
            if (tier >= p.minTier)
                ev += (p.prob * luck) * (baseSlotValue * p.mult * tierData.efficiency);
        }
        return currentCost > 0 ? (ev * tierData.slots / currentCost) * 100 : 0;
    }, [calculateCurrentCost]);

    // ── compra normal (avulsa, não bloqueia agendamento) ──────
    const buyScratchCard = useCallback((tier: number) => {
        const now             = Date.now();
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
            showMsg(`💸 Taxa: $${serviceFee}. Saldo insuficiente!`, 2000, true); return;
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

        const totalWin = prizes.reduce((s, p) => s + p, 0);
        const finalWin = applyFinalGain(totalWin);

        setActiveScratchCard({
            tier,
            cells: prizes.map(p => ({
                prize: applyFinalGain(p),
                revealed: false,
                isJackpot: p >= baseSlotValue * 50,
            })),
            totalWin: finalWin,
            isRevealing: true,
        });

        setScratchMetrics(prev => ({
            ...prev,
            tierPurchaseCounts: prev.tierPurchaseCounts.map((c, i) => i === tier ? c + 1 : c),
            tierLastPurchase:   prev.tierLastPurchase.map((t, i)   => i === tier ? now  : t),
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

    // ── agendamento de série (2–10, 1 série ativa por tier) ────
    const scheduleCards = useCallback((tier: number, qty: number) => {
        const now             = Date.now();
        const unlockThreshold = SCRATCH_CARD_UNLOCK_THRESHOLDS[tier];
        const clampedQty      = Math.max(2, Math.min(SCRATCH_QUEUE_MAX, qty));
        const delayMs         = SCRATCH_SCHEDULE_DELAY_MS[tier];   // delay fixo da série
        const cooldown        = SCRATCH_CARD_TIERS_V3[tier].cooldown;
        const feeRate         = getServiceFeeRate(tier);

        if (bal < unlockThreshold && scratchMetrics.tierPurchaseCounts[tier] === 0) {
            showMsg(`🔒 Bloqueado! Requer $${unlockThreshold.toLocaleString()}.`, 2000, true); return;
        }

        // bloquear se já há uma série ativa
        if (scheduleSeries[tier] !== null) {
            const rem = scheduleSeries[tier]!.seriesEndsAt - now;
            showMsg(`📋 Série em andamento! Termina em ${formatTimeSec(rem)}.`, 2000, true); return;
        }

        // custo total: cada slot paga inflação incremental
        let totalPot = 0, totalFee = 0;
        const costs: number[] = [];
        for (let i = 0; i < clampedQty; i++) {
            const cost = calculateCurrentCost(tier, i);
            const fee  = Math.ceil(cost * feeRate);
            totalPot  += cost;
            totalFee  += fee;
            costs.push(cost);
        }

        if (unluckyPot < totalPot) {
            showMsg(`🏺 Pote insuficiente! Precisa de ${totalPot.toFixed(0)}.`, 2000, true); return;
        }
        if (bal < totalFee) {
            showMsg(`💸 Taxa total: $${totalFee.toFixed(0)}. Saldo insuficiente!`, 2000, true); return;
        }

        // desconto imediato
        setUnluckyPot(p => p - totalPot);
        setBal(p => p - totalFee);

        // montar slots da série:
        // slot 0: entrega após delayMs (o delay de agendamento)
        // slot i: delayMs + i * cooldown  (cada slot respeita o cooldown do tier)
        const slots: ScheduledSlot[] = costs.map((_, i) => ({
            tier,
            inflaOffset: i,
            deliverAt:   now + delayMs + i * cooldown,
            processed:   false,
        }));

        const seriesEndsAt = slots[slots.length - 1].deliverAt;

        setScheduleSeries(prev =>
            prev.map((s, i) => i === tier ? { tier, slots, seriesEndsAt, totalQty: clampedQty } : s)
        );

        showMsg(
            `📋 ${clampedQty}x ${SCRATCH_CARD_TIERS_V3[tier].name} agendadas! Última entrega em ${formatTimeSec(seriesEndsAt - now)}. Taxa: -$${totalFee.toFixed(0)}`,
            4000, true
        );
    }, [
        bal, unluckyPot, setUnluckyPot, setBal,
        calculateCurrentCost, scratchMetrics,
        scheduleSeries, showMsg,
    ]);

    // ── saque do pote ─────────────────────────────────────────
    const getCurrentWithdrawFee = useCallback((): number =>
        Math.min(WITHDRAW_BASE_FEE + withdrawCount * WITHDRAW_FEE_STEP, WITHDRAW_FEE_MAX)
    , [withdrawCount]);

    const withdrawUnluckyPot = useCallback((percentToWithdraw: number) => {
        if (unluckyPot <= 0) { showMsg('🏺 Pote vazio!', 1500, true); return; }
        if (withdrawCooldownRem > 0) {
            showMsg(`⏳ Saque disponível em ${formatTimeSec(withdrawCooldownRem)}`, 2000, true); return;
        }
        const pct      = Math.max(1, Math.min(100, percentToWithdraw));
        const potSlice = unluckyPot * (pct / 100);
        const gross    = potSlice * WITHDRAW_EFFICIENCY;
        const fee      = gross * getCurrentWithdrawFee();
        const net      = gross - fee;
        if (net <= 0) { showMsg('❌ Valor muito baixo.', 1500, true); return; }
        setUnluckyPot(p => p - potSlice);
        setBal(p => p + net);
        setWithdrawCount(c => c + 1);
        setLastWithdrawTime(Date.now());
        showMsg(`💸 +$${net.toFixed(2)} (${pct}% do pote, taxa ${(getCurrentWithdrawFee() * 100).toFixed(1)}%)`, 4000, true);
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
        const prevCount = scratchMetrics.tierPurchaseCounts[tier];
        const newCount  = Math.floor(prevCount * (1 - config.reduction));
        setScratchMetrics(prev => ({
            ...prev,
            tierPurchaseCounts: prev.tierPurchaseCounts.map((c, i) => i === tier ? newCount : c),
        }));
        setLotericaState(prev => ({
            ...prev,
            lastInjectionTime: prev.lastInjectionTime.map((t, i) => i === tier ? now : t),
            totalInjections:   prev.totalInjections.map((c, i)   => i === tier ? c + 1 : c),
        }));
        showMsg(`✅ Lotérica! ${prevCount} → ${newCount} compras (-${(config.reduction * 100).toFixed(0)}%)`, 3000, true);
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
        scheduleSeries,
        scheduleQty,
        setScheduleQty,
    };
};
