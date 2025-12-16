
import type { SymbolKey, SymbolMap, MidSymbolKey, ScratchCardTier, CookieRecipe } from './types';

export const MID: MidSymbolKey[] = ['🍭','🍦','🍧'];
export const EXTRA: SymbolKey[] = ['🍀','💵','💎','🐯','☄️','🪙'];

export const SYM: SymbolMap = {
  '⭐':{v:0,p:25},
  '🍭':{v:0.2,p:0},
  '🍦':{v:0.3,p:0},
  '🍧':{v:0.4,p:0},
  '🍀':{v:2,p:1},
  '💵':{v:4,p:2},
  '💎':{v:8,p:4},
  '🐯':{v:16,p:8},
  '☄️':{v:64,p:50},
  '🪙':{v:0,p:1} // Ficha: Value determined by minigame, Price scales linearly
};

export const INITIAL_INVENTORY: Record<SymbolKey, number> = {
    '🍭': 10, '🍦': 10, '🍧': 10,
    '🍀': 0, '💵': 0, '💎': 0, '🐯': 0,
    '⭐': 2, '☄️': 0, '🪙': 0
};

export const INITIAL_MULTIPLIERS: Record<SymbolKey, number> = {
    '🍭': 0, '🍦': 0, '🍧': 0,
    '🍀': 0, '💵': 0, '💎': 0, '🐯': 0,
    '⭐': 0, '☄️': 0, '🪙': 0
};

export const MID_SELL: Record<MidSymbolKey, number> = {'🍭':0.01,'🍦':0.02,'🍧':0.03};
export const MID_BASE: Record<MidSymbolKey, number> = {'🍭':0.2,'🍦':0.3,'🍧':0.4};
export const MID_STEP: Record<MidSymbolKey, number> = {'🍭':1.05,'🍦':1.05,'🍧':1.05};
export const PANI_INCREMENT: Record<MidSymbolKey, number> = {'🍭':0.02,'🍦':0.03,'🍧':0.04};
export const MIDMAX = 10;
export const LOAN_BLOCK_BASE = 30;

// Sugar Conversion Rates
export const SUGAR_CONVERSION = {
    '🍭': 1,
    '🍦': 2,
    '🍧': 3
};

// Cookie Recipes
export const COOKIE_RECIPES: CookieRecipe[] = [
    {
        id: 'basic_cookie',
        name: 'Cookie Básico',
        sugarCost: 10,
        multiplier: 1.5, // 50% boost
        duration: 5, // spins (10 / 2)
        description: 'Um boost simples e rápido.',
        icon: '🍪'
    },
    {
        id: 'golden_cookie',
        name: 'Cookie Dourado',
        sugarCost: 50,
        multiplier: 3.0, // 200% boost
        duration: 7, // spins (20 / 3 approx)
        description: 'Sabor rico com ganhos triplicados.',
        icon: '🌟'
    },
    {
        id: 'mega_cookie',
        name: 'Mega Cookie',
        sugarCost: 200,
        multiplier: 10.0, // 900% boost
        duration: 8, // spins (50 / 6 approx)
        description: 'Poder massivo da fornalha!',
        icon: '💎'
    }
];


// --- Item Penalty Values ---
export const ITEM_PENALTY_VALUES: Record<Extract<SymbolKey, '☄️' | '🍀' | '🐯' | '⭐' | '💎' | '💵' | '🪙'>, number> = {
    '☄️': 100,
    '🍀': 5,
    '🐯': 40,
    '⭐': 50,
    '💎': 20,
    '💵': 10,
    '🪙': 1
};


// --- Scratch Card Constants ---

// Inflation: Additive price increase per purchase per tier.
// Tier 0 increases $0.05, Tier 6 increases $15.00
export const SCRATCH_CARD_INFLATION = [0.05, 0.12, 0.30, 0.75, 2.00, 5.00, 15.00];

// Progression: Powers of 2 costs with INCREASING Efficiency.
// Efficiency = Multiplier / Cost.
export const SCRATCH_CARD_TIERS: ScratchCardTier[] = [
    { name: 'Bronze',       cost: 1,     multiplier: 1 },      // Eff: 1.0
    { name: 'Prata',        cost: 2,     multiplier: 2.2 },    // Eff: 1.1
    { name: 'Ouro',         cost: 4,     multiplier: 4.8 },    // Eff: 1.2
    { name: 'Platina',      cost: 8,     multiplier: 10.4 },   // Eff: 1.3
    { name: 'Diamante',     cost: 16,    multiplier: 22.4 },   // Eff: 1.4
    { name: 'Mestre',       cost: 32,    multiplier: 48 },     // Eff: 1.5
    { name: 'Grão-Mestre',  cost: 64,    multiplier: 102.4 },  // Eff: 1.6
];

// Base prizes calibrated for Cost 1 (PER SLOT - 6 slots total)
// EV per slot = (100*0.0005) + (25*0.005) + (10*0.02) + (2*0.12) + (0.5*0.20)
// EV per slot = 0.05 + 0.125 + 0.2 + 0.24 + 0.1 = 0.715
// Total Card EV (6 slots) = 0.715 * 6 = 4.29 (429% RTP Base)
export const SCRATCH_CARD_BASE_PRIZES = [
    { value: 100,  probability: 0.0005 }, // 0.05% - Jackpot (100x)
    { value: 25,   probability: 0.0050 }, // 0.5%  - Grande (25x)
    { value: 10,   probability: 0.0200 }, // 2.0%  - Médio (10x)
    { value: 2,    probability: 0.1200 }, // 12%   - Dobro (2x)
    { value: 0.5,  probability: 0.2000 }, // 20%   - Meio (0.5x)
    { value: 0,    probability: 0.6545 }, // 65%   - Nada
];

// Chance modifiers per tier (Linear growth to slightly boost win rate on high tiers)
// Increases the chance of hitting *any* winning prize per slot.
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
export const SCRATCH_CARD_BASE_WIN_CHANCE = SCRATCH_CARD_BASE_PRIZES.filter(p => p.value > 0).reduce((sum, p) => sum + p.probability, 0);
