import { useState, useEffect, useCallback, useRef } from 'react';
import { INITIAL_INVENTORY, INITIAL_MULTIPLIERS } from '../constants';
import type { Inventory, Multipliers, PanificadoraLevels, RoiSaldo, RenegotiationTier, ActiveCookie, ScratchCardMetrics, LotericaInjectionState, BakeryState, CraftingSlot } from '../types';
import { prepareSaveState, EMPTY_FEVER_SNAPSHOT, type FeverSnapshot } from '../utils/feverStateIsolation';
import { calculateMomentumLevel, calcMomentoValue } from '../utils/mechanics/momentumCalculator';

const SAVE_KEY = 'tigrinho-save-game';
const SAVE_VERSION = 30; // Migração de Momento tetraédrico

export interface ItemPenalty { amount: number; }

export interface SavedState {
    bal: number; betVal: number; inv: Inventory; mult: Multipliers;
    bonusMult: Multipliers; // Níveis extras que não aumentam o preço
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
    bakery: BakeryState; // New Bakery State
    feverSnapshot: FeverSnapshot; // Fever State Isolation
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

// VALIDAÇÃO E CORREÇÃO AUTOMÁTICA DE CRAFTING SLOTS
const validateAndFixCraftingSlots = (bakery: BakeryState): BakeryState => {
    const expectedSlotCount = 1 + bakery.extraSlots;
    const currentSlotCount = bakery.craftingSlots.length;

    // Se tiver a quantidade correta, retorna sem modificação
    if (currentSlotCount === expectedSlotCount) {
        return bakery;
    }

    console.log(`[Bakery Fix] Detectado ${currentSlotCount} slots, mas deveria ter ${expectedSlotCount} (1 base + ${bakery.extraSlots} extras)`);

    // Se tiver MAIS slots que deveria (save antigo com 3 slots iniciais)
    if (currentSlotCount > expectedSlotCount) {
        // Mantém apenas os slots ocupados + completa até expectedSlotCount
        const occupiedSlots = bakery.craftingSlots.filter(slot => slot.productId !== null);
        const emptySlots = bakery.craftingSlots.filter(slot => slot.productId === null);
        
        // Usa os ocupados primeiro, depois preenche com vazios até o limite
        const fixedSlots: CraftingSlot[] = [];
        
        // Adiciona slots ocupados primeiro
        for (let i = 0; i < Math.min(occupiedSlots.length, expectedSlotCount); i++) {
            fixedSlots.push({ ...occupiedSlots[i], id: i });
        }
        
        // Completa com slots vazios
        for (let i = fixedSlots.length; i < expectedSlotCount; i++) {
            fixedSlots.push({ id: i, productId: null, startTime: null, endTime: null, quantity: 0 });
        }
        
        console.log(`[Bakery Fix] Reduzido de ${currentSlotCount} para ${expectedSlotCount} slots. Slots ocupados preservados: ${occupiedSlots.length}`);
        
        return { ...bakery, craftingSlots: fixedSlots };
    }

    // Se tiver MENOS slots que deveria (caso improvável, mas trata mesmo assim)
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
    
    // Ref para manter o estado atualizado sem precisar recriar funções
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
                // parts[0] = Version, parts[1] = Timestamp/ID, parts[2] = Encoded Data
                if (parts.length >= 3) {
                    const decoded = JSON.parse(decodeURIComponent(escape(atob(parts[2]))));
                    
                    // Versão do save: V29, V30, etc
                    const versionTag = parts[0]; // ex: "V29"
                    const version = parseInt(versionTag.slice(1), 10) || 0;
                    
                    // Merge com o estado inicial para garantir novas propriedades
                    const merged = { ...getInitialState(), ...decoded };
                    
                    // Deep merge for bakery
                    if (decoded.bakery) {
                        merged.bakery = { ...getInitialState().bakery, ...decoded.bakery };
                    }
                    
                    // VALIDAÇÃO AUTOMÁTICA: Corrige craftingSlots baseado em extraSlots
                    merged.bakery = validateAndFixCraftingSlots(merged.bakery);
                    
                    // Ensure feverSnapshot exists
                    if (!decoded.feverSnapshot) {
                        merged.feverSnapshot = EMPTY_FEVER_SNAPSHOT;
                    }

                    // --- MIGRAÇÃO DE MOMENTO PARA FÓRMULA TETRAÉDRICA ---
                    // Só roda para saves antigos (V29 e anteriores)
                    if (version > 0 && version < 30) {
                        try {
                            const oldLevel = merged.momentoLevel ?? 0;
                            const oldProgress = merged.momentoProgress ?? 0;

                            if (oldLevel > 0 || oldProgress > 0) {
                                // Aproxima o total de progresso com a fórmula antiga (linear):
                                // threshold_antigo(i) = i * 100
                                let approxTotal = oldProgress;
                                for (let i = 1; i <= oldLevel; i++) {
                                    approxTotal += i * 100;
                                }

                                const { level, remainingProgress } = calculateMomentumLevel(approxTotal);
                                merged.momentoLevel = level;
                                merged.momentoProgress = remainingProgress;
                                
                                console.log('[Momentum Migration] Migrado de', 
                                    { oldLevel, oldProgress }, 
                                    'para', 
                                    { level, remainingProgress }
                                );
                            }
                        } catch (e) {
                            console.warn('[Momentum Migration] Falha ao migrar Momento, mantendo valores antigos', e);
                        }
                    }
                    
                    setState(merged);
                }
            } catch (e) { console.error("Load failed", e); }
        }
    }, []);

    const saveGame = useCallback((isManual = false) => {
        const currentState = stateRef.current;
        
        // APLICAR ISOLAMENTO DE FEBRE ANTES DE SALVAR
        const { inv: safeInv, mult: safeMult } = prepareSaveState(
            currentState.inv,
            currentState.mult,
            currentState.feverSnapshot
        );
        
        // Criar cópia do estado com inv/mult corretos
        const safeState = {
            ...currentState,
            inv: safeInv,
            mult: safeMult
        };
        
        const json = JSON.stringify(safeState);
        const encoded = btoa(unescape(encodeURIComponent(json)));
        
        // Usamos Date.now() como ID único do save para diferenciar cada salvamento
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
        
        // Bônus do Start/Stop entra no BonusMult (não afeta preço)
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
    
    // --- CORREÇÃO DO AUTO-SAVE ---
    // Armazena a função saveGame mais recente em uma ref.
    // Isso permite que o setInterval chame a versão correta sem precisar
    // adicionar saveGame como dependência (o que reiniciaria o timer).
    const savedCallback = useRef(saveGame);
    useEffect(() => {
        savedCallback.current = saveGame;
    }, [saveGame]);

    useEffect(() => { 
        // O intervalo agora roda indefinidamente sem ser reiniciado
        const i = setInterval(() => {
            savedCallback.current(false);
        }, 30000); 
        return () => clearInterval(i); 
    }, []); // Array vazio = monta apenas uma vez

    // --- MOMENTO VALUE (valor derivado por nível e inventário) ---
    // Fórmula: 100x + (x²)/2 + 10y
    // x = momentoLevel, y = total de figuras de doces no inventário (🍭 + 🍦 + 🍧)
    const candyStacksForMomento = (state.inv['🍭'] || 0) + (state.inv['🍦'] || 0) + (state.inv['🍧'] || 0);
    const momentoValue = calcMomentoValue(state.momentoLevel, candyStacksForMomento);

    return {
        ...state,
        candyStacksForMomento,
        momentoValue,
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
