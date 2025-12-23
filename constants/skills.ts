
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
        description: () => `Concede +3 ⭐. Acertos de linha com ⭐ ativam um bônus: 90 sorteios de 3 símbolos da roleta são feitos. Cada trio correspondente concede 5% do valor de sua linha.`,
        tier: 2,
        dependencies: [{ id: 'grandeGanho', level: 5 }],
        getCost: () => 500,
        maxLevel: 1,
    },
    caminhoFicha: {
        id: 'caminhoFicha',
        name: 'Caminho da Ficha',
        description: () => `Desbloqueia a Ficha (🪙). Custa $1 e aumenta em $1 por compra. Acertos com Ficha iniciam o minigame Cara ou Coroa para dobrar a aposta (2x, 4x, 8x...).`,
        tier: 2,
        dependencies: [{ id: 'grandeGanho', level: 5 }],
        getCost: () => 50,
        maxLevel: 1,
    },
    caminhoEconomia: {
        id: 'caminhoEconomia',
        name: 'Caminho da Economia',
        description: (level) => `Reduz o custo de todas as compras na loja em ${level * 2}% e concede +$${(level * 0.1).toFixed(2)} por segundo.`,
        tier: 2,
        dependencies: [{ id: 'grandeGanho', level: 5 }],
        getCost: (level) => 200 + level * 25,
        maxLevel: 10,
    },
    caminhoCometa: {
        id: 'caminhoCometa',
        name: 'Caminho do Cometa',
        description: () => `Desbloqueia o símbolo Cometa (☄️) com multiplicador base de 64x. O preço do ☄️ aumenta 50% por compra. Requer Momento Nível 10 na run para comprar.`,
        tier: 3,
        // Agora depende do Caminho da Ficha
        dependencies: [{ id: 'caminhoFicha', level: 1 }],
        getCost: () => 15000,
        maxLevel: 1,
    },
};

export const SKILL_TREE_LAYOUT: SkillId[][] = [
    ['grandeGanho'],
    ['caminhoEstelar', 'caminhoFicha', 'caminhoEconomia'],
    ['caminhoCometa']
];