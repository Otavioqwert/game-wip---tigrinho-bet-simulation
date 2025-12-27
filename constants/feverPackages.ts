import type { FeverPackage } from '../types';

// ==========================================
// 📦 ITEM PACKAGES
// ==========================================

export const ITEM_PACKAGES: FeverPackage[] = [
    // --- TIER 1: BUDGET ---
    {
        id: 'safe_budget_1',
        name: '🍭 Pacote Docinho',
        cost: 500,
        type: 'item', risk: 'safe', tier: 'budget',
        icon: '🍭',
        contents: { items: { '🍭': 12, '🍦': 5, '🍧': 2 }, multipliers: { '🍭': 12, '🍦': 8 } },
        description: 'Entrada barata no tema (ROI +18%)'
    },
    {
        id: 'safe_budget_2',
        name: '🍀 Pacote Sortudo',
        cost: 1000,
        type: 'item', risk: 'safe', tier: 'budget',
        icon: '🍀',
        contents: { items: { '🍀': 8 }, multipliers: { '🍀': 10 } },
        description: 'Trevos garantidos (ROI -26%)'
    },
    {
        id: 'risk_budget_1',
        name: '🎁 Caixa Mistério',
        cost: 800,
        type: 'item', risk: 'risk', tier: 'budget',
        icon: '🎁',
        contents: 'WEIGHTED_RANDOM',
        rolls: {
            kit_trevo_base: { contents: { items: { '🍀': 10 }, multipliers: { '🍀': 5 } }, chance: 0.25 },
            kit_trevo_grana: { contents: { items: { '🍀': 10, '💵': 10 }, multipliers: {} }, chance: 0.25 },
            kit_doce: { contents: { items: { '🍭': 10, '🍦': 10, '🍧': 10 }, multipliers: { '🍭': 3, '🍦': 3, '🍧': 3 } }, chance: 0.125 },
            kit_tigre_diamante: { contents: { items: { '🐯': 3, '💎': 3 }, multipliers: { '🐯': 12, '💎': 12 } }, chance: 0.125 },
            kit_trevo_puro: { contents: { items: { '🍀': 20 }, multipliers: {} }, chance: 0.125 },
            kit_tigre_puro: { contents: { items: { '🐯': 6 }, multipliers: {} }, chance: 0.125 }
        },
        description: 'Pode conter kits variados de Trevos, Doces, Dinheiro ou Tigres!'
    },
    {
        id: 'pkg_doce_escada',
        name: '🔗 Doce Corrente',
        cost: 3250,
        type: 'item', risk: 'safe', tier: 'budget',
        icon: '🔗',
        contents: { items: {}, multipliers: {} },
        description: 'Até 8 correntes paralelas! +$20/nível. A cada 10 acertos, +1 vida (máx 2). Erro sem vida = quebra.'
    },
    {
        id: 'pkg_star_junior',
        name: '⭐ Star Junior',
        cost: 3500,
        type: 'item', risk: 'safe', tier: 'budget',
        icon: '⭐',
        contents: { items: { '⭐': 3 }, multipliers: {} },
        description: 'Adiciona 3 Estrelas ao inventário imediatamente.'
    },

    // --- TIER 2: MID ---
    {
        id: 'safe_mid_1',
        name: '🍬 Paraíso Doce',
        cost: 3000,
        type: 'item', risk: 'safe', tier: 'mid',
        icon: '🍬',
        // 🍭: 0.2 × 1.05^57 ≈ 3.0x ($10 → $30)
        // 🍦: 0.3 × 1.05^66 ≈ 7.5x ($10 → $75)
        // 🍧: 0.4 × 1.05^69 ≈ 12.5x ($10 → $125) - APENAS neste pacote!
        contents: { 
            items: { '🍭': 10, '🍦': 5 }, 
            multipliers: { '🍭': 57, '🍦': 66, '🍧': 69 }
        },
        description: 'REWORK 2.0: 3x3 Divine Grid - RTP 95-300% + Progressive Bars (ROI +35%)✨'
    },
    {
        id: 'risk_mid_3',
        name: '⚡ Tigre Turbinado',
        cost: 10000,
        type: 'item', risk: 'safe', tier: 'mid',
        icon: '⚡',
        contents: { items: { '🐯': 3 }, multipliers: { '🐯': 50 } },
        description: 'Garante +3 Tigres e +50 Níveis de Mult (12.5x base extra).'
    },
    {
        id: 'risk_mid_1',
        name: '🎰 Baú do Apostador',
        cost: 7500,
        type: 'item', risk: 'risk', tier: 'mid',
        icon: '🎰',
        contents: 'TOTALLY_RANDOM_CHEST',
        description: '1 a 20 Itens com +25% por Nível (apenas 🐯🍀💵💎)'
    },

    // --- TIER 3: PREMIUM ---
    {
        id: 'safe_mid_3',
        name: '🐯 Caçada ao Tigre',
        cost: 35000,
        type: 'item', risk: 'risk', tier: 'premium',
        icon: '🐯',
        contents: { items: { '🐯': 6, '🍭': 10, '🍦': 10, '🍧': 10 }, multipliers: { '🐯': 500 } },
        description: 'FUSÃO: 6 Tigres (+500 nv) escondidos em 30 doces! Chance real de linhas duplas.'
    },
    {
        id: 'safe_premium_1',
        name: '💼 Pacote Executivo',
        cost: 15000,
        type: 'item', risk: 'safe', tier: 'premium',
        icon: '💼',
        contents: { items: { '🐯': 4, '💎': 8, '💵': 12 }, multipliers: { '🐯': 40, '💎': 32, '💵': 20 } },
        description: 'Mix balanceado premium (ROI +12%)'
    },
    {
        id: 'safe_premium_4',
        name: '👑 Pacote Real',
        cost: 35000,
        type: 'item', risk: 'safe', tier: 'premium',
        icon: '👑',
        contents: { items: { '☄️': 2, '⭐': 3, '🐯': 5 }, multipliers: { '☄️': 50, '🐯': 60 } },
        description: 'MELHOR DEAL SAFE! (ROI +34%)'
    },
    {
        id: 'risk_premium_2',
        name: '🌠 Chuva de Meteoros',
        cost: 28000,
        type: 'item', risk: 'safe', tier: 'premium',
        icon: '🌠',
        // REVERTIDO: Não tem mais +69 níveis de 🍧
        contents: { items: { '☄️': 3, '⭐': 1, '🍭': 5, '🍦': 5, '🍧': 5 }, multipliers: { '☄️': 150 } },
        description: '3 Meteoros, 1 Estrela, Doces e +150% de Poder Real (Níveis)!'
    },

    // --- TIER 4: LUXURY ---
    {
        id: 'risk_luxury_2',
        name: '💫 Explosão Estelar',
        cost: 70000,
        type: 'item', risk: 'safe', tier: 'luxury',
        icon: '💫',
        // REVERTIDO: Não tem mais +69 níveis de 🍧
        contents: { items: { '☄️': 10, '⭐': 1, '🍭': 5, '🍦': 5, '🍧': 5 }, multipliers: { '☄️': 300 } },
        description: '10 Meteoros, 1 Estrela, Doces e +300% de Poder Real (Níveis)!'
    },
    {
        id: 'risk_luxury_3',
        name: '🌠 Aposta Suprema',
        cost: 155000,
        type: 'item', risk: 'risk', tier: 'luxury',
        icon: '🌌',
        contents: 'MEGA_JACKPOT',
        rolls: {
            low: { contents: { items: { '⭐': 5 }, multipliers: {} }, chance: 0.25 },
            mid: { contents: { items: { '⭐': 10 }, multipliers: {} }, chance: 0.35 },
            high: { contents: { items: { '⭐': 15 }, multipliers: {} }, chance: 0.25 },
            max: { contents: { items: { '⭐': 20 }, multipliers: {} }, chance: 0.15 }
        },
        description: 'Ganhe entre 5 e 20 Estrelas!'
    }
];

// ==========================================
// 🎰 BET PACKAGES (SPINS)
// ==========================================

export const BET_PACKAGES: FeverPackage[] = [
    { id: 'bet_micro', name: '🎲 Micro Spins', cost: 1000, type: 'bet', tier: 'budget', spins: 10, icon: '🎲', description: '10 Spins ($100/giro) - ROI +50%' },
    { id: 'bet_small', name: '🎲 Small Spins', cost: 10000, type: 'bet', tier: 'budget', spins: 50, icon: '🤏', description: '50 Spins ($200/giro) - ROI -25%' },
    { id: 'bet_standard', name: '🎲 Standard Spins', cost: 25000, type: 'bet', tier: 'mid', spins: 100, icon: '🏪', description: '100 Spins ($250/giro) - ROI -40%' },
    { id: 'bet_gambler', name: '🎲 Gambler Spins', cost: 5000, type: 'bet', risk: 'risk', tier: 'mid', icon: '🎴', spins: 'VARIABLE', rolls: { bad: { spins: 20, chance: 0.40 }, ok: { spins: 40, chance: 0.40 }, good: { spins: 60, chance: 0.20 } }, description: '20-60 Spins (MELHOR RISK! EV +20%)' },
    { id: 'pkg_apostador', name: '😎 O Apostador', cost: 15000, type: 'bet', tier: 'mid', spins: 0, icon: '🕶️', description: 'Aposta sobe para $100, mas giros totais caem para 1/4.' },
    { id: 'bet_volatile', name: '🌪️ Volatile Spins', cost: 50000, type: 'bet', risk: 'risk', tier: 'premium', icon: '🌪️', spins: 'EXTREME_VARIABLE', rolls: { disaster: { spins: 50, chance: 0.50 }, jackpot: { spins: 400, chance: 0.50 } }, description: '50 ou 400 Spins (Tudo ou Nada)' },
    { id: 'bet_jackpot', name: '💎 Jackpot Spins', cost: 200000, type: 'bet', risk: 'risk', tier: 'luxury', icon: '💎', spins: 'MEGA_VARIABLE', rolls: { disaster: { spins: 100, chance: 0.40 }, bad: { spins: 500, chance: 0.30 }, good: { spins: 1200, chance: 0.20 }, jackpot: { spins: 2000, chance: 0.10 } }, description: '100 a 2000 Spins - 10% chance de Jackpot' }
];

export const ALL_FEVER_PACKAGES = [...ITEM_PACKAGES, ...BET_PACKAGES];
