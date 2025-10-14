import type { Skill, SkillId, SkillDependency } from '../types';

export const SKILLS: Record<SkillId, Skill> = {
    grandeGanho: {
        id: 'grandeGanho',
        name: 'Grande Ganho',
        description: (level) => `Aumenta o ganho de dinheiro de todas as fontes em ${level}%.`,
        tier: 1,
        dependencies: [],
        getCost: (level) => 10 + level,
        maxLevel: 25,
    },
    caminhoEstelar: {
        id: 'caminhoEstelar',
        name: 'Caminho Estelar',
        description: () => `Concede +3 ⭐. Acertos de linha com ⭐ ativam um bônus: 30 sorteios de 3 símbolos da roleta são feitos. Cada trio correspondente concede 5% do valor de sua linha.`,
        tier: 2,
        dependencies: [{ id: 'grandeGanho', level: 5 }],
        getCost: () => 500,
        maxLevel: 1,
    },
    caminhoCometa: {
        id: 'caminhoCometa',
        name: 'Caminho do Cometa',
        description: () => `Desbloqueia o símbolo Cometa (☄️) com multiplicador base de 64x. O preço do ☄️ aumenta 50% por compra. Seu upgrade de multiplicador aumenta o valor atual em 1%.`,
        tier: 2,
        dependencies: [{ id: 'grandeGanho', level: 5 }],
        getCost: () => 50,
        maxLevel: 1,
    },
    caminhoEconomia: {
        id: 'caminhoEconomia',
        name: 'Caminho da Economia',
        description: (level) => `Reduz o custo de todas as compras na loja em ${level * 5}% e concede +$${(level * 0.1).toFixed(2)} por segundo.`,
        tier: 2,
        dependencies: [{ id: 'grandeGanho', level: 5 }],
        getCost: (level) => 200 + level * 25,
        maxLevel: 10,
    }
};

export const SKILL_TREE_LAYOUT: SkillId[][] = [
    ['grandeGanho'],
    ['caminhoEstelar', 'caminhoCometa', 'caminhoEconomia']
];