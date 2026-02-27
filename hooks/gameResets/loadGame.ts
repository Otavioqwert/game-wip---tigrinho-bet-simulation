import { calculateMomentumLevel } from '../../utils/mechanics/momentumCalculator';
import { EMPTY_FEVER_SNAPSHOT } from '../../utils/feverStateIsolation';
import { SAVE_KEY, getInitialState, validateAndFixCraftingSlots } from './initialState';
import type { SavedState } from '../useGameState';

/**
 * Carrega o save do localStorage e retorna o estado merged e migrado.
 * Retorna null se não houver save válido.
 */
export const loadGameFromStorage = (): SavedState | null => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved || !saved.startsWith('V')) return null;

    try {
        const parts = saved.split(':');
        if (parts.length < 3) return null;

        const versionTag = parts[0]; // ex: "V30"
        const version    = parseInt(versionTag.slice(1), 10) || 0;
        const decoded    = JSON.parse(decodeURIComponent(escape(atob(parts[2]))));

        // Merge com estado inicial para garantir novas propriedades
        const merged: SavedState = { ...getInitialState(), ...decoded };

        // Deep merge da bakery
        if (decoded.bakery) {
            merged.bakery = { ...getInitialState().bakery, ...decoded.bakery };
        }

        // Valida crafting slots
        merged.bakery = validateAndFixCraftingSlots(merged.bakery);

        // Garante feverSnapshot
        if (!decoded.feverSnapshot) {
            merged.feverSnapshot = EMPTY_FEVER_SNAPSHOT;
        }

        // ─── Migração de Momento para fórmula tetraédrica (V29 → V30) ───────
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

                    console.log('[Momentum Migration] Migrado de',
                        { oldLevel, oldProgress },
                        'para', { level, remainingProgress }
                    );
                }
            } catch (e) {
                console.warn('[Momentum Migration] Falha, mantendo valores antigos', e);
            }
        }
        // ─────────────────────────────────────────────────────────────────────

        return merged;
    } catch (e) {
        console.error('[loadGame] Falha ao carregar save:', e);
        return null;
    }
};
