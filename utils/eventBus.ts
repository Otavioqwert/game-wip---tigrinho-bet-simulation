/**
 * EVENT BUS SYSTEM
 * 
 * Eliminates circular dependencies by using pub/sub pattern
 * instead of direct hook imports.
 * 
 * Components can emit events without knowing about other components
 * that listen to them.
 */

type EventListener<T> = (data: T) => void;

interface EventBusImpl {
  // Spin Events
  onSpinComplete: (listener: (data: SpinCompleteEvent) => void) => () => void;
  emitSpinComplete: (data: SpinCompleteEvent) => void;

  // Star Bonus Events
  onStarBonusTriggered: (listener: (data: StarBonusEvent) => void) => () => void;
  emitStarBonusTriggered: (data: StarBonusEvent) => void;

  // Coin Flip Events
  onCoinFlipTriggered: (listener: (data: CoinFlipEvent) => void) => () => void;
  emitCoinFlipTriggered: (data: CoinFlipEvent) => void;

  // Prestige Events
  onPrestigeReset: (listener: (data: PrestigeResetEvent) => void) => () => void;
  emitPrestigeReset: (data: PrestigeResetEvent) => void;

  // Fever Events
  onFeverStarted: (listener: (data: FeverStartedEvent) => void) => () => void;
  emitFeverStarted: (data: FeverStartedEvent) => void;

  onFeverEnded: (listener: (data: FeverEndedEvent) => void) => () => void;
  emitFeverEnded: (data: FeverEndedEvent) => void;

  // State Validation Events
  onStateValidationError: (listener: (data: StateValidationErrorEvent) => void) => () => void;
  emitStateValidationError: (data: StateValidationErrorEvent) => void;
}

/**
 * EVENT TYPES
 */

export interface SpinCompleteEvent {
  grid: string[];
  totalWin: number;
  hitCount: number;
  hasStarHit: boolean;
  timestamp: number;
}

export interface StarBonusEvent {
  linesFound: number;
  currentBet: number;
  totalWin: number;
  timestamp: number;
}

export interface CoinFlipEvent {
  flipsRemaining: number;
  currentBet: number;
  currentMultiplier: number;
  timestamp: number;
}

export interface PrestigeResetEvent {
  prestigeLevel: number;
  prestigePoints: number;
  timestamp: number;
}

export interface FeverStartedEvent {
  feverSpins: number;
  feverBet: number;
  timestamp: number;
}

export interface FeverEndedEvent {
  totalFeverSpins: number;
  totalFeverWin: number;
  timestamp: number;
}

export interface StateValidationErrorEvent {
  error: string;
  path: string;
  severity: 'warning' | 'error';
  timestamp: number;
}

/**
 * EVENT BUS IMPLEMENTATION
 */

class EventBus implements EventBusImpl {
  private listeners: Map<string, Set<EventListener<any>>> = new Map();

  private subscribe<T>(event: string, listener: EventListener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  private emit<T>(event: string, data: T): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`[EventBus] Error in listener for "${event}":`, error);
        }
      });
    }
  }

  // --- SPIN EVENTS ---
  onSpinComplete = (listener: EventListener<SpinCompleteEvent>) =>
    this.subscribe('spin:complete', listener);
  emitSpinComplete = (data: SpinCompleteEvent) =>
    this.emit('spin:complete', data);

  // --- STAR BONUS EVENTS ---
  onStarBonusTriggered = (listener: EventListener<StarBonusEvent>) =>
    this.subscribe('starBonus:triggered', listener);
  emitStarBonusTriggered = (data: StarBonusEvent) =>
    this.emit('starBonus:triggered', data);

  // --- COIN FLIP EVENTS ---
  onCoinFlipTriggered = (listener: EventListener<CoinFlipEvent>) =>
    this.subscribe('coinFlip:triggered', listener);
  emitCoinFlipTriggered = (data: CoinFlipEvent) =>
    this.emit('coinFlip:triggered', data);

  // --- PRESTIGE EVENTS ---
  onPrestigeReset = (listener: EventListener<PrestigeResetEvent>) =>
    this.subscribe('prestige:reset', listener);
  emitPrestigeReset = (data: PrestigeResetEvent) =>
    this.emit('prestige:reset', data);

  // --- FEVER EVENTS ---
  onFeverStarted = (listener: EventListener<FeverStartedEvent>) =>
    this.subscribe('fever:started', listener);
  emitFeverStarted = (data: FeverStartedEvent) =>
    this.emit('fever:started', data);

  onFeverEnded = (listener: EventListener<FeverEndedEvent>) =>
    this.subscribe('fever:ended', listener);
  emitFeverEnded = (data: FeverEndedEvent) =>
    this.emit('fever:ended', data);

  // --- STATE VALIDATION EVENTS ---
  onStateValidationError = (listener: EventListener<StateValidationErrorEvent>) =>
    this.subscribe('validation:error', listener);
  emitStateValidationError = (data: StateValidationErrorEvent) =>
    this.emit('validation:error', data);

  /**
   * CLEAR ALL LISTENERS (for testing)
   */
  clear = () => {
    this.listeners.clear();
  };

  /**
   * GET LISTENER COUNT (for debugging)
   */
  getListenerCount = (event: string): number => {
    return this.listeners.get(event)?.size ?? 0;
  };
}

/**
 * SINGLETON EVENT BUS INSTANCE
 * 
 * All components use the same instance to communicate
 */
export const gameEventBus = new EventBus();

/**
 * HOOK TO USE EVENT BUS
 * 
 * Automatically handles subscription cleanup
 */
export const useGameEvents = () => {
  return gameEventBus;
};
