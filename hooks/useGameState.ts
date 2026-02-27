import { useState, useEffect, useCallback, useRef } from 'react';
import type {
    Inventory, Multipliers, PanificadoraLevels, RoiSaldo,
    RenegotiationTier, ActiveCookie, ScratchCardMetrics,
    LotericaInjectionState, BakeryState, CraftingSlot
} from '../types';
import type { FeverSnapshot } from '../utils/feverStateIsolation';
import { calcMomentoValue } from '../utils/mechanics/momentumCalculator';

// ─── Sub-módulos de reset ────────────────────────────────────────────────────
import { getInitialState }                        from './gameResets/initialState';
import { loadGameFromStorage }                    from './gameResets/loadGame';
import { persistGameState, exportCurrentState }   from './gameResets/saveGame';
import { buildSoftResetState }                    from './gameResets/softReset';
import { clearSaveFromStorage, importSaveToStorage } from './gameResets/hardReset';
import { readAllSlotsMeta }                       from './gameResets/initialState';
import type { SaveSlotId, SlotMeta }              from './gameResets/initialState';

export type { SaveSlotId };

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
    const [state, setState]               = useState<SavedState>(getInitialState());
    // ─── Slot ativo: define de onde salva e carrega ──────────────────────────
    const [activeSaveSlot, setActiveSaveSlot] = useState<SaveSlotId>(0);
    // ─── Trava mecânicas durante troca de save ───────────────────────────────
    const [isGameReady, setIsGameReady]   = useState(false);

    const stateRef       = useRef(state);
    const activeSlotRef  = useRef(activeSaveSlot);
    useEffect(() => { stateRef.current      = state;          }, [state]);
    useEffect(() => { activeSlotRef.current = activeSaveSlot; }, [activeSaveSlot]);

    const updateState = useCallback(
        (patch: Partial<SavedState> | ((prev: SavedState) => SavedState)) =>
            setState(prev => typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }),
        []
    );

    // ─── Load (slot específico) ──────────────────────────────────────────────
    const loadGame = useCallback((slot?: SaveSlotId) => {
        const target = slot ?? activeSlotRef.current;
        const loaded = loadGameFromStorage(target);
        if (loaded) setState(loaded);
    }, []);

    // ─── Save síncrono (sempre usa o slot ativo via ref) ────────────────────
    const saveGame = useCallback((isManual = false) => {
        persistGameState(stateRef.current, activeSlotRef.current, showMsg, isManual);
    }, [showMsg]);

    // ─── Trocar slot: salva o atual, carrega o novo, trava durante transição ─
    const switchSaveSlot = useCallback((nextSlot: SaveSlotId) => {
        // 1. Salva o slot atual antes de sair
        persistGameState(stateRef.current, activeSlotRef.current, showMsg, false);
        // 2. Trava mecânicas (raspadinhas, passive income, etc)
        setIsGameReady(false);
        // 3. Troca o slot ativo
        setActiveSaveSlot(nextSlot);
        // 4. Carrega o novo slot
        const loaded = loadGameFromStorage(nextSlot);
        setState(loaded ?? getInitialState());
        // 5. Libera mecânicas após um tick (garante que o estado foi aplicado)
        setTimeout(() => setIsGameReady(true), 50);
        showMsg(`📂 Slot ${nextSlot} carregado!`, 2500, true);
    }, [showMsg]);

    // ─── Soft Reset (Prestígio) ──────────────────────────────────────────────
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

    // ─── Hard Reset (apaga slot ativo) ───────────────────────────────────────
    const hardReset = useCallback(() => {
        clearSaveFromStorage(activeSlotRef.current);
        setState(getInitialState());
    }, []);

    // ─── Import State (importa para o slot ativo) ────────────────────────────
    const importState = useCallback((encodedData: string): boolean => {
        const ok = importSaveToStorage(activeSlotRef.current, encodedData);
        if (ok) loadGame(activeSlotRef.current);
        return ok;
    }, [loadGame]);

    // ─── Export State (snapshot síncrono do estado atual) ────────────────────
    const exportState = useCallback((): string => {
        return exportCurrentState(stateRef.current, activeSlotRef.current, showMsg);
    }, [showMsg]);

    // ─── Metadados de todos os slots (para UI de seleção) ────────────────────
    const getSlotsInfo = useCallback((): SlotMeta[] => readAllSlotsMeta(), []);

    // ─── Init + Auto-save ────────────────────────────────────────────────────
    useEffect(() => {
        const loaded = loadGameFromStorage(0);
        setState(loaded ?? getInitialState());
        setActiveSaveSlot(0);
        setIsGameReady(true);
    }, []);

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
        // ─── Save management ─────────────────────────────────────────────
        activeSaveSlot,
        isGameReady,
        switchSaveSlot,
        getSlotsInfo,
        updateState,
        loadGame,
        saveGame,
        softReset,
        hardReset,
        importState,
        exportState,
        // ─── Setters ─────────────────────────────────────────────────────
        setBal:                       mk<number>('bal'),
        setBetVal:                    mk<number>('betVal'),
        setInv:                       mk<Inventory>('inv'),
        setMult:                      mk<Multipliers>('mult'),
        setBonusMult:                 mk<Multipliers>('bonusMult'),
        setSugar:                     mk<number>('sugar'),
        setPrestigePoints:            mk<number>('prestigePoints'),
        setPrestigeLevel:             mk<number>('prestigeLevel'),
        setUnluckyPot:                mk<number>('unluckyPot'),
        setRoiSaldo:                  mk<RoiSaldo>('roiSaldo'),
        setPanificadoraLevel:         mk<PanificadoraLevels>('panificadoraLevel'),
        setEstrelaPrecoAtual:         mk<number>('estrelaPrecoAtual'),
        setSkillLevels:               mk<Record<string, number>>('skillLevels'),
        setSecondarySkillLevels:      mk<Record<string, number>>('secondarySkillLevels'),
        setSnakeUpgrades:             mk<Record<string, number>>('snakeUpgrades'),
        setScratchCardPurchaseCounts: mk<Record<number, number>>('scratchCardPurchaseCounts'),
        setMomentoLevel:              mk<number>('momentoLevel'),
        setMomentoProgress:           mk<number>('momentoProgress'),
        setCreditCardDebt:            mk<number>('creditCardDebt'),
        setRenegotiationTier:         mk<RenegotiationTier>('renegotiationTier'),
        setMissedPayments:            mk<number>('missedPayments'),
        setPaymentDueDate:            mk<number | null>('paymentDueDate'),
        setIsBettingLocked:           mk<boolean>('isBettingLocked'),
        setItemPenaltyDue:            mk<ItemPenalty | null>('itemPenaltyDue'),
        setActiveCookies:             mk<ActiveCookie[]>('activeCookies'),
        setScratchMetrics:            mk<ScratchCardMetrics>('scratchMetrics'),
        setLotericaState:             mk<LotericaInjectionState>('lotericaState'),
        setTotalTokenPurchases:       mk<number>('totalTokenPurchases'),
        setMortgageUsages:            mk<number>('mortgageUsages'),
        setBakeryState:               mk<BakeryState>('bakery'),
        setFeverSnapshot:             mk<FeverSnapshot>('feverSnapshot'),
    };
};
