import type { SnakeUpgrade, SnakeUpgradeId, SnakeUpgradeType } from '../types';

export const SNAKE_UPGRADES: Record<SnakeUpgradeId, SnakeUpgrade> = {
  // Pontuação
  basicMultiplier: {
    id: 'basicMultiplier',
    nome: "Multiplicador Básico",
    tipo: "pontuacao",
    custoInicial: 100,
    efeitoPorNivel: 0.15,
    crescimento: 1.25,
    maxLevel: 20,
    description: (level) => `Aumenta os ganhos base do jogo em ${((level * 0.15) * 100).toFixed(0)}%.`
  },
  comboMaster: {
    id: 'comboMaster',
    nome: "Mestre do Combo",
    tipo: "pontuacao",
    custoInicial: 500, // CHANGED
    efeitoPorNivel: 0.05,
    efeitoMaximo: 0.50,
    crescimento: 1.3,
    maxLevel: 5, // CHANGED
    description: (level) => `Cada maçã coletada vale ${((level * 0.05) * 100).toFixed(0)}% a mais de pontos (máx 50%).`
  },
  premiumMultiplier: {
    id: 'premiumMultiplier',
    nome: "Multiplicador Premium",
    tipo: "pontuacao",
    custoInicial: 500,
    efeitoPorNivel: 0.01, // CHANGED
    crescimento: 1.4,
    maxLevel: 999, // CHANGED
    description: (level) => `Multiplica seus ganhos totais em ${((level * 0.01) * 100).toFixed(0)}% (acumulativo).`
  },

  // Gameplay
  slowSpeed: {
    id: 'slowSpeed',
    nome: "Velocidade Controlada",
    tipo: "gameplay",
    custoInicial: 150,
    efeitoPorNivel: 0.05,
    efeitoMaximo: 0.25,
    crescimento: 1.2,
    maxLevel: 5,
    description: (level) => `Reduz a velocidade da cobrinha em ${((level * 0.05) * 100).toFixed(0)}%.`
  },
  smallerStart: {
    id: 'smallerStart',
    nome: "Início Rápido",
    tipo: "gameplay",
    custoInicial: 300,
    efeitoPorNivel: 1,
    minimo: 1,
    crescimento: 1.35,
    maxLevel: 2,
    description: (level) => `Comece o jogo com ${level} segmento(s) a menos.`
  },
  secondChance: {
    id: 'secondChance',
    nome: "Segunda Chance",
    tipo: "gameplay",
    custoInicial: 0, // Not used
    efeitoPorNivel: 1,
    crescimento: 1.0, // Not used
    maxLevel: 2,
    description: (level) => `Ganhe ${level} vida(s) extra por jogo.`,
    costs: [2500, 18500],
  },

  // Especial
  goldenApple: {
    id: 'goldenApple',
    nome: "Maçã Dourada",
    tipo: "especial",
    custoInicial: 400,
    efeitoPorNivel: 0.01, // CHANGED
    efeitoMaximo: 0.50,
    crescimento: 1.15, // CHANGED
    maxLevel: 50, // CHANGED
    description: (level) => `${((level * 0.01) * 100).toFixed(0)}% de chance de uma maçã dourada aparecer, valendo 5x mais pontos.`
  },
  turboCash: {
    id: 'turboCash',
    nome: "Ingresso Turbo",
    tipo: "especial",
    custoInicial: 1000,
    efeitoPorNivel: 0.05,
    efeitoMaximo: 0.50,
    crescimento: 1.5,
    maxLevel: 10,
    description: (level) => `Reduz o custo do ingresso para jogar em ${((level * 0.05) * 100).toFixed(0)}%.`
  },
  frenzy: {
    id: 'frenzy',
    nome: "Frenesi de Maçãs",
    tipo: "especial",
    custoInicial: 600,
    efeitoPorNivel: 0, // Complex effect
    crescimento: 1.45,
    maxLevel: 5,
    description: (level) => `Chance de gerar maçãs extras. Nv ${level}: +1(${(level*10).toFixed(2)}%), +2(${(level*2.5).toFixed(2)}%), +3(${(level*0.62).toFixed(2)}%), +4(${(level*0.16).toFixed(2)}%), +5(${(level*0.04).toFixed(2)}%)`
  }
};

export const calculateSnakeUpgradeCost = (upgrade: SnakeUpgrade, level: number): number => {
  if (upgrade.costs && level < upgrade.costs.length) {
    return upgrade.costs[level];
  }
  return Math.floor(upgrade.custoInicial * Math.pow(upgrade.crescimento, level));
};

export const SNAKE_UPGRADE_LAYOUT: Record<SnakeUpgradeType, SnakeUpgradeId[]> = {
    pontuacao: ['basicMultiplier', 'comboMaster', 'premiumMultiplier'],
    gameplay: ['slowSpeed', 'smallerStart', 'secondChance'],
    especial: ['goldenApple', 'turboCash', 'frenzy']
};