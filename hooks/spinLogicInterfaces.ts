import type { SymbolKey, MidSymbolKey, Inventory, Multipliers, PanificadoraLevels, SkillId, RoiSaldo, ActiveCookie, StarBonusState, StarBonusResult, CoinFlipState } from '../types';
import type { UseSweetLadderResult } from './useSweetLadder';
import type { useParaisoDoceDetector } from './useParaisoDoceDetector';

export interface SpinLogicProps {
    bal: number;
    betVal: number;
    inv: Inventory;
    setInv: React.Dispatch<React.SetStateAction<Inventory>>;
    mult: Multipliers;
    bonusMult: Multipliers;
    multUpgradeBonus: number; 
    panificadoraLevel: PanificadoraLevels;
    febreDocesAtivo: boolean;
    endFever: () => void;
    febreDocesGiros: number;
    setFebreDocesGiros: React.Dispatch<React.SetStateAction<number>>;
    betValFebre: number;
    applyFinalGain: (baseAmount: number) => number;
    skillLevels: Record<string, number>;
    showMsg: (msg: string, duration?: number, isExtra?: boolean) => void;
    setWinMsg: React.Dispatch<React.SetStateAction<string>>;
    unluckyPot: number;
    setUnluckyPot: React.Dispatch<React.SetStateAction<number>>;
    cashbackMultiplier: number;
    creditLimit: number;
    momentoLevel: number;
    setMomentoLevel: React.Dispatch<React.SetStateAction<number>>;
    momentoProgress: number;
    setMomentoProgress: React.Dispatch<React.SetStateAction<number>>;
    setRoiSaldo: React.Dispatch<React.SetStateAction<RoiSaldo>>;
    handleSpend: (cost: number) => boolean;
    handleGain: (amount: number) => void;
    activeCookies: ActiveCookie[];
    setActiveCookies: React.Dispatch<React.SetStateAction<ActiveCookie[]>>;
    setSugar: React.Dispatch<React.SetStateAction<number>>;
    sweetLadder: UseSweetLadderResult;
    paraisoDetector: ReturnType<typeof useParaisoDoceDetector>;
}

export interface UseSpinLogicResult {
    isSpinning: boolean;
    grid: SymbolKey[];
    spinningColumns: boolean[];
    stoppingColumns: boolean[];
    pool: SymbolKey[];
    midMultiplierValue: (sym: SymbolKey) => number;
    handleSpin: () => void;
    quickSpinQueue: number;
    handleQuickSpin: () => boolean;
    cancelQuickSpins: () => void;
    quickSpinStatus: { available: boolean; reason: string | null };
    starBonusState: StarBonusState;
    closeStarBonus: () => void;
    coinFlipState: CoinFlipState;
    handleCoinGuess: (guess: 'heads' | 'tails') => void;
    closeCoinFlip: () => void;
    triggerStarBonus: (validKeys: SymbolKey[], bet: number, lines: number) => void;
    startCoinFlip: (flips: number, bet: number) => void;
}