
import type { ScratchCardTierV3, CookieRecipe, BakeryProduct, BakeryProductId } from './types';
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

export const BAKERY_PRODUCTS: Record<BakeryProductId, BakeryProduct> = {
    cookie: {
        id: 'cookie',
        name: 'Cookie',
        icon: '🍪',
        craftTime: 60,           // 1 minuto
        craftCost: 1,            // 1 açúcar
        sellPrice: 200,          // $200
        passiveIncome: 0.1,      // +$0.1/s
        upgradeBonus: 0.10,      // +10% por nível
        upgradeCost: 40,         // $40 (20% do sell price)
        upgradeCostIncrease: 2   // +$2 por nível
    },
    cupcake: {
        id: 'cupcake',
        name: 'Cupcake',
        icon: '🧁',
        craftTime: 180,          // 3 minutos
        craftCost: 2,            // 2 açúcar
        sellPrice: 500,          // $500
        passiveIncome: 0.3,      // +$0.3/s
        upgradeBonus: 0.25,      // +25% por nível
        upgradeCost: 100,        // $100
        upgradeCostIncrease: 5   // +$5 por nível
    },
    cake: {
        id: 'cake',
        name: 'Bolo',
        icon: '🎂',
        craftTime: 360,          // 6 minutos
        craftCost: 4,            // 4 açúcar
        sellPrice: 1200,         // $1,200
        passiveIncome: 0.7,      // +$0.7/s
        upgradeBonus: 0.40,      // +40% por nível
        upgradeCost: 240,        // $240
        upgradeCostIncrease: 12  // +$12 por nível
    }
};

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

export const SCRATCH_PRIZE_TIERS = [
    { id: 'divine',    name: 'Divino',    mult: 800, prob: 0.00008335, minTier: 7, color: 'text-pink-500' }, // Obsidiana+
    { id: 'exalted',   name: 'Exaltado',  mult: 400, prob: 0.0001667,  minTier: 5, color: 'text-cyan-400' }, // Diamante+
    { id: 'ancient',   name: 'Ancestral', mult: 200, prob: 0.0004171,  minTier: 2, color: 'text-purple-400' }, // Prata+
    { id: 'mythic',    name: 'Mítico',    mult: 100, prob: 0.00167,    minTier: 0, color: 'text-red-500' },
    { id: 'legendary', name: 'Lendário',  mult: 50,  prob: 0.003361,   minTier: 0, color: 'text-orange-400' },
    { id: 'epic',      name: 'Épico',     mult: 40,  prob: 0.006781,   minTier: 0, color: 'text-yellow-400' },
    { id: 'rare',      name: 'Raro',      mult: 30,  prob: 0.008512,   minTier: 0, color: 'text-blue-400' },
    { id: 'uncommon',  name: 'Incomum',   mult: 20,  prob: 0.017407,   minTier: 0, color: 'text-green-400' },
    { id: 'common',    name: 'Comum',     mult: 4,   prob: 0.076581,   minTier: 0, color: 'text-gray-400' },
];

export const SCRATCH_CARD_INFLATION_V3 = [1.50, 4.00, 12.00, 45.00, 120.00, 450.00, 2000.00, 7500.00, 25000.00, 75000.00];
export const SCRATCH_CARD_UNLOCK_THRESHOLDS = [0, 50, 250, 1000, 5000, 20000, 100000, 500000, 2500000, 10000000];
export const LOTERICA_INJECTION_COOLDOWN = 14400000;
export const LOTERICA_INJECTION_COSTS = [3, 3, 4, 5, 6, 7, 8, 9, 10, 12];
export const LOTERICA_INJECTION_REDUCTIONS = [0.60, 0.60, 0.55, 0.55, 0.55, 0.55, 0.60, 0.60, 0.60, 0.65];
