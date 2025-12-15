
// Fix: Import React to resolve 'Cannot find namespace React' error in type annotations.
import React, { useState, useCallback } from 'react';
import { 
    SCRATCH_CARD_TIERS, SCRATCH_CARD_BASE_PRIZES,
    SCRATCH_CARD_WIN_CHANCE_MODIFIERS, SCRATCH_CARD_BASE_WIN_CHANCE,
    SCRATCH_CARD_INFLATION
} from '../constants';
import type { ScratchCardTier, ScratchCardCell } from '../types';

interface ScratchCardLogicProps {
    bal: number;
    unluckyPot: number;
    setUnluckyPot: React.Dispatch<React.SetStateAction<number>>;
    scratchCardPurchaseCounts: Record<number, number>;
    setScratchCardPurchaseCounts: React.Dispatch<React.SetStateAction<Record<number, number>>>;
    totalIncomeMultiplier: number;
    showMsg: (msg: string, duration?: number, isExtra?: boolean) => void;
    handleSpend: (cost: number) => boolean;
    handleGain: (amount: number) => void;
}

// Helper function to calculate prize values for a specific tier using the multiplier
const getTierPrizes = (tierIndex: number): { value: number, probability: number }[] => {
    const tier = SCRATCH_CARD_TIERS[tierIndex];
    if (!tier) return SCRATCH_CARD_BASE_PRIZES;

    return SCRATCH_CARD_BASE_PRIZES.map(prize => ({
        ...prize,
        value: prize.value * tier.multiplier
    }));
};

// Helper function to calculate the total win chance for a specific tier
const getTierWinChance = (tierIndex: number): number => {
    const modifier = SCRATCH_CARD_WIN_CHANCE_MODIFIERS[tierIndex] || 0;
    return Math.min(1, Math.max(0, SCRATCH_CARD_BASE_WIN_CHANCE + modifier));
};

export const useScratchCardLogic = (props: ScratchCardLogicProps) => {
    const {
        unluckyPot, setUnluckyPot, scratchCardPurchaseCounts,
        setScratchCardPurchaseCounts, totalIncomeMultiplier, showMsg, handleGain
    } = props;

    const [activeCard, setActiveCard] = useState<{ tier: ScratchCardTier, grid: ScratchCardCell[] } | null>(null);
    const [winnings, setWinnings] = useState<number | null>(null);
    const [bulkResult, setBulkResult] = useState<{ count: number, cost: number, winnings: number } | null>(null);

    // Calculates the price of the Nth card (where N is current count + 1)
    // Formula: Base Cost + (Count * Inflation Value)
    const getScratchCardPrice = useCallback((tierIndex: number, purchaseCountOverride?: number): number => {
        const tier = SCRATCH_CARD_TIERS[tierIndex];
        if (!tier) return Infinity;
        
        const purchaseCount = purchaseCountOverride ?? (scratchCardPurchaseCounts[tierIndex] || 0);
        const inflation = SCRATCH_CARD_INFLATION[tierIndex] || 0;
        
        return tier.cost + (purchaseCount * inflation);
    }, [scratchCardPurchaseCounts]);
    
    const generateSingleCardResult = (tierIndex: number) => {
        const tierWinChance = getTierWinChance(tierIndex);
        const currentTierPrizes = getTierPrizes(tierIndex);
        // We use the base sum for normalization of the roll logic within a winning outcome
        // NOTE: Our probability list now includes a 0 value item for "loss" which affects the sum if included blindly.
        // We only care about winning probabilities for the secondary roll.
        const winningPrizes = currentTierPrizes.filter(p => p.value > 0);
        const totalWinProbability = winningPrizes.reduce((acc, p) => acc + p.probability, 0);

        let totalWinnings = 0;
        for (let i = 0; i < 6; i++) {
            const randomRoll = Math.random();
            // First check if this cell is a winner at all
            if (randomRoll < tierWinChance) {
                // Determine WHICH prize it is based on relative weights of winning prizes
                let prizeRoll = Math.random() * totalWinProbability;
                
                for (let j = 0; j < winningPrizes.length; j++) {
                    const prize = winningPrizes[j];
                    prizeRoll -= prize.probability;
                    if (prizeRoll <= 0) {
                        totalWinnings += prize.value;
                        break;
                    }
                }
                // Fallback to smallest prize if loop finishes (rounding errors)
                if (totalWinnings === 0 && winningPrizes.length > 0) {
                     // Just in case
                     totalWinnings += winningPrizes[winningPrizes.length - 1].value;
                }
            }
        }
        return totalWinnings;
    };


    const buyScratchCard = useCallback((tierIndex: number) => {
        const tier = SCRATCH_CARD_TIERS[tierIndex];
        const price = getScratchCardPrice(tierIndex);

        if (!tier || unluckyPot < price) {
            showMsg('Pote de Azar insuficiente!', 2000, true);
            return;
        }
        setUnluckyPot(p => p - price);
        setScratchCardPurchaseCounts(p => ({ ...p, [tierIndex]: (p[tierIndex] || 0) + 1 }));

        const tierWinChance = getTierWinChance(tierIndex);
        const currentTierPrizes = getTierPrizes(tierIndex);
        
        // Correct probability handling for cell generation
        const winningPrizes = currentTierPrizes.filter(p => p.value > 0);
        const totalWinProbability = winningPrizes.reduce((acc, p) => acc + p.probability, 0);
    
        const newGrid: ScratchCardCell[] = Array.from({ length: 6 }, () => {
            const randomRoll = Math.random();
            let cellPrizeValue = 0;
    
            if (randomRoll < tierWinChance) {
                let prizeRoll = Math.random() * totalWinProbability;
                
                for (let i = 0; i < winningPrizes.length; i++) {
                    const prize = winningPrizes[i];
                    prizeRoll -= prize.probability;
                    if (prizeRoll <= 0) {
                        cellPrizeValue = prize.value;
                        break;
                    }
                }
                // Fallback
                if (cellPrizeValue === 0 && winningPrizes.length > 0) {
                    cellPrizeValue = winningPrizes[winningPrizes.length - 1].value;
                }
            }
    
            return { prize: cellPrizeValue, revealed: false };
        });
        
        setActiveCard({ tier, grid: newGrid });
        setWinnings(null);
    }, [unluckyPot, setUnluckyPot, showMsg, getScratchCardPrice, setScratchCardPurchaseCounts]);

    const buyMultipleScratchCards = useCallback((tierIndex: number, quantity: number) => {
        if (quantity <= 0) return;

        let totalCost = 0;
        let totalWinnings = 0;
        const tempPurchaseCounts = { ...scratchCardPurchaseCounts };
        const initialPurchaseCount = tempPurchaseCounts[tierIndex] || 0;

        // Calculate total cost considering additive inflation for each card individually
        for (let i = 0; i < quantity; i++) {
            const currentPurchaseCount = initialPurchaseCount + i;
            const cardCost = getScratchCardPrice(tierIndex, currentPurchaseCount);
            totalCost += cardCost;
            totalWinnings += generateSingleCardResult(tierIndex);
        }

        if (unluckyPot < totalCost) {
            showMsg(`Pote de Azar insuficiente para ${quantity} raspadinhas! Custo: $${totalCost.toFixed(2)}`, 3000, true);
            return;
        }

        setUnluckyPot(p => p - totalCost);
        setScratchCardPurchaseCounts(p => ({ ...p, [tierIndex]: (p[tierIndex] || 0) + quantity }));
        
        const finalWinnings = totalWinnings * totalIncomeMultiplier;
        handleGain(finalWinnings);

        setBulkResult({
            count: quantity,
            cost: totalCost,
            winnings: finalWinnings
        });

    }, [scratchCardPurchaseCounts, getScratchCardPrice, unluckyPot, totalIncomeMultiplier, setUnluckyPot, setScratchCardPurchaseCounts, handleGain, showMsg]);

    const revealSquare = useCallback((index: number) => {
        if (!activeCard || winnings !== null) return;
        setActiveCard(prev => {
            if (!prev) return null;
            const newGrid = [...prev.grid];
            if (newGrid[index].revealed) return prev;
            newGrid[index] = { ...newGrid[index], revealed: true };
            return { ...prev, grid: newGrid };
        });
    }, [activeCard, winnings]);

    const revealAll = useCallback(() => {
        if (!activeCard) return;
        const revealedGrid = activeCard.grid.map(cell => ({ ...cell, revealed: true }));
        
        const finalWinnings = revealedGrid.reduce((sum, cell) => sum + cell.prize, 0);

        setWinnings(finalWinnings);
        setActiveCard(prev => prev ? { ...prev, grid: revealedGrid } : null);
    }, [activeCard]);

    const closeCard = useCallback(() => {
        if (winnings === null) return;
        if (winnings > 0) {
            const finalWinnings = winnings * totalIncomeMultiplier;
            handleGain(finalWinnings);
            showMsg(`Você ganhou $${finalWinnings.toFixed(2)}!`, 3000);
        }
        setActiveCard(null);
        setWinnings(null);
    }, [winnings, handleGain, showMsg, totalIncomeMultiplier]);

    const closeBulkResultModal = useCallback(() => {
        setBulkResult(null);
    }, []);

    return {
        activeCard,
        winnings,
        bulkResult,
        getScratchCardPrice,
        buyScratchCard,
        revealSquare,
        revealAll,
        closeCard,
        buyMultipleScratchCards,
        closeBulkResultModal,
    };
};
