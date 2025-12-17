
import React, { useState, useCallback, useEffect } from 'react';
import { 
    SCRATCH_CARD_TIERS_V3,
    SCRATCH_CARD_INFLATION_V3,
    SCRATCH_CARD_UNLOCK_THRESHOLDS,
    LOTERICA_INJECTION_COOLDOWN,
    LOTERICA_INJECTION_COSTS,
    LOTERICA_INJECTION_REDUCTIONS
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

const PRIZE_DISTRIBUTION = [
    { id: 'jackpot', prob: 0.002, share: 0.40, isJackpot: true },
    { id: 'high',    prob: 0.015, share: 0.25, isJackpot: false },
    { id: 'mid',     prob: 0.060, share: 0.20, isJackpot: false },
    { id: 'low',     prob: 0.180, share: 0.15, isJackpot: false },
];

const generatePrizeStructure = (currentCost: number, baseRTP: number, efficiency: number, totalSlots: number) => {
    const expectedReturnPot = currentCost * (baseRTP / 100);
    return PRIZE_DISTRIBUTION.map(tier => {
        const rawValue = (expectedReturnPot * tier.share * efficiency) / (tier.prob * totalSlots);
        let value = rawValue;
        if (value > 1000) value = Math.round(value / 100) * 100;
        else if (value > 100) value = Math.round(value / 10) * 10;
        else value = Math.round(value);

        return {
            value: Math.max(currentCost * 0.1, value), 
            prob: tier.prob,
            isJackpot: tier.isJackpot
        };
    });
};

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

    const calculateCurrentRTP = useCallback((tier: number): number => {
        const currentCost = calculateCurrentCost(tier);
        if (currentCost === 0) return 0;
        const tierData = SCRATCH_CARD_TIERS_V3[tier];
        return ((tierData.targetRTP * tierData.cost) / currentCost) * tierData.efficiency;
    }, [calculateCurrentCost]);

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
        const prizeStructure = generatePrizeStructure(currentCost, tierData.targetRTP, tierData.efficiency, tierData.slots);
        const prizes: number[] = [];
        for (let i = 0; i < tierData.slots; i++) {
            const roll = Math.random();
            let cumulativeProb = 0;
            let selectedPrize = 0;
            for (const p of prizeStructure) {
                cumulativeProb += p.prob;
                if (roll <= cumulativeProb) {
                    selectedPrize = p.value;
                    break;
                }
            }
            prizes.push(selectedPrize);
        }

        const rawTotalWin = prizes.reduce((sum, p) => sum + p, 0);
        // Aplica modificadores lineares e a Hidra Exponencial
        const finalTotalWin = applyFinalGain(rawTotalWin);
        
        const jackpotThreshold = currentCost * 20;

        setActiveScratchCard({
            tier,
            cells: prizes.map(p => ({
                prize: applyFinalGain(p), // Visualização individual também corrigida
                revealed: false,
                isJackpot: p >= jackpotThreshold
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
