export type SymbolKey = '⭐' | '🍭' | '🍦' | '🍧' | '🍀' | '💵' | '💎' | '🐯' | '☄️' | '🪙' | '🎰';
export type MidSymbolKey = '🍭' | '🍦' | '🍧';
export type ExtraSymbolKey = '🍀' | '💵' | '💎' | '🐯' | '☄️' | '🪙';
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

// --- Leaf System (Folha 🍁) ---
export interface LeafState {
    count: number;
    isActive: boolean;
}

// --- Cookie System ---
export type CookieId = 'basic_cookie' | 'golden_cookie' | 'mega_cookie';

export interface CookieRecipe {
    id: CookieId;
    name: string;
    sugarCost: number;
    multiplier: number;
    duration: number; // in spins
    description: string;
    icon: string;
}

export interface ActiveCookie {
    instanceId: number; // Unique ID for React keys
    recipeId: CookieId;
    multiplier: number;
    remainingSpins: number;
    maxSpins: number;
    name: string;
    icon: string;
}

// --- BAKERY SYSTEM ("PRÓPRIO CHEFE") ---
export type BakeryProductId = 'cookie' | 'cupcake' | 'cake';

export interface BakeryProduct {
    id: BakeryProductId;
    name: string;
    icon: string;
    craftTime: number;        // segundos
    craftCost: number;        // açúcar
    sellPrice: number;        // $
    passiveIncome: number;    // $/s por unidade no estoque
    upgradeBonus: number;     // % de buff por nível de upgrade
    upgradeCost: number;      // custo base do upgrade
    upgradeCostIncrease: number; // incremento linear
}

export interface CraftingSlot {
    id: number;
    productId: BakeryProductId | null;
    startTime: number | null;    // timestamp
    endTime: number | null;      // timestamp
    quantity: number;            // batch crafting
}

export interface BakeryState {
    inventory: Record<BakeryProductId, number>;        // Estoque por produto
    upgradeLevels: Record<BakeryProductId, number>;    // Níveis de upgrade
    craftingSlots: CraftingSlot[];            // Slots de crafting
    extraSlots: number;                       // Quantos slots extras (além dos 3 base)
    speedLevel: number;                       // Nível do upgrade de velocidade
}

// --- Skill Tree Types ---

export type SkillId = 'grandeGanho' | 'caminhoEstelar' | 'caminhoCometa' | 'caminhoEconomia' | 'caminhoFicha';

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


// --- Scratch Card V3 Types ---
export interface ScratchCardTierV3 {
    name: string;
    cost: number;
    targetRTP: number;
    efficiency: number;
    slots: number;
    maxJackpotMult: number;
    cooldown: number;
    theme: {
        color: string;
        icon: string;
        glow?: string;
    };
}

export interface ScratchCardMetrics {
    tierPurchaseCounts: number[];      // Compras lifetime por tier
    tierLastPurchase: number[];        // Timestamp última compra
    tierCooldownRemaining: number[];   // Cooldown restante por tier (runtime only)
}

export interface LotericaInjectionState {
    lastInjectionTime: number[];       // Timestamp última injeção por tier
    injectionCooldownRemaining: number[]; // Cooldown restante injeção (runtime only)
    totalInjections: number[];         // Total de injeções por tier
}

export interface ScratchCardCell {
    prize: number;
    revealed: boolean;
    isJackpot?: boolean;
}

export interface ActiveScratchCard {
    tier: number;
    cells: ScratchCardCell[];
    totalWin: number;
    isRevealing: boolean;
}

// --- Snake Minigame Upgrade Types ---
export type SnakeUpgradeId = 'basicMultiplier' | 'comboMaster' | 'premiumMultiplier' | 'slowSpeed' | 'smallerStart' | 'dashSkill' | 'secondChance' | 'goldenApple' | 'turboCash' | 'frenzy' | 'paralamas' | 'subtleAlert' | 'alarmingAlert' | 'pushApple';
export type SnakeUpgradeType = 'pontuacao' | 'gameplay' | 'especial';

export interface SnakeUpgrade {
    id: SnakeUpgradeId;
    nome: string;
    tipo: SnakeUpgradeType;
    custoInicial: number;
    efeitoPorNivel?: number; // Optional now since some use custom logic
    crescimento?: number; // Optional
    maxLevel: number;
    description: (level: number) => string;
    efeitoMaximo?: number;
    minimo?: number;
    costs?: number[];
}

// --- FEVER SWEET TYPES ---

export type FeverRisk = 'safe' | 'risk';
export type FeverTier = 'budget' | 'mid' | 'premium' | 'luxury';
export type FeverType = 'item' | 'bet';

export interface FeverContentResult {
    items: Partial<Record<SymbolKey, number>>;
    multipliers: Partial<Record<SymbolKey, number>>;
}

export interface FeverRollOption {
    value?: number; // Para itens (dinheiro base)
    contents?: FeverContentResult; // Para itens (conteúdo específico)
    spins?: number; // Para apostas
    roi?: number;
    chance: number;
}

export interface FeverPackage {
    id: string;
    name: string;
    cost: number;
    type: FeverType;
    risk?: FeverRisk;
    tier: FeverTier;
    description: string;
    icon?: string;
    
    // Para pacotes de itens
    contents?: FeverContentResult | 'RANDOM' | 'WEIGHTED_RANDOM' | 'HIGH_RISK_RANDOM' | 'MEGA_JACKPOT' | 'TOTALLY_RANDOM_CHEST';
    
    // Para pacotes de aposta
    spins?: number | 'VARIABLE' | 'EXTREME_VARIABLE' | 'MEGA_VARIABLE';
    cost_per_spin?: number;
    
    // Para pacotes Risk (ambos)
    rolls?: Record<string, FeverRollOption>;
    
    // Metadata
    calculated_value?: number;
    expected_value?: number;
    roi?: number;
    expected_roi?: number;
}

export interface PurchasedPackage extends FeverPackage {
    uniqueId: string; // Para permitir múltiplos do mesmo tipo se a regra mudar, ou chaves unicas
    resultDescription?: string; // O que o jogador ganhou (ex: "40 Spins" ou "Tigre x3")
}

export interface FeverReport {
    startBalance: number;
    endBalance: number;
    totalSpins: number; // Total de giros feitos
    packagesUsed: PurchasedPackage[];
}

// --- STAR BONUS TYPES ---
export interface StarBonusResult {
    uid: string;
    symbols: SymbolKey[];
    win: number;
    isWin: boolean;
}

export interface StarBonusState {
    isActive: boolean;
    results: StarBonusResult[];
    totalWin: number;
}

// --- COIN FLIP BONUS TYPES ---
export interface CoinFlipState {
    isActive: boolean;
    flipsRemaining: number;
    currentMultiplier: number;
    currentBet: number;
    history: ('heads' | 'tails')[];
    lastResult: 'heads' | 'tails' | null;
    isAnimating: boolean;
}

// --- TOKEN FLIP VISUAL TYPES ---
export interface TokenFlipState {
    isActive: boolean;
    results: boolean[]; // true = win (heads), false = lose (tails)
    tokenValue: number; // The market value of 1 token at time of flip
}
