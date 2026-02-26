import type { FeverPackage } from '../types';

// ==========================================
// 📦 ITEM PACKAGES
// CUSTO EM DOCES (🍬): $100 = 1 🍬
// REBALANCEAMENTO: <=100 doces = 3x | <=1000 doces = 2x | >1000 = sem mudança
// ==========================================

export const ITEM_PACKAGES: FeverPackage[] = [
    // --- TIER 1: BUDGET ---
    {
        id: 'safe_budget_1',
        name: '🍭 Pacote Docinho',
        cost: 15,
        type: 'item', risk: 'safe', tier: 'budget',
        icon: '🍭',
        contents: { items: { '🍭': 12, '🍦': 5, '🍧': 2 }, multipliers: { '🍭': 12, '🍦': 8 } },
        description: '+12🍭 +5🍦 +2🍧 no inventário. +12 níveis mult 🍭 e +8 níveis mult 🍦. Enche o pool com doces base para garantir linhas durante a febre.'
    },
    {
        id: 'safe_budget_2',
        name: '🍀 Pacote Sortudo',
        cost: 30,
        type: 'item', risk: 'safe', tier: 'budget',
        icon: '🍀',
        contents: { items: { '🍀': 8 }, multipliers: { '🍀': 10 } },
        description: '+8🍀 no inventário e +10 níveis de multiplicador 🍀. Cada nível de mult vale +0.5x no valor da linha.'
    },
    {
        id: 'risk_budget_1',
        name: '🎁 Caixa Mistério',
        cost: 24,
        type: 'item', risk: 'risk', tier: 'budget',
        icon: '🎁',
        contents: 'WEIGHTED_RANDOM',
        rolls: {
            kit_trevo_base:     { contents: { items: { '🍀': 10 }, multipliers: { '🍀': 5 } }, chance: 0.25 },
            kit_trevo_grana:    { contents: { items: { '🍀': 10, '💵': 10 }, multipliers: {} }, chance: 0.25 },
            kit_doce:           { contents: { items: { '🍭': 10, '🍦': 10, '🍧': 10 }, multipliers: { '🍭': 3, '🍦': 3, '🍧': 3 } }, chance: 0.125 },
            kit_tigre_diamante: { contents: { items: { '🐯': 3, '💎': 3 }, multipliers: { '🐯': 12, '💎': 12 } }, chance: 0.125 },
            kit_trevo_puro:     { contents: { items: { '🍀': 20 }, multipliers: {} }, chance: 0.125 },
            kit_tigre_puro:     { contents: { items: { '🐯': 6 }, multipliers: {} }, chance: 0.125 }
        },
        description: 'Conteúdo aleatório com 6 possíveis kits: 25% Trevo+Mult | 25% Trevo+💵 | 12.5% Doces | 12.5% Tigre+Diamante | 12.5% 20 Trevos | 12.5% 6 Tigres. Risco médio, recompensa variável.'
    },
    {
        id: 'pkg_doce_escada',
        name: '🔗 Doce Corrente',
        cost: 99,
        type: 'item', risk: 'safe', tier: 'budget',
        icon: '🔗',
        contents: { items: {}, multipliers: {} },
        description: 'Ativa o minigame Corrente durante a febre: acertos consecutivos geram +$20/nível. A cada 10 acertos seguidos ganha +1 vida extra (máx 2 vidas). Um erro sem vida quebra a corrente.'
    },
    {
        id: 'pkg_star_junior',
        name: '⭐ Star Junior',
        cost: 105,
        type: 'item', risk: 'safe', tier: 'budget',
        icon: '⭐',
        contents: { items: { '⭐': 3 }, multipliers: {} },
        description: '+3 Estrelas (⭐) imediatas no inventário. Estrelas são wilds: substituem qualquer símbolo para completar linhas. Mais estrelas = mais linhas formadas por giro.'
    },

    // --- TIER 2: MID ---
    {
        id: 'safe_mid_1',
        name: '🍬 Paraíso Doce',
        cost: 90,
        type: 'item', risk: 'safe', tier: 'mid',
        icon: '🍬',
        contents: { 
            items: { '🍭': 10, '🍦': 5 }, 
            multipliers: { '🍭': 57, '🍦': 66, '🍧': 69 }
        },
        description: '+10🍭 +5🍦 e mult massiva nos 3 doces (+57/+66/+69 níveis). Ativa o detector Paraíso Doce: monitora padrões de ganho e exibe barra de progresso durante a febre.'
    },
    {
        id: 'risk_mid_3',
        name: '⚡ Tigre Turbinado',
        cost: 300,
        type: 'item', risk: 'safe', tier: 'mid',
        icon: '⚡',
        contents: { items: { '🐯': 3 }, multipliers: { '🐯': 50 } },
        description: '+3 Tigres (🐯) e +50 níveis de multiplicador 🐯. 50 níveis equivalem a +12.5x de ganho extra por linha de Tigre formada.'
    },
    {
        id: 'risk_mid_1',
        name: '🎰 Baú do Apostador',
        cost: 225,
        type: 'item', risk: 'risk', tier: 'mid',
        icon: '🎰',
        contents: 'TOTALLY_RANDOM_CHEST',
        description: 'Gera entre 1 e 20 itens totalmente aleatórios de 🐯 🍀 💵 💎 (sem doces). Cada item premium recebe +25% de nível de mult por unidade. Alto risco, alto potencial.'
    },

    // --- TIER 3: PREMIUM ---
    {
        id: 'safe_mid_3',
        name: '🐯 Caçada ao Tigre',
        cost: 700,
        type: 'item', risk: 'risk', tier: 'premium',
        icon: '🐯',
        contents: { items: { '🐯': 6, '🍭': 10, '🍦': 10, '🍧': 10 }, multipliers: { '🐯': 500 } },
        description: '+6🐯 com +500 níveis de mult (+125x de ganho extra) e +30 doces de base. Pool denso de Tigres entre doces aumenta muito a chance de linhas duplas ou triplas de 🐯.'
    },
    {
        id: 'safe_premium_1',
        name: '💼 Pacote Executivo',
        cost: 300,
        type: 'item', risk: 'safe', tier: 'premium',
        icon: '💼',
        contents: { items: { '🐯': 4, '💎': 8, '💵': 12 }, multipliers: { '🐯': 40, '💎': 32, '💵': 20 } },
        description: '+4🐯 +8💎 +12💵 com multiplicadores em todos (+40/+32/+20 níveis). Mix diversificado que garante linhas de vários símbolos premium ao longo da febre.'
    },
    {
        id: 'safe_premium_4',
        name: '👑 Pacote Real',
        cost: 700,
        type: 'item', risk: 'safe', tier: 'premium',
        icon: '👑',
        contents: { items: { '☄️': 2, '⭐': 3, '🐯': 5 }, multipliers: { '☄️': 50, '🐯': 60 } },
        description: '+2☄️ +3⭐ +5🐯 com +50 níveis de mult ☄️ e +60 níveis 🐯. Meteoros valem 64x base: com +50 níveis cada linha de ☄️ rende +12.5x adicional. As ⭐ amplificam tudo como wilds.'
    },
    {
        id: 'risk_premium_2',
        name: '🌠 Chuva de Meteoros',
        cost: 560,
        type: 'item', risk: 'safe', tier: 'premium',
        icon: '🌠',
        contents: { items: { '☄️': 3, '⭐': 1, '🍭': 5, '🍦': 5, '🍧': 5 }, multipliers: { '☄️': 150 } },
        description: '+3☄️ +1⭐ +15 doces de base. +150 níveis de mult ☄️ (+37.5x por linha de Meteoro). Os doces enchem o pool para o wild ⭐ completar linhas de ☄️ com mais frequência.'
    },

    // --- TIER 4: LUXURY ---
    {
        id: 'risk_luxury_2',
        name: '💫 Explosão Estelar',
        cost: 1400,
        type: 'item', risk: 'safe', tier: 'luxury',
        icon: '💫',
        contents: { items: { '☄️': 10, '⭐': 1, '🍭': 5, '🍦': 5, '🍧': 5 }, multipliers: { '☄️': 300 } },
        description: '+10☄️ +1⭐ +15 doces de base. +300 níveis de mult ☄️ (+75x por linha). Pool dominado por Meteoros: alta chance de linhas ☄️ a cada giro com ganhos massivos.'
    },
    {
        id: 'risk_luxury_3',
        name: '🌠 Aposta Suprema',
        cost: 1550,
        type: 'item', risk: 'risk', tier: 'luxury',
        icon: '🌌',
        contents: 'MEGA_JACKPOT',
        rolls: {
            low:  { contents: { items: { '⭐': 5  }, multipliers: {} }, chance: 0.25 },
            mid:  { contents: { items: { '⭐': 10 }, multipliers: {} }, chance: 0.35 },
            high: { contents: { items: { '⭐': 15 }, multipliers: {} }, chance: 0.25 },
            max:  { contents: { items: { '⭐': 20 }, multipliers: {} }, chance: 0.15 }
        },
        description: 'Resultado aleatório de Estrelas (⭐): 25% chance de 5 ⭐ | 35% de 10 ⭐ | 25% de 15 ⭐ | 15% de 20 ⭐. Média esperada: ~11.5 Estrelas. Cada estrela é um wild permanente durante a febre.'
    }
];

// ==========================================
// 🎰 BET PACKAGES (SPINS)
// CUSTO EM DOCES (🍬): $100 = 1 🍬
// REBALANCEAMENTO: <=100 doces = 3x | <=1000 doces = 2x | >1000 = sem mudança
// ==========================================

export const BET_PACKAGES: FeverPackage[] = [
    { id: 'bet_micro',     name: '🎲 Micro Spins',    cost: 30,   type: 'bet', tier: 'budget',  spins: 10,  icon: '🎲', description: '+10 giros fixos na febre. Custo de 3🍬 por giro. Ideal pra complementar pacotes de item sem gastar muitos doces.' },
    { id: 'bet_small',     name: '🎲 Small Spins',    cost: 300,  type: 'bet', tier: 'budget',  spins: 50,  icon: '🤏', description: '+50 giros fixos. Custo de 6🍬 por giro. Boa quantidade pra aproveitar um pool montado sem arriscar doces a mais.' },
    { id: 'bet_standard',  name: '🎲 Standard Spins', cost: 500,  type: 'bet', tier: 'mid',     spins: 100, icon: '🏪', description: '+100 giros fixos. Custo de 5🍬 por giro. Melhor custo por giro dos pacotes fixos: mais tempo no pool pra gerar retorno.' },
    { id: 'bet_gambler',   name: '🎲 Gambler Spins',  cost: 150,  type: 'bet', risk: 'risk', tier: 'mid', icon: '🎴', spins: 'VARIABLE', rolls: { bad: { spins: 20, chance: 0.40 }, ok: { spins: 40, chance: 0.40 }, good: { spins: 60, chance: 0.20 } }, description: 'Giros aleatórios: 40% chance de 20 | 40% de 40 | 20% de 60. Média esperada ~36 giros por 150🍬 (4.2🍬/giro). Melhor EV dos pacotes de giro.' },
    { id: 'pkg_apostador', name: '😎 O Apostador',    cost: 300,  type: 'bet', tier: 'mid',     spins: 0,   icon: '🕶️', description: 'Transforma a aposta de $10 para $100 por giro. Em troca, todos os giros acumulados (inclusive de outros pacotes) são divididos por 4. Só vale com pool premium.' },
    { id: 'bet_volatile',  name: '🌪️ Volatile Spins', cost: 1000, type: 'bet', risk: 'risk', tier: 'premium', icon: '🌪️', spins: 'EXTREME_VARIABLE', rolls: { disaster: { spins: 50, chance: 0.50 }, jackpot: { spins: 400, chance: 0.50 } }, description: '50/50: ou 50 giros ou 400 giros. Sem meio-termo. Com sorte é o melhor custo por giro do jogo (2.5🍬/giro); sem sorte é o pior (20🍬/giro).' },
    { id: 'bet_jackpot',   name: '💎 Jackpot Spins',  cost: 2000, type: 'bet', risk: 'risk', tier: 'luxury', icon: '💎', spins: 'MEGA_VARIABLE', rolls: { disaster: { spins: 100, chance: 0.40 }, bad: { spins: 500, chance: 0.30 }, good: { spins: 1200, chance: 0.20 }, jackpot: { spins: 2000, chance: 0.10 } }, description: 'Giros aleatórios: 40% → 100 | 30% → 500 | 20% → 1200 | 10% → 2000. Média esperada ~580 giros. O jackpot de 2000 giros é o maior da febre.' }
];

export const ALL_FEVER_PACKAGES = [...ITEM_PACKAGES, ...BET_PACKAGES];
