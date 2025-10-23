
export type SymbolKey = '⭐' | '🍭' | '🍦' | '🍧' | '🍀' | '💵' | '💎' | '🐯' | '☄️';
export type MidSymbolKey = '🍭' | '🍦' | '🍧';
export type ExtraSymbolKey = '🍀' | '💵' | '💎' | '🐯' | '☄️';
export type WildcardSymbolKey = '⭐';

export type Inventory = Record<SymbolKey, number>;
export type Multipliers = Record<SymbolKey, number>;
export type PanificadoraLevels = Record<MidSymbolKey, number>;
export type RoiSaldo = Record<MidSymbolKey, number>;
export type RenegotiationTier = 0 | 1 | 2;

export interface SymbolData {
  v: number;
  p: number;
}

export type SymbolMap = Record<SymbolKey, SymbolData>;


// --- Skill Tree Types ---

export type SkillId = 'grandeGanho' | 'caminhoEstelar' | 'caminhoCometa' | 'caminhoEconomia';

export interface SkillDependency {
    id: SkillId;
    level: number;
}

export interface Skill {
    id: SkillId;
    name: string;
    description: (level: number) => string;
    tier: number;
    dependencies: SkillDependency[];
    getCost: (level: number) => number;
    maxLevel: number;
}

// --- Secondary Skill Tree Types ---
export type SecondarySkillId = 'startStop' | 'snakeGame' | 'cashback' | 'salary' | 'decelerometer' | 'sideQuest' | 'hyperInterest' | 'bankruptcy' | 'mortgage' | 'ownBoss' | 'echo' | 'increment' | 'hydra';

export interface SecondarySkillDependency {
    id: SecondarySkillId;
    level: number;
}

export interface SecondarySkill {
    id: SecondarySkillId;
    name: string;
    description: (level: number) => string;
    tier: number;
    dependencies: SecondarySkillDependency[];
    getCost: (level: number) => number;
    costType: 'pa' | 'cash';
    maxLevel: number;
}


// --- Scratch Card Types ---
export interface ScratchCardTier {
    name: string;
    cost: number;
}

export interface ScratchCardCell {
    prize: number;
    revealed: boolean;
}

// --- Snake Minigame Upgrade Types ---
export type SnakeUpgradeId = 'basicMultiplier' | 'comboMaster' | 'premiumMultiplier' | 'slowSpeed' | 'smallerStart' | 'secondChance' | 'goldenApple' | 'turboCash' | 'frenzy' | 'paralamas';
export type SnakeUpgradeType = 'pontuacao' | 'gameplay' | 'especial';

export interface SnakeUpgrade {
    id: SnakeUpgradeId;
    nome: string;
    tipo: SnakeUpgradeType;
    custoInicial: number;
    efeitoPorNivel: number;
    crescimento: number;
    maxLevel: number;
    description: (level: number) => string;
    efeitoMaximo?: number;
    minimo?: number;
    costs?: number[];
}