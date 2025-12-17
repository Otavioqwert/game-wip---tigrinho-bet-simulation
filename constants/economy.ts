
import type { SymbolKey, SymbolMap, MidSymbolKey } from '../types';

export const MID: MidSymbolKey[] = ['🍭','🍦','🍧'];
export const EXTRA: SymbolKey[] = ['🍀','💵','💎','🐯','☄️','🪙'];

export const SYM: SymbolMap = {
  '⭐':{v:0,p:25},
  '🍭':{v:0.2,p:0},
  '🍦':{v:0.3,p:0},
  '🍧':{v:0.4,p:0},
  '🍀':{v:2,p:1}, 
  '💵':{v:4,p:2},
  '💎':{v:8,p:4},
  '🐯':{v:16,p:8},
  '☄️':{v:64,p:50},
  '🪙':{v:0,p:1}
};

export const INITIAL_INVENTORY: Record<SymbolKey, number> = {
    '🍭': 10, '🍦': 10, '🍧': 10,
    '🍀': 0, '💵': 0, '💎': 0, '🐯': 0,
    '⭐': 2, '☄️': 0, '🪙': 0
};

export const INITIAL_MULTIPLIERS: Record<SymbolKey, number> = {
    '🍭': 0, '🍦': 0, '🍧': 0,
    '🍀': 0, '💵': 0, '💎': 0, '🐯': 0,
    '⭐': 0, '☄️': 0, '🪙': 0
};

export const SUGAR_CONVERSION = {
    '🍭': 1,
    '🍦': 2,
    '🍧': 3
};
