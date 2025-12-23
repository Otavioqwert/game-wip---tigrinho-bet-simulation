import type { Inventory, Multipliers } from '../types';

/**
 * Fever State Isolation Utility
 * 
 * Este utilitário separa o estado da Febre do estado principal do jogo,
 * evitando que o inventário/multiplicadores da febre vazem para o save normal.
 */

export interface FeverSnapshot {
    originalInv: Inventory | null;
    originalMult: Multipliers | null;
    feverInv: Inventory | null;
    feverMult: Multipliers | null;
    isActive: boolean;
}

export const EMPTY_FEVER_SNAPSHOT: FeverSnapshot = {
    originalInv: null,
    originalMult: null,
    feverInv: null,
    feverMult: null,
    isActive: false
};

/**
 * Captura o estado atual antes de iniciar a febre
 */
export const createFeverSnapshot = (
    currentInv: Inventory,
    currentMult: Multipliers,
    feverInv: Inventory,
    feverMult: Multipliers
): FeverSnapshot => ({
    originalInv: { ...currentInv },
    originalMult: { ...currentMult },
    feverInv: { ...feverInv },
    feverMult: { ...feverMult },
    isActive: true
});

/**
 * Restaura o estado original após a febre terminar
 */
export const restoreFromSnapshot = (snapshot: FeverSnapshot): {
    inv: Inventory;
    mult: Multipliers;
} | null => {
    if (!snapshot.originalInv || !snapshot.originalMult) return null;
    return {
        inv: { ...snapshot.originalInv },
        mult: { ...snapshot.originalMult }
    };
};

/**
 * Valida se o snapshot atual é consistente com o estado de febre
 * (Previne corrupção de dados)
 */
export const validateFeverSnapshot = (snapshot: FeverSnapshot, isFebreActive: boolean): boolean => {
    if (isFebreActive && !snapshot.isActive) return false;
    if (!isFebreActive && snapshot.isActive) return false;
    if (snapshot.isActive && (!snapshot.originalInv || !snapshot.originalMult)) return false;
    return true;
};

/**
 * Prepara o estado para salvamento, garantindo que inv/mult corretos sejam persistidos
 */
export const prepareSaveState = (
    currentInv: Inventory,
    currentMult: Multipliers,
    snapshot: FeverSnapshot
): { inv: Inventory; mult: Multipliers } => {
    // Se a febre está ativa, salva o inventário ORIGINAL, não o da febre
    if (snapshot.isActive && snapshot.originalInv && snapshot.originalMult) {
        return {
            inv: { ...snapshot.originalInv },
            mult: { ...snapshot.originalMult }
        };
    }
    // Caso contrário, salva o estado atual normalmente
    return {
        inv: { ...currentInv },
        mult: { ...currentMult }
    };
};
