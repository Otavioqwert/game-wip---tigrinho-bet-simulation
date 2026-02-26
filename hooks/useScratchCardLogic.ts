import React, { useState, useCallback, useEffect } from 'react';
import { 
    SCRATCH_CARD_TIERS_V3,
    SCRATCH_INFLATION_CONFIG_V2,
    SCRATCH_CARD_UNLOCK_THRESHOLDS,
    LOTERICA_INJECTION_CONFIG_V2,
    SCRATCH_PRIZE_TIERS
} from '../constants';
import type { ScratchCardMetrics, LotericaInjectionState, ActiveScratchCard } from '../types';

// ============================================================
// TAXA DE SERVIÇO: 10% do custo da raspadinha, com desconto
// composto de 10% por tier (tier 0 = 10%, tier 1 = 9%, ...)
// Paga em dinheiro do jogo (bal), não do pote de azar.
// ============================================================
export const getServiceFeeRate = (tier: number): number => {
    return 0.10 * Math.pow(0.9, tier);
};

// ============================================================
// SAQUE DO POTE DE AZAR
// - Converte X% do pote em X * 0.15% em dinheiro (15% de eficiência)
// - Taxa inicial: 2% sobre o valor convertido
// - Cada saque: +0.5% na taxa (máx 15%)
// - Cooldown: 10 minutos entre saques
// ============================================================
export const WITHDRAW_BASE_FEE   = 0.02;  // 2% inicial
export const WITHDRAW_FEE_STEP   = 0.005; // +0.5% por saque
export const WITHDRAW_FEE_MAX    = 0.15;  // teto de 15%
export const WITHDRAW_EFFICIENCY = 0.15;  // 15% de conversão pote → dinheiro
export const WITHDRAW_COOLDOWN   = 10 * 60 * 1000; // 10 minutos

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
    const { bal, setBal, unluckyPot, setUnluckyPot, scratchMetrics, setScratchMetrics, lotericaState, setLotericaState, applyFinalGain, showMsg } = props;
    const [activeScratchCard, setActiveScratchCard] = useState<ActiveScratchCard | null>(null);

    // Estado de saque do pote
    const [withdrawCount,       setWithdrawCount]       = useState(0);
    const [lastWithdrawTime,    setLastWithdrawTime]    = useState(0);
    const [withdrawCooldownRem, setWithdrawCooldownRem] = useState(0);

    // Tick de cooldowns
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
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
            setWithdrawCooldownRem(Math.max(0, WITHDRAW_COOLDOWN - (now - lastWithdrawTime)));
        }, 1000);
        return () => clearInterval(interval);
    }, [setScratchMetrics, setLotericaState, lastWithdrawTime]);

    const calculateCurrentCost = useCallback((tier: number): number => {
        const baseCost = SCRATCH_CARD_TIERS_V3[tier].cost;
        const config = SCRATCH_INFLATION_CONFIG_V2[tier];
        const purchases = scratchMetrics.tierPurchaseCounts[tier];
        if (purchases === 0) return baseCost;
        let currentCost = baseCost;
        for (let i = 0; i < purchases; i++) {
            currentCost = currentCost * (1 + config.percentPerPurchase);
            currentCost += baseCost * config.flatPerPurchase;
        }
        return Math.round(currentCost);
    }, [scratchMetrics.tierPurchaseCounts]);

    const getTierLuckFactor = (tier: number) => {
        const linear = tier * 0.15;
        const scaled = Math.pow(tier / 9, 0.7) * 0.40;
        return 1 + linear + scaled;
    };

    const calculateCurrentRTP = useCallback((tier: number): number => {
        const tierData = SCRATCH_CARD_TIERS_V3[tier];
        const currentCost = calculateCurrentCost(tier);
        const baseSlotValue = tierData.cost / tierData.slots;
        const luckFactor = getTierLuckFactor(tier);
        let expectedValuePerSlot = 0;
        for (const prize of SCRATCH_PRIZE_TIERS) {
            if (tier >= prize.minTier) {
                const effectiveProb = prize.prob * luckFactor;
                const prizeValue = baseSlotValue * prize.mult * tierData.efficiency;
                expectedValuePerSlot += (effectiveProb * prizeValue);
            }
        }
        const totalTicketEV = expectedValuePerSlot * tierData.slots;
        return currentCost > 0 ? (totalTicketEV / currentCost) * 100 : 0;
    }, [calculateCurrentCost]);

    // ----------------------------------------------------------------
    // COMPRAR RASPADINHA — cobra taxa de serviço em bal
    // ----------------------------------------------------------------
    const buyScratchCard = useCallback((tier: number) => {
        const now = Date.now();
        const lastPurchase    = scratchMetrics.tierLastPurchase[tier];
        const cooldown        = SCRATCH_CARD_TIERS_V3[tier].cooldown;
        const unlockThreshold = SCRATCH_CARD_UNLOCK_THRESHOLDS[tier];
        const currentCost     = calculateCurrentCost(tier);

        // Taxa de serviço: % do custo da raspadinha, desconto composto por tier
        const feeRate   = getServiceFeeRate(tier);
        const serviceFee = Math.ceil(currentCost * feeRate);

        if (bal < unlockThreshold && scratchMetrics.tierPurchaseCounts[tier] === 0) {
            showMsg(`🔒 Bloqueado! Requer saldo de $${unlockThreshold.toLocaleString()}.`, 2000, true);
            return;
        }
        if (now - lastPurchase < cooldown) {
            showMsg('⏳ Aguarde o tempo de recarga!', 1500, true);
            return;
        }
        if (unluckyPot < currentCost) {
            showMsg(`🏺 Pote de Azar insuficiente! Requer ${currentCost.toFixed(0)}`, 1500, true);
            return;
        }
        if (bal < serviceFee) {
            showMsg(`💸 Taxa de serviço: $${serviceFee.toFixed(0)} (${(feeRate * 100).toFixed(1)}%). Saldo insuficiente!`, 2000, true);
            return;
        }

        // Debita pote e taxa
        setUnluckyPot(prev => prev - currentCost);
        setBal(prev => prev - serviceFee);

        const tierData = SCRATCH_CARD_TIERS_V3[tier];
        const baseSlotValue = tierData.cost / tierData.slots;
        const luckFactor = getTierLuckFactor(tier);
        const prizes: number[] = [];

        for (let i = 0; i < tierData.slots; i++) {
            const roll = Math.random();
            let selectedMult = 0;
            let currentThreshold = 0;
            for (const prizeTier of SCRATCH_PRIZE_TIERS) {
                if (tier < prizeTier.minTier) continue;
                const effectiveProb = prizeTier.prob * luckFactor;
                if (roll < currentThreshold + effectiveProb) {
                    selectedMult = prizeTier.mult;
                    break;
                }
                currentThreshold += effectiveProb;
            }
            const winValue = selectedMult > 0 ? baseSlotValue * selectedMult * tierData.efficiency : 0;
            prizes.push(winValue);
        }

        const rawTotalWin  = prizes.reduce((sum, p) => sum + p, 0);
        const finalTotalWin = applyFinalGain(rawTotalWin);

        setActiveScratchCard({
            tier,
            cells: prizes.map(p => ({
                prize: applyFinalGain(p),
                revealed: false,
                isJackpot: p >= (baseSlotValue * 50)
            })),
            totalWin: finalTotalWin,
            isRevealing: true
        });

        setScratchMetrics(prev => ({
            ...prev,
            tierPurchaseCounts: prev.tierPurchaseCounts.map((count, i) => i === tier ? count + 1 : count),
            tierLastPurchase:   prev.tierLastPurchase.map((time, i)  => i === tier ? now : time)
        }));

        showMsg(`🎫 Raspadinha comprada! Taxa de serviço: -$${serviceFee.toFixed(0)}`, 2000, true);
    }, [bal, unluckyPot, setUnluckyPot, setBal, calculateCurrentCost, scratchMetrics, setScratchMetrics, showMsg, applyFinalGain]);

    const finishScratchCard = useCallback(() => {
        if (!activeScratchCard) return;
        if (activeScratchCard.totalWin > 0) {
            setBal(prev => prev + activeScratchCard.totalWin);
            showMsg(`Ganhou $${activeScratchCard.totalWin.toFixed(2)}!`, 2000, true);
        }
        setActiveScratchCard(null);
    }, [activeScratchCard, setBal, showMsg]);

    const formatTime = (ms: number) => {
        if (ms < 60000) return `${Math.ceil(ms / 1000)}s`;
        if (ms < 3600000) return `${Math.ceil(ms / 60000)}m`;
        return `${Math.ceil(ms / 3600000)}h`;
    };

    // ----------------------------------------------------------------
    // SAQUE DO POTE DE AZAR
    // percentToWithdraw: 0–100 (% do pote atual a converter)
    // ----------------------------------------------------------------
    const getCurrentWithdrawFee = useCallback((): number => {
        return Math.min(WITHDRAW_BASE_FEE + withdrawCount * WITHDRAW_FEE_STEP, WITHDRAW_FEE_MAX);
    }, [withdrawCount]);

    const withdrawUnluckyPot = useCallback((percentToWithdraw: number) => {
        if (unluckyPot <= 0) {
            showMsg('🏺 Pote de Azar está vazio!', 1500, true);
            return;
        }
        if (withdrawCooldownRem > 0) {
            showMsg(`⏳ Saque disponível em ${formatTime(withdrawCooldownRem)}`, 2000, true);
            return;
        }

        const clampedPct    = Math.max(1, Math.min(100, percentToWithdraw));
        const potSlice      = unluckyPot * (clampedPct / 100);            // valor do pote sacado
        const grossCash     = potSlice * WITHDRAW_EFFICIENCY;              // 15% de conversão
        const currentFee    = getCurrentWithdrawFee();
        const feeAmount     = grossCash * currentFee;
        const netCash       = grossCash - feeAmount;

        if (netCash <= 0) {
            showMsg('❌ Valor muito baixo para saque.', 1500, true);
            return;
        }

        setUnluckyPot(prev => prev - potSlice);
        setBal(prev => prev + netCash);
        setWithdrawCount(prev => prev + 1);
        setLastWithdrawTime(Date.now());

        showMsg(
            `💸 Saque: ${clampedPct}% do pote → $${grossCash.toFixed(0)} bruto | Taxa ${(currentFee * 100).toFixed(1)}% (-$${feeAmount.toFixed(0)}) → +$${netCash.toFixed(2)} líquido`,
            4000, true
        );
    }, [unluckyPot, withdrawCooldownRem, getCurrentWithdrawFee, setUnluckyPot, setBal, showMsg]);

    // ----------------------------------------------------------------
    // INJETAR LOTÉRICA (deflação de compras)
    // ----------------------------------------------------------------
    const injetarLoterica = useCallback((tier: number) => {
        const now = Date.now();
        const config = LOTERICA_INJECTION_CONFIG_V2[tier];
        const lastInjection = lotericaState.lastInjectionTime[tier];
        const currentCost   = calculateCurrentCost(tier);
        const injectionCost = Math.round(currentCost * config.costMultiplier);

        if (now - lastInjection < config.cooldown) {
            const remaining = config.cooldown - (now - lastInjection);
            showMsg(`⏳ Recarga em ${formatTime(remaining)}`, 2000, true);
            return;
        }
        if (bal < injectionCost) {
            showMsg(`💸 Precisa de $${injectionCost.toLocaleString()} para injetar!`, 2000, true);
            return;
        }

        setBal(prev => prev - injectionCost);

        const newPurchaseCount = Math.floor(
            scratchMetrics.tierPurchaseCounts[tier] * (1 - config.reduction)
        );

        setScratchMetrics(prev => ({
            ...prev,
            tierPurchaseCounts: prev.tierPurchaseCounts.map((count, i) =>
                i === tier ? newPurchaseCount : count
            )
        }));

        setLotericaState(prev => ({
            ...prev,
            lastInjectionTime: prev.lastInjectionTime.map((time, i)   => i === tier ? now : time),
            totalInjections:   prev.totalInjections.map((count, i)    => i === tier ? count + 1 : count)
        }));

        const prevCount = scratchMetrics.tierPurchaseCounts[tier];
        showMsg(`✅ Lotérica Injetada! ${prevCount} → ${newPurchaseCount} compras (-${((config.reduction) * 100).toFixed(0)}%)`, 3000, true);
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
    };
};
