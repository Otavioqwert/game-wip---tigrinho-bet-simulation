
import React, { useState, useCallback, useEffect } from 'react';
import { 
    SCRATCH_CARD_TIERS_V3,
    SCRATCH_INFLATION_CONFIG_V2,
    SCRATCH_CARD_UNLOCK_THRESHOLDS,
    LOTERICA_INJECTION_CONFIG_V2,
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
                injectionCooldownRemaining: prev.lastInjectionTime.map((lastTime, i) =>
                    Math.max(0, LOTERICA_INJECTION_CONFIG_V2[i].cooldown - (now - lastTime))
                )
            }));
        }, 1000);
        return () => clearInterval(interval);
    }, [setScratchMetrics, setLotericaState]);

    const calculateCurrentCost = useCallback((tier: number): number => {
        const baseCost = SCRATCH_CARD_TIERS_V3[tier].cost;
        const config = SCRATCH_INFLATION_CONFIG_V2[tier];
        const purchases = scratchMetrics.tierPurchaseCounts[tier];
        
        if (purchases === 0) return baseCost;
        
        let currentCost = baseCost;
        
        // Calcular iterativamente (crescimento composto + flat)
        for (let i = 0; i < purchases; i++) {
            // Componente percentual (ex: 5% do valor atual)
            currentCost = currentCost * (1 + config.percentPerPurchase);
            
            // Componente flat (ex: tier% do custo base)
            currentCost += baseCost * config.flatPerPurchase;
        }
        
        return Math.round(currentCost);
    }, [scratchMetrics.tierPurchaseCounts]);

    // FATOR DE SORTE PROGRESSIVO (Versão Balanceada):
    const getTierLuckFactor = (tier: number) => {
        // Base linear mais generosa
        const linear = tier * 0.15;  // 15% por tier
        
        // Bônus escalonado com diminuição de retorno
        const scaled = Math.pow(tier / 9, 0.7) * 0.40;  // Até +40% extra
        
        return 1 + linear + scaled;
    };

    const calculateCurrentRTP = useCallback((tier: number): number => {
        const tierData = SCRATCH_CARD_TIERS_V3[tier];
        const currentCost = calculateCurrentCost(tier);
        
        // FIX: Valor base calculado sobre o CUSTO ORIGINAL (tierData.cost), não o custo inflacionado.
        const baseSlotValue = tierData.cost / tierData.slots;
        const luckFactor = getTierLuckFactor(tier);
        
        let expectedValuePerSlot = 0;

        for (const prize of SCRATCH_PRIZE_TIERS) {
            if (tier >= prize.minTier) {
                // Chance Real = Probabilidade Base * Sorte do Tier
                const effectiveProb = prize.prob * luckFactor;
                
                // Valor Real do Prêmio = Valor do Slot * Mult * Eficiência
                const prizeValue = baseSlotValue * prize.mult * tierData.efficiency;
                
                // EV acumulado (Probabilidade * Valor)
                expectedValuePerSlot += (effectiveProb * prizeValue);
            }
        }

        // Valor Esperado Total do Ticket = EV por Slot * Numero de Slots
        const totalTicketEV = expectedValuePerSlot * tierData.slots;

        // RTP = (Retorno Esperado / Custo Atual) * 100
        // Como o retorno é fixo e o custo sobe, o RTP cai com o tempo.
        return currentCost > 0 ? (totalTicketEV / currentCost) * 100 : 0;
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
        // FIX: Prêmios baseados no custo original
        const baseSlotValue = tierData.cost / tierData.slots;
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
                isJackpot: p >= (baseSlotValue * 50) // Jackpot visual threshold also based on base value
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

    const formatTime = (ms: number) => {
        if (ms < 60000) return `${Math.ceil(ms / 1000)}s`;
        if (ms < 3600000) return `${Math.ceil(ms / 60000)}m`;
        return `${Math.ceil(ms / 3600000)}h`;
    };

    const injetarLoterica = useCallback((tier: number) => {
        const now = Date.now();
        const config = LOTERICA_INJECTION_CONFIG_V2[tier];
        const lastInjection = lotericaState.lastInjectionTime[tier];
        const currentCost = calculateCurrentCost(tier);
        const injectionCost = Math.round(currentCost * config.costMultiplier);
        
        // Checar cooldown
        if (now - lastInjection < config.cooldown) {
            const remaining = config.cooldown - (now - lastInjection);
            showMsg(`⏳ Recarga em ${formatTime(remaining)}`, 2000, true);
            return;
        }
        
        // Checar saldo
        if (bal < injectionCost) {
            showMsg(`💸 Precisa de $${injectionCost.toLocaleString()} para injetar!`, 2000, true);
            return;
        }
        
        // Executar injeção
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
            lastInjectionTime: prev.lastInjectionTime.map((time, i) => 
                i === tier ? now : time
            ),
            totalInjections: prev.totalInjections.map((count, i) => 
                i === tier ? count + 1 : count
            )
        }));
        
        const prevCount = scratchMetrics.tierPurchaseCounts[tier];
        showMsg(`✅ Lotérica Injetada! ${prevCount} → ${newPurchaseCount} compras (-${((config.reduction) * 100).toFixed(0)}%)`, 3000, true);
    }, [bal, calculateCurrentCost, scratchMetrics, lotericaState, setBal, setScratchMetrics, setLotericaState, showMsg]);

    return { activeScratchCard, buyScratchCard, finishScratchCard, injetarLoterica, calculateCurrentCost, calculateCurrentRTP };
};
