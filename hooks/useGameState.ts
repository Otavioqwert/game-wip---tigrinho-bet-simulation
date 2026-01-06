import { useState, useEffect, useCallback, useRef } from 'react';
import { INITIAL_INVENTORY, INITIAL_MULTIPLIERS } from '../constants';
import type { Inventory, Multipliers, PanificadoraLevels, RoiSaldo, RenegotiationTier, ActiveCookie, ScratchCardMetrics, LotericaInjectionState, BakeryState, CraftingSlot } from '../types';
import { prepareSaveState, EMPTY_FEVER_SNAPSHOT, type FeverSnapshot } from '../utils/feverStateIsolation';
import { checkVersionCompatibility, migrateSave, canSafelyLoadSave } from '../utils/saveVersioning';

const SAVE_KEY = 'tigrinho-save-game';
const SAVE_VERSION = 29; // Updated Version for 1 Initial Bakery Slot

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

const getInitialState = (): SavedState => ({
    bal: 100, betVal: 1, inv: { ...INITIAL_INVENTORY }, mult: { ...INITIAL_MULTIPLIERS },
    bonusMult: { ...INITIAL_MULTIPLIERS },
    roiSaldo: { '🍭': 0, '🍦': 0, '🍧': 0 }, panificadoraLevel: { '🍭': 0, '🍦': 0, '🍧': 0 },
    estrelaPrecoAtual: 25, prestigePoints: 0, prestigeLevel: 0,
    skillLevels: {}, secondarySkillLevels: {}, snakeUpgrades: {}, scratchCardPurchaseCounts: {},
    unluckyPot: 0, momentoLevel: 0, momentoProgress: 0, creditCardDebt: 0, renegotiationTier: 0,
    missedPayments: 0, paymentDueDate: null, isBettingLocked: false, itemPenaltyDue: null,
    sugar: 0, activeCookies: [],
    scratchMetrics: {
        tierPurchaseCounts: new Array(10).fill(0), tierLastPurchase: new Array(10).fill(0), tierCooldownRemaining: new Array(10).fill(0)
    },
    lotericaState: {
        lastInjectionTime: new Array(10).fill(0), injectionCooldownRemaining: new Array(10).fill(0), totalInjections: new Array(10).fill(0)
    },
    totalTokenPurchases: 0, mortgageUsages: 0,
    bakery: {
        inventory: { cookie: 0, cupcake: 0, cake: 0 },
        upgradeLevels: { cookie: 0, cupcake: 0, cake: 0 },
        craftingSlots: [
            { id: 0, productId: null, startTime: null, endTime: null, quantity: 0 }
        ],
        extraSlots: 0,
        speedLevel: 0
    },
    feverSnapshot: EMPTY_FEVER_SNAPSHOT
});

const validateAndFixCraftingSlots = (bakery: BakeryState): BakeryState => {
    const expectedSlotCount = 1 + bakery.extraSlots;
    const currentSlotCount = bakery.craftingSlots.length;

    if (currentSlotCount === expectedSlotCount) {
        return bakery;
    }

    console.log(`[Bakery Fix] Detectado ${currentSlotCount} slots, mas deveria ter ${expectedSlotCount} (1 base + ${bakery.extraSlots} extras)`);

    if (currentSlotCount > expectedSlotCount) {
        const occupiedSlots = bakery.craftingSlots.filter(slot => slot.productId !== null);
        const fixedSlots: CraftingSlot[] = [];
        
        for (let i = 0; i < Math.min(occupiedSlots.length, expectedSlotCount); i++) {
            fixedSlots.push({ ...occupiedSlots[i], id: i });
        }
        
        for (let i = fixedSlots.length; i < expectedSlotCount; i++) {
            fixedSlots.push({ id: i, productId: null, startTime: null, endTime: null, quantity: 0 });
        }
        
        console.log(`[Bakery Fix] Reduzido de ${currentSlotCount} para ${expectedSlotCount} slots. Slots ocupados preservados: ${occupiedSlots.length}`);
        
        return { ...bakery, craftingSlots: fixedSlots };
    }

    if (currentSlotCount < expectedSlotCount) {
        const fixedSlots = [...bakery.craftingSlots];
        for (let i = currentSlotCount; i < expectedSlotCount; i++) {
            fixedSlots.push({ id: i, productId: null, startTime: null, endTime: null, quantity: 0 });
        }
        
        console.log(`[Bakery Fix] Expandido de ${currentSlotCount} para ${expectedSlotCount} slots`);
        
        return { ...bakery, craftingSlots: fixedSlots };
    }

    return bakery;
};

export const useGameState = ({ showMsg }: { showMsg: (msg: string, d?: number, e?: boolean) => void }) => {
    const [state, setState] = useState<SavedState>(getInitialState());
    const [versionWarning, setVersionWarning] = useState<any>(null);
    
    const stateRef = useRef(state);
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    const updateState = useCallback((patch: Partial<SavedState> | ((prev: SavedState) => SavedState)) => {
        setState(prev => {
            const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch };
            return next;
        });
    }, []);

    const loadGame = useCallback(() => {
        const saved = localStorage.getItem(SAVE_KEY);
        if (saved && saved.startsWith('V')) {
            try {
                const parts = saved.split(':');
                if (parts.length >= 3) {
                    // Extrai versão do save
                    const saveVersionStr = parts[0].replace('V', '');
                    const saveVersion = parseInt(saveVersionStr, 10);
                    
                    const decoded = JSON.parse(decodeURIComponent(escape(atob(parts[2]))));
                    
                    // ✅ VALIDAÇÃO DE VERSÃO
                    const safetyCheck = canSafelyLoadSave(saveVersion, SAVE_VERSION, decoded);
                    
                    if (!safetyCheck.canLoad) {
                        console.error('[SaveVersioning] Save bloqueado:', safetyCheck.reason);
                        showMsg(`⛔ ${safetyCheck.reason}`, 8000, true);
                        // NÃO carrega o save, usa o inicial
                        return;
                    }
                    
                    if (safetyCheck.needsMigration) {
                        const compatibility = checkVersionCompatibility(saveVersion, SAVE_VERSION, decoded);
                        
                        // Se é risco alto, mostra aviso antes de carregar
                        if (compatibility.risk === 'high' || compatibility.risk === 'critical') {
                            console.warn('[SaveVersioning] Save de alto risco detectado, requer atenção do usuário');
                            setVersionWarning({ compatibility, saveData: decoded });
                            return;
                        }
                        
                        // Migra automaticamente para riscos baixos/médios
                        const migration = migrateSave(decoded, saveVersion, SAVE_VERSION);
                        
                        if (!migration.success) {
                            console.error('[SaveVersioning] Migração falhou:', migration.error);
                            showMsg(`⚠️ Erro ao migrar save: ${migration.error}`, 5000, true);
                            return;
                        }
                        
                        console.info(`[SaveVersioning] Save migrado de v${saveVersion} para v${SAVE_VERSION}`);
                        showMsg(`✅ Save atualizado de v${saveVersion} para v${SAVE_VERSION}`, 3000, true);
                        
                        const merged = { ...getInitialState(), ...migration.data };
                        if (migration.data!.bakery) {
                            merged.bakery = { ...getInitialState().bakery, ...migration.data!.bakery };
                        }
                        merged.bakery = validateAndFixCraftingSlots(merged.bakery);
                        if (!migration.data!.feverSnapshot) {
                            merged.feverSnapshot = EMPTY_FEVER_SNAPSHOT;
                        }
                        setState(merged);
                        return;
                    }
                    
                    // Carregamento normal (mesma versão)
                    const merged = { ...getInitialState(), ...decoded };
                    if (decoded.bakery) {
                        merged.bakery = { ...getInitialState().bakery, ...decoded.bakery };
                    }
                    merged.bakery = validateAndFixCraftingSlots(merged.bakery);
                    if (!decoded.feverSnapshot) {
                        merged.feverSnapshot = EMPTY_FEVER_SNAPSHOT;
                    }
                    setState(merged);
                }
            } catch (e) { console.error("Load failed", e); }
        }
    }, [showMsg]);

    const saveGame = useCallback((isManual = false) => {
        const currentState = stateRef.current;
        
        const { inv: safeInv, mult: safeMult } = prepareSaveState(
            currentState.inv,
            currentState.mult,
            currentState.feverSnapshot
        );
        
        const safeState = {
            ...currentState,
            inv: safeInv,
            mult: safeMult
        };
        
        const json = JSON.stringify(safeState);
        const encoded = btoa(unescape(encodeURIComponent(json)));
        const timestamp = Date.now();
        localStorage.setItem(SAVE_KEY, `V${SAVE_VERSION}:${timestamp}:${encoded}`);
        
        if (isManual) showMsg("✅ Jogo salvo!", 2000, true);
    }, [showMsg]);

    const softReset = useCallback((newPrestigeData: { 
        points: number, level: number, initialBal: number, initialSugar: number, initialCloverMult: number
    }) => {
        const fresh = getInitialState();
        
        const persistentSkillLevels = { ...state.skillLevels };
        const persistentSecondarySkillLevels = { ...state.secondarySkillLevels };

        const adjustedMult = { ...fresh.mult };
        const adjustedBonusMult = { ...fresh.bonusMult };
        const adjustedInv = { ...fresh.inv };

        if (persistentSkillLevels['caminhoEstelar'] > 0) adjustedInv['⭐'] += 3;
        
        if (newPrestigeData.initialCloverMult > 0) {
            adjustedBonusMult['🍀'] = newPrestigeData.initialCloverMult;
        }

        const newState: SavedState = {
            ...fresh,
            bal: newPrestigeData.initialBal,
            sugar: newPrestigeData.initialSugar,
            mult: adjustedMult,
            bonusMult: adjustedBonusMult,
            inv: adjustedInv,
            prestigePoints: newPrestigeData.points,
            prestigeLevel: newPrestigeData.level,
            skillLevels: persistentSkillLevels,
            secondarySkillLevels: persistentSecondarySkillLevels
        };

        setState(newState);
        showMsg("✨ Prestígio realizado! Seu Kit de Partida foi aplicado com sucesso.", 5000, true);
    }, [state.skillLevels, state.secondarySkillLevels, showMsg]);

    useEffect(() => { loadGame(); }, [loadGame]);
    
    const savedCallback = useRef(saveGame);
    useEffect(() => {
        savedCallback.current = saveGame;
    }, [saveGame]);

    useEffect(() => { 
        const i = setInterval(() => {
            savedCallback.current(false);
        }, 30000); 
        return () => clearInterval(i); 
    }, []);

    return {
        ...state,
        versionWarning,
        setVersionWarning,
        setBal: (val: number | ((p: number) => number)) => updateState(s => ({ ...s, bal: typeof val === 'function' ? val(s.bal) : val })),
        setInv: (val: Inventory | ((p: Inventory) => Inventory)) => updateState(s => ({ ...s, inv: typeof val === 'function' ? val(s.inv) : val })),
        setMult: (val: Multipliers | ((p: Multipliers) => Multipliers)) => updateState(s => ({ ...s, mult: typeof val === 'function' ? val(s.mult) : val })),
        setBonusMult: (val: Multipliers | ((p: Multipliers) => Multipliers)) => updateState(s => ({ ...s, bonusMult: typeof val === 'function' ? val(s.bonusMult) : val })),
        setSugar: (val: number | ((p: number) => number)) => updateState(s => ({ ...s, sugar: typeof val === 'function' ? val(s.sugar) : val })),
        setPrestigePoints: (val: number | ((p: number) => number)) => updateState(s => ({ ...s, prestigePoints: typeof val === 'function' ? val(s.prestigePoints) : val })),
        setUnluckyPot: (val: number | ((p: number) => number)) => updateState(s => ({ ...s, unluckyPot: typeof val === 'function' ? val(s.unluckyPot) : val })),
        updateState, softReset, saveGame, hardReset: () => { localStorage.removeItem(SAVE_KEY); setState(getInitialState()); },
        exportState: () => localStorage.getItem(SAVE_KEY) || "",
        importState: (data: string) => { localStorage.setItem(SAVE_KEY, data); loadGame(); return true; },
        setBetVal: (v: any) => updateState(s => ({...s, betVal: typeof v === 'function' ? v(s.betVal) : v})),
        setRoiSaldo: (v: any) => updateState(s => ({...s, roiSaldo: typeof v === 'function' ? v(s.roiSaldo) : v})),
        setPanificadoraLevel: (v: any) => updateState(s => ({...s, panificadoraLevel: typeof v === 'function' ? v(s.panificadoraLevel) : v})),
        setEstrelaPrecoAtual: (v: any) => updateState(s => ({...s, estrelaPrecoAtual: typeof v === 'function' ? v(s.estrelaPrecoAtual) : v})),
        setPrestigeLevel: (v: any) => updateState(s => ({...s, prestigeLevel: typeof v === 'function' ? v(s.prestigeLevel) : v})),
        setSkillLevels: (v: any) => updateState(s => ({...s, skillLevels: typeof v === 'function' ? v(s.skillLevels) : v})),
        setSecondarySkillLevels: (v: any) => updateState(s => ({...s, secondarySkillLevels: typeof v === 'function' ? v(s.secondarySkillLevels) : v})),
        setSnakeUpgrades: (v: any) => updateState(s => ({...s, snakeUpgrades: typeof v === 'function' ? v(s.snakeUpgrades) : v})),
        setScratchCardPurchaseCounts: (v: any) => updateState(s => ({...s, scratchCardPurchaseCounts: typeof v === 'function' ? v(s.scratchCardPurchaseCounts) : v})),
        setMomentoLevel: (v: any) => updateState(s => ({...s, momentoLevel: typeof v === 'function' ? v(s.momentoLevel) : v})),
        setMomentoProgress: (v: any) => updateState(s => ({...s, momentoProgress: typeof v === 'function' ? v(s.momentoProgress) : v})),
        setCreditCardDebt: (v: any) => updateState(s => ({...s, creditCardDebt: typeof v === 'function' ? v(s.creditCardDebt) : v})),
        setRenegotiationTier: (v: any) => updateState(s => ({...s, renegotiationTier: typeof v === 'function' ? v(s.renegotiationTier) : v})),
        setMissedPayments: (v: any) => updateState(s => ({...s, missedPayments: typeof v === 'function' ? v(s.missedPayments) : v})),
        setPaymentDueDate: (v: any) => updateState(s => ({...s, paymentDueDate: typeof v === 'function' ? v(s.paymentDueDate) : v})),
        setIsBettingLocked: (v: any) => updateState(s => ({...s, isBettingLocked: typeof v === 'function' ? v(s.isBettingLocked) : v})),
        setItemPenaltyDue: (v: any) => updateState(s => ({...s, itemPenaltyDue: typeof v === 'function' ? v(s.itemPenaltyDue) : v})),
        setActiveCookies: (v: any) => updateState(s => ({...s, activeCookies: typeof v === 'function' ? v(s.activeCookies) : v})),
        setScratchMetrics: (v: any) => updateState(s => ({...s, scratchMetrics: typeof v === 'function' ? v(s.scratchMetrics) : v})),
        setLotericaState: (v: any) => updateState(s => ({...s, lotericaState: typeof v === 'function' ? v(s.lotericaState) : v})),
        setTotalTokenPurchases: (v: any) => updateState(s => ({...s, totalTokenPurchases: typeof v === 'function' ? v(s.totalTokenPurchases) : v})),
        setMortgageUsages: (v: any) => updateState(s => ({...s, mortgageUsages: typeof v === 'function' ? v(s.mortgageUsages) : v})),
        setBakeryState: (v: any) => updateState(s => ({...s, bakery: typeof v === 'function' ? v(s.bakery) : v})),
        setFeverSnapshot: (v: any) => updateState(s => ({...s, feverSnapshot: typeof v === 'function' ? v(s.feverSnapshot) : v})),
    };
};