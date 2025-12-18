
import React, { useState, useCallback, useEffect } from 'react';
import { 
    SCRATCH_CARD_TIERS_V3,
    SCRATCH_CARD_INFLATION_V3,
    SCRATCH_CARD_UNLOCK_THRESHOLDS,
    LOTERICA_INJECTION_COOLDOWN,
    LOTERICA_INJECTION_COSTS,
    LOTERICA_INJECTION_REDUCTIONS,
    SCRATCH_PRIZE_TIERS
} from '../constants';
import type { ScratchCardMetrics, LotericaInjectionState, ActiveScratchCard } from '../types';

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
                injectionCooldownRemaining: prev.lastInjectionTime.map((lastTime) =>
                    Math.max(0, LOTERICA_INJECTION_COOLDOWN - (now - lastTime))
                )
            }));
        }, 1000);
        return () => clearInterval(interval);
    }, [setScratchMetrics, setLotericaState]);

    const calculateCurrentCost = useCallback((tier: number): number => {
        const baseCost = SCRATCH_CARD_TIERS_V3[tier].cost;
        const inflation = SCRATCH_CARD_INFLATION_V3[tier];
        const purchases = scratchMetrics.tierPurchaseCounts[tier];
        return baseCost + (inflation * purchases);
    }, [scratchMetrics.tierPurchaseCounts]);

    // FATOR DE SORTE PROGRESSIVO (Versão Melhorada):
    // Tier 0 = 1.00x
    // Tier 1 = 1.25x
    // ...
    // Tier 9 = 3.25x
    // Aumenta a frequência de acertos significativamente nos tiers altos.
    const getTierLuckFactor = (tier: number) => 1 + (tier * 0.25);

    const calculateCurrentRTP = useCallback((tier: number): number => {
        const tierData = SCRATCH_CARD_TIERS_V3[tier];
        const luckFactor = getTierLuckFactor(tier);
        let expectedMultiplierSum = 0;

        for (const prize of SCRATCH_PRIZE_TIERS) {
            if (tier >= prize.minTier) {
                // Chance Real = Probabilidade Base * Sorte do Tier
                const effectiveProb = prize.prob * luckFactor;
                
                // Valor Real = Multiplicador Base * Eficiência do Tier
                const effectiveMult = prize.mult * tierData.efficiency;
                
                // Contribuição para o Retorno (Probabilidade * Valor)
                expectedMultiplierSum += (effectiveProb * effectiveMult);
            }
        }

        // RTP = (Soma das Expectativas) * 100
        // Como o 'effectiveMult' é aplicado sobre o (Custo/Slot), a soma direta é o retorno sobre o custo.
        return expectedMultiplierSum * 100;
    }, []);

    const buyScratchCard = useCallback((tier: number) => {
        const now = Date.now();
        const lastPurchase = scratchMetrics.tierLastPurchase[tier];
        const cooldown = SCRATCH_CARD_TIERS_V3[tier].cooldown;
        const unlockThreshold = SCRATCH_CARD_UNLOCK_THRESHOLDS[tier];
        const currentCost = calculateCurrentCost(tier);

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
        
        setUnluckyPot(prev => prev - currentCost);
        
        const tierData = SCRATCH_CARD_TIERS_V3[tier];
        const baseSlotValue = currentCost / tierData.slots;
        const luckFactor = getTierLuckFactor(tier);
        
        const prizes: number[] = [];
        
        for (let i = 0; i < tierData.slots; i++) {
            const roll = Math.random();
            let selectedMult = 0;
            let currentThreshold = 0;

            for (const prizeTier of SCRATCH_PRIZE_TIERS) {
                if (tier < prizeTier.minTier) continue;

                // APLICA O FATOR DE SORTE AQUI
                const effectiveProb = prizeTier.prob * luckFactor;

                if (roll < currentThreshold + effectiveProb) {
                    selectedMult = prizeTier.mult;
                    break;
                }
                currentThreshold += effectiveProb;
            }

            // O prêmio real aplica a Eficiência do Tier sobre o Multiplicador Base
            const winValue = selectedMult > 0 
                ? baseSlotValue * selectedMult * tierData.efficiency 
                : 0;

            prizes.push(winValue);
        }

        const rawTotalWin = prizes.reduce((sum, p) => sum + p, 0);
        const finalTotalWin = applyFinalGain(rawTotalWin);
        
        setActiveScratchCard({
            tier,
            cells: prizes.map(p => ({
                prize: applyFinalGain(p), 
                revealed: false,
                isJackpot: p >= (currentCost / tierData.slots * 50)
            })),
            totalWin: finalTotalWin,
            isRevealing: true
        });
        
        setScratchMetrics(prev => ({
            ...prev,
            tierPurchaseCounts: prev.tierPurchaseCounts.map((count, i) => i === tier ? count + 1 : count),
            tierLastPurchase: prev.tierLastPurchase.map((time, i) => i === tier ? now : time)
        }));
    }, [bal, unluckyPot, setUnluckyPot, calculateCurrentCost, scratchMetrics, setScratchMetrics, showMsg, applyFinalGain]);

    const finishScratchCard = useCallback(() => {
        if (!activeScratchCard) return;
        if (activeScratchCard.totalWin > 0) {
            setBal(prev => prev + activeScratchCard.totalWin);
            showMsg(`Ganhou $${activeScratchCard.totalWin.toFixed(2)}!`, 2000, true);
        }
        setActiveScratchCard(null);
    }, [activeScratchCard, setBal, showMsg]);

    const injetarLoterica = useCallback((tier: number) => {
        const now = Date.now();
        const lastInjection = lotericaState.lastInjectionTime[tier];
        const currentCost = calculateCurrentCost(tier);
        const injectionCost = currentCost * LOTERICA_INJECTION_COSTS[tier];

        if (now - lastInjection < LOTERICA_INJECTION_COOLDOWN) return;
        if (bal < injectionCost) {
            showMsg('💸 Saldo insuficiente para injeção!', 2000, true);
            return;
        }
        
        setBal(prev => prev - injectionCost);
        const newPurchaseCount = Math.floor(scratchMetrics.tierPurchaseCounts[tier] * (1 - LOTERICA_INJECTION_REDUCTIONS[tier]));
        
        setScratchMetrics(prev => ({
            ...prev,
            tierPurchaseCounts: prev.tierPurchaseCounts.map((count, i) => i === tier ? newPurchaseCount : count)
        }));
        setLotericaState(prev => ({
            ...prev,
            lastInjectionTime: prev.lastInjectionTime.map((time, i) => i === tier ? now : time),
            totalInjections: prev.totalInjections.map((count, i) => i === tier ? count + 1 : count)
        }));
        showMsg(`🏪 Lotérica Injetada! Inflação reduzida.`, 3000, true);
    }, [bal, calculateCurrentCost, scratchMetrics, lotericaState, setBal, setScratchMetrics, setLotericaState, showMsg]);

    return { activeScratchCard, buyScratchCard, finishScratchCard, injetarLoterica, calculateCurrentCost, calculateCurrentRTP };
};
