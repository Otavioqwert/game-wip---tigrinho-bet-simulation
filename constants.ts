
import type { ScratchCardTierV3, CookieRecipe } from './types';
export * from './constants/economy';

export const MID_SELL: Record<string, number> = {'🍭':0.01,'🍦':0.02,'🍧':0.03};
export const MID_BASE: Record<string, number> = {'🍭':0.2,'🍦':0.3,'🍧':0.4};
export const MID_STEP: Record<string, number> = {'🍭':1.05,'🍦':1.05,'🍧':1.05};
export const PANI_INCREMENT: Record<string, number> = {'🍭':0.02,'🍦':0.03,'🍧':0.04};
export const MIDMAX = 10;
export const LOAN_BLOCK_BASE = 30;

export const COOKIE_RECIPES: CookieRecipe[] = [
    {
        id: 'basic_cookie',
        name: 'Cookie Básico',
        sugarCost: 10,
        multiplier: 1.5,
        duration: 5,
        description: 'Um boost simples e rápido.',
        icon: '🍪'
    },
    {
        id: 'golden_cookie',
        name: 'Cookie Dourado',
        sugarCost: 50,
        multiplier: 3.0,
        duration: 7,
        description: 'Sabor rico com ganhos triplicados.',
        icon: '🌟'
    },
    {
        id: 'mega_cookie',
        name: 'Mega Cookie',
        sugarCost: 200,
        multiplier: 10.0,
        duration: 8,
        description: 'Poder massivo da fornalha!',
        icon: '💎'
    }
];

export const ITEM_PENALTY_VALUES: Record<string, number> = {
    '☄️': 100, '🍀': 5, '🐯': 40, '⭐': 50, '💎': 20, '💵': 10, '🪙': 1
};

export const SCRATCH_CARD_TIERS_V3: ScratchCardTierV3[] = [
    {
        name: 'Papelão', cost: 5, targetRTP: 400, efficiency: 1.0, slots: 6, maxJackpotMult: 50, cooldown: 1000,
        theme: { color: 'gray', icon: '📦' }
    },
    {
        name: 'Bronze', cost: 10, targetRTP: 500, efficiency: 1.1, slots: 6, maxJackpotMult: 100, cooldown: 5000,
        theme: { color: 'amber', icon: '🥉' }
    },
    {
        name: 'Prata', cost: 25, targetRTP: 600, efficiency: 1.2, slots: 6, maxJackpotMult: 150, cooldown: 15000,
        theme: { color: 'slate', icon: '🥈' }
    },
    {
        name: 'Ouro', cost: 60, targetRTP: 700, efficiency: 1.3, slots: 9, maxJackpotMult: 250, cooldown: 45000,
        theme: { color: 'yellow', icon: '🥇' }
    },
    {
        name: 'Platina', cost: 150, targetRTP: 800, efficiency: 1.4, slots: 9, maxJackpotMult: 400, cooldown: 120000,
        theme: { color: 'cyan', icon: '💠' }
    },
    {
        name: 'Diamante', cost: 400, targetRTP: 900, efficiency: 1.5, slots: 9, maxJackpotMult: 600, cooldown: 300000,
        theme: { color: 'blue', icon: '💎' }
    },
    {
        name: 'Titânio', cost: 1000, targetRTP: 1000, efficiency: 1.6, slots: 12, maxJackpotMult: 1000, cooldown: 600000,
        theme: { color: 'zinc', icon: '⚙️' }
    },
    {
        name: 'Obsidiana', cost: 2500, targetRTP: 1100, efficiency: 1.7, slots: 12, maxJackpotMult: 1500, cooldown: 1200000,
        theme: { color: 'purple', icon: '🔮' }
    },
    {
        name: 'Celestial', cost: 6000, targetRTP: 1200, efficiency: 1.8, slots: 12, maxJackpotMult: 2500, cooldown: 2400000,
        theme: { color: 'indigo', icon: '🌌' }
    },
    {
        name: 'Divino', cost: 15000, targetRTP: 1300, efficiency: 1.9, slots: 12, maxJackpotMult: 4000, cooldown: 7200000,
        theme: { color: 'pink', icon: '👑', glow: 'animate-pulse' }
    }
];

export const SCRATCH_CARD_INFLATION_V3 = [1.50, 4.00, 12.00, 45.00, 120.00, 450.00, 2000.00, 7500.00, 25000.00, 75000.00];
export const SCRATCH_CARD_UNLOCK_THRESHOLDS = [0, 50, 250, 1000, 5000, 20000, 100000, 500000, 2500000, 10000000];
export const LOTERICA_INJECTION_COOLDOWN = 14400000;
export const LOTERICA_INJECTION_COSTS = [3, 3, 4, 5, 6, 7, 8, 9, 10, 12];
export const LOTERICA_INJECTION_REDUCTIONS = [0.60, 0.60, 0.55, 0.55, 0.55, 0.55, 0.60, 0.60, 0.60, 0.65];
