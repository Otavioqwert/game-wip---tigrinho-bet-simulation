
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { MID, SUGAR_CONVERSION, SYM } from '../constants';
import { getRandomSymbolFromInventory, calculateMidMultiplierValue, createWeightSnapshot, spinFromSnapshot } from '../utils/spinCalculations';
import type { SymbolKey, MidSymbolKey, Inventory, Multipliers, PanificadoraLevels, SkillId, RoiSaldo, ActiveCookie, StarBonusState, StarBonusResult, CoinFlipState } from '../types';

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
    // Função de aplicação de bônus (Grande Ganho + Hidra)
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
    sweetLadderActive: boolean;
    sweetLadderD: number;
    setSweetLadderD: React.Dispatch<React.SetStateAction<number>>;
}

export const useSpinLogic = (props: SpinLogicProps) => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [grid, setGrid] = useState<SymbolKey[]>(Array(9).fill('🍭'));
    const [spinningColumns, setSpinningColumns] = useState([false, false, false]);
    const [stoppingColumns, setStoppingColumns] = useState([false, false, false]);
    const [quickSpinQueue, setQuickSpinQueue] = useState(0);

    const [starBonusState, setStarBonusState] = useState<StarBonusState>({
        isActive: false, results: [], totalWin: 0
    });

    const [coinFlipState, setCoinFlipState] = useState<CoinFlipState>({
        isActive: false, flipsRemaining: 0, currentMultiplier: 0, currentBet: 0, history: [], lastResult: null, isAnimating: false
    });

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

    const closeStarBonus = useCallback(() => {
        const { handleGain } = propsRef.current;
        if (starBonusState.totalWin > 0) {
            handleGain(starBonusState.totalWin);
        }
        setStarBonusState({ isActive: false, results: [], totalWin: 0 });
    }, [starBonusState.totalWin]);

    const triggerStarBonus = useCallback((validKeys: SymbolKey[], bet: number, lines: number) => {
        const { inv, applyFinalGain } = propsRef.current;
        const results: StarBonusResult[] = [];
        let rawTotalWin = 0;
        let spinsToProcess = 90 * lines;
        
        const snapshot = createWeightSnapshot(inv, validKeys);

        for (let i = 0; i < spinsToProcess; i++) {
            const syms = [spinFromSnapshot(snapshot), spinFromSnapshot(snapshot), spinFromSnapshot(snapshot)] as SymbolKey[];
            const isWin = syms[0] === syms[1] && syms[1] === syms[2];
            let win = 0;
            if (isWin) {
                if (syms[0] === '⭐') {
                    spinsToProcess += 5;
                } else {
                    win = bet * midMultiplierValue(syms[0]) * 0.05;
                }
            }
            results.push({ symbols: syms, win, isWin });
            rawTotalWin += win;
        }

        const finalWin = applyFinalGain(rawTotalWin);
        setStarBonusState({ isActive: true, results, totalWin: finalWin });
    }, [midMultiplierValue]);

    const startCoinFlip = useCallback((flips: number, bet: number) => {
        setCoinFlipState({
            isActive: true,
            flipsRemaining: flips,
            currentMultiplier: 0,
            currentBet: bet,
            history: [],
            lastResult: null,
            isAnimating: false
        });
    }, []);

    const handleCoinGuess = useCallback((guess: 'heads' | 'tails') => {
        if (coinFlipState.isAnimating) return;
        setCoinFlipState(prev => ({ ...prev, isAnimating: true }));
        setTimeout(() => {
            const result: 'heads' | 'tails' = Math.random() < 0.5 ? 'heads' : 'tails';
            const isCorrect = guess === result;
            setCoinFlipState(prev => {
                const nextMultiplier = isCorrect ? (prev.currentMultiplier === 0 ? 2 : prev.currentMultiplier * 2) : 0;
                return { ...prev, isAnimating: false, lastResult: result, history: [...prev.history, result], currentMultiplier: nextMultiplier, flipsRemaining: isCorrect ? prev.flipsRemaining - 1 : 0 };
            });
        }, 2000);
    }, [coinFlipState.isAnimating]);

    const closeCoinFlip = useCallback(() => {
        const { handleGain, applyFinalGain } = propsRef.current;
        const rawWinnings = coinFlipState.currentBet * coinFlipState.currentMultiplier;
        if (rawWinnings > 0) {
            handleGain(applyFinalGain(rawWinnings));
        }
        setCoinFlipState(p => ({ ...p, isActive: false }));
    }, [coinFlipState.currentBet, coinFlipState.currentMultiplier]);

    const getSpinResult = useCallback((finalGrid: SymbolKey[], validKeys: SymbolKey[]) => {
        const { febreDocesAtivo, betValFebre, betVal, inv } = propsRef.current;
        const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
        let totalSweetWin = 0; let totalOtherWin = 0; let hitCount = 0; let sweetLinesCount = 0;
        const isCaminhoEstelarActive = getSkillLevel('caminhoEstelar') > 0;
        const isCaminhoFichaActive = getSkillLevel('caminhoFicha') > 0;
        const currentBet = febreDocesAtivo ? betValFebre : betVal;
        let starLinesFound = 0; let tokenLinesFound = 0;

        for (const line of lines) {
            const syms = line.map(i => finalGrid[i]);
            const wilds = syms.filter(s => s === '⭐').length;
            const nonWilds = syms.filter(s => s !== '⭐');
            let winSymbol: SymbolKey | null = null;
            if (syms.every(s => s === '🪙')) { if (isCaminhoFichaActive) winSymbol = '🪙'; }
            else if (wilds === 3) {
                if (isCaminhoEstelarActive) winSymbol = '⭐';
                else {
                    const eligible = MID.filter(k => (inv[k] || 0) >= 3).sort((a, b) => (SYM[b]?.v || 0) - (SYM[a]?.v || 0));
                    winSymbol = eligible.length > 0 ? (eligible[0] as SymbolKey) : null;
                }
            }
            else if (wilds === 2 && nonWilds.length === 1) winSymbol = nonWilds[0];
            else if (wilds === 1 && nonWilds.length === 2 && nonWilds[0] === nonWilds[1]) winSymbol = nonWilds[0];
            else if (wilds === 0 && syms[0] === syms[1] && syms[1] === syms[2]) winSymbol = syms[0];

            if (winSymbol) {
                if (winSymbol === '⭐' && isCaminhoEstelarActive) starLinesFound++;
                else if (winSymbol === '🪙' && isCaminhoFichaActive) tokenLinesFound++;
                else {
                    const lineWin = currentBet * midMultiplierValue(winSymbol);
                    if (MID.includes(winSymbol as MidSymbolKey)) { totalSweetWin += lineWin; sweetLinesCount++; }
                    else totalOtherWin += lineWin;
                }
                hitCount++;
            }
        }
        if (starLinesFound > 0) triggerStarBonus(validKeys, currentBet, starLinesFound);
        if (tokenLinesFound > 0) startCoinFlip(tokenLinesFound, currentBet);
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
                    const { applyFinalGain, febreDocesAtivo, betValFebre, betVal, febreDocesGiros, handleGain, setFebreDocesGiros, showMsg, setWinMsg, endFever, setUnluckyPot, momentoLevel, setMomentoLevel, momentoProgress, setMomentoProgress, setInv, setSugar, activeCookies, setActiveCookies, sweetLadderActive, sweetLadderD, setSweetLadderD } = propsRef.current;
                    setStoppingColumns([false, false, false]);
                    const result = getSpinResult(animationState.current.finalGrid, animationState.current.availableKeys);
                    const cookieMult = activeCookies.reduce((acc, c) => acc * c.multiplier, 1);
                    const boostedOther = result.totalOtherWin * cookieMult;
                    let ladderBonus = 0;
                    if (febreDocesAtivo && sweetLadderActive) {
                        if (result.sweetLinesCount > 0) {
                            let curD = sweetLadderD;
                            for (let i = 0; i < result.sweetLinesCount; i++) { curD++; ladderBonus += (curD * 10); }
                            setSweetLadderD(curD);
                        } else {
                            if (sweetLadderD > 0) showMsg(`Corrente Quebrada! (Estava em ${sweetLadderD}x)`, 1500, true);
                            setSweetLadderD(0);
                        }
                    }
                    
                    // APLICA O CÁLCULO FINAL (GRANDE GANHO + HIDRA)
                    const rawTotalWinnings = result.totalSweetWin + boostedOther + ladderBonus;
                    const finalWinnings = applyFinalGain(rawTotalWinnings);
                    
                    if (activeCookies.length > 0 && result.totalOtherWin > 0) {
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
        const { febreDocesAtivo, handleSpend, betVal, setWinMsg, cashbackMultiplier } = propsRef.current;
        if (isSpinning || availableKeys.length === 0 || quickSpinQueue > 0 || starBonusState.isActive || coinFlipState.isActive) return;
        setWinMsg('');
        if (!febreDocesAtivo && !handleSpend(betVal * (1 - cashbackMultiplier))) return;
        startAnimationCycle(false);
    }, [isSpinning, availableKeys, quickSpinQueue, startAnimationCycle, starBonusState.isActive, coinFlipState.isActive]);
    
    const handleQuickSpin = useCallback(() => {
        const { febreDocesAtivo, febreDocesGiros, betVal, handleSpend, cashbackMultiplier } = propsRef.current;
        if (febreDocesAtivo) { if (febreDocesGiros > 0) { setQuickSpinQueue(p => p + 1); return true; } return false; }
        if (handleSpend(betVal * (1 - cashbackMultiplier))) { setQuickSpinQueue(p => p + 1); return true; }
        return false;
    }, []);

    useEffect(() => {
        if (quickSpinQueue > 0 && !isSpinning && !starBonusState.isActive && !coinFlipState.isActive) {
            setQuickSpinQueue(p => p - 1); startAnimationCycle(true);
        }
    }, [quickSpinQueue, isSpinning, starBonusState.isActive, coinFlipState.isActive, startAnimationCycle]);

    return { isSpinning, grid, spinningColumns, stoppingColumns, pool: availableKeys, midMultiplierValue, handleSpin, quickSpinQueue, handleQuickSpin, starBonusState, closeStarBonus, coinFlipState, handleCoinGuess, closeCoinFlip, triggerStarBonus, startCoinFlip };
};
