import { calculateMomentumLevel } from '../../utils/mechanics/momentumCalculator';
import { EMPTY_FEVER_SNAPSHOT } from '../../utils/feverStateIsolation';
import { getSaveKey, getInitialState, validateAndFixCraftingSlots } from './initialState';
import type { SavedState } from '../useGameState';
import type { SaveSlotId } from './initialState';

/**
 * Carrega e migra o save de um slot específico.
 * Retorna null se o slot estiver vazio ou corrompido.
 */
export const loadGameFromStorage = (slot: SaveSlotId = 0): SavedState | null => {
    const raw = localStorage.getItem(getSaveKey(slot));
    if (!raw || !raw.startsWith('V')) return null;

    try {
        const parts = raw.split(':');
        if (parts.length < 3) return null;

        const version = parseInt(parts[0].slice(1), 10) || 0;
        const decoded = JSON.parse(decodeURIComponent(escape(atob(parts[2]))));

        const merged: SavedState = { ...getInitialState(), ...decoded };

        if (decoded.bakery)
            merged.bakery = { ...getInitialState().bakery, ...decoded.bakery };

        merged.bakery = validateAndFixCraftingSlots(merged.bakery);

        if (!decoded.feverSnapshot)
            merged.feverSnapshot = EMPTY_FEVER_SNAPSHOT;

        // ─── Migração V29 → V30: Momento tetraédrico ───────────────────────
        if (version > 0 && version < 30) {
            try {
                const oldLevel    = merged.momentoLevel    ?? 0;
                const oldProgress = merged.momentoProgress ?? 0;
                if (oldLevel > 0 || oldProgress > 0) {
                    let approxTotal = oldProgress;
                    for (let i = 1; i <= oldLevel; i++) approxTotal += i * 100;
                    const { level, remainingProgress } = calculateMomentumLevel(approxTotal);
                    merged.momentoLevel    = level;
                    merged.momentoProgress = remainingProgress;
                    console.log('[Momentum Migration]', { oldLevel, oldProgress }, '→', { level, remainingProgress });
                }
            } catch (e) {
                console.warn('[Momentum Migration] Falha, mantendo valores antigos', e);
            }
        }
        // ────────────────────────────────────────────────────────────────────

        return merged;
    } catch (e) {
        console.error(`[loadGame] Falha ao carregar slot ${slot}:`, e);
        return null;
    }
};
