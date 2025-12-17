
import type { SymbolKey, SymbolMap, MidSymbolKey, ScratchCardTierV3, CookieRecipe } from './types';

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


// --- Scratch Card V3 Constants ---

export const SCRATCH_CARD_TIERS_V3: ScratchCardTierV3[] = [
    {
        name: 'Papelão',
        cost: 5,
        targetRTP: 400,
        efficiency: 1.0,
        slots: 6,
        maxJackpotMult: 50,
        cooldown: 1000,
        theme: { color: 'gray', icon: '📦' }
    },
    {
        name: 'Bronze',
        cost: 10,
        targetRTP: 500,
        efficiency: 1.25,
        slots: 6,
        maxJackpotMult: 100,
        cooldown: 5000,
        theme: { color: 'amber', icon: '🥉' }
    },
    {
        name: 'Prata',
        cost: 25,
        targetRTP: 600,
        efficiency: 1.5,
        slots: 6,
        maxJackpotMult: 150,
        cooldown: 15000,
        theme: { color: 'slate', icon: '🥈' }
    },
    {
        name: 'Ouro',
        cost: 60,
        targetRTP: 700,
        efficiency: 1.75,
        slots: 9,
        maxJackpotMult: 250,
        cooldown: 45000,
        theme: { color: 'yellow', icon: '🥇' }
    },
    {
        name: 'Platina',
        cost: 150,
        targetRTP: 800,
        efficiency: 2.0,
        slots: 9,
        maxJackpotMult: 400,
        cooldown: 120000,
        theme: { color: 'cyan', icon: '💠' }
    },
    {
        name: 'Diamante',
        cost: 400,
        targetRTP: 900,
        efficiency: 2.25,
        slots: 9,
        maxJackpotMult: 600,
        cooldown: 300000,
        theme: { color: 'blue', icon: '💎' }
    },
    {
        name: 'Titânio',
        cost: 1000,
        targetRTP: 1000,
        efficiency: 2.5,
        slots: 12,
        maxJackpotMult: 1000,
        cooldown: 600000,
        theme: { color: 'zinc', icon: '⚙️' }
    },
    {
        name: 'Obsidiana',
        cost: 2500,
        targetRTP: 1100,
        efficiency: 2.75,
        slots: 12,
        maxJackpotMult: 1500,
        cooldown: 1200000,
        theme: { color: 'purple', icon: '🔮' }
    },
    {
        name: 'Celestial',
        cost: 6000,
        targetRTP: 1200,
        efficiency: 3.0,
        slots: 12,
        maxJackpotMult: 2500,
        cooldown: 2400000,
        theme: { color: 'indigo', icon: '🌌' }
    },
    {
        name: 'Divino',
        cost: 15000,
        targetRTP: 1300,
        efficiency: 3.25,
        slots: 12,
        maxJackpotMult: 4000,
        cooldown: 7200000,
        theme: { color: 'pink', icon: '👑', glow: 'animate-pulse' }
    }
];

// REBALANCEAMENTO DA INFLAÇÃO
// Tiers altos agora escalam muito mais rápido para compensar o RTP Real de 2600%
export const SCRATCH_CARD_INFLATION_V3 = [
    1.50,    // Papelão (6 slots) - Leve
    4.00,    // Bronze (6 slots)
    12.00,   // Prata (6 slots)
    45.00,   // Ouro (9 slots) - Médio (Começa vantagem 1.5x)
    120.00,  // Platina (9 slots)
    450.00,  // Diamante (9 slots)
    2000.00, // Titânio (12 slots) - Pesado (Começa vantagem 2.0x)
    7500.00, // Obsidiana (12 slots)
    25000.00,// Celestial (12 slots)
    75000.00 // Divino (12 slots) - Brutal (Para forçar uso de injeção)
];

// Requisitos de Saldo para desbloquear (V3 Update)
export const SCRATCH_CARD_UNLOCK_THRESHOLDS = [
    0,       // Papelão (Sempre liberado)
    50,      // Bronze
    250,     // Prata
    1000,    // Ouro
    5000,    // Platina
    20000,   // Diamante
    100000,  // Titânio
    500000,  // Obsidiana
    2500000, // Celestial
    10000000 // Divino
];

export const LOTERICA_INJECTION_COOLDOWN = 14400000; // 4 hours

export const LOTERICA_INJECTION_COSTS = [
    3, 3, 4, 5, 6, 7, 8, 9, 10, 12
];

// Aumento ligeiro na eficiência da injeção para compensar a inflação alta
export const LOTERICA_INJECTION_REDUCTIONS = [
    0.60, 0.60, 0.55, 0.55, 0.55, 0.55, 0.60, 0.60, 0.60, 0.65
];
