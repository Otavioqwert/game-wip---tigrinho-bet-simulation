import { SAVE_KEY } from './initialState';

/**
 * Apaga o save do localStorage.
 * Quem chamar deve aplicar getInitialState() ao setState depois.
 */
export const clearSaveFromStorage = () => {
    localStorage.removeItem(SAVE_KEY);
};

/**
 * Sobrescreve o save com dados externos (importar save).
 * Retorna true para sinalizar sucesso ao chamador.
 */
export const importSaveToStorage = (encodedData: string): boolean => {
    try {
        localStorage.setItem(SAVE_KEY, encodedData);
        return true;
    } catch (e) {
        console.error('[importSave] Falha ao escrever no localStorage:', e);
        return false;
    }
};
