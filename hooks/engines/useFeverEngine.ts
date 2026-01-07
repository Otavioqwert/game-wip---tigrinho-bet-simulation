/**
 * FEVER ENGINE
 * 
 * Pure logic for:
 * - Fever state transitions
 * - Spin decrement logic
 * - Fever end detection
 * 
 * Independent state machine. Pure calculations only.
 */

export interface FeverEngineInput {
  isActive: boolean;
  spinsRemaining: number;
  shouldDecrement: boolean; // true when a spin just completed
}

export interface FeverEngineOutput {
  isActive: boolean;
  spinsRemaining: number;
  justEnded: boolean; // true if fever just ended this call
}

/**
 * MAIN ENGINE: Update fever state
 */
export const updateFeverState = (
  input: FeverEngineInput
): FeverEngineOutput => {
  const { isActive, spinsRemaining, shouldDecrement } = input;

  // If not active, nothing changes
  if (!isActive) {
    return {
      isActive: false,
      spinsRemaining: 0,
      justEnded: false,
    };
  }

  // If no decrement needed, keep state
  if (!shouldDecrement) {
    return {
      isActive,
      spinsRemaining,
      justEnded: false,
    };
  }

  // Decrement spins
  const nextSpins = spinsRemaining - 1;
  const justEnded = nextSpins <= 0;

  return {
    isActive: !justEnded,
    spinsRemaining: nextSpins,
    justEnded,
  };
};

/**
 * Calculate total payout after fever ends
 */
export const calculateFeverTotalPayout = (
  totalSpinsPlayed: number,
  totalWinsAccumulated: number
): number => {
  // Fever mode: sum of all wins during fever
  return totalWinsAccumulated;
};

/**
 * Check if should auto-end fever (e.g., manual end button)
 */
export const shouldFeverEnd = (
  manualEndRequested: boolean,
  isActive: boolean,
  spinsRemaining: number
): boolean => {
  return manualEndRequested && isActive && spinsRemaining > 0;
};

/**
 * Batch validate fever state
 */
export const validateFeverState = (
  isActive: boolean,
  spinsRemaining: number
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (isActive && spinsRemaining <= 0) {
    errors.push('Fever is active but has no spins remaining');
  }

  if (!isActive && spinsRemaining > 0) {
    errors.push('Fever is inactive but has spins remaining');
  }

  if (spinsRemaining < 0) {
    errors.push('Spins remaining cannot be negative');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
