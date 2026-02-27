import { getInitialState } from './initialState';
import type { SavedState } from '../useGameState';
import type { Multipliers } from '../../types';

export interface SoftResetParams {
    points: number;
    level: number;
    initialBal: number;
    initialSugar: number;
    initialCloverMult: number;
    skillLevels: Record<string, number>;
    secondarySkillLevels: Record<string, number>;
}

/**
 * Calcula o próximo estado após um prestígio.
 * Preserva skills, devolve estado fresh com bônus de partida aplicados.
 */
export const buildSoftResetState = (params: SoftResetParams): SavedState => {
    const fresh = getInitialState();

    const adjustedMult:      typeof fresh.mult      = { ...fresh.mult };
    const adjustedBonusMult: typeof fresh.bonusMult = { ...fresh.bonusMult };
    const adjustedInv:       typeof fresh.inv       = { ...fresh.inv };

    // Skill: Caminho Estelar dá 3 estrelas extra ao começar
    if ((params.skillLevels['caminhoEstelar'] ?? 0) > 0) {
        adjustedInv['⭐'] = (adjustedInv['⭐'] ?? 0) + 3;
    }

    // Bônus Start/Stop entra no bonusMult (não afeta preço de upgrades)
    if (params.initialCloverMult > 0) {
        adjustedBonusMult['🍀'] = params.initialCloverMult;
    }

    return {
        ...fresh,
        bal:                    params.initialBal,
        sugar:                  params.initialSugar,
        mult:                   adjustedMult,
        bonusMult:              adjustedBonusMult,
        inv:                    adjustedInv,
        prestigePoints:         params.points,
        prestigeLevel:          params.level,
        skillLevels:            { ...params.skillLevels },
        secondarySkillLevels:   { ...params.secondarySkillLevels },
    };
};
