
import React, { useState, useCallback, useEffect } from 'react';
import { 
    SCRATCH_CARD_TIERS_V3,
    SCRATCH_CARD_INFLATION_V3,
    SCRATCH_CARD_UNLOCK_THRESHOLDS,
    LOTERICA_INJECTION_COOLDOWN,
    LOTERICA_INJECTION_COSTS,
    LOTERICA_INJECTION_REDUCTIONS
} from '../constants';
import type { ScratchCardMetrics, LotericaInjectionState, ActiveScratchCard, ScratchCardCell } from '../types';

interface ScratchCardLogicProps {
    bal: number;
    setBal: React.Dispatch<React.SetStateAction<number>>;
    scratchMetrics: ScratchCardMetrics;
    setScratchMetrics: React.Dispatch<React.SetStateAction<ScratchCardMetrics>>;
    lotericaState: LotericaInjectionState;
    setLotericaState: React.Dispatch<React.SetStateAction<LotericaInjectionState>>;
    showMsg: (msg: string, duration?: number, isExtra?: boolean) => void;
    totalIncomeMultiplier: number;
}

// --- NEW MATH CONSTANTS ---
const BASE_SLOTS_NORMALIZATION = 6; // Todos os valores são calculados como se tivessem 6 slots

// Definição da Distribuição do Pote (RTP Distribution)
// Probabilidade por Slot | % do RTP total alocado
const PRIZE_DISTRIBUTION = [
    { id: 'jackpot', prob: 0.002, share: 0.40, isJackpot: true }, // 0.2% chance, leva 40% do valor esperado
    { id: 'high',    prob: 0.015, share: 0.25, isJackpot: false }, // 1.5% chance, leva 25%
    { id: 'mid',     prob: 0.060, share: 0.20, isJackpot: false }, // 6.0% chance, leva 20%
    { id: 'low',     prob: 0.180, share: 0.15, isJackpot: false }, // 18.0% chance, leva 15%
];

// Gera a tabela de prêmios baseada no custo e RTP alvo
const generatePrizeStructure = (currentCost: number, baseRTP: number) => {
    // O "Pote Esperado" é quanto o cartão deveria pagar em média baseada no RTP
    const expectedReturnPot = currentCost * (baseRTP / 100);

    return PRIZE_DISTRIBUTION.map(tier => {
        // Mágica da Normalização:
        // Calculamos o valor do prêmio dividindo a fatia do pote pela probabilidade E por 6 slots.
        // Se o cartão tiver 12 slots, ele terá 12 chances de ganhar esse prêmio calculado para 6.
        // Isso dobra efetivamente o retorno real para o jogador.
        const rawValue = (expectedReturnPot * tier.share) / (tier.prob * BASE_SLOTS_NORMALIZATION);
        
        // Arredondamento estético
        let value = rawValue;
        if (value > 1000) value = Math.round(value / 100) * 100;
        else if (value > 100) value = Math.round(value / 10) * 10;
        else value = Math.round(value);

        return {
            value: Math.max(currentCost * 0.1, value), // Minimo 10% do custo
            prob: tier.prob,
            isJackpot: tier.isJackpot
        };
    });
};

export const useScratchCardLogic = (props: ScratchCardLogicProps) => {
    const {
        bal, setBal,
        scratchMetrics, setScratchMetrics,
        lotericaState, setLotericaState,
        showMsg, totalIncomeMultiplier
    } = props;

    const [activeScratchCard, setActiveScratchCard] = useState<ActiveScratchCard | null>(null);

    // Cooldown Loop
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
        }, 500);
        return () => clearInterval(interval);
    }, [setScratchMetrics, setLotericaState]);

    const calculateCurrentCost = useCallback((tier: number): number => {
        const baseCost = SCRATCH_CARD_TIERS_V3[tier].cost;
        const inflation = SCRATCH_CARD_INFLATION_V3[tier];
        const purchases = scratchMetrics.tierPurchaseCounts[tier];
        return baseCost + (inflation * purchases);
    }, [scratchMetrics.tierPurchaseCounts]);

    // RTP Real: Considera a vantagem dos slots extras
    const calculateCurrentRTP = useCallback((tier: number): number => {
        const currentCost = calculateCurrentCost(tier);
        if (currentCost === 0) return 0;
        
        const tierData = SCRATCH_CARD_TIERS_V3[tier];
        const baseRTP = tierData.targetRTP; // RTP Base definido na constante
        
        // RTP Nominal (ajustado pela inflação do custo)
        const nominalRTP = (baseRTP * tierData.cost) / currentCost;
        
        // RTP Real (Vantagem de slots: (Slots Atuais / 6))
        // Se tiver 12 slots, o RTP real é o dobro do nominal
        const realRTP = nominalRTP * (tierData.slots / BASE_SLOTS_NORMALIZATION);
        
        return realRTP;
    }, [calculateCurrentCost]);

    const rollScratchCard = (tier: number): { prizes: number[], jackpotHit: boolean } => {
        const tierData = SCRATCH_CARD_TIERS_V3[tier];
        const currentCost = calculateCurrentCost(tier);
        const prizeStructure = generatePrizeStructure(currentCost, tierData.targetRTP);
        
        const results: number[] = [];
        let jackpotHit = false;

        for (let i = 0; i < tierData.slots; i++) {
            const roll = Math.random();
            let cumulativeProb = 0;
            let selectedPrize = 0;
            
            for (const p of prizeStructure) {
                cumulativeProb += p.prob;
                if (roll <= cumulativeProb) {
                    selectedPrize = p.value;
                    if (p.isJackpot) jackpotHit = true;
                    break;
                }
            }
            results.push(selectedPrize);
        }
        return { prizes: results, jackpotHit };
    };

    const buyScratchCard = useCallback((tier: number) => {
        const now = Date.now();
        const lastPurchase = scratchMetrics.tierLastPurchase[tier];
        const cooldown = SCRATCH_CARD_TIERS_V3[tier].cooldown;
        const unlockThreshold = SCRATCH_CARD_UNLOCK_THRESHOLDS[tier];
        const purchases = scratchMetrics.tierPurchaseCounts[tier];

        if (bal < unlockThreshold && purchases === 0) {
            showMsg(`🔒 Bloqueado! Requer $${unlockThreshold.toLocaleString()}.`, 2000, true);
            return;
        }
        
        if (now - lastPurchase < cooldown) return;
        
        const currentCost = calculateCurrentCost(tier);
        if (bal < currentCost) {
            showMsg('💸 Saldo insuficiente!', 1500, true);
            return;
        }
        
        // Deduct Cost
        setBal(prev => prev - currentCost);
        
        // Roll Prizes
        const { prizes } = rollScratchCard(tier);
        const rawTotalWin = prizes.reduce((sum, p) => sum + p, 0);
        const totalWin = rawTotalWin * totalIncomeMultiplier;
        
        // Determine jackpots for UI (value based threshold)
        // Se o prêmio for maior que 20x o custo, considera visualmente um jackpot
        const jackpotThreshold = currentCost * 20;

        const cells: ScratchCardCell[] = prizes.map(prize => ({
            prize: prize * totalIncomeMultiplier,
            revealed: false,
            isJackpot: prize >= jackpotThreshold
        }));
        
        setActiveScratchCard({
            tier,
            cells,
            totalWin,
            isRevealing: true
        });
        
        setScratchMetrics(prev => ({
            ...prev,
            tierPurchaseCounts: prev.tierPurchaseCounts.map((count, i) => i === tier ? count + 1 : count),
            tierLastPurchase: prev.tierLastPurchase.map((time, i) => i === tier ? now : time)
        }));

    }, [bal, setBal, calculateCurrentCost, scratchMetrics, setScratchMetrics, showMsg, totalIncomeMultiplier]);

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
        
        if (now - lastInjection < LOTERICA_INJECTION_COOLDOWN) return;
        
        const currentCost = calculateCurrentCost(tier);
        const injectionCost = currentCost * LOTERICA_INJECTION_COSTS[tier];
        
        if (bal < injectionCost) {
            showMsg('💸 Saldo insuficiente para injeção!', 2000, true);
            return;
        }
        
        setBal(prev => prev - injectionCost);
        
        const purchases = scratchMetrics.tierPurchaseCounts[tier];
        const reduction = LOTERICA_INJECTION_REDUCTIONS[tier];
        const newPurchaseCount = Math.floor(purchases * (1 - reduction));
        
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

    return {
        activeScratchCard,
        buyScratchCard,
        finishScratchCard,
        injetarLoterica,
        calculateCurrentCost,
        calculateCurrentRTP
    };
};
