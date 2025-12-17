
import type { Inventory, SymbolKey } from '../types';
import { SYM, MID } from '../constants';

export interface PoolDensityMetrics {
    totalItems: number;
    uniqueSymbols: number;
    meteorCount: number;
    sweetCount: number;
    hitChance: number; // Chance aproximada de qualquer linha (0-100)
    healthStatus: 'healthy' | 'warning' | 'critical';
    symbolChances: Record<string, number>; // Chance de 1 linha específica desse símbolo
}

export const calculatePoolDensity = (inv: Inventory): PoolDensityMetrics => {
    let totalItems = 0;
    let uniqueSymbols = 0;
    let meteorCount = 0;
    let sweetCount = 0;
    const symbolChances: Record<string, number> = {};

    // 1. Contagem básica
    (Object.keys(inv) as SymbolKey[]).forEach(key => {
        const count = inv[key] || 0;
        if (count > 0) {
            totalItems += count;
            uniqueSymbols++;
            
            if (key === '☄️') meteorCount += count;
            if (MID.includes(key as any)) sweetCount += count;
        }
    });

    // Evitar divisão por zero
    if (totalItems === 0) {
        return {
            totalItems: 0,
            uniqueSymbols: 0,
            meteorCount: 0,
            sweetCount: 0,
            hitChance: 0,
            healthStatus: 'critical',
            symbolChances: {}
        };
    }

    // 2. Cálculo de Probabilidade (Simplificado para UX)
    // Chance de uma linha específica ser Símbolo X = (CountX / Total)^3
    // Chance Global de Hit = Soma das chances individuais * 8 linhas (aproximação)
    
    let sumCubeProbs = 0;

    (Object.keys(inv) as SymbolKey[]).forEach(key => {
        const count = inv[key] || 0;
        if (count > 0) {
            const probSingleSlot = count / totalItems;
            const probLine = Math.pow(probSingleSlot, 3);
            symbolChances[key] = probLine;
            sumCubeProbs += probLine;
        }
    });

    // Multiplica por 8 linhas (Horizontais, Verticais, Diagonais)
    // Nota: Isso é uma aproximação (soma de probabilidades), matematicamente não é exato para "pelo menos 1 linha",
    // mas serve perfeitamente como métrica de "Score de Sorte" para o jogador.
    const hitChance = Math.min(100, sumCubeProbs * 8 * 100);

    // 3. Determinar Status
    let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';

    if (hitChance < 5) {
        healthStatus = 'critical';
    } else if (hitChance < 15) {
        healthStatus = 'warning';
    }

    // Se tiver muitos meteoros sem base de doces, força warning/critical
    const ratio = meteorCount > 0 ? sweetCount / meteorCount : 999;
    if (meteorCount > 0 && ratio < 10) healthStatus = 'warning';
    if (meteorCount > 0 && ratio < 5) healthStatus = 'critical';

    return {
        totalItems,
        uniqueSymbols,
        meteorCount,
        sweetCount,
        hitChance,
        healthStatus,
        symbolChances
    };
};
