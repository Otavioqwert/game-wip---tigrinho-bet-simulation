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
    custoInicial: 100, 
    efeitoPorNivel: 0.25, // Adds +0.25% to the base 1% step
    crescimento: 1.35,
    maxLevel: 16,
    description: (level) => `Acelera o combo! Cada maçã adiciona +${(1 + (level * 0.25)).toFixed(2)}% ao multiplicador (Base: 1%).`
  },
  premiumMultiplier: {
    id: 'premiumMultiplier',
    nome: "Multiplicador Premium",
    tipo: "pontuacao",
    custoInicial: 500,
    efeitoPorNivel: 0.01, 
    crescimento: 1.4,
    maxLevel: 999, 
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
  dashSkill: {
    id: 'dashSkill',
    nome: "Hyper Dash",
    tipo: "gameplay",
    custoInicial: 2500,
    efeitoPorNivel: 1,
    crescimento: 1,
    maxLevel: 1,
    description: () => `Toque 2x na mesma direção para dar um DASH instantâneo até a parede! Inclui 1s de câmera lenta para reagir.`
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
    costs: [25000, 125000], // 🆕 ATUALIZADO: 2.5k⇒25k | 18.5k⇒125k
  },
  paralamas: {
    id: 'paralamas',
    nome: "Paralamas",
    tipo: "gameplay",
    custoInicial: 0, // Not used
    efeitoPorNivel: 1,
    crescimento: 1, // Not used
    maxLevel: 3,
    description: (level) => {
        const recharge = level >= 3 ? 15 : level === 2 ? 12 : 10;
        return `Permite bater na parede ${level} vez(es). As cargas são restauradas após coletar ${recharge} maçãs.`;
    },
    costs: [1000, 10000, 50000],
  },

  // Especial
  goldenApple: {
    id: 'goldenApple',
    nome: "Maçã Dourada",
    tipo: "especial",
    custoInicial: 400,
    efeitoPorNivel: 0.01, 
    efeitoMaximo: 0.50,
    crescimento: 1.15, 
    maxLevel: 50, 
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
  },
  subtleAlert: {
    id: 'subtleAlert',
    nome: 'Alerta Sutil',
    tipo: 'especial',
    custoInicial: 0,
    maxLevel: 3,
    costs: [800, 3500, 12000],
    description: (level) => {
      const effects = [
        'Mostra 1 maçã mais próxima no canto',
        'Mostra 2 maçãs mais próximas',
        'Mostra todas as maçãs na barra superior'
      ];
      return effects[level - 1];
    }
  },
  alarmingAlert: {
    id: 'alarmingAlert',
    nome: 'Alerta Alarmante',
    tipo: 'especial',
    custoInicial: 0,
    maxLevel: 3,
    costs: [1200, 5000, 15000],
    description: (level) => {
      const effects = [
        'Seta grande no centro aponta maçã mais próxima',
        'Seta + distância em células',
        'Seta + distância + tipo da maçã'
      ];
      return effects[level - 1];
    }
  },
  pushApple: {
    id: 'pushApple',
    nome: 'Empurra Maçã',
    tipo: 'especial',
    custoInicial: 0,
    maxLevel: 3,
    costs: [2000, 8000, 25000],
    description: (level) => {
      const effects = [
        'Habilidade Ativa: Empurra maçã próxima para local mais seguro.',
        'Recarga reduzida.',
        'Recarga mínima.'
      ];
      return effects[level - 1];
    }
  }
};

export const calculateSnakeUpgradeCost = (upgrade: SnakeUpgrade, level: number): number => {
  if (upgrade.costs && level < upgrade.costs.length) {
    return upgrade.costs[level];
  }
  return Math.floor(upgrade.custoInicial * Math.pow(upgrade.crescimento || 1.1, level));
};

export const SNAKE_UPGRADE_LAYOUT: Record<SnakeUpgradeType, SnakeUpgradeId[]> = {
    pontuacao: ['basicMultiplier', 'comboMaster', 'premiumMultiplier'],
    gameplay: ['slowSpeed', 'smallerStart', 'dashSkill', 'secondChance', 'paralamas'],
    especial: ['goldenApple', 'turboCash', 'frenzy', 'subtleAlert', 'alarmingAlert', 'pushApple']
};
