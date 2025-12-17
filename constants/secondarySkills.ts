
import type { SecondarySkill, SecondarySkillId } from '../types';

// Tabela de custos exatos para a Hidra (Lógica: 2x Atual + Anterior)
const HYDRA_COSTS = [
    10000,    // Nv 0 -> 1
    20000,    // Nv 1 -> 2
    50000,    // Nv 2 -> 3
    120000,   // Nv 3 -> 4
    290000,   // Nv 4 -> 5
    700000,   // Nv 5 -> 6
    1690000,  // Nv 6 -> 7
    4080000,  // Nv 7 -> 8
    9850000,  // Nv 8 -> 9
    23780000  // Nv 9 -> 10
];

export const SECONDARY_SKILLS: Record<SecondarySkillId, SecondarySkill> = {
    // Tier 1 - O PULO DO GATO
    startStop: {
        id: 'startStop',
        name: 'Start/Stop',
        description: (level) => `Kit de Partida: +$${level * 25}, +${level * 5} 🍬 e (+${Math.floor(level / 10)}x) Nv Avulso de Mult no Trevo (🍀).`,
        tier: 1,
        dependencies: [],
        getCost: (level) => 1 + level,
        costType: 'pa',
        maxLevel: 100,
    },
    // Tier 2
    snakeGame: {
        id: 'snakeGame',
        name: 'Snake Game',
        description: () => `Desbloqueia o minigame da cobrinha. Ingressos custam $10, e cada maçã recompensa com base no seu multiplicador de renda total.`,
        tier: 2,
        dependencies: [],
        getCost: () => 25,
        costType: 'pa',
        maxLevel: 1,
    },
    cashback: {
        id: 'cashback',
        name: 'Perda da Perda',
        description: (level) => `Receba ${level * 1}% de volta em compras. Essencial para desbloquear finanças avançadas (Requer Nível 5 MAX).`,
        tier: 2,
        dependencies: [],
        getCost: (level) => 10 + level * 10,
        costType: 'pa',
        maxLevel: 5,
    },
    salary: {
        id: 'salary',
        name: 'Aumento de Salário',
        description: (level) => `Gere +$${(level * 0.10).toFixed(2)} por segundo. No Nível 10, libera especializações de carreira.`,
        tier: 2,
        dependencies: [],
        getCost: (level) => 10 + level * 10,
        costType: 'pa',
        maxLevel: 100,
    },
    decelerometer: {
        id: 'decelerometer',
        name: 'Desacelerômetro',
        description: (level) => `Reduz o aumento de preço de todos os upgrades em ${level * 2}%.`,
        tier: 2,
        dependencies: [],
        getCost: (level) => Math.pow(2, level),
        costType: 'pa',
        maxLevel: 50,
    },
    // Tier 3 - BLOQUEIOS ESTRATÉGICOS
    sideQuest: {
        id: 'sideQuest',
        name: 'Side Quest',
        description: () => `(EM BREVE) Desbloqueia 100 mini-quests aleatórias com grandes recompensas.`,
        tier: 3,
        dependencies: [{id: 'snakeGame', level: 1}],
        getCost: () => 100,
        costType: 'pa',
        maxLevel: 1,
    },
    hyperInterest: {
        id: 'hyperInterest',
        name: 'Ritmo dos Hiper Juros',
        description: () => `(EM BREVE) Desbloqueia 3 novas formas de ganhar juros sobre seu desempenho.`,
        tier: 3,
        dependencies: [{id: 'snakeGame', level: 1}],
        getCost: () => 250,
        costType: 'pa',
        maxLevel: 1,
    },
    bankruptcy: {
        id: 'bankruptcy',
        name: 'Cartão de Crédito',
        description: (level) => `Desbloqueia um cartão de crédito. Requer Perda da Perda no Nível 5 (MAX).`,
        tier: 3,
        dependencies: [{id: 'cashback', level: 5}],
        getCost: (level) => 5 + level * 5,
        costType: 'pa',
        maxLevel: 25,
    },
    mortgage: {
        id: 'mortgage',
        name: 'Hipoteca',
        description: (level) => `Compre itens raros com Açúcar (🍬). Penalidade base de $100 + $50 por uso. Requer Perda da Perda no Nível 5 (MAX).`,
        tier: 3,
        dependencies: [{id: 'cashback', level: 5}],
        getCost: () => 1000,
        costType: 'pa',
        maxLevel: 1,
    },
    ownBoss: {
        id: 'ownBoss',
        name: 'Próprio Chefe',
        description: () => `(EM BREVE) Desbloqueia uma loja especial de salário. Requer Salário no Nível 10.`,
        tier: 3,
        dependencies: [{id: 'salary', level: 10}],
        getCost: () => 550,
        costType: 'pa',
        maxLevel: 1,
    },
    echo: {
        id: 'echo',
        name: 'Eco',
        description: (level) => `Chance de salário pago duas vezes. Requer Salário no Nível 10.`,
        tier: 3,
        dependencies: [{id: 'salary', level: 10}],
        getCost: (level) => 25 + level * 25,
        costType: 'pa',
        maxLevel: 5,
    },
    increment: {
        id: 'increment',
        name: 'Incremento',
        description: (level) => `Aumenta em ${level}% a eficácia de todos os multiplicadores da loja (Bônus Final).`,
        tier: 3,
        dependencies: [{id: 'decelerometer', level: 7}],
        getCost: (level) => 25 * (level + 1 + Math.floor(level / 2) * Math.ceil(level / 2)),
        costType: 'pa',
        maxLevel: 25,
    },
    hydra: {
        id: 'hydra',
        name: 'Hidra',
        description: (level) => `Eleva ganhos finais à potência de ^${(1 + level * 0.005).toFixed(3)}. No Nível 10 (^1.05), prêmios de 1M rendem o DOBRO!`,
        tier: 3,
        dependencies: [{id: 'decelerometer', level: 7}],
        getCost: (level) => HYDRA_COSTS[level] || HYDRA_COSTS[HYDRA_COSTS.length - 1] * Math.pow(2.414, level - 9),
        costType: 'pa',
        maxLevel: 10,
    },
};

export const SECONDARY_SKILL_TREE_LAYOUT = [
    {
        tier: 1,
        groups: [
            { skills: ['startStop'] }
        ]
    },
    {
        tier: 2,
        groups: [
            { skills: ['snakeGame', 'cashback', 'salary', 'decelerometer'] }
        ]
    },
    {
        tier: 3,
        groups: [
            { dependency: 'snakeGame', skills: ['sideQuest', 'hyperInterest'] },
            { dependency: 'cashback', skills: ['bankruptcy', 'mortgage'] },
            { dependency: 'salary', skills: ['ownBoss', 'echo'] },
            { dependency: 'decelerometer', skills: ['increment', 'hydra'] },
        ]
    }
];
