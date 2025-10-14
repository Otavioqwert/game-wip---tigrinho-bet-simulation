import type { SecondarySkill, SecondarySkillId } from '../types';

// NOTE: Some of the more complex skills are stubbed out with a "Coming Soon" notice
// to manage implementation scope. Their logic is not yet implemented.

export const SECONDARY_SKILLS: Record<SecondarySkillId, SecondarySkill> = {
    // Tier 1
    startStop: {
        id: 'startStop',
        name: 'Start/Stop',
        description: (level) => `Cada prestígio aumenta o valor inicial do próximo em $10. Bônus atual: +$${level * 10}.`,
        tier: 1,
        dependencies: [],
        getCost: (level) => 1 + level,
        costType: 'pa',
        maxLevel: 90,
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
        description: (level) => `Receba ${level * 1}% de volta em todas as apostas e compras na loja.`,
        tier: 2,
        dependencies: [],
        getCost: (level) => 10 + level * 10,
        costType: 'pa',
        maxLevel: 5,
    },
    salary: {
        id: 'salary',
        name: 'Aumento de Salário',
        description: (level) => `Gere +$${(level * 0.10).toFixed(2)} por segundo passivamente.`,
        tier: 2,
        dependencies: [],
        getCost: (level) => 10 + level * 10,
        costType: 'pa',
        maxLevel: 100,
    },
    decelerometer: {
        id: 'decelerometer',
        name: 'Desacelerômetro',
        description: (level) => `Reduz o aumento de preço de todos os upgrades em ${level * 2}%. Custa PA e dobra de preço a cada nível.`,
        tier: 2,
        dependencies: [],
        getCost: (level) => Math.pow(2, level),
        costType: 'pa',
        maxLevel: 50,
    },
    // Tier 3
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
        description: (level) => `Desbloqueia um cartão de crédito com limite de $${(level > 0 ? 50 * level + 50 * Math.pow(1.25, level) : 0).toFixed(2)}. A dívida é paga em 24 parcelas a cada 60s, com juros de 15% a cada 300s.`,
        tier: 3,
        dependencies: [{id: 'cashback', level: 1}],
        getCost: (level) => 5 + level * 5,
        costType: 'pa',
        maxLevel: 25,
    },
    mortgage: {
        id: 'mortgage',
        name: 'Hipoteca',
        description: () => `(EM BREVE) Permite comprar itens com Saldo Diabético, criando uma dívida com juros.`,
        tier: 3,
        dependencies: [{id: 'cashback', level: 1}],
        getCost: () => 25,
        costType: 'pa',
        maxLevel: 1,
    },
    ownBoss: {
        id: 'ownBoss',
        name: 'Próprio Chefe',
        description: () => `(EM BREVE) Desbloqueia uma loja especial de salário.`,
        tier: 3,
        dependencies: [{id: 'salary', level: 10}],
        getCost: () => 50,
        costType: 'pa',
        maxLevel: 1,
    },
    echo: {
        id: 'echo',
        name: 'Eco',
        description: () => `Seu salário passivo tem 10% de chance de ser pago duas vezes.`,
        tier: 3,
        dependencies: [{id: 'salary', level: 10}],
        getCost: () => 25,
        costType: 'pa',
        maxLevel: 1,
    },
    increment: {
        id: 'increment',
        name: 'Incremento',
        description: (level) => `Aumenta em ${level}% o valor ganho ao comprar upgrades de multiplicador.`,
        tier: 3,
        dependencies: [{id: 'decelerometer', level: 7}],
        getCost: (level) => 50 + level * 25,
        costType: 'pa',
        maxLevel: 25,
    },
    hydra: {
        id: 'hydra',
        name: 'Hidra',
        description: (level) => `Multiplica todos os ganhos por ${Math.pow(1.005, level).toFixed(6)}. Este efeito é cumulativo com outros bônus.`,
        tier: 3,
        dependencies: [{id: 'decelerometer', level: 7}],
        getCost: (level) => 10000 * Math.pow(2, level),
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