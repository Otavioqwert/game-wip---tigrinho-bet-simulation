// Fix: Import React to resolve 'Cannot find namespace React' error in type annotations.
import React, { useState, useCallback, useRef } from 'react';
import type { RoiSaldo, Inventory, SymbolKey } from '../types';
import { MID, INITIAL_INVENTORY } from '../constants';

interface FebreDoceProps {
    roiSaldo: RoiSaldo;
    setRoiSaldo: React.Dispatch<React.SetStateAction<RoiSaldo>>;
    inv: Inventory;
    setInv: React.Dispatch<React.SetStateAction<Inventory>>;
    showMsg: (msg: string, duration?: number, isExtra?: boolean) => void;
}

export const useFebreDoce = (props: FebreDoceProps) => {
    const { roiSaldo, setRoiSaldo, inv, setInv, showMsg } = props;

    const [febreDocesAtivo, setFebreDocesAtivo] = useState(false);
    const [febreDocesGiros, setFebreDocesGiros] = useState(0);
    const [betValFebre, setBetValFebre] = useState(0);
    const originalState = useRef<{ inv: Inventory | null }>({ inv: null });

    const criarEmbaixadorDoce = useCallback(() => {
        if (febreDocesAtivo) return showMsg('Febre já ativa!', 3000, true);
        if (!MID.every(d => (roiSaldo[d] || 0) >= 10)) return showMsg('Precisa de 10 de saldo diabético de cada doce!', 3000, true);

        // 1. Save original inventory
        originalState.current.inv = { ...inv };

        const newRoiSaldo = { ...roiSaldo };
        MID.forEach(d => { newRoiSaldo[d] = (newRoiSaldo[d] || 0) - 10; });
        setRoiSaldo(newRoiSaldo);

        // 2. Set special Febre Doce inventory, zeroing out others
        const febreInventory: Inventory = {
            ...(Object.keys(INITIAL_INVENTORY) as SymbolKey[]).reduce((acc, key) => ({ ...acc, [key]: 0 }), {} as Inventory),
            '🍭': 10,
            '🍦': 10,
            '🍧': 10,
            '⭐': 10,
        };
        setInv(febreInventory);

        const newBetValFebre = 10;
        setBetValFebre(newBetValFebre);
        setFebreDocesAtivo(true);
        setFebreDocesGiros(20);
        showMsg(`EMBAIXADOR DOCE! 20 spins grátis de $ ${newBetValFebre.toFixed(2)}.`, 5000, true);
    }, [febreDocesAtivo, roiSaldo, inv, showMsg, setRoiSaldo, setInv]);

    const restoreOriginalState = useCallback(() => {
        if (originalState.current.inv) {
            setInv(originalState.current.inv);
            originalState.current.inv = null;
        }
    }, [setInv]);

    return {
        febreDocesAtivo,
        setFebreDocesAtivo,
        febreDocesGiros,
        setFebreDocesGiros,
        betValFebre,
        criarEmbaixadorDoce,
        restoreOriginalState,
    };
};
