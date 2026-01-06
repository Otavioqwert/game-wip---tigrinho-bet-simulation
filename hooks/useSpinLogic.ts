import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { MID, SUGAR_CONVERSION, SYM } from '../constants';
import { getRandomSymbolFromInventory, calculateMidMultiplierValue, createWeightSnapshot, spinFromSnapshot } from '../utils/spinCalculations';
import type { SymbolKey, MidSymbolKey, Inventory, Multipliers, PanificadoraLevels, SkillId, RoiSaldo, ActiveCookie, StarBonusState, StarBonusResult, CoinFlipState, LeafState } from '../types';
import type { UseSweetLadderResult } from './useSweetLadder';
import type { useParaisoDoceDetector } from './useParaisoDoceDetector';
import { useQuickSpinAvailability, QuickSpinStatus } from './useQuickSpinAvailability';

interface SpinLogicProps {
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
    isCloverPackActive?: boolean;
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
    quickSpinStatus: QuickSpinStatus;
    starBonusState: StarBonusState;
    closeStarBonus: () => void;
    coinFlipState: CoinFlipState;
    handleCoinGuess: (guess: 'heads' | 'tails') => void;
    closeCoinFlip: () => void;
    leafState: LeafState;
    handleCellReroll: (index: number) => void;
    handleGlobalReroll: () => void;
}

// 🔍 Helper: Detecta linhas vencedoras em um grid
interface WinningLine {
    lineIndex: number;
    winSymbol: SymbolKey;
    positions: number[];
}

export const useSpinLogic = (props: SpinLogicProps): UseSpinLogicResult => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [grid, setGrid] = useState<SymbolKey[]>(Array(9).fill('🍭'));
    const [spinningColumns, setSpinningColumns] = useState([false, false, false]);
    const [stoppingColumns, setStoppingColumns] = useState([false, false, false]);
    const [quickSpinQueue, setQuickSpinQueue] = useState(0);

    // 🍁 Leaf System State
    const [leafCount, setLeafCount] = useState(0);

    const [starBonusState, setStarBonusState] = useState<StarBonusState>({
        isActive: false, results: [], totalWin: 0
    });

    const [coinFlipState, setCoinFlipState] = useState<CoinFlipState>({
        isActive: false, flipsRemaining: 0, currentMultiplier: 0, currentBet: 0, history: [], lastResult: null, isAnimating: false
    });

    const [starStreak, setStarStreak] = useState(0); 

    const propsRef = useRef(props);
    propsRef.current = props;
    
    const gridRef = useRef(grid);
    useEffect(() => { gridRef.current = grid; }, [grid]);

    const animationState = useRef({
        startTime: 0,
        finalGrid: [] as SymbolKey[],
        availableKeys: [] as SymbolKey[],
        columns: [
            { status: 'idle', spinStartTime: 0, spinDuration: 1500, decelerateDuration: 500, lastUpdateTime: 0, currentInterval: 50 },
            { status: 'idle', spinStartTime: 100, spinDuration: 2000, decelerateDuration: 500, lastUpdateTime: 0, currentInterval: 50 },
            { status: 'idle', spinStartTime: 200, spinDuration: 2500, decelerateDuration: 500, lastUpdateTime: 0, currentInterval: 50 },
        ]
    });

    const getSkillLevel = useCallback((id: SkillId) => propsRef.current.skillLevels[id] || 0, []);
    
    const availableKeys = useMemo(() => {
        const { inv } = props;
        let keys = (Object.keys(inv) as SymbolKey[]).filter(k => (inv[k] || 0) > 0);
        if (getSkillLevel('caminhoCometa') === 0) keys = keys.filter(s => s !== '☄️');
        if (getSkillLevel('caminhoFicha') === 0) keys = keys.filter(s => s !== '🪙');
        return keys.length > 0 ? keys : (['🍭'] as SymbolKey[]);
    }, [props.inv, getSkillLevel]);

    const getEffectiveMultLevels = useCallback(() => {
        const { mult, bonusMult } = propsRef.current;
        const effective: Multipliers = { ...mult };
        (Object.keys(SYM) as SymbolKey[]).forEach(k => {
            effective[k] = (mult[k] || 0) + (bonusMult[k] || 0);
        });
        return effective;
    }, []);

    const midMultiplierValue = useCallback((sym: SymbolKey) => {
        const baseVal = calculateMidMultiplierValue(sym, getEffectiveMultLevels());
        const isUpgradeable = !['⭐', '🪙'].includes(sym);
        const finalMultiplier = isUpgradeable ? propsRef.current.multUpgradeBonus : 1;
        return baseVal * finalMultiplier;
    }, [getEffectiveMultLevels]);

    // 🔍 FUNÇÃO CORE: Detecta linhas vencedoras em um grid
    const detectWinningLines = useCallback((testGrid: SymbolKey[]): WinningLine[] => {
        const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
        const isCaminhoEstelarActive = getSkillLevel('caminhoEstelar') > 0;
        const isCaminhoFichaActive = getSkillLevel('caminhoFicha') > 0;
        const winningLines: WinningLine[] = [];

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            const syms = line.map(i => testGrid[i]);
            const wilds = syms.filter(s => s === '⭐').length;
            const nonWilds = syms.filter(s => s !== '⭐');
            let winSymbol: SymbolKey | null = null;

            if (syms.every(s => s === '🪙')) {
                if (isCaminhoFichaActive) winSymbol = '🪙';
            }
            else if (wilds > 0 && nonWilds.length > 0) {
                const firstNonWild = nonWilds[0];
                if (nonWilds.every(s => s === firstNonWild)) {
                    winSymbol = firstNonWild;
                }
            }
            else if (wilds === 3 && isCaminhoEstelarActive) {
                winSymbol = '⭐';
            }
            else if (wilds === 0 && syms[0] === syms[1] && syms[1] === syms[2]) {
                winSymbol = syms[0];
            }

            if (winSymbol) {
                winningLines.push({ lineIndex, winSymbol, positions: line });
            }
        }

        return winningLines;
    }, [getSkillLevel]);

    // ⭐ STAR BONUS FUNCTIONS
    const triggerStarBonus = useCallback((validKeys: SymbolKey[], bet: number, lines: number) => {
        // Cada linha ⭐ do jogo normal adiciona 90 linhas bônus estelar
        const bonusLines = lines * 90;
        const results: StarBonusResult[] = [];
        let totalWin = 0;
        let additionalSpins = 0;

        for (let i = 0; i < bonusLines; i++) {
            const symbols = Array.from({ length: 3 }, () => 
                getRandomSymbolFromInventory(propsRef.current.inv, validKeys)
            );
            
            // Lógica de verificação com ⭐ como wild
            const wilds = symbols.filter(s => s === '⭐').length;
            const nonWilds = symbols.filter(s => s !== '⭐');
            let isWin = false;
            let winSymbol: SymbolKey | null = null;
            let winAmount = 0;
            
            // ⭐ é wild - combina com qualquer símbolo não-wild
            if (wilds > 0 && nonWilds.length > 0) {
                const firstNonWild = nonWilds[0];
                if (nonWilds.every(s => s === firstNonWild)) {
                    isWin = true;
                    winSymbol = firstNonWild;
                }
            }
            // Três ⭐ também é win
            else if (wilds === 3) {
                isWin = true;
                winSymbol = '⭐';
            }
            // Três símbolos iguais sem wild
            else if (wilds === 0 && symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
                isWin = true;
                winSymbol = symbols[0];
            }
            
            // Calcula ganho (0.05x o valor normal)
            if (isWin && winSymbol) {
                winAmount = bet * midMultiplierValue(winSymbol) * 0.05;
                totalWin += winAmount;
                
                // Acerto de ⭐ adiciona +5 giros
                if (winSymbol === '⭐') {
                    additionalSpins += 5;
                }
                // Acerto de 🪙 adiciona +2 giros
                else if (winSymbol === '🪙') {
                    additionalSpins += 2;
                }
            }
            
            results.push({ uid: `${Date.now()}-${i}`, symbols, win: winAmount, isWin });
        }

        // Adiciona giros bônus adicionais se houver
        if (additionalSpins > 0) {
            for (let i = 0; i < additionalSpins; i++) {
                const symbols = Array.from({ length: 3 }, () => 
                    getRandomSymbolFromInventory(propsRef.current.inv, validKeys)
                );
                
                // Aplica mesma lógica de wild para giros bônus
                const wilds = symbols.filter(s => s === '⭐').length;
                const nonWilds = symbols.filter(s => s !== '⭐');
                let isWin = false;
                let winSymbol: SymbolKey | null = null;
                let winAmount = 0;
                
                if (wilds > 0 && nonWilds.length > 0) {
                    const firstNonWild = nonWilds[0];
                    if (nonWilds.every(s => s === firstNonWild)) {
                        isWin = true;
                        winSymbol = firstNonWild;
                    }
                }
                else if (wilds === 3) {
                    isWin = true;
                    winSymbol = '⭐';
                }
                else if (wilds === 0 && symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
                    isWin = true;
                    winSymbol = symbols[0];
                }
                
                if (isWin && winSymbol) {
                    winAmount = bet * midMultiplierValue(winSymbol) * 0.05;
                    totalWin += winAmount;
                    
                    // Cascata: mais giros para mais ⭐ ou 🪙
                    if (winSymbol === '⭐') {
                        additionalSpins += 5; // Mais 5 giros
                    }
                    else if (winSymbol === '🪙') {
                        additionalSpins += 2; // Mais 2 giros
                    }
                }
                
                results.push({ uid: `${Date.now()}-${bonusLines + i}`, symbols, win: winAmount, isWin });
            }
        }

        setStarBonusState({ isActive: true, results, totalWin });
        propsRef.current.handleGain(propsRef.current.applyFinalGain(totalWin));
    }, [midMultiplierValue]);

    const closeStarBonus = useCallback(() => {
        setStarBonusState({ isActive: false, results: [], totalWin: 0 });
    }, []);

    // 🪙 COIN FLIP FUNCTIONS
    const startCoinFlip = useCallback((flips: number, bet: number) => {
        setCoinFlipState({
            isActive: true,
            flipsRemaining: flips,
            currentMultiplier: 1,
            currentBet: bet,
            history: [],
            lastResult: null,
            isAnimating: false
        });
    }, []);

    const handleCoinGuess = useCallback((guess: 'heads' | 'tails') => {
        setCoinFlipState(prev => {
            if (prev.isAnimating || prev.flipsRemaining <= 0) return prev;

            const result: 'heads' | 'tails' = Math.random() < 0.5 ? 'heads' : 'tails';
            const won = guess === result;
            const newMultiplier = won ? prev.currentMultiplier * 2 : prev.currentMultiplier;
            const newFlips = prev.flipsRemaining - 1;

            if (won && newFlips > 0) {
                return {
                    ...prev,
                    currentMultiplier: newMultiplier,
                    flipsRemaining: newFlips,
                    history: [...prev.history, result],
                    lastResult: result,
                    isAnimating: true
                };
            } else {
                const winAmount = won ? prev.currentBet * newMultiplier : 0;
                if (winAmount > 0) {
                    propsRef.current.handleGain(propsRef.current.applyFinalGain(winAmount));
                    propsRef.current.showMsg(`🪙 Ganhou $${winAmount.toFixed(2)}!`, 3000);
                }
                return { isActive: false, flipsRemaining: 0, currentMultiplier: 0, currentBet: 0, history: [], lastResult: null, isAnimating: false };
            }
        });
    }, []);

    const closeCoinFlip = useCallback(() => {
        setCoinFlipState({ isActive: false, flipsRemaining: 0, currentMultiplier: 0, currentBet: 0, history: [], lastResult: null, isAnimating: false });
    }, []);

    // 🍁 LEAF ACTIONS COM VALIDAÇÃO
    const handleCellReroll = useCallback((index: number) => {
        const { inv, showMsg, handleGain, applyFinalGain, febreDocesAtivo, betValFebre, betVal } = propsRef.current;
        if (!props.isCloverPackActive) return;
        if (isSpinning) return;
        if (leafCount < 1) {
            showMsg("🍁 Folhas insuficientes!", 1500, true);
            return;
        }

        // 1️⃣ CAPTURA ESTADO ANTES
        const oldGrid = [...gridRef.current];
        const linesBeforeReroll = detectWinningLines(oldGrid);

        // 2️⃣ APLICA REROLL
        setLeafCount(prev => prev - 1);
        const newGrid = [...oldGrid];
        newGrid[index] = getRandomSymbolFromInventory(inv, availableKeys);
        setGrid(newGrid);

        // 3️⃣ DETECTA NOVAS LINHAS
        const linesAfterReroll = detectWinningLines(newGrid);

        // 4️⃣ COMPARA E PAGA APENAS NOVAS LINHAS
        const beforeSet = new Set(linesBeforeReroll.map(l => `${l.lineIndex}-${l.winSymbol}`));
        const newLines = linesAfterReroll.filter(l => !beforeSet.has(`${l.lineIndex}-${l.winSymbol}`));

        if (newLines.length > 0) {
            const currentBet = febreDocesAtivo ? betValFebre : betVal;
            let totalWin = 0;

            for (const line of newLines) {
                const lineWin = currentBet * midMultiplierValue(line.winSymbol);
                totalWin += lineWin;
            }

            const finalWin = applyFinalGain(totalWin);
            handleGain(finalWin);
            showMsg(`🍁 Reroll: +${newLines.length} linha${newLines.length > 1 ? 's' : ''} ($${finalWin.toFixed(2)})`, 2500, true);
        } else {
            showMsg("♻️ Reroll de Célula", 1000, true);
        }
    }, [leafCount, isSpinning, availableKeys, props.isCloverPackActive, detectWinningLines, midMultiplierValue]);

    const handleGlobalReroll = useCallback(() => {
        const { inv, showMsg, handleGain, applyFinalGain, febreDocesAtivo, betValFebre, betVal } = propsRef.current;
        if (!props.isCloverPackActive) return;
        if (isSpinning) return;
        if (leafCount < 3) {
            showMsg("🎰 Precisa de 3 🍁!", 1500, true);
            return;
        }

        // 1️⃣ CAPTURA ESTADO ANTES
        const oldGrid = [...gridRef.current];
        const linesBeforeReroll = detectWinningLines(oldGrid);

        // 2️⃣ APLICA REROLL GLOBAL
        setLeafCount(prev => prev - 3);
        const newGrid = Array.from({ length: 9 }, () => getRandomSymbolFromInventory(inv, availableKeys));
        setGrid(newGrid);

        // 3️⃣ DETECTA NOVAS LINHAS
        const linesAfterReroll = detectWinningLines(newGrid);

        // 4️⃣ COMPARA E PAGA APENAS NOVAS LINHAS
        const beforeSet = new Set(linesBeforeReroll.map(l => `${l.lineIndex}-${l.winSymbol}`));
        const newLines = linesAfterReroll.filter(l => !beforeSet.has(`${l.lineIndex}-${l.winSymbol}`));

        if (newLines.length > 0) {
            const currentBet = febreDocesAtivo ? betValFebre : betVal;
            let totalWin = 0;

            for (const line of newLines) {
                const lineWin = currentBet * midMultiplierValue(line.winSymbol);
                totalWin += lineWin;
            }

            const finalWin = applyFinalGain(totalWin);
            handleGain(finalWin);
            showMsg(`🎰 REROLL GLOBAL: +${newLines.length} linha${newLines.length > 1 ? 's' : ''} ($${finalWin.toFixed(2)})`, 3000, true);
        } else {
            showMsg("🎰 REROLL DA ROLETA!", 2000, true);
        }
    }, [leafCount, isSpinning, availableKeys, props.isCloverPackActive, detectWinningLines, midMultiplierValue]);

    const getSpinResult = useCallback((finalGrid: SymbolKey[], validKeys: SymbolKey[]) => {
        const { febreDocesAtivo, betValFebre, betVal, showMsg, isCloverPackActive } = propsRef.current;
        const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
        let totalSweetWin = 0; let totalOtherWin = 0; let hitCount = 0; let sweetLinesCount = 0;
        const isCaminhoEstelarActive = getSkillLevel('caminhoEstelar') > 0;
        const isCaminhoFichaActive = getSkillLevel('caminhoFicha') > 0;
        const currentBet = febreDocesAtivo ? betValFebre : betVal;
        let starLinesFound = 0; let tokenLinesFound = 0;
        let cloverLinesFound = 0;

        let hasStarHitInThisSpin = false;

        for (const line of lines) {
            const syms = line.map(i => finalGrid[i]);
            const wilds = syms.filter(s => s === '⭐').length;
            const nonWilds = syms.filter(s => s !== '⭐');
            let winSymbol: SymbolKey | null = null;

            if (syms.every(s => s === '🪙')) {
                if (isCaminhoFichaActive) winSymbol = '🪙';
            }
            else if (wilds > 0 && nonWilds.length > 0) {
                const firstNonWild = nonWilds[0];
                if (nonWilds.every(s => s === firstNonWild)) {
                    winSymbol = firstNonWild;
                }
            }
            else if (wilds === 3 && isCaminhoEstelarActive) {
                winSymbol = '⭐';
            }
            else if (wilds === 0 && syms[0] === syms[1] && syms[1] === syms[2]) {
                winSymbol = syms[0];
            }

            if (winSymbol) {
                const lineWin = currentBet * midMultiplierValue(winSymbol);

                if (MID.includes(winSymbol as MidSymbolKey)) {
                    totalSweetWin += lineWin;
                    sweetLinesCount++;
                } else if (winSymbol !== '🪙' && winSymbol !== '⭐') {
                    totalOtherWin += lineWin;
                }

                if (winSymbol === '⭐' && isCaminhoEstelarActive) {
                    starLinesFound++;
                    hasStarHitInThisSpin = true;
                }
                if (winSymbol === '🪙' && isCaminhoFichaActive) {
                    tokenLinesFound++;
                }
                if (winSymbol === '🍀') {
                    cloverLinesFound++;
                }

                hitCount++;
            }
        }

        // 🍁 Ganho de Folhas ao acertar trevo
        if (isCloverPackActive && cloverLinesFound > 0) {
            setLeafCount(prev => prev + cloverLinesFound);
            showMsg(`🍁 +${cloverLinesFound} Folhas!`, 2000, true);
        }

        setStarStreak(prev => hasStarHitInThisSpin ? prev + 1 : 0);
        if (starLinesFound > 0) triggerStarBonus(validKeys, currentBet, starLinesFound);

        if (tokenLinesFound > 0) {
            for (let i = 0; i < tokenLinesFound; i++) {
                if (Math.random() < 0.5) {
                    const r = Math.random() * 100;
                    let extraLines = 0;
                    if (r < 53.33) extraLines = 2;
                    else if (r < 80) extraLines = 4;
                    else if (r < 93.33) extraLines = 8;
                    else extraLines = 16;
                    
                    if (extraLines > 0) {
                        showMsg(`🔄️ +${extraLines} giros`, 2500, true);
                        startCoinFlip(extraLines, currentBet);
                    }
                }
            }
        }

        return { totalSweetWin, totalOtherWin, hitCount, sweetLinesCount };
    }, [getSkillLevel, midMultiplierValue, triggerStarBonus, startCoinFlip]);

    const startAnimationCycle = useCallback((isQuick = false) => {
        setStoppingColumns([false, false, false]);
        const { inv } = propsRef.current;
        const finalGrid = Array.from({ length: 9 }, () => getRandomSymbolFromInventory(inv, availableKeys));
        const now = performance.now();
        animationState.current.startTime = now;
        animationState.current.finalGrid = finalGrid;
        animationState.current.availableKeys = availableKeys; 
        const durations = isQuick ? { spin: [250, 350, 450], decel: 150 } : { spin: [1500, 2000, 2500], decel: 500 };
        animationState.current.columns.forEach((col, i) => {
            col.status = 'pending'; col.lastUpdateTime = now; col.spinStartTime = [100, 200, 300][i];
            col.spinDuration = durations.spin[i]; col.decelerateDuration = durations.decel;
        });
        setIsSpinning(true);
    }, [availableKeys]);

    useEffect(() => {
        if (!isSpinning) return;
        const animate = (timestamp: number) => {
            const { startTime, columns, finalGrid, availableKeys } = animationState.current;
            const currentInv = propsRef.current.inv; 
            let allStopped = true;
            const nextGrid = [...gridRef.current];
            columns.forEach((col, colIndex) => {
                if (col.status === 'stopped') return;
                allStopped = false;
                const elapsedTime = timestamp - startTime;
                if (elapsedTime < col.spinStartTime) return;
                if (col.status === 'pending') {
                    col.status = 'spinning';
                    setSpinningColumns(prev => { const n = [...prev]; n[colIndex] = true; return n; });
                }
                const spinStopTime = col.spinStartTime + col.spinDuration;
                const decelerateStartTime = spinStopTime - col.decelerateDuration;
                if (elapsedTime >= spinStopTime) {
                    col.status = 'stopped';
                    [0, 3, 6].forEach(offset => { nextGrid[colIndex + offset] = finalGrid[colIndex + offset]; });
                    setSpinningColumns(prev => { const n = [...prev]; n[colIndex] = false; return n; });
                    setStoppingColumns(prev => { const n = [...prev]; n[colIndex] = true; return n; });
                } else {
                    const progress = elapsedTime >= decelerateStartTime ? (elapsedTime - decelerateStartTime) / col.decelerateDuration : 0;
                    col.currentInterval = 50 + 200 * progress * (2 - progress);
                    if (timestamp - col.lastUpdateTime >= col.currentInterval) {
                        col.lastUpdateTime = timestamp;
                        [0, 3, 6].forEach(offset => { nextGrid[colIndex + offset] = getRandomSymbolFromInventory(currentInv, availableKeys); });
                    }
                }
            });
            setGrid(nextGrid);
            if (allStopped) {
                setTimeout(() => {
                    const { applyFinalGain, febreDocesAtivo, betValFebre, betVal, febreDocesGiros, handleGain, setFebreDocesGiros, showMsg, setWinMsg, endFever, setUnluckyPot, momentoLevel, setMomentoLevel, momentoProgress, setMomentoProgress, setInv, setSugar, activeCookies, setActiveCookies, sweetLadder, paraisoDetector } = propsRef.current;
                    setStoppingColumns([false, false, false]);
                    const result = getSpinResult(animationState.current.finalGrid, animationState.current.availableKeys);
                    
                    if (febreDocesAtivo && paraisoDetector.isActive) {
                        const candyHits = paraisoDetector.detectCandyHits(animationState.current.finalGrid);
                        if (candyHits.length > 0) {
                            const hitMsg = candyHits.map(h => `${h.count}x ${h.symbol}`).join(' + ');
                            showMsg(`🍬 Paraíso Doce: ${hitMsg}`, 2500, true);
                        }
                    }
                    
                    const cookieMult = febreDocesAtivo ? 1 : activeCookies.reduce((acc, c) => acc * c.multiplier, 1);
                    const boostedOther = result.totalOtherWin * cookieMult;
                    
                    let ladderBonus = 0;
                    if (febreDocesAtivo && sweetLadder.state.isActive) {
                        if (result.sweetLinesCount > 0) {
                            const ladderResult = sweetLadder.onCandyLinesHit(result.sweetLinesCount);
                            ladderBonus = ladderResult.totalBonus;
                            if (ladderResult.slotsUnlocked > 0) showMsg(`🔓 Desbloqueou +${ladderResult.slotsUnlocked} Slot!`, 3000, true);
                            if (ladderResult.livesGained > 0) showMsg(`💚 +${ladderResult.livesGained} Vidas!`, 2000, true);
                            if (ladderResult.chainsCreated > 0) showMsg(`⛓️ +${ladderResult.chainsCreated} Correntes!`, 2000, true);
                        } else {
                            const missResult = sweetLadder.onMiss();
                            if (missResult.livesUsed > 0) showMsg(`💔 ${missResult.livesUsed} Vida usada!`, 2000, true);
                            if (missResult.chainsBroken > 0) showMsg(`💥 ${missResult.chainsBroken} Corrente quebrada!`, 2500, true);
                        }
                    }
                    
                    const rawTotalWinnings = result.totalSweetWin + boostedOther + ladderBonus;
                    const finalWinnings = applyFinalGain(rawTotalWinnings);
                    
                    if (!febreDocesAtivo && activeCookies.length > 0 && result.totalOtherWin > 0) {
                        setActiveCookies(prev => prev.map(c => ({ ...c, remainingSpins: c.remainingSpins - 1 })).filter(c => c.remainingSpins > 0));
                    }
                    if (finalWinnings > 0) handleGain(finalWinnings);
                    
                    const currentSpinBet = febreDocesAtivo ? betValFebre : betVal;
                    if (!febreDocesAtivo) {
                        const netGain = finalWinnings - currentSpinBet;
                        let curL = momentoLevel; let newP = momentoProgress + netGain; let threshold = (curL + 1) * 100;
                        const rewards: Partial<Record<MidSymbolKey, number>> = {};
                        let totalS = 0;
                        while (newP >= threshold && newP > 0) {
                            newP -= threshold; curL++; threshold = (curL + 1) * 100;
                            const candies = curL;
                            for (let i = 0; i < candies; i++) {
                                const r = MID[Math.floor(Math.random() * MID.length)] as MidSymbolKey;
                                rewards[r] = (rewards[r] || 0) + 1; totalS += SUGAR_CONVERSION[r];
                            }
                        }
                        if (totalS > 0) {
                            showMsg(`Momento Nível ${curL}! +${totalS} 🍬`, 4000, true);
                            setInv(prev => { const n = { ...prev }; Object.entries(rewards).forEach(([k,v]) => { n[k as MidSymbolKey] = (n[k as MidSymbolKey] || 0) + v!; }); return n; });
                            setSugar(prev => prev + totalS); setMomentoLevel(curL);
                        }
                        setMomentoProgress(newP);
                        if (finalWinnings < currentSpinBet * 2) setUnluckyPot(p => p + currentSpinBet);
                    } else {
                        const nextG = febreDocesGiros - 1;
                        if (nextG <= 0) endFever(); else setFebreDocesGiros(nextG);
                    }
                    if (finalWinnings > 0) setWinMsg(`🎉 ${result.hitCount} L! Ganhou $ ${finalWinnings.toFixed(2)}`);
                    setIsSpinning(false);
                }, 400);
            } else requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [isSpinning, getSpinResult, startAnimationCycle]);

    const handleSpin = useCallback(() => {
        const { febreDocesAtivo, handleSpend, betVal, setWinMsg, cashbackMultiplier, paraisoDetector } = propsRef.current;
        if (paraisoDetector.activeAnimation !== null) return;
        if (isSpinning || availableKeys.length === 0 || quickSpinQueue > 0 || starBonusState.isActive || coinFlipState.isActive) return;
        setWinMsg('');
        if (!febreDocesAtivo && !handleSpend(betVal * (1 - cashbackMultiplier))) return;
        startAnimationCycle(false);
    }, [isSpinning, availableKeys, quickSpinQueue, startAnimationCycle, starBonusState.isActive, coinFlipState.isActive]);
    
    const quickSpinStatus = useQuickSpinAvailability({
        bal: props.bal,
        betVal: props.betVal,
        febreDocesAtivo: props.febreDocesAtivo,
        febreDocesGiros: props.febreDocesGiros,
        isSpinning,
        quickSpinQueue,
        starBonusState,
        coinFlipState,
        paraisoDetector: props.paraisoDetector,
        cashbackMultiplier: props.cashbackMultiplier,
        handleSpend: props.handleSpend
    });
    
    const handleQuickSpin = useCallback((): boolean => {
        if (!quickSpinStatus.available) {
            if (quickSpinStatus.reason) props.showMsg(quickSpinStatus.reason, 1000);
            return false;
        }
        setQuickSpinQueue(p => p + 1);
        return true;
    }, [quickSpinStatus, props.showMsg]);

    const cancelQuickSpins = useCallback(() => {
        setQuickSpinQueue(0);
    }, []);

    useEffect(() => {
        const { paraisoDetector } = propsRef.current;
        if (paraisoDetector.activeAnimation !== null) return;
        if (quickSpinQueue > 0 && !isSpinning && !starBonusState.isActive && !coinFlipState.isActive) {
            setQuickSpinQueue(p => p - 1); startAnimationCycle(true);
        }
    }, [quickSpinQueue, isSpinning, starBonusState.isActive, coinFlipState.isActive, startAnimationCycle]);

    return { 
        isSpinning, grid, spinningColumns, stoppingColumns, pool: availableKeys, midMultiplierValue, handleSpin, 
        quickSpinQueue, handleQuickSpin, cancelQuickSpins, quickSpinStatus, starBonusState, closeStarBonus, 
        coinFlipState, handleCoinGuess, closeCoinFlip,
        leafState: { count: leafCount, isActive: props.isCloverPackActive || false },
        handleCellReroll,
        handleGlobalReroll
    };
};