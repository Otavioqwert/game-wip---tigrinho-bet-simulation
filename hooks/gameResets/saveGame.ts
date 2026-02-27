import { prepareSaveState } from '../../utils/feverStateIsolation';
import { getSaveKey, SAVE_VERSION } from './initialState';
import type { SavedState } from '../useGameState';
import type { SaveSlotId } from './initialState';

/**
 * Persiste o estado no localStorage de forma SÍNCRONA.
 * Recebe o slot explicitamente para nunca salvar no slot errado.
 */
export const persistGameState = (
    state: SavedState,
    slot: SaveSlotId,
    showMsg: (msg: string, d?: number, e?: boolean) => void,
    isManual = false
): void => {
    const { inv: safeInv, mult: safeMult } = prepareSaveState(
        state.inv,
        state.mult,
        state.feverSnapshot
    );

    const safeState = { ...state, inv: safeInv, mult: safeMult };
    const json      = JSON.stringify(safeState);
    const encoded   = btoa(unescape(encodeURIComponent(json)));
    const timestamp = Date.now();

    // Escrita síncrona — localStorage.setItem é bloqueante por spec
    localStorage.setItem(getSaveKey(slot), `V${SAVE_VERSION}:${timestamp}:${encoded}`);

    if (isManual) showMsg(`✅ Salvo no Slot ${slot}!`, 2000, true);
};

/**
 * Exporta o save atual como string (para backup / clone).
 * Garante que o snapshot do momento atual é exportado, não uma versão antiga.
 */
export const exportCurrentState = (
    state: SavedState,
    slot: SaveSlotId,
    showMsg: (msg: string, d?: number, e?: boolean) => void
): string => {
    persistGameState(state, slot, showMsg, false);
    return localStorage.getItem(getSaveKey(slot)) ?? '';
};
