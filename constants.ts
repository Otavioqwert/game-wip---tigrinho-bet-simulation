
import type { SymbolKey, SymbolMap, MidSymbolKey, ScratchCardTier } from './types';

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

// --- Item Penalty Values ---
export const ITEM_PENALTY_VALUES: Record<Extract<SymbolKey, '☄️' | '🍀' | '🐯' | '⭐' | '💎' | '💵'>, number> = {
    '☄️': 100,
    '🍀': 5,
    '🐯': 40,
    '⭐': 50,
    '💎': 20,
    '💵': 10
};


// --- Scratch Card Constants ---
// New Progression: Costs scale geometrically, Multipliers scale slightly faster to reward saving up.
export const SCRATCH_CARD_TIERS: ScratchCardTier[] = [
    { name: 'Bronze',       cost: 25,       multiplier: 1 },    // Base
    { name: 'Prata',        cost: 100,      multiplier: 4.5 },  // 12.5% Bonus Efficiency
    { name: 'Ouro',         cost: 500,      multiplier: 24 },   // 20% Bonus Efficiency
    { name: 'Platina',      cost: 2500,     multiplier: 125 },  // 25% Bonus Efficiency
    { name: 'Diamante',     cost: 10000,    multiplier: 550 },  // 37.5% Bonus Efficiency
    { name: 'Mestre',       cost: 50000,    multiplier: 3000 }, // 50% Bonus Efficiency
    { name: 'Grão-Mestre',  cost: 250000,   multiplier: 16000 },// 60% Bonus Efficiency
];

// Base prizes calibrated for the Tier 1 (Cost 25)
// Max Win (Jackpot) is 100x cost. Min win is roughly 10% cost.
export const SCRATCH_CARD_BASE_PRIZES = [
    { value: 2500, probability: 0.001 },  // 0.1% - Jackpot (100x Cost)
    { value: 500,  probability: 0.005 },  // 0.5% - Major Prize (20x Cost)
    { value: 125,  probability: 0.025 },  // 2.5% - Big Prize (5x Cost)
    { value: 50,   probability: 0.08 },   // 8%   - Double Up (2x Cost)
    { value: 25,   probability: 0.15 },   // 15%  - Money Back (1x Cost)
    { value: 5,    probability: 0.20 },   // 20%  - Consolation (0.2x Cost)
    { value: 2,    probability: 0.25 },   // 25%  - Tiny (0.08x Cost)
];

// Chance modifiers per tier (Higher tiers = slightly better luck)
// Indices correspond to SCRATCH_CARD_TIERS
export const SCRATCH_CARD_WIN_CHANCE_MODIFIERS = [
    0,      // Bronze
    0.01,   // Prata
    0.02,   // Ouro
    0.025,  // Platina
    0.03,   // Diamante
    0.035,  // Mestre
    0.04    // Grão-Mestre
];

// The base chance of a single cell winning for Tier 1
export const SCRATCH_CARD_BASE_WIN_CHANCE = SCRATCH_CARD_BASE_PRIZES.reduce((sum, p) => sum + p.probability, 0); 
