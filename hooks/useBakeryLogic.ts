import React, { useCallback, useEffect, useMemo } from 'react';
import { BAKERY_PRODUCTS } from '../constants';
import type { BakeryState, BakeryProductId, CraftingSlot } from '../types';

interface BakeryLogicProps {
    sugar: number;
    setSugar: React.Dispatch<React.SetStateAction<number>>;
    bal: number;
    handleSpend: (cost: number) => boolean;
    handleGain: (amount: number) => void;
    bakeryState: BakeryState;
    setBakeryState: React.Dispatch<React.SetStateAction<BakeryState>>;
    showMsg: (msg: string, duration?: number, isExtra?: boolean) => void;
    applyFinalGain: (baseAmount: number) => number;
    priceIncreaseModifier: number; // NOVO: Modificador do Desacelerômetro
}

export const useBakeryLogic = (props: BakeryLogicProps) => {
    const { 
        sugar, setSugar, bal, handleSpend, handleGain, 
        bakeryState, setBakeryState, showMsg, applyFinalGain,
        priceIncreaseModifier // NOVO
    } = props;

    // --- UTILS: COST & TIME CALCULATORS ---

    const getProductUpgradeCost = useCallback((productId: BakeryProductId, currentLevel: number): number => {
        const product = BAKERY_PRODUCTS[productId];
        const base = product.upgradeCost;
        const increase = product.upgradeCostIncrease;
        
        // Aplica modifier no crescimento exponencial (1.25 base)
        const growthRate = 1 + ((1.25 - 1) * priceIncreaseModifier);
        
        return Math.floor(base * Math.pow(growthRate, currentLevel) + (increase * currentLevel * priceIncreaseModifier));
    }, [priceIncreaseModifier]);

    const calculateProductPassiveIncome = useCallback((productId: BakeryProductId, count: number, level: number): number => {
        const product = BAKERY_PRODUCTS[productId];
        const basePassive = product.passiveIncome * count;
        const multiplier = 1 + (product.upgradeBonus * level);
        return basePassive * multiplier;
    }, []);

    const getExtraSlotCost = useCallback((currentExtraSlots: number): number => {
        // Base: 1 slot inicial. Level 0 extra = 1 slot total.
        // Cost starts at 3000 for 2nd slot (level 0 -> 1)
        // Aplica modifier no crescimento exponencial (2.0 base)
        const growthRate = 1 + ((2.0 - 1) * priceIncreaseModifier);
        return Math.floor(3000 * Math.pow(growthRate, currentExtraSlots));
    }, [priceIncreaseModifier]);

    const getSpeedUpgradeCost = useCallback((level: number): number => {
        // Curva quadrática com modifier aplicado nos fatores de crescimento
        const base = 2000;
        const linearFactor = 1500 * priceIncreaseModifier;
        const quadraticFactor = 300 * priceIncreaseModifier;
        return Math.floor(base + (linearFactor * level) + (quadraticFactor * level * level));
    }, [priceIncreaseModifier]);

    const calculateSpeedDiscount = useCallback((level: number): number => {
        let remaining = 1.0;
        for (let i = 1; i <= level; i++) {
            remaining *= (1 - i / 100);
        }
        return 1 - remaining;
    }, []);

    const getModifiedCraftTime = useCallback((baseTime: number, speedLevel: number): number => {
        const discount = calculateSpeedDiscount(speedLevel);
        return baseTime * (1 - discount);
    }, [calculateSpeedDiscount]);

    // --- CRAFTING LOGIC ---

    const startCraft = useCallback((productId: BakeryProductId, quantity: number = 1) => {
        const product = BAKERY_PRODUCTS[productId];
        const totalCost = product.craftCost * quantity;

        if (sugar < totalCost) {
            showMsg(`Açúcar insuficiente! Requer ${totalCost} 🍬`, 2000, true);
            return;
        }

        const freeSlotIndex = bakeryState.craftingSlots.findIndex(s => s.productId === null);
        if (freeSlotIndex === -1) {
            showMsg("Todos os fornos ocupados!", 2000, true);
            return;
        }

        setSugar(prev => prev - totalCost);

        const baseCraftTime = product.craftTime * 1000;
        const finalTime = getModifiedCraftTime(baseCraftTime, bakeryState.speedLevel);
        const now = Date.now();

        setBakeryState(prev => {
            const newSlots = [...prev.craftingSlots];
            newSlots[freeSlotIndex] = {
                ...newSlots[freeSlotIndex],
                productId: productId,
                startTime: now,
                endTime: now + finalTime,
                quantity: quantity
            };
            return { ...prev, craftingSlots: newSlots };
        });
        
        showMsg(`Assando ${quantity}x ${product.name}...`, 1500);

    }, [sugar, bakeryState.craftingSlots, bakeryState.speedLevel, setSugar, setBakeryState, showMsg, getModifiedCraftTime]);

    // --- TICK LOOP (Completion & Passive Income) ---

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            let stateChanged = false;
            const completedItems: Partial<Record<BakeryProductId, number>> = {};

            // 1. Check Crafting Completion
            const newSlots = bakeryState.craftingSlots.map(slot => {
                if (slot.productId && slot.endTime && now >= slot.endTime) {
                    completedItems[slot.productId] = (completedItems[slot.productId] || 0) + slot.quantity;
                    stateChanged = true;
                    // Reset slot
                    return { ...slot, productId: null, startTime: null, endTime: null, quantity: 0 } as CraftingSlot;
                }
                return slot;
            });

            // 2. Calculate Passive Income
            let totalPassive = 0;
            (Object.keys(BAKERY_PRODUCTS) as BakeryProductId[]).forEach(pid => {
                const count = bakeryState.inventory[pid] || 0;
                // Add completed items to count for this tick? No, update state first.
                const level = bakeryState.upgradeLevels[pid] || 0;
                totalPassive += calculateProductPassiveIncome(pid, count, level);
            });

            if (totalPassive > 0) {
                const finalIncome = applyFinalGain(totalPassive);
                handleGain(finalIncome);
            }

            // 3. Update State if needed
            if (stateChanged) {
                setBakeryState(prev => {
                    const newInventory = { ...prev.inventory };
                    Object.entries(completedItems).forEach(([pid, qty]) => {
                        const id = pid as BakeryProductId;
                        newInventory[id] = (newInventory[id] || 0) + qty;
                    });
                    
                    // Show message for completion
                    const completedNames = Object.keys(completedItems).map(id => BAKERY_PRODUCTS[id as BakeryProductId].name).join(', ');
                    // To avoid spam, maybe don't show msg here, or only show concise.
                    // showMsg(`Pronto: ${completedNames}`, 2000, true); 

                    return { ...prev, craftingSlots: newSlots, inventory: newInventory };
                });
            }

        }, 1000);

        return () => clearInterval(interval);
    }, [bakeryState, setBakeryState, handleGain, applyFinalGain, calculateProductPassiveIncome, showMsg]);

    // --- SELLING & UPGRADES ---

    const sellProduct = useCallback((productId: BakeryProductId, quantity: number) => {
        const available = bakeryState.inventory[productId] || 0;
        if (quantity > available) return;

        const product = BAKERY_PRODUCTS[productId];
        const totalValue = product.sellPrice * quantity;
        
        // Aplica modificadores de ganho (Grande Ganho / Hidra)
        const finalValue = applyFinalGain(totalValue);

        setBakeryState(prev => ({
            ...prev,
            inventory: { ...prev.inventory, [productId]: prev.inventory[productId] - quantity }
        }));

        handleGain(finalValue);
        showMsg(`Vendeu ${quantity}x ${product.name} por $${finalValue.toFixed(2)}!`, 2000, true);
    }, [bakeryState.inventory, setBakeryState, handleGain, applyFinalGain, showMsg]);

    const buyProductUpgrade = useCallback((productId: BakeryProductId) => {
        const currentLevel = bakeryState.upgradeLevels[productId] || 0;
        const cost = getProductUpgradeCost(productId, currentLevel);

        if (handleSpend(cost)) {
            setBakeryState(prev => ({
                ...prev,
                upgradeLevels: { ...prev.upgradeLevels, [productId]: (prev.upgradeLevels[productId] || 0) + 1 }
            }));
            showMsg(`Upgrade ${BAKERY_PRODUCTS[productId].name} para Nível ${currentLevel + 1}!`, 2000, true);
        }
    }, [bakeryState.upgradeLevels, getProductUpgradeCost, handleSpend, setBakeryState, showMsg]);

    const buyExtraSlot = useCallback(() => {
        const cost = getExtraSlotCost(bakeryState.extraSlots);
        if (bakeryState.extraSlots >= 8) { // Max 9 slots total (1 base + 8 extra)
             showMsg("Máximo de fornos atingido!", 2000, true);
             return;
        }

        if (handleSpend(cost)) {
            setBakeryState(prev => {
                const newSlotId = prev.craftingSlots.length;
                return {
                    ...prev,
                    extraSlots: prev.extraSlots + 1,
                    craftingSlots: [...prev.craftingSlots, { id: newSlotId, productId: null, startTime: null, endTime: null, quantity: 0 }]
                };
            });
            showMsg("Novo forno adquirido!", 2000, true);
        }
    }, [bakeryState.extraSlots, getExtraSlotCost, handleSpend, setBakeryState, showMsg]);

    const buySpeedUpgrade = useCallback(() => {
        const cost = getSpeedUpgradeCost(bakeryState.speedLevel);
        if (bakeryState.speedLevel >= 20) {
            showMsg("Velocidade máxima atingida!", 2000, true);
            return;
        }

        if (handleSpend(cost)) {
            setBakeryState(prev => ({ ...prev, speedLevel: prev.speedLevel + 1 }));
            showMsg("Velocidade da cozinha aumentada!", 2000, true);
        }
    }, [bakeryState.speedLevel, getSpeedUpgradeCost, handleSpend, setBakeryState, showMsg]);

    // Calculate total passive income for display
    const currentPassiveIncome = useMemo(() => {
        let total = 0;
        (Object.keys(BAKERY_PRODUCTS) as BakeryProductId[]).forEach(pid => {
            const count = bakeryState.inventory[pid] || 0;
            const level = bakeryState.upgradeLevels[pid] || 0;
            total += calculateProductPassiveIncome(pid, count, level);
        });
        return applyFinalGain(total);
    }, [bakeryState.inventory, bakeryState.upgradeLevels, calculateProductPassiveIncome, applyFinalGain]);

    return {
        startCraft,
        sellProduct,
        buyProductUpgrade,
        buyExtraSlot,
        buySpeedUpgrade,
        getProductUpgradeCost,
        getExtraSlotCost,
        getSpeedUpgradeCost,
        getModifiedCraftTime,
        calculateSpeedDiscount,
        calculateProductPassiveIncome,
        currentPassiveIncome
    };
};