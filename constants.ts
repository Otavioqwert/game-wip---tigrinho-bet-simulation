import type { SymbolKey, SymbolMap, MidSymbolKey } from './types';

export const MID: MidSymbolKey[] = ['🍭','🍦','🍧'];
export const EXTRA: SymbolKey[] = ['🍀','💵','💎','🐯','☄️'];

export const SYM: SymbolMap = {
  '⭐':{v:0,p:25},
  '🍭':{v:0.2,p:0},
  '🍦':{v:0.3,p:0},
  '🍧':{v:0.4,p:0},
  '🍀':{v:2,p:1},
  '💵':{v:4,p:2},
  '💎':{v:8,p:4},
  '🐯':{v:16,p:8},
  '☄️':{v:64,p:50}
};

export const INITIAL_INVENTORY: Record<SymbolKey, number> = {
    '🍭': 10, '🍦': 10, '🍧': 10,
    '🍀': 0, '💵': 0, '💎': 0, '🐯': 0,
    '⭐': 2, '☄️': 0
};

export const INITIAL_MULTIPLIERS: Record<SymbolKey, number> = {
    '🍭': 0, '🍦': 0, '🍧': 0,
    '🍀': 0, '💵': 0, '💎': 0, '🐯': 0,
    '⭐': 0, '☄️': 0
};

export const MID_SELL: Record<MidSymbolKey, number> = {'🍭':0.01,'🍦':0.02,'🍧':0.03};
export const MID_BASE: Record<MidSymbolKey, number> = {'🍭':0.2,'🍦':0.3,'🍧':0.4};
export const MID_STEP: Record<MidSymbolKey, number> = {'🍭':1.05,'🍦':1.05,'🍧':1.05};
export const PANI_INCREMENT: Record<MidSymbolKey, number> = {'🍭':0.02,'🍦':0.03,'🍧':0.04};
export const MIDMAX = 10;
export const LOAN_BLOCK_BASE = 30;

// --- Scratch Card Constants ---
export const SCRATCH_CARD_TIERS = [
    { name: 'Bronze', cost: 1 },
    { name: 'Prata', cost: 2 },
    { name: 'Ouro', cost: 4 },
    { name: 'Platina', cost: 8 },
    { name: 'Diamante', cost: 16 },
    { name: 'Mestre', cost: 32 },
    { name: 'Grão-Mestre', cost: 64 },
];

// Base prizes and probabilities for a single cell on a $1 card (Tier 1)
export const SCRATCH_CARD_BASE_PRIZES = [
    { value: 100, probability: 0.0009 }, // 0.09%
    { value: 25, probability: 0.0066 },  // 0.66%
    { value: 10, probability: 0.0125 },  // 1.25%
    { value: 5, probability: 0.03 },     // 3%
    { value: 2, probability: 0.05 },     // 5%
    { value: 1, probability: 0.10 },     // 10%
    { value: 0.5, probability: 0.15 },   // 15%
];

// Additive value increase for prizes for each tier after the first
// T2 adds 0.5, T3 adds 1 to T2's values, etc.
export const SCRATCH_CARD_PRIZE_ADDITIONS = [0.5, 1, 2, 3, 6, 18]; // For Tiers 2-7

// Percentage point modifiers for the total win chance PER CELL for each tier after the first
// T2 is T1 - 1%, T3 is T2 - 0.5%, T4 is T3 + 1%, etc.
export const SCRATCH_CARD_WIN_CHANCE_MODIFIERS = [-0.01, -0.005, 0.01, 0.0075, 0.005, 0.0025]; // For Tiers 2-7

// The base chance of a single cell winning for Tier 1 is the sum of all probabilities
export const SCRATCH_CARD_BASE_WIN_CHANCE = SCRATCH_CARD_BASE_PRIZES.reduce((sum, p) => sum + p.probability, 0); // Should be 0.35