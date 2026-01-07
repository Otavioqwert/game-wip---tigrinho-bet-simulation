/**
 * STATE VALIDATION LAYER
 * 
 * Prevents silent failures from undefined props and ensures type safety
 * at all boundaries where state is passed through component trees.
 */

import type { Inventory, Multipliers, PanificadoraLevels, SkillId, ActiveCookie, RoiSaldo } from '../types';

export class StateValidationError extends Error {
  constructor(message: string, public path: string) {
    super(`[STATE VALIDATION] ${message} (path: ${path})`);
    this.name = 'StateValidationError';
  }
}

/**
 * VALIDATION HELPERS
 */
const validateRequired = (value: any, fieldName: string, expectedType?: string): void => {
  if (value === undefined || value === null) {
    throw new StateValidationError(`${fieldName} is required`, fieldName);
  }
  if (expectedType && typeof value !== expectedType) {
    throw new StateValidationError(
      `${fieldName} must be ${expectedType}, got ${typeof value}`,
      fieldName
    );
  }
};

const validateOptional = (
  value: any,
  fieldName: string,
  defaultValue: any,
  expectedType?: string
): any => {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  if (expectedType && typeof value !== expectedType) {
    console.warn(
      `[VALIDATION] ${fieldName} has wrong type (expected ${expectedType}, got ${typeof value}), using default`
    );
    return defaultValue;
  }
  return value;
};

/**
 * SPIN LOGIC PROPS VALIDATOR
 * Ensures all props needed by useSpinLogic are present and valid
 */
export interface ValidatedSpinLogicProps {
  bal: number;
  betVal: number;
  inv: Inventory;
  setInv: (val: Inventory | ((p: Inventory) => Inventory)) => void;
  mult: Multipliers;
  bonusMult: Multipliers;
  multUpgradeBonus: number;
  panificadoraLevel: PanificadoraLevels;
  febreDocesAtivo: boolean;
  endFever: () => void;
  febreDocesGiros: number;
  setFebreDocesGiros: (val: number | ((p: number) => number)) => void;
  betValFebre: number;
  applyFinalGain: (baseAmount: number) => number;
  skillLevels: Record<string, number>;
  showMsg: (msg: string, duration?: number, isExtra?: boolean) => void;
  setWinMsg: (val: string) => void;
  unluckyPot: number;
  setUnluckyPot: (val: number | ((p: number) => number)) => void;
  cashbackMultiplier: number;
  creditLimit: number;
  momentoLevel: number;
  setMomentoLevel: (val: number | ((p: number) => number)) => void;
  momentoProgress: number;
  setMomentoProgress: (val: number | ((p: number) => number)) => void;
  setRoiSaldo: (val: RoiSaldo | ((p: RoiSaldo) => RoiSaldo)) => void;
  handleSpend: (cost: number) => boolean;
  handleGain: (amount: number) => void;
  activeCookies: ActiveCookie[];
  setActiveCookies: (val: ActiveCookie[] | ((p: ActiveCookie[]) => ActiveCookie[])) => void;
  setSugar: (val: number | ((p: number) => number)) => void;
  sweetLadder: any; // UseSweet LadderResult
  paraisoDetector: any; // ReturnType<typeof useParaisoDoceDetector>
  isCloverPackActive: boolean; // NOW REQUIRED AND VALIDATED
}

export const validateSpinLogicProps = (props: any): ValidatedSpinLogicProps => {
  try {
    validateRequired(props.bal, 'bal', 'number');
    validateRequired(props.betVal, 'betVal', 'number');
    validateRequired(props.inv, 'inv', 'object');
    validateRequired(props.setInv, 'setInv', 'function');
    validateRequired(props.mult, 'mult', 'object');
    validateRequired(props.bonusMult, 'bonusMult', 'object');
    validateRequired(props.multUpgradeBonus, 'multUpgradeBonus', 'number');
    validateRequired(props.panificadoraLevel, 'panificadoraLevel', 'object');
    validateRequired(props.febreDocesAtivo, 'febreDocesAtivo', 'boolean');
    validateRequired(props.endFever, 'endFever', 'function');
    validateRequired(props.febreDocesGiros, 'febreDocesGiros', 'number');
    validateRequired(props.setFebreDocesGiros, 'setFebreDocesGiros', 'function');
    validateRequired(props.betValFebre, 'betValFebre', 'number');
    validateRequired(props.applyFinalGain, 'applyFinalGain', 'function');
    validateRequired(props.skillLevels, 'skillLevels', 'object');
    validateRequired(props.showMsg, 'showMsg', 'function');
    validateRequired(props.setWinMsg, 'setWinMsg', 'function');
    validateRequired(props.unluckyPot, 'unluckyPot', 'number');
    validateRequired(props.setUnluckyPot, 'setUnluckyPot', 'function');
    validateRequired(props.cashbackMultiplier, 'cashbackMultiplier', 'number');
    validateRequired(props.creditLimit, 'creditLimit', 'number');
    validateRequired(props.momentoLevel, 'momentoLevel', 'number');
    validateRequired(props.setMomentoLevel, 'setMomentoLevel', 'function');
    validateRequired(props.momentoProgress, 'momentoProgress', 'number');
    validateRequired(props.setMomentoProgress, 'setMomentoProgress', 'function');
    validateRequired(props.setRoiSaldo, 'setRoiSaldo', 'function');
    validateRequired(props.handleSpend, 'handleSpend', 'function');
    validateRequired(props.handleGain, 'handleGain', 'function');
    validateRequired(props.activeCookies, 'activeCookies', 'object');
    validateRequired(props.setActiveCookies, 'setActiveCookies', 'function');
    validateRequired(props.setSugar, 'setSugar', 'function');
    validateRequired(props.sweetLadder, 'sweetLadder', 'object');
    validateRequired(props.paraisoDetector, 'paraisoDetector', 'object');

    // NOW ENFORCE isCloverPackActive is NOT undefined
    const isCloverPackActive = validateOptional(
      props.isCloverPackActive,
      'isCloverPackActive',
      false, // DEFAULT TO FALSE IF NOT PROVIDED
      'boolean'
    );

    return {
      ...props,
      isCloverPackActive, // GUARANTEED TO BE boolean
    } as ValidatedSpinLogicProps;
  } catch (error) {
    if (error instanceof StateValidationError) {
      console.error(error.message);
      throw error;
    }
    throw new StateValidationError(`Unknown validation error: ${error}`, 'unknown');
  }
};

/**
 * GAME STATE PROPS VALIDATOR
 * Validates the main game state object
 */
export const validateGameState = (state: any) => {
  try {
    validateRequired(state.bal, 'state.bal', 'number');
    validateRequired(state.betVal, 'state.betVal', 'number');
    validateRequired(state.inv, 'state.inv', 'object');
    validateRequired(state.prestigePoints, 'state.prestigePoints', 'number');
    validateRequired(state.skillLevels, 'state.skillLevels', 'object');
    return true;
  } catch (error) {
    console.error('[STATE VALIDATION] Invalid game state:', error);
    return false;
  }
};

/**
 * SAFE PROP ACCESS
 * Returns safe value with fallback for optional props
 */
export const safeGet = <T>(obj: any, path: string, defaultValue: T): T => {
  try {
    const value = path.split('.').reduce((current, key) => current?.[key], obj);
    return value !== undefined ? value : defaultValue;
  } catch {
    return defaultValue;
  }
};

/**
 * PROP LOGGER
 * Logs props for debugging (only in dev)
 */
export const logProps = (componentName: string, props: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`[PROPS] ${componentName}`);
    console.table(props);
    console.groupEnd();
  }
};
