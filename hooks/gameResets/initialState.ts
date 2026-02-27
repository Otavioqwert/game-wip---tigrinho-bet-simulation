import { INITIAL_INVENTORY, INITIAL_MULTIPLIERS } from '../../constants';
import { EMPTY_FEVER_SNAPSHOT } from '../../utils/feverStateIsolation';
import type { SavedState } from '../useGameState';
import type { CraftingSlot, BakeryState } from '../../types';

// ─── Slots de save ──────────────────────────────────────────────────────────
// Cada slot tem sua própria chave no localStorage.
// Slot 0 é o padrão (retrocompatível com a chave antiga).
export type SaveSlotId = 0 | 1 | 2;

export const SAVE_SLOT_KEYS: Record<SaveSlotId, string> = {
    0: 'tigrinho-save-game',      // chave legada preservada
    1: 'tigrinho-save-game-slot1',
    2: 'tigrinho-save-game-slot2',
};

/** Retorna a chave correta do localStorage para o slot informado. */
export const getSaveKey = (slot: SaveSlotId = 0): string => SAVE_SLOT_KEYS[slot];

export const SAVE_VERSION = 30;

// ─── Estado inicial ──────────────────────────────────────────────────────────
export const getInitialState = (): SavedState => ({
    bal: 100,
    betVal: 1,
    inv: { ...INITIAL_INVENTORY },
    mult: { ...INITIAL_MULTIPLIERS },
    bonusMult: { ...INITIAL_MULTIPLIERS },
    roiSaldo: { '🍭': 0, '🍦': 0, '🍧': 0 },
    panificadoraLevel: { '🍭': 0, '🍦': 0, '🍧': 0 },
    estrelaPrecoAtual: 25,
    prestigePoints: 0,
    prestigeLevel: 0,
    skillLevels: {},
    secondarySkillLevels: {},
    snakeUpgrades: {},
    scratchCardPurchaseCounts: {},
    unluckyPot: 0,
    momentoLevel: 0,
    momentoProgress: 0,
    creditCardDebt: 0,
    renegotiationTier: 0,
    missedPayments: 0,
    paymentDueDate: null,
    isBettingLocked: false,
    itemPenaltyDue: null,
    sugar: 0,
    activeCookies: [],
    scratchMetrics: {
        tierPurchaseCounts: new Array(10).fill(0),
        tierLastPurchase: new Array(10).fill(0),
        tierCooldownRemaining: new Array(10).fill(0),
    },
    lotericaState: {
        lastInjectionTime: new Array(10).fill(0),
        injectionCooldownRemaining: new Array(10).fill(0),
        totalInjections: new Array(10).fill(0),
    },
    totalTokenPurchases: 0,
    mortgageUsages: 0,
    bakery: {
        inventory: { cookie: 0, cupcake: 0, cake: 0 },
        upgradeLevels: { cookie: 0, cupcake: 0, cake: 0 },
        craftingSlots: [
            { id: 0, productId: null, startTime: null, endTime: null, quantity: 0 },
        ],
        extraSlots: 0,
        speedLevel: 0,
    },
    feverSnapshot: EMPTY_FEVER_SNAPSHOT,
});

// ─── Validação de crafting slots ─────────────────────────────────────────────
export const validateAndFixCraftingSlots = (bakery: BakeryState): BakeryState => {
    const expected = 1 + bakery.extraSlots;
    const current  = bakery.craftingSlots.length;
    if (current === expected) return bakery;

    console.log(`[Bakery Fix] Detectado ${current} slots, esperado ${expected}`);

    if (current > expected) {
        const occupied = bakery.craftingSlots.filter(s => s.productId !== null);
        const fixed: CraftingSlot[] = [];
        for (let i = 0; i < Math.min(occupied.length, expected); i++)
            fixed.push({ ...occupied[i], id: i });
        for (let i = fixed.length; i < expected; i++)
            fixed.push({ id: i, productId: null, startTime: null, endTime: null, quantity: 0 });
        return { ...bakery, craftingSlots: fixed };
    }

    const fixed = [...bakery.craftingSlots];
    for (let i = current; i < expected; i++)
        fixed.push({ id: i, productId: null, startTime: null, endTime: null, quantity: 0 });
    return { ...bakery, craftingSlots: fixed };
};

// ─── Snapshot de metadados de todos os slots (para tela de seleção) ──────────
export interface SlotMeta {
    slot: SaveSlotId;
    exists: boolean;
    bal?: number;
    prestigeLevel?: number;
    savedAt?: number;   // timestamp do último save
}

/** Lê metadados leves de todos os slots sem carregar o estado completo. */
export const readAllSlotsMeta = (): SlotMeta[] => {
    return ([0, 1, 2] as SaveSlotId[]).map(slot => {
        const raw = localStorage.getItem(getSaveKey(slot));
        if (!raw || !raw.startsWith('V')) return { slot, exists: false };
        try {
            const parts = raw.split(':');
            if (parts.length < 3) return { slot, exists: false };
            const data = JSON.parse(decodeURIComponent(escape(atob(parts[2]))));
            return {
                slot,
                exists: true,
                bal: data.bal ?? 0,
                prestigeLevel: data.prestigeLevel ?? 0,
                savedAt: Number(parts[1]) || undefined,
            };
        } catch {
            return { slot, exists: false };
        }
    });
};
