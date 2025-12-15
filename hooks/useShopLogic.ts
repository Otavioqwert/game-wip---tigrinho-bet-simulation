
import React, { useCallback } from 'react';
import { SYM, MID, MIDMAX } from '../constants';
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
}

export const useShopLogic = (props: ShopLogicProps) => {
    const {
        bal, inv, setInv, mult, setMult, roiSaldo, setRoiSaldo,
        panificadoraLevel, setPanificadoraLevel, estrelaPrecoAtual,
        setEstrelaPrecoAtual, midMultiplierValue, economiaCostMultiplier,
        getSkillLevel, showMsg,
        cashbackMultiplier, priceIncreaseModifier, multUpgradeBonus, handleSpend
    } = props;

    // ===== FIX #1: PREÇO DO ITEM METEORO =====
    const getPrice = useCallback((k: SymbolKey): number => {
        let price: number;
        
        if (k === '☄️') {
            const basePrice = SYM[k]?.p || 50;
            const currentInventory = inv[k] || 0;
            // Exponencial 1.25x por compra
            // Progressão: $50 -> $64 -> $80 -> $100...
            price = basePrice * Math.pow(1.25, currentInventory);
        } else if (k === '⭐') {
            price = estrelaPrecoAtual;
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
        // NOTA: Para o meteoro, aplicamos apenas o desconto de economia, 
        // o priceIncreaseModifier (Desacelerômetro) foi removido da fórmula do meteoro para manter a curva 1.25x pura ou pode ser aplicado no final.
        // Aqui aplicamos no final para consistência, mas o meteoro já tem sua curva própria.
        return finalPrice * economiaCostMultiplier;
    }, [inv, estrelaPrecoAtual, economiaCostMultiplier, priceIncreaseModifier]);

    const buy = useCallback((k: SymbolKey) => {
        const pr = getPrice(k);
        const cost = pr * (1 - cashbackMultiplier);
        
        if (handleSpend(cost)) {
            setInv(p => ({ ...p, [k]: (p[k] || 0) + 1 }));

            if (k === '⭐') {
                const priceIncrease = estrelaPrecoAtual; // dobra o preço base
                const modifiedIncrease = priceIncrease * priceIncreaseModifier;
                setEstrelaPrecoAtual(p => p + modifiedIncrease);
            }
        }
    }, [getPrice, cashbackMultiplier, handleSpend, setInv, estrelaPrecoAtual, setEstrelaPrecoAtual, priceIncreaseModifier]);

    // ===== FIX #2: PREÇO DO MULTIPLICADOR =====
    const multPrice = useCallback((sym: SymbolKey): number | null => {
        const currentMult = mult[sym] || 0;
        let price: number | null;

        if (sym === '☄️' && getSkillLevel('caminhoCometa') > 0) {
            // Linear $10, $20, $30...
            // Evita exploit de redução de preço e mantém escala justa
            price = (Math.floor(currentMult) + 1) * 10;
        } else if (sym === '⭐' || sym === '☄️') {
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
            // Sempre +1% fixo (ou +1 nível)
            // Removemos lógicas complexas que causavam explosão exponencial
            const increase = 1.0 * (1 + multUpgradeBonus);
            setMult(p => ({...p, [k]: (p[k] || 0) + increase}));
        }
    };

    const buyPanificadora = useCallback((d: MidSymbolKey) => {
        const cost = 1 + Math.floor(((panificadoraLevel[d] || 0) + 1) / 3);
        if ((roiSaldo[d] || 0) < cost) return showMsg(`Precisa de ${cost} ${d} no saldo diabético.`, 3000, true);
        
        setRoiSaldo(p => ({...p, [d]: (p[d] || 0) - cost}));
        setPanificadoraLevel(p => ({...p, [d]: (p[d] || 0) + 1}));
        showMsg(`${d} Panificadora +1 nível!`, 3000, true);
    }, [panificadoraLevel, roiSaldo, showMsg, setRoiSaldo, setPanificadoraLevel]);
    
    return {
        getPrice,
        buy,
        multPrice,
        buyMult,
        buyPanificadora,
    };
};
