import { prepareSaveState } from '../../utils/feverStateIsolation';
import { SAVE_KEY, SAVE_VERSION } from './initialState';
import type { SavedState } from '../useGameState';

/**
 * Serializa e persiste o estado no localStorage.
 * Se isManual = true, exibe mensagem de confirmação.
 */
export const persistGameState = (
    state: SavedState,
    showMsg: (msg: string, d?: number, e?: boolean) => void,
    isManual = false
) => {
    // Isola o estado da febre antes de salvar
    const { inv: safeInv, mult: safeMult } = prepareSaveState(
        state.inv,
        state.mult,
        state.feverSnapshot
    );

    const safeState = { ...state, inv: safeInv, mult: safeMult };
    const json      = JSON.stringify(safeState);
    const encoded   = btoa(unescape(encodeURIComponent(json)));
    const timestamp = Date.now();

    localStorage.setItem(SAVE_KEY, `V${SAVE_VERSION}:${timestamp}:${encoded}`);

    if (isManual) showMsg('✅ Jogo salvo!', 2000, true);
};
