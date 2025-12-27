
import type { ScratchCardTierV3, CookieRecipe, BakeryProduct, BakeryProductId } from './types';
export * from './constants/economy';

export const APP_VERSION = "v1.2.0 (PWA Enabled)";

export const MID_SELL: Record<string, number> = {'🍭':0.01,'🍦':0.02,'🍧':0.03};

// ATUALIZAÇÃO: 🍧 buffado para 12.5x ($10 → $125)
export const MID_BASE: Record<string, number> = {'🍭':0.2,'🍦':0.3,'🍧':12.5};
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
        name: 'Papelão', cost: 5, targetRTP: 355, efficiency: 1.00, slots: 6, maxJackpotMult: 50, cooldown: 1000,
        theme: { color: 'gray', icon: '📦' }
    },
    {
        name: 'Bronze', cost: 10, targetRTP: 479, efficiency: 1.125, slots: 6, maxJackpotMult: 100, cooldown: 5000,
        theme: { color: 'amber', icon: '🥉' }
    },
    {
        name: 'Prata', cost: 25, targetRTP: 681, efficiency: 1.25, slots: 6, maxJackpotMult: 150, cooldown: 15000,
        theme: { color: 'slate', icon: '🥈' }
    },
    {
        name: 'Ouro', cost: 60, targetRTP: 849, efficiency: 1.375, slots: 9, maxJackpotMult: 250, cooldown: 45000,
        theme: { color: 'yellow', icon: '🥇' }
    },
    {
        name: 'Platina', cost: 150, targetRTP: 950, efficiency: 1.50, slots: 9, maxJackpotMult: 400, cooldown: 120000,
        theme: { color: 'cyan', icon: '💠' }
    },
    {
        name: 'Diamante', cost: 400, targetRTP: 1050, efficiency: 1.625, slots: 9, maxJackpotMult: 600, cooldown: 300000,
        theme: { color: 'blue', icon: '💎' }
    },
    {
        name: 'Titânio', cost: 1000, targetRTP: 1150, efficiency: 1.75, slots: 12, maxJackpotMult: 1000, cooldown: 600000,
        theme: { color: 'zinc', icon: '⚙️' }
    },
    {
        name: 'Obsidiana', cost: 2500, targetRTP: 1250, efficiency: 1.875, slots: 12, maxJackpotMult: 1500, cooldown: 1200000,
        theme: { color: 'purple', icon: '🔮' }
    },
    {
        name: 'Celestial', cost: 6000, targetRTP: 1350, efficiency: 2.00, slots: 12, maxJackpotMult: 2500, cooldown: 2400000,
        theme: { color: 'indigo', icon: '🌌' }
    },
    {
        name: 'Divino', cost: 15000, targetRTP: 1500, efficiency: 2.125, slots: 12, maxJackpotMult: 4000, cooldown: 7200000,
        theme: { color: 'pink', icon: '👑', glow: 'animate-pulse' }
    }
];

export const SCRATCH_PRIZE_TIERS = [
    { id: 'divino', name: 'Divino', mult: 800, prob: 0.00008, minTier: 7, color: 'text-pink-500' },
    { id: 'celestial', name: 'Celestial', mult: 600, prob: 0.00012, minTier: 7, color: 'text-cyan-300' },
    { id: 'exaltado', name: 'Exaltado', mult: 400, prob: 0.0002, minTier: 5, color: 'text-purple-300' },
    { id: 'supremo', name: 'Supremo', mult: 300, prob: 0.00035, minTier: 5, color: 'text-indigo-400' },
    { id: 'ancestral', name: 'Ancestral', mult: 200, prob: 0.0005, minTier: 2, color: 'text-violet-400' },
    { id: 'primordial', name: 'Primordial', mult: 150, prob: 0.0008, minTier: 2, color: 'text-fuchsia-400' },
    { id: 'arcano', name: 'Arcano', mult: 120, prob: 0.0012, minTier: 2, color: 'text-purple-400' },
    { id: 'mítico', name: 'Mítico', mult: 100, prob: 0.0018, minTier: 0, color: 'text-red-500' },
    { id: 'lendário', name: 'Lendário', mult: 80, prob: 0.0025, minTier: 0, color: 'text-orange-500' },
    { id: 'épico', name: 'Épico', mult: 65, prob: 0.004, minTier: 0, color: 'text-yellow-500' },
    { id: 'raro', name: 'Raro', mult: 50, prob: 0.0065, minTier: 0, color: 'text-blue-500' },
    { id: 'incomum', name: 'Incomum', mult: 35, prob: 0.012, minTier: 0, color: 'text-green-500' },
    { id: 'comum', name: 'Comum', mult: 22, prob: 0.025, minTier: 0, color: 'text-green-400' },
    { id: 'básico', name: 'Básico', mult: 15, prob: 0.035, minTier: 0, color: 'text-gray-300' },
    { id: 'simples', name: 'Simples', mult: 10, prob: 0.045, minTier: 0, color: 'text-gray-400' },
    { id: 'modesto', name: 'Modesto', mult: 6, prob: 0.055, minTier: 0, color: 'text-gray-500' },
    { id: 'mínimo', name: 'Mínimo', mult: 3, prob: 0.065, minTier: 0, color: 'text-slate-500' },
    { id: 'migalha', name: 'Migalha', mult: 1.5, prob: 0.075, minTier: 0, color: 'text-slate-600' }
];

// Sistema de Inflação Híbrido V2
// Fórmula: novoPreço = (preçoAtual × (1 + percentPerPurchase)) + (baseCost × flatPerPurchase)
export const SCRATCH_INFLATION_CONFIG_V2 = [
    { percentPerPurchase: 0.05, flatPerPurchase: 0,    exponent: 1.0 },  // Tier 0: Papelão
    { percentPerPurchase: 0.05, flatPerPurchase: 0.03, exponent: 1.0 },  // Tier 1: Bronze
    { percentPerPurchase: 0.05, flatPerPurchase: 0.06, exponent: 1.0 },  // Tier 2: Prata
    { percentPerPurchase: 0.05, flatPerPurchase: 0.09, exponent: 1.0 },  // Tier 3: Ouro
    { percentPerPurchase: 0.05, flatPerPurchase: 0.12, exponent: 1.0 },  // Tier 4: Platina
    { percentPerPurchase: 0.05, flatPerPurchase: 0.15, exponent: 1.0 },  // Tier 5: Diamante
    { percentPerPurchase: 0.05, flatPerPurchase: 0.18, exponent: 1.0 },  // Tier 6: Titânio
    { percentPerPurchase: 0.05, flatPerPurchase: 0.21, exponent: 1.0 },  // Tier 7: Obsidiana
    { percentPerPurchase: 0.07, flatPerPurchase: 0.24, exponent: 1.0 },  // Tier 8: Celestial (+0.02)
    { percentPerPurchase: 0.08, flatPerPurchase: 0.27, exponent: 1.0 }   // Tier 9: Divino (+0.03)
];

export const SCRATCH_CARD_UNLOCK_THRESHOLDS = [0, 50, 250, 1000, 5000, 20000, 100000, 500000, 2500000, 10000000];

// Sistema de Injeção Lotérica V2
// costMultiplier: multiplicador do custo atual da raspadinha
// reduction: % de compras que serão removidas (0.80 = remove 80%)
// cooldown: tempo em ms até poder injetar novamente
export const LOTERICA_INJECTION_CONFIG_V2 = [
    { costMultiplier: 0.5, reduction: 0.80, cooldown: 3600000  },  // Tier 0: 1h cooldown
    { costMultiplier: 0.6, reduction: 0.78, cooldown: 5400000  },  // Tier 1: 1.5h
    { costMultiplier: 0.8, reduction: 0.75, cooldown: 7200000  },  // Tier 2: 2h
    { costMultiplier: 1.0, reduction: 0.72, cooldown: 10800000 },  // Tier 3: 3h
    { costMultiplier: 1.3, reduction: 0.70, cooldown: 10800000 },  // Tier 4: 3h
    { costMultiplier: 1.6, reduction: 0.68, cooldown: 14400000 },  // Tier 5: 4h
    { costMultiplier: 2.0, reduction: 0.65, cooldown: 14400000 },  // Tier 6: 4h
    { costMultiplier: 2.5, reduction: 0.63, cooldown: 14400000 },  // Tier 7: 4h
    { costMultiplier: 3.0, reduction: 0.60, cooldown: 14400000 },  // Tier 8: 4h
    { costMultiplier: 3.5, reduction: 0.58, cooldown: 14400000 }   // Tier 9: 4h
];
