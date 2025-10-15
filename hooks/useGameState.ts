import { useState, useEffect, useCallback } from 'react';
import { INITIAL_INVENTORY, INITIAL_MULTIPLIERS } from '../constants';
import type { Inventory, Multipliers, PanificadoraLevels, RoiSaldo, SymbolKey, RenegotiationTier } from '../types';

const SAVE_KEY = 'tigrinho-save-game';
const SAVE_VERSION = 16; // Incremented version for new momento state

export interface ItemPenalty {
    amount: number;
}

export interface SavedState {
    bal: number;
    betVal: number;
    inv: Inventory;
    mult: Multipliers;
    roiSaldo: RoiSaldo;
    panificadoraLevel: PanificadoraLevels;
    estrelaPrecoAtual: number;
    prestigePoints: number;
    prestigeLevel: number;
    skillLevels: Record<string, number>;
    secondarySkillLevels: Record<string, number>;
    snakeUpgrades: Record<string, number>;
    scratchCardPurchaseCounts: Record<number, number>;
    unluckyPot: number;
    momentoLevel: number;
    momentoProgress: number;
    creditCardDebt: number;
    renegotiationTier: RenegotiationTier;
    // New state for interactive credit card payments
    missedPayments: number;
    paymentDueDate: number | null;
    isBettingLocked: boolean;
    itemPenaltyDue: ItemPenalty | null;
}

const getInitialState = (): SavedState => ({
    bal: 100,
    betVal: 1,
    inv: { ...INITIAL_INVENTORY },
    mult: { ...INITIAL_MULTIPLIERS },
    roiSaldo: { '🍭': 0, '🍦': 0, '🍧': 0 },
    panificadoraLevel: { '🍭': 0, '🍦': 0, '🍧': 0 },
    estrelaPrecoAtual: 25, // SYM['⭐'].p
    prestigePoints: 0,
    prestigeLevel: 0,
    skillLevels: {},
    secondarySkillLevels: {},
    snakeUpgrades: {},
    scratchCardPurchaseCounts: {},
    unluckyPot: 0,
    momentoLevel: 0,
    momentoProgress: 0,
    creditCardDebt: 0,
    renegotiationTier: 0,
    missedPayments: 0,
    paymentDueDate: null,
    isBettingLocked: false,
    itemPenaltyDue: null,
});

const parseAndMigrateSaveData = (encodedState: string): SavedState | null => {
    try {
        if (!encodedState.startsWith('V')) {
            const parsed = JSON.parse(encodedState);
            if (typeof parsed.bal === 'number' && typeof parsed.inv === 'object') {
                return { ...getInitialState(), ...parsed };
            }
            return null;
        }

        const parts = encodedState.split(':');
        if (parts.length !== 3) return null;

        const saveVersion = parseInt(parts[0].substring(1), 10);
        const checksum = parseInt(parts[1], 10);
        const base64Data = parts[2];
        const decodedBinaryString = atob(base64Data);

        const calculatedChecksum = decodedBinaryString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        if (calculatedChecksum !== checksum) {
            console.error("Checksum mismatch.");
            return null;
        }

        const jsonData = decodeURIComponent(escape(decodedBinaryString));
        let parsedState: Partial<SavedState> = JSON.parse(jsonData);

        if (saveVersion < 16) {
             // Migrate from old momento to new system if loading an old save
            if (typeof (parsedState as any).momento === 'number') {
                delete (parsedState as any).momento;
                delete (parsedState as any).maxMomentoReached;
                parsedState.momentoLevel = 0;
                parsedState.momentoProgress = 0;
            }
        }
        
        // Ensure bal is not negative from older saves
        if (parsedState.bal && parsedState.bal < 0) {
            parsedState.bal = 0;
        }

        return { ...getInitialState(), ...parsedState };

    } catch (error) {
        console.error("Failed to parse or migrate save data:", error);
        return null;
    }
};

interface GameStateProps {
    showMsg: (msg: string, duration?: number, isExtra?: boolean) => void;
}

export const useGameState = ({ showMsg }: GameStateProps) => {
    const [bal, setBal] = useState(getInitialState().bal);
    const [betVal, setBetVal] = useState(getInitialState().betVal);
    const [inv, setInv] = useState<Inventory>(getInitialState().inv);
    const [mult, setMult] = useState<Multipliers>(getInitialState().mult);
    const [roiSaldo, setRoiSaldo] = useState<RoiSaldo>(getInitialState().roiSaldo);
    const [panificadoraLevel, setPanificadoraLevel] = useState<PanificadoraLevels>(getInitialState().panificadoraLevel);
    const [estrelaPrecoAtual, setEstrelaPrecoAtual] = useState(getInitialState().estrelaPrecoAtual);
    const [prestigePoints, setPrestigePoints] = useState(getInitialState().prestigePoints);
    const [prestigeLevel, setPrestigeLevel] = useState(getInitialState().prestigeLevel);
    const [skillLevels, setSkillLevels] = useState<Record<string, number>>(getInitialState().skillLevels);
    const [secondarySkillLevels, setSecondarySkillLevels] = useState<Record<string, number>>(getInitialState().secondarySkillLevels);
    const [snakeUpgrades, setSnakeUpgrades] = useState<Record<string, number>>(getInitialState().snakeUpgrades);
    const [scratchCardPurchaseCounts, setScratchCardPurchaseCounts] = useState<Record<number, number>>(getInitialState().scratchCardPurchaseCounts);
    const [unluckyPot, setUnluckyPot] = useState<number>(getInitialState().unluckyPot);
    const [momentoLevel, setMomentoLevel] = useState(getInitialState().momentoLevel);
    const [momentoProgress, setMomentoProgress] = useState(getInitialState().momentoProgress);
    const [creditCardDebt, setCreditCardDebt] = useState(getInitialState().creditCardDebt);
    const [renegotiationTier, setRenegotiationTier] = useState<RenegotiationTier>(getInitialState().renegotiationTier);
    const [missedPayments, setMissedPayments] = useState(getInitialState().missedPayments);
    const [paymentDueDate, setPaymentDueDate] = useState(getInitialState().paymentDueDate);
    const [isBettingLocked, setIsBettingLocked] = useState(getInitialState().isBettingLocked);
    const [itemPenaltyDue, setItemPenaltyDue] = useState(getInitialState().itemPenaltyDue);


    const loadState = (state: SavedState) => {
        setBal(state.bal);
        setBetVal(state.betVal);
        setInv(state.inv);
        setMult(state.mult);
        setRoiSaldo(state.roiSaldo);
        setPanificadoraLevel(state.panificadoraLevel);
        setEstrelaPrecoAtual(state.estrelaPrecoAtual);
        setPrestigePoints(state.prestigePoints);
        setPrestigeLevel(state.prestigeLevel);
        setSkillLevels(state.skillLevels || {});
        setSecondarySkillLevels(state.secondarySkillLevels || {});
        setSnakeUpgrades(state.snakeUpgrades || {});
        setScratchCardPurchaseCounts(state.scratchCardPurchaseCounts || {});
        setUnluckyPot(state.unluckyPot || 0);
        setMomentoLevel(state.momentoLevel || 0);
        setMomentoProgress(state.momentoProgress || 0);
        setCreditCardDebt(state.creditCardDebt || 0);
        setRenegotiationTier(state.renegotiationTier || 0);
        setMissedPayments(state.missedPayments || 0);
        setPaymentDueDate(state.paymentDueDate || null);
        setIsBettingLocked(state.isBettingLocked || false);
        setItemPenaltyDue(state.itemPenaltyDue || null);
    };
    
    const softReset = useCallback((newPrestigeData: { points: number, level: number, initialBal: number }) => {
        const initial = getInitialState();
        // Carrega um estado completamente novo, MAS sobrescreve-o imediatamente
        // com os valores de prestígio que queremos preservar.
        loadState({
            ...initial,
            bal: newPrestigeData.initialBal, // Use new initial balance
            prestigePoints: newPrestigeData.points,
            prestigeLevel: newPrestigeData.level,
            skillLevels: skillLevels,
            secondarySkillLevels: secondarySkillLevels, // Preserve secondary skills
        });
        showMsg("Progresso reiniciado para o próximo nível de prestígio!", 4000, true);
    }, [skillLevels, secondarySkillLevels, showMsg]);

    const exportState = useCallback((): string => {
        const gameState: SavedState = { bal, betVal, inv, mult, roiSaldo, panificadoraLevel, estrelaPrecoAtual, prestigePoints, prestigeLevel, skillLevels, secondarySkillLevels, snakeUpgrades, scratchCardPurchaseCounts, unluckyPot, momentoLevel, momentoProgress, creditCardDebt, renegotiationTier, missedPayments, paymentDueDate, isBettingLocked, itemPenaltyDue };
        const jsonState = JSON.stringify(gameState);
        const binaryString = unescape(encodeURIComponent(jsonState));
        const checksum = binaryString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const encodedData = btoa(binaryString);
        return `V${SAVE_VERSION}:${checksum}:${encodedData}`;
    }, [bal, betVal, inv, mult, roiSaldo, panificadoraLevel, estrelaPrecoAtual, prestigePoints, prestigeLevel, skillLevels, secondarySkillLevels, snakeUpgrades, scratchCardPurchaseCounts, unluckyPot, momentoLevel, momentoProgress, creditCardDebt, renegotiationTier, missedPayments, paymentDueDate, isBettingLocked, itemPenaltyDue]);

    const saveGame = useCallback((isManual = false) => {
        try {
            localStorage.setItem(SAVE_KEY, exportState());
            if (isManual) showMsg("✅ Jogo salvo com sucesso!", 2000, true);
        } catch (error) {
            console.error("Failed to save game:", error);
            if (isManual) showMsg("❌ Falha ao salvar o jogo.", 2000, true);
        }
    }, [exportState, showMsg]);
    
    const importState = useCallback((encodedState: string): boolean => {
        const stateToLoad = parseAndMigrateSaveData(encodedState);
        if (stateToLoad) {
            loadState(stateToLoad);
            saveGame();
            showMsg("Jogo importado com sucesso!", 3000, true);
            return true;
        }
        showMsg("Falha ao importar: código inválido ou corrompido.", 4000, true);
        return false;
    }, [saveGame, showMsg]);

    const hardReset = useCallback(() => {
        localStorage.removeItem(SAVE_KEY);
        loadState(getInitialState());
        showMsg("Jogo resetado para o estado inicial.", 3000, true);
    }, [showMsg]);

    const loadGame = useCallback(() => {
        const savedData = localStorage.getItem(SAVE_KEY);
        if (savedData) {
            const state = parseAndMigrateSaveData(savedData);
            if (state) loadState(state);
        }
    }, []);

    useEffect(() => { loadGame(); }, [loadGame]);
    useEffect(() => { const i = setInterval(() => saveGame(false), 10000); return () => clearInterval(i); }, [saveGame]);
    
    return {
        bal, setBal,
        betVal, setBetVal,
        inv, setInv,
        mult, setMult,
        roiSaldo, setRoiSaldo,
        panificadoraLevel, setPanificadoraLevel,
        estrelaPrecoAtual, setEstrelaPrecoAtual,
        prestigePoints, setPrestigePoints,
        prestigeLevel, setPrestigeLevel,
        skillLevels, setSkillLevels,
        secondarySkillLevels, setSecondarySkillLevels,
        snakeUpgrades, setSnakeUpgrades,
        scratchCardPurchaseCounts, setScratchCardPurchaseCounts,
        unluckyPot, setUnluckyPot,
        momentoLevel, setMomentoLevel,
        momentoProgress, setMomentoProgress,
        creditCardDebt, setCreditCardDebt,
        renegotiationTier, setRenegotiationTier,
        missedPayments, setMissedPayments,
        paymentDueDate, setPaymentDueDate,
        isBettingLocked, setIsBettingLocked,
        itemPenaltyDue, setItemPenaltyDue,
        softReset,
        saveGame, hardReset, exportState, importState
    };
};