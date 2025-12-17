
import React, { useCallback, useState } from 'react';
import { SYM, MID, MIDMAX, SUGAR_CONVERSION } from '../constants';
import type { SymbolKey, MidSymbolKey, Inventory, Multipliers, PanificadoraLevels, RoiSaldo, SkillId, TokenFlipState } from '../types';

interface ShopLogicProps {
    bal: number;
    inv: Inventory;
    setInv: React.Dispatch<React.SetStateAction<Inventory>>;
    mult: Multipliers;
    setMult: React.Dispatch<React.SetStateAction<Multipliers>>;
    bonusMult: Multipliers;
    setBonusMult: React.Dispatch<React.SetStateAction<Multipliers>>;
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
    cashbackMultiplier: number;
    priceIncreaseModifier: number;
    multUpgradeBonus: number;
    isSnakeGameUnlocked: boolean;
    startSnakeGame: () => void;
    handleSpend: (cost: number) => boolean;
    handleGain: (amount: number) => void;
    setSugar: React.Dispatch<React.SetStateAction<number>>;
    momentoLevel: number;
    totalTokenPurchases: number;
    setTotalTokenPurchases: React.Dispatch<React.SetStateAction<number>>;
    mortgageUsages: number;
    setMortgageUsages: React.Dispatch<React.SetStateAction<number>>;
    sugar: number;
}

export const useShopLogic = (props: ShopLogicProps) => {
    const {
        bal, inv, setInv, mult, setMult, bonusMult, setBonusMult, roiSaldo, setRoiSaldo,
        panificadoraLevel, setPanificadoraLevel, estrelaPrecoAtual,
        setEstrelaPrecoAtual, midMultiplierValue, economiaCostMultiplier,
        getSkillLevel, showMsg,
        cashbackMultiplier, priceIncreaseModifier, multUpgradeBonus, handleSpend, handleGain,
        setSugar, momentoLevel, totalTokenPurchases, setTotalTokenPurchases,
        mortgageUsages, setMortgageUsages, sugar
    } = props;

    const [tokenFlipState, setTokenFlipState] = useState<TokenFlipState>({
        isActive: false, results: [], tokenValue: 0
    });

    const getPrice = useCallback((k: SymbolKey): number => {
        let price: number;
        if (k === '☄️') price = (SYM[k]?.p || 50) * Math.pow(1.5, inv[k] || 0);
        else if (k === '⭐') price = estrelaPrecoAtual;
        else if (k === '🪙') price = 1 + totalTokenPurchases;
        else {
            const midConfig = { '🍭': { b: 2, i: 0.2 }, '🍦': { b: 3, i: 0.3 }, '🍧': { b: 4, i: 0.4 } };
            if (MID.includes(k as MidSymbolKey)) {
                const midSym = k as MidSymbolKey;
                price = midConfig[midSym].b + (inv[k] || 0) * (midConfig[midSym].i * priceIncreaseModifier);
            } else price = Math.max((inv[k] || 0) * (SYM[k]?.v || 0) * 2, SYM[k]?.p || 0);
        }
        return price * economiaCostMultiplier;
    }, [inv, estrelaPrecoAtual, economiaCostMultiplier, priceIncreaseModifier, totalTokenPurchases]);

    const buy = useCallback((k: SymbolKey) => {
        if (k === '☄️' && momentoLevel < 10) return;
        const pr = getPrice(k);
        if (handleSpend(pr * (1 - cashbackMultiplier))) {
            setInv(p => ({ ...p, [k]: (p[k] || 0) + 1 }));
            if (MID.includes(k as MidSymbolKey)) setSugar(prev => prev + (SUGAR_CONVERSION[k as MidSymbolKey] || 0));
            if (k === '⭐') setEstrelaPrecoAtual(p => p + (estrelaPrecoAtual * priceIncreaseModifier));
            if (k === '🪙') setTotalTokenPurchases(p => p + 1);
        }
    }, [getPrice, cashbackMultiplier, handleSpend, setInv, setSugar, estrelaPrecoAtual, setEstrelaPrecoAtual, priceIncreaseModifier, momentoLevel, setTotalTokenPurchases]);

    const buyWithSugar = useCallback((k: SymbolKey) => {
        const sugarCosts: Partial<Record<SymbolKey, number>> = { '🍀': 1, '💵': 2, '💎': 4, '🐯': 8 };
        const sCost = sugarCosts[k];
        if (!sCost) return;
        if (sugar < sCost) { showMsg(`Açúcar insuficiente! Requer ${sCost} 🍬`, 1000, true); return; }
        const totalPenalty = sCost * (100 + (mortgageUsages * 50));
        if (handleSpend(totalPenalty)) {
            setSugar(prev => prev - sCost); setInv(p => ({ ...p, [k]: (p[k] || 0) + 1 })); setMortgageUsages(p => p + 1);
            showMsg(`Hipoteca aceita! ${k} adquirido. -$${totalPenalty.toFixed(0)}`, 2000, true);
        } else showMsg("❌ Hipoteca negada: Saldo/Crédito insuficiente!", 1000, true);
    }, [sugar, mortgageUsages, setSugar, handleSpend, setInv, setMortgageUsages, showMsg]);

    const sellMeteor = useCallback(() => {
        const meteorCount = inv['☄️'] || 0;
        if (meteorCount <= 0) return;
        const lastBoughtPrice = (SYM['☄️']?.p || 50) * Math.pow(1.5, Math.max(0, meteorCount - 1));
        const refundAmount = lastBoughtPrice * 0.5 * economiaCostMultiplier; 
        setInv(p => ({ ...p, '☄️': Math.max(0, (p['☄️'] || 0) - 1) }));
        handleGain(refundAmount);
        showMsg(`Meteoro vendido! +$${refundAmount.toFixed(2)}`, 3000, true);
    }, [inv, handleGain, showMsg, economiaCostMultiplier]);

    const flipTokens = useCallback((amount: number) => {
        const owned = inv['🪙'] || 0;
        if (owned < amount) return;
        const currentPrice = getPrice('🪙');
        const results = Array.from({ length: amount }, () => Math.random() < 0.5);
        setInv(prev => ({ ...prev, '🪙': (prev['🪙'] || 0) - amount }));
        setTokenFlipState({ isActive: true, results, tokenValue: currentPrice });
    }, [inv, getPrice, setInv]);

    const closeTokenFlip = useCallback((totalWinnings: number) => {
        if (totalWinnings > 0) handleGain(totalWinnings);
        setTokenFlipState(prev => ({ ...prev, isActive: false }));
    }, [handleGain]);

    const multPrice = useCallback((sym: SymbolKey): number | null => {
        const currentMult = mult[sym] || 0;
        let price: number | null;
        if (sym === '☄️' && getSkillLevel('caminhoCometa') > 0) price = (Math.floor(currentMult) + 1) * 10;
        else if (sym === '⭐' || sym === '☄️' || sym === '🪙') return null;
        else if (MID.includes(sym as MidSymbolKey)) {
            if (currentMult >= MIDMAX) return null;
            price = midMultiplierValue(sym) * 20;
        } else price = (SYM[sym]?.v || 0) * Math.pow(1.5, currentMult) * priceIncreaseModifier;
        return (isFinite(price) && price > 0) ? price * economiaCostMultiplier : null;
    }, [mult, midMultiplierValue, economiaCostMultiplier, getSkillLevel, priceIncreaseModifier]);

    const buyMult = (k: SymbolKey) => {
        const price = multPrice(k);
        if (price !== null && handleSpend(price * (1 - cashbackMultiplier))) {
            // COMPRA LIMPA: Apenas incrementa o nível comprado. O bônus de Incremento é somado dinamicamente no cálculo.
            setMult(p => ({...p, [k]: (p[k] || 0) + 1}));
        }
    };

    return { getPrice, buy, buyWithSugar, sellMeteor, multPrice, buyMult, flipTokens, tokenFlipState, closeTokenFlip };
};
