
import type { SymbolKey, Inventory, MidSymbolKey } from '../types';
import { SYM, MID, MID_BASE, MID_STEP } from '../constants';

// --- ALGORITMO OTIMIZADO DE SELEÇÃO (SNAPSHOT) ---

export interface WeightSnapshot {
    keys: SymbolKey[];
    cumulativeWeights: number[];
    totalWeight: number;
}

// Cria um "mapa" estático das probabilidades atuais.
// Executado UMA vez antes do loop de 90 giros.
export const createWeightSnapshot = (inv: Inventory, availableKeys: SymbolKey[]): WeightSnapshot => {
    const keys: SymbolKey[] = [];
    const cumulativeWeights: number[] = [];
    let totalWeight = 0;

    for (const key of availableKeys) {
        const count = inv[key] || 0;
        if (count > 0) {
            totalWeight += count;
            keys.push(key);
            cumulativeWeights.push(totalWeight);
        }
    }

    return { keys, cumulativeWeights, totalWeight };
};

// Sorteio ultra-rápido baseado no snapshot.
// Substitui o loop pesado dentro do while.
export const spinFromSnapshot = (snapshot: WeightSnapshot): SymbolKey => {
    if (snapshot.totalWeight === 0) return '🍭';

    const randomValue = Math.random() * snapshot.totalWeight;
    
    // Busca (Linear é ok para N pequeno < 20, para N > 100 seria melhor binária)
    // Como temos poucos símbolos únicos, um loop simples é extremamente rápido aqui.
    for (let i = 0; i < snapshot.cumulativeWeights.length; i++) {
        if (randomValue < snapshot.cumulativeWeights[i]) {
            return snapshot.keys[i];
        }
    }

    return snapshot.keys[snapshot.keys.length - 1] || '🍭';
};

// --- CÁLCULOS ANTIGOS (Mantidos para retrocompatibilidade de giro único) ---

export const getRandomSymbolFromInventory = (inv: Inventory, availableKeys: SymbolKey[]): SymbolKey => {
    let totalWeight = 0;
    const validKeys = availableKeys.filter(k => (inv[k] || 0) > 0);
    
    for (const k of validKeys) {
        totalWeight += (inv[k] || 0);
    }

    if (totalWeight === 0) return '🍭';

    let randomValue = Math.random() * totalWeight;

    for (const k of validKeys) {
        const count = inv[k] || 0;
        if (randomValue < count) {
            return k;
        }
        randomValue -= count;
    }

    return validKeys[validKeys.length - 1] || '🍭';
};

export const calculateMidMultiplierValue = (sym: SymbolKey, mult: Record<string, number>): number => {
    const multLevel = mult[sym] || 0;
    if (sym === '☄️') {
        const baseValue = SYM[sym]?.v || 64;
        return baseValue * Math.pow(1.01, multLevel);
    }
    if (MID.includes(sym as MidSymbolKey)) {
        const midSym = sym as MidSymbolKey;
        const v = (MID_BASE[midSym] * Math.pow(MID_STEP[midSym], multLevel));
        return isFinite(v) ? Number(v.toFixed(4)) : 0;
    }
    const val = (SYM[sym]?.v || 0) * (1 + multLevel * 0.25);
    return isFinite(val) ? Number(val.toFixed(4)) : 0;
};
