import { getSaveKey } from './initialState';
import type { SaveSlotId } from './initialState';

/** Apaga o save de um slot específico do localStorage. */
export const clearSaveFromStorage = (slot: SaveSlotId): void => {
    localStorage.removeItem(getSaveKey(slot));
};

/**
 * Sobrescreve o slot com dados externos (importar save).
 * Retorna true em caso de sucesso.
 */
export const importSaveToStorage = (slot: SaveSlotId, encodedData: string): boolean => {
    try {
        localStorage.setItem(getSaveKey(slot), encodedData);
        return true;
    } catch (e) {
        console.error(`[importSave] Falha ao escrever no slot ${slot}:`, e);
        return false;
    }
};
