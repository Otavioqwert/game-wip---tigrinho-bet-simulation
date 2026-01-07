/**
 * GAME ENGINES - PURE BUSINESS LOGIC
 * 
 * Each engine is completely independent and testable.
 * No side effects, no component awareness.
 * 
 * Import what you need:
 * import { calculateSpinResult } from './engines';
 * import { generateStarBonusSpins } from './engines';
 * etc.
 */

// Spin Engine - Core spin result calculation
export {
  calculateSpinResult,
  type SpinEngineInput,
  type SpinEngineOutput,
} from './useSpinEngine';

// Star Bonus Engine - Bonus spin generation
export {
  generateStarBonusSpins,
  type StarBonusEngineInput,
  type StarBonusEngineOutput,
  type StarBonusResult,
} from './useStarBonusEngine';

// Coin Flip Engine - Coin flip result generation
export {
  processCoinFlip,
  calculateCoinFlipPayout,
  type CoinFlipEngineInput,
  type CoinFlipEngineOutput,
} from './useCoinFlipEngine';

// Prestige Engine - Skill affordability and progression
export {
  calculateSkillCost,
  checkPrestigeAffordability,
  getAllPrestigeSkills,
  checkMultipleSkillsAffordability,
  type PrestigeSkill,
  type PrestigeEngineInput,
  type PrestigeEngineOutput,
} from './usePrestigeEngine';

// Fever Engine - Fever state management
export {
  updateFeverState,
  calculateFeverTotalPayout,
  shouldFeverEnd,
  validateFeverState,
  type FeverEngineInput,
  type FeverEngineOutput,
} from './useFeverEngine';
