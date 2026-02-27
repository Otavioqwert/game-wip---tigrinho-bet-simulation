import { useState, useEffect, useCallback, useRef } from 'react';
import type { Inventory, Multipliers, PanificadoraLevels, RoiSaldo, RenegotiationTier, ActiveCookie, ScratchCardMetrics, LotericaInjectionState, BakeryState, CraftingSlot } from '../types';
import type { FeverSnapshot } from '../utils/feverStateIsolation';
import { calcMomentoValue } from '../utils/mechanics/momentumCalculator';

// ─── Sub-módulos de reset ─────────────────────────────────────────────────────
import { getInitialState }       from './gameResets/initialState';
import { loadGameFromStorage }   from './gameResets/loadGame';
import { persistGameState }      from './gameResets/saveGame';
import { buildSoftResetState }   from './gameResets/softReset';
import { clearSaveFromStorage, importSaveToStorage } from './gameResets/hardReset';

export interface ItemPenalty { amount: number; }

export interface SavedState {
    bal: number; betVal: number; inv: Inventory; mult: Multipliers;
    bonusMult: Multipliers;
    roiSaldo: RoiSaldo; panificadoraLevel: PanificadoraLevels;
    estrelaPrecoAtual: number; prestigePoints: number; prestigeLevel: number;
    skillLevels: Record<string, number>; secondarySkillLevels: Record<string, number>;
    snakeUpgrades: Record<string, number>; scratchCardPurchaseCounts: Record<number, number>;
    unluckyPot: number; momentoLevel: number; momentoProgress: number;
    creditCardDebt: number; renegotiationTier: RenegotiationTier;
    missedPayments: number; paymentDueDate: number | null; isBettingLocked: boolean;
    itemPenaltyDue: ItemPenalty | null; sugar: number; activeCookies: ActiveCookie[];
    scratchMetrics: ScratchCardMetrics; lotericaState: LotericaInjectionState;
    totalTokenPurchases: number; mortgageUsages: number;
    bakery: BakeryState;
    feverSnapshot: FeverSnapshot;
}

export const useGameState = ({ showMsg }: { showMsg: (msg: string, d?: number, e?: boolean) => void }) => {
    const [state, setState] = useState<SavedState>(getInitialState());

    const stateRef = useRef(state);
    useEffect(() => { stateRef.current = state; }, [state]);

    const updateState = useCallback((patch: Partial<SavedState> | ((prev: SavedState) => SavedState)) => {
        setState(prev => typeof patch === 'function' ? patch(prev) : { ...prev, ...patch });
    }, []);

    // ─── Load ────────────────────────────────────────────────────────────────
    const loadGame = useCallback(() => {
        const loaded = loadGameFromStorage();
        if (loaded) setState(loaded);
    }, []);

    // ─── Save ────────────────────────────────────────────────────────────────
    const saveGame = useCallback((isManual = false) => {
        persistGameState(stateRef.current, showMsg, isManual);
    }, [showMsg]);

    // ─── Soft Reset (Prestígio) ───────────────────────────────────────────────
    const softReset = useCallback((params: {
        points: number; level: number;
        initialBal: number; initialSugar: number; initialCloverMult: number;
    }) => {
        const next = buildSoftResetState({
            ...params,
            skillLevels:          state.skillLevels,
            secondarySkillLevels: state.secondarySkillLevels,
        });
        setState(next);
        showMsg('✨ Prestígio realizado! Seu Kit de Partida foi aplicado com sucesso.', 5000, true);
    }, [state.skillLevels, state.secondarySkillLevels, showMsg]);

    // ─── Hard Reset ──────────────────────────────────────────────────────────
    const hardReset = useCallback(() => {
        clearSaveFromStorage();
        setState(getInitialState());
    }, []);

    // ─── Import State ────────────────────────────────────────────────────────
    const importState = useCallback((encodedData: string): boolean => {
        const ok = importSaveToStorage(encodedData);
        if (ok) loadGame();
        return ok;
    }, [loadGame]);

    // ─── Export State ────────────────────────────────────────────────────────
    const exportState = useCallback((): string => {
        // Salva snapshot atual antes de exportar para garantir dados frescos
        persistGameState(stateRef.current, showMsg, false);
        const { SAVE_KEY } = require('./gameResets/initialState');
        return localStorage.getItem(SAVE_KEY) ?? '';
    }, [showMsg]);

    // ─── Init + Auto-save ───────────────────────────────────────────────────
    useEffect(() => { loadGame(); }, [loadGame]);

    const savedCallback = useRef(saveGame);
    useEffect(() => { savedCallback.current = saveGame; }, [saveGame]);
    useEffect(() => {
        const i = setInterval(() => { savedCallback.current(false); }, 30000);
        return () => clearInterval(i);
    }, []);

    // ─── Momento value (derivado) ────────────────────────────────────────────
    const candyStacksForMomento = (state.inv['🍭'] || 0) + (state.inv['🍦'] || 0) + (state.inv['🍧'] || 0);
    const momentoValue          = calcMomentoValue(state.momentoLevel, candyStacksForMomento);

    // ─── Setters individuais ─────────────────────────────────────────────────
    const mk = <T>(key: keyof SavedState) =>
        (val: T | ((p: T) => T)) =>
            updateState(s => ({ ...s, [key]: typeof val === 'function' ? (val as (p: T) => T)(s[key] as T) : val }));

    return {
        ...state,
        candyStacksForMomento,
        momentoValue,
        updateState,
        loadGame,
        saveGame,
        softReset,
        hardReset,
        importState,
        exportState,
        setBal:                    mk<number>('bal'),
        setBetVal:                 mk<number>('betVal'),
        setInv:                    mk<Inventory>('inv'),
        setMult:                   mk<Multipliers>('mult'),
        setBonusMult:              mk<Multipliers>('bonusMult'),
        setSugar:                  mk<number>('sugar'),
        setPrestigePoints:         mk<number>('prestigePoints'),
        setPrestigeLevel:          mk<number>('prestigeLevel'),
        setUnluckyPot:             mk<number>('unluckyPot'),
        setRoiSaldo:               mk<RoiSaldo>('roiSaldo'),
        setPanificadoraLevel:      mk<PanificadoraLevels>('panificadoraLevel'),
        setEstrelaPrecoAtual:      mk<number>('estrelaPrecoAtual'),
        setSkillLevels:            mk<Record<string, number>>('skillLevels'),
        setSecondarySkillLevels:   mk<Record<string, number>>('secondarySkillLevels'),
        setSnakeUpgrades:          mk<Record<string, number>>('snakeUpgrades'),
        setScratchCardPurchaseCounts: mk<Record<number, number>>('scratchCardPurchaseCounts'),
        setMomentoLevel:           mk<number>('momentoLevel'),
        setMomentoProgress:        mk<number>('momentoProgress'),
        setCreditCardDebt:         mk<number>('creditCardDebt'),
        setRenegotiationTier:      mk<RenegotiationTier>('renegotiationTier'),
        setMissedPayments:         mk<number>('missedPayments'),
        setPaymentDueDate:         mk<number | null>('paymentDueDate'),
        setIsBettingLocked:        mk<boolean>('isBettingLocked'),
        setItemPenaltyDue:         mk<ItemPenalty | null>('itemPenaltyDue'),
        setActiveCookies:          mk<ActiveCookie[]>('activeCookies'),
        setScratchMetrics:         mk<ScratchCardMetrics>('scratchMetrics'),
        setLotericaState:          mk<LotericaInjectionState>('lotericaState'),
        setTotalTokenPurchases:    mk<number>('totalTokenPurchases'),
        setMortgageUsages:         mk<number>('mortgageUsages'),
        setBakeryState:            mk<BakeryState>('bakery'),
        setFeverSnapshot:          mk<FeverSnapshot>('feverSnapshot'),
    };
};
