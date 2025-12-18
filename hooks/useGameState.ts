
import { useState, useEffect, useCallback, useRef } from 'react';
import { INITIAL_INVENTORY, INITIAL_MULTIPLIERS } from '../constants';
import type { Inventory, Multipliers, PanificadoraLevels, RoiSaldo, RenegotiationTier, ActiveCookie, ScratchCardMetrics, LotericaInjectionState, BakeryState } from '../types';

const SAVE_KEY = 'tigrinho-save-game';
const SAVE_VERSION = 27; // Updated Version for Bakery

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
            { id: 0, productId: null, startTime: null, endTime: null, quantity: 0 },
            { id: 1, productId: null, startTime: null, endTime: null, quantity: 0 },
            { id: 2, productId: null, startTime: null, endTime: null, quantity: 0 }
        ],
        extraSlots: 0,
        speedLevel: 0
    }
});

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
                    // Merge com o estado inicial para garantir novas propriedades
                    const merged = { ...getInitialState(), ...decoded };
                    
                    // Deep merge for bakery
                    if (decoded.bakery) {
                        merged.bakery = { ...getInitialState().bakery, ...decoded.bakery };
                    }
                    
                    setState(merged);
                }
            } catch (e) { console.error("Load failed", e); }
        }
    }, []);

    const saveGame = useCallback((isManual = false) => {
        // Usa stateRef.current para garantir que salvamos o estado mais recente
        const currentState = stateRef.current;
        const json = JSON.stringify(currentState);
        const encoded = btoa(unescape(encodeURIComponent(json)));
        
        // Usamos Date.now() como ID único do save para diferenciar cada salvamento
        const timestamp = Date.now();
        localStorage.setItem(SAVE_KEY, `V27:${timestamp}:${encoded}`);
        
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

    return {
        ...state,
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
    };
};
