
import React, { useCallback } from 'react';
import { SYM, MID, MIDMAX, SUGAR_CONVERSION } from '../constants';
import type { SymbolKey, MidSymbolKey, Inventory, Multipliers, PanificadoraLevels, RoiSaldo, SkillId } from '../types';

interface ShopLogicProps {
    bal: number;
    inv: Inventory;
    setInv: React.Dispatch<React.SetStateAction<Inventory>>;
    mult: Multipliers;
    setMult: React.Dispatch<React.SetStateAction<Multipliers>>;
    roiSaldo: RoiSaldo;
    setRoiSaldo: React.Dispatch<React.SetStateAction<RoiSaldo>>;
    panificadoraLevel: PanificadoraLevels;
    setPanificadoraLevel: React.Dispatch<React.SetStateAction<PanificadoraLevels>>;
    estrelaPrecoAtual: number;
    setEstrelaPrecoAtual: React.Dispatch<React.SetStateAction<number>>;
    midMultiplierValue: (k: SymbolKey) => number;
    economiaCostMultiplier: number;
    getSkillLevel: (id: SkillId) => number;
    showMsg: (msg: string, duration?: number, isExtra?: boolean) => void;
    // Secondary skill props
    cashbackMultiplier: number;
    priceIncreaseModifier: number;
    multUpgradeBonus: number;
    // Snake game props
    isSnakeGameUnlocked: boolean;
    startSnakeGame: () => void;
    // Economy handler
    handleSpend: (cost: number) => boolean;
    // Furnace props
    setSugar: React.Dispatch<React.SetStateAction<number>>;
    // Momento Props for Meteor Lock
    momentoLevel: number;
}

export const useShopLogic = (props: ShopLogicProps) => {
    const {
        bal, inv, setInv, mult, setMult, roiSaldo, setRoiSaldo,
        panificadoraLevel, setPanificadoraLevel, estrelaPrecoAtual,
        setEstrelaPrecoAtual, midMultiplierValue, economiaCostMultiplier,
        getSkillLevel, showMsg,
        cashbackMultiplier, priceIncreaseModifier, multUpgradeBonus, handleSpend,
        setSugar, momentoLevel
    } = props;

    // ===== FIX #1: PREÇO DO ITEM METEORO =====
    const getPrice = useCallback((k: SymbolKey): number => {
        let price: number;
        
        if (k === '☄️') {
            const basePrice = SYM[k]?.p || 50;
            const currentInventory = inv[k] || 0;
            // UPDATE: Escala aumentada para 1.5x (era 1.25x)
            price = basePrice * Math.pow(1.5, currentInventory);
        } else if (k === '⭐') {
            price = estrelaPrecoAtual;
        } else if (k === '🪙') {
            // Ficha Price: Starts at 1, +1 per purchase (Linear)
            const count = inv[k] || 0;
            price = 1 + count;
        } else {
            const midConfig = { '🍭': { b: 2, i: 0.2 }, '🍦': { b: 3, i: 0.3 }, '🍧': { b: 4, i: 0.4 } };
            
            if (MID.includes(k as MidSymbolKey)) {
                const midSym = k as MidSymbolKey;
                // Preço linear modificado pelo priceIncreaseModifier (habilidade Desacelerômetro)
                price = midConfig[midSym].b + (inv[k] || 0) * (midConfig[midSym].i * priceIncreaseModifier);
            } else {
                // Outros itens mantêm sistema atual
                price = Math.max((inv[k] || 0) * (SYM[k]?.v || 0) * 2, SYM[k]?.p || 0);
            }
        }
        
        const finalPrice = isFinite(price) ? price : (SYM[k]?.p || 0);
        // Aplica desconto global da árvore de habilidades (Caminho da Economia)
        return finalPrice * economiaCostMultiplier;
    }, [inv, estrelaPrecoAtual, economiaCostMultiplier, priceIncreaseModifier]);

    const buy = useCallback((k: SymbolKey) => {
        // LOCK CHECK: Meteor requires Momento Level 10
        if (k === '☄️' && momentoLevel < 10) {
            // Visual feedback is handled in the UI component, but we double check logic here
            return;
        }

        const pr = getPrice(k);
        const cost = pr * (1 - cashbackMultiplier);
        
        if (handleSpend(cost)) {
            setInv(p => ({ ...p, [k]: (p[k] || 0) + 1 }));

            // NEW: Add Sugar instead of Saldo Diabético
            if (MID.includes(k as MidSymbolKey)) {
                const sugarAmount = SUGAR_CONVERSION[k as MidSymbolKey] || 0;
                setSugar(prev => prev + sugarAmount);
            }

            if (k === '⭐') {
                const priceIncrease = estrelaPrecoAtual; // dobra o preço base
                const modifiedIncrease = priceIncrease * priceIncreaseModifier;
                setEstrelaPrecoAtual(p => p + modifiedIncrease);
            }
        }
    }, [getPrice, cashbackMultiplier, handleSpend, setInv, setSugar, estrelaPrecoAtual, setEstrelaPrecoAtual, priceIncreaseModifier, momentoLevel]);

    // ===== FIX #2: PREÇO DO MULTIPLICADOR =====
    const multPrice = useCallback((sym: SymbolKey): number | null => {
        const currentMult = mult[sym] || 0;
        let price: number | null;

        if (sym === '☄️' && getSkillLevel('caminhoCometa') > 0) {
            // Linear $10, $20, $30...
            price = (Math.floor(currentMult) + 1) * 10;
        } else if (sym === '⭐' || sym === '☄️' || sym === '🪙') {
            return null;
        } else if (MID.includes(sym as MidSymbolKey)) {
            if (currentMult >= MIDMAX) return null;
            price = midMultiplierValue(sym) * 20;
        } else {
            price = (SYM[sym]?.v || 0) * Math.pow(1.5, currentMult) * priceIncreaseModifier;
        }
        
        const finalPrice = isFinite(price) && price > 0 ? price : null;
        if (finalPrice === null) return null;

        return finalPrice * economiaCostMultiplier;
    }, [mult, midMultiplierValue, economiaCostMultiplier, getSkillLevel, priceIncreaseModifier]);

    // ===== FIX #3: COMPRAR MULTIPLICADOR =====
    const buyMult = (k: SymbolKey) => {
        const price = multPrice(k);
        if (price === null) return;
        const cost = price * (1 - cashbackMultiplier);

        if (handleSpend(cost)) {
            const increase = 1.0 * (1 + multUpgradeBonus);
            setMult(p => ({...p, [k]: (p[k] || 0) + increase}));
        }
    };

    // DEPRECATED: Panificadora removed in v17
    const buyPanificadora = useCallback((d: MidSymbolKey) => {
       showMsg("A Panificadora foi fechada! Use a Fornalha.", 2000, true);
    }, [showMsg]);
    
    return {
        getPrice,
        buy,
        multPrice,
        buyMult,
        buyPanificadora,
    };
};
