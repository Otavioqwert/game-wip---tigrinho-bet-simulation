/**
 * PRESTIGE ENGINE
 * 
 * Pure logic for:
 * - Prestige cost calculation
 * - Skill affordability check
 * - Prestige progression
 * 
 * Independent from gameplay. Pure calculations only.
 */

export interface PrestigeSkill {
  id: string;
  name: string;
  baseCost: number; // Base prestige points cost
  costMultiplier: number; // Cost scales per level
  maxLevel: number; // Max level for this skill
  description: string;
}

export interface PrestigeEngineInput {
  prestigePoints: number;
  currentSkillLevel: number;
  skill: PrestigeSkill;
}

export interface PrestigeEngineOutput {
  canAfford: boolean;
  costToBuy: number;
  prestigePointsAfter: number;
  nextLevel: number;
  isMaxLevel: boolean;
}

/**
 * Calculate cost to upgrade skill one level
 */
export const calculateSkillCost = (
  skill: PrestigeSkill,
  currentLevel: number
): number => {
  // Cost = base + (multiplier * level)
  // So level 1 costs: base + (multiplier * 1)
  // Level 2 costs: base + (multiplier * 2), etc.
  return skill.baseCost + skill.costMultiplier * (currentLevel + 1);
};

/**
 * MAIN ENGINE: Check if skill upgrade is affordable
 */
export const checkPrestigeAffordability = (
  input: PrestigeEngineInput
): PrestigeEngineOutput => {
  const { prestigePoints, currentSkillLevel, skill } = input;

  const isMaxLevel = currentSkillLevel >= skill.maxLevel;
  const costToBuy = isMaxLevel ? 0 : calculateSkillCost(skill, currentSkillLevel);
  const canAfford = prestigePoints >= costToBuy && !isMaxLevel;
  const prestigePointsAfter = canAfford ? prestigePoints - costToBuy : prestigePoints;
  const nextLevel = canAfford ? currentSkillLevel + 1 : currentSkillLevel;

  return {
    canAfford,
    costToBuy,
    prestigePointsAfter,
    nextLevel,
    isMaxLevel,
  };
};

/**
 * Get all prestige skills (static definition)
 */
export const getAllPrestigeSkills = (): PrestigeSkill[] => [
  {
    id: 'caminhoEstelar',
    name: 'Caminho Estelar',
    baseCost: 10,
    costMultiplier: 5,
    maxLevel: 10,
    description: 'Desbloqueie ⭐ como símbolo de linha',
  },
  {
    id: 'caminhoFicha',
    name: 'Caminho da Ficha',
    baseCost: 15,
    costMultiplier: 8,
    maxLevel: 8,
    description: 'Desbloqueie 🪙 e ganhe giros de moeda',
  },
  // Add more skills as needed
];

/**
 * Batch check affordability for multiple skills
 */
export const checkMultipleSkillsAffordability = (
  prestigePoints: number,
  skillLevels: Record<string, number>,
  skills: PrestigeSkill[]
): Record<string, PrestigeEngineOutput> => {
  const results: Record<string, PrestigeEngineOutput> = {};

  for (const skill of skills) {
    const currentLevel = skillLevels[skill.id] ?? 0;
    results[skill.id] = checkPrestigeAffordability({
      prestigePoints,
      currentSkillLevel: currentLevel,
      skill,
    });
  }

  return results;
};
