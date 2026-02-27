import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { MID, SUGAR_CONVERSION, SYM } from '../constants';
import { getRandomSymbolFromInventory, calculateMidMultiplierValue, createWeightSnapshot, spinFromSnapshot } from '../utils/spinCalculations';
import type { SymbolKey, MidSymbolKey, Inventory, Multipliers, PanificadoraLevels, SkillId, RoiSaldo, ActiveCookie, StarBonusState, StarBonusResult, CoinFlipState } from '../types';
import type { UseSweetLadderResult } from './useSweetLadder';
import type { useParaisoDoceDetector } from './useParaisoDoceDetector';
import { useQuickSpinAvailability, QuickSpinStatus } from './useQuickSpinAvailability';
import { validateSpinLogicProps } from '../utils/validateState';
import { calculateMomentumThreshold } from '../utils/mechanics/momentumCalculator';

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
    triggerStarBonus: (validKeys: SymbolKey[], bet: number, lines: number) => void;
    startCoinFlip: (flips: number, bet: number) => void;
}

export const useSpinLogic = (rawProps: SpinLogicProps): UseSpinLogicResult => {
    const props = validateSpinLogicProps(rawProps);

    const [isSpinning, setIsSpinning]         = useState(false);
    const [grid, setGrid]                     = useState<SymbolKey[]>(Array(9).fill('\ud83c\udf6d'));
    const [spinningColumns, setSpinningColumns] = useState([false, false, false]);
    const [stoppingColumns, setStoppingColumns] = useState([false, false, false]);

    // ─── Fila de quick spin ─────────────────────────────────────────────────
    // quickSpinQueue é só para exibição na UI.
    // O controle real de disparo fica no quickSpinQueueRef + isProcessingRef,
    // isolados de ciclos de render, eliminando condições de corrida.
    const [quickSpinQueue, setQuickSpinQueue] = useState(0);
    const quickSpinQueueRef  = useRef(0);   // fonte de verdade da fila
    const isProcessingRef    = useRef(false); // mutex: impede disparo duplo
    const isSpinningRef      = useRef(false); // espelho de isSpinning sem lag de render

    const syncQueue = (delta: number) => {
        quickSpinQueueRef.current = Math.max(0, quickSpinQueueRef.current + delta);
        setQuickSpinQueue(quickSpinQueueRef.current);
    };

    const [starBonusState, setStarBonusState] = useState<StarBonusState>({
        isActive: false, results: [], totalWin: 0
    });
    const starBonusActiveRef = useRef(false);
    useEffect(() => { starBonusActiveRef.current = starBonusState.isActive; }, [starBonusState.isActive]);

    const [coinFlipState, setCoinFlipState] = useState<CoinFlipState>({
        isActive: false, flipsRemaining: 0, currentMultiplier: 0, currentBet: 0, history: [], lastResult: null, isAnimating: false
    });
    const coinFlipActiveRef = useRef(false);
    useEffect(() => { coinFlipActiveRef.current = coinFlipState.isActive; }, [coinFlipState.isActive]);

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
            { status: 'idle', spinStartTime: 0,   spinDuration: 1500, decelerateDuration: 500, lastUpdateTime: 0, currentInterval: 50 },
            { status: 'idle', spinStartTime: 100,  spinDuration: 2000, decelerateDuration: 500, lastUpdateTime: 0, currentInterval: 50 },
            { status: 'idle', spinStartTime: 200,  spinDuration: 2500, decelerateDuration: 500, lastUpdateTime: 0, currentInterval: 50 },
        ]
    });

    const getSkillLevel = useCallback((id: SkillId) => propsRef.current.skillLevels[id] || 0, []);

    const availableKeys = useMemo(() => {
        const { inv } = props;
        let keys = (Object.keys(inv) as SymbolKey[]).filter(k => (inv[k] || 0) > 0);
        if (getSkillLevel('caminhoCometa') === 0) keys = keys.filter(s => s !== '\u2604\ufe0f');
        if (getSkillLevel('caminhoFicha')  === 0) keys = keys.filter(s => s !== '\ud83e\ude99');
        return keys.length > 0 ? keys : (['\ud83c\udf6d'] as SymbolKey[]);
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
        const isUpgradeable = !['\u2b50', '\ud83e\ude99'].includes(sym);
        const finalMultiplier = isUpgradeable ? propsRef.current.multUpgradeBonus : 1;
        return baseVal * finalMultiplier;
    }, [getEffectiveMultLevels]);

    const closeStarBonus = useCallback(() => {
        if (starBonusState.totalWin > 0) propsRef.current.handleGain(starBonusState.totalWin);
        setStarBonusState({ isActive: false, results: [], totalWin: 0 });
    }, [starBonusState.totalWin]);

    const triggerStarBonus = useCallback((validKeys: SymbolKey[], bet: number, lines: number) => {
        const { inv, applyFinalGain, showMsg } = propsRef.current;
        let results: StarBonusResult[] = [];
        let rawTotalWin = 0;
        const bonusLinesPerHit = 90 + starStreak * 5;
        let spinsToProcess = bonusLinesPerHit * lines;
        const snapshot = createWeightSnapshot(inv, validKeys);
        const sessionId = Date.now().toString();
        let i = 0;
        while (i < spinsToProcess) {
            const syms = [spinFromSnapshot(snapshot), spinFromSnapshot(snapshot), spinFromSnapshot(snapshot)] as SymbolKey[];
            const wilds = syms.filter(s => s === '\u2b50').length;
            const nonWilds = syms.filter(s => s !== '\u2b50');
            let winSymbol: SymbolKey | null = null;
            if      (syms.every(s => s === '\ud83e\ude99'))                          { winSymbol = '\ud83e\ude99'; }
            else if (wilds > 0 && nonWilds.length > 0 && nonWilds.every(s => s === nonWilds[0])) { winSymbol = nonWilds[0]; }
            else if (wilds === 3)                                                    { winSymbol = '\u2b50'; }
            else if (wilds === 0 && syms[0] === syms[1] && syms[1] === syms[2])     { winSymbol = syms[0]; }
            let win = 0;
            const isWin = winSymbol !== null;
            if (isWin && winSymbol === '\ud83e\ude99') {
                if (Math.random() < 0.5) {
                    const r = Math.random() * 100;
                    const extra = r < 53.33 ? 2 : r < 80 ? 4 : r < 93.33 ? 8 : 16;
                    spinsToProcess += extra;
                    showMsg(`\ud83d\udd04\ufe0f +${extra} linhas`, 2000, true);
                }
            } else if (isWin && winSymbol !== '\u2b50') {
                win = bet * midMultiplierValue(winSymbol!) * 0.05;
            }
            results.push({ uid: `${sessionId}-${i}`, symbols: syms, win, isWin });
            rawTotalWin += win;
            i++;
        }
        setStarBonusState({ isActive: true, results, totalWin: applyFinalGain(rawTotalWin) });
    }, [midMultiplierValue, starStreak]);

    const startCoinFlip = useCallback((flips: number, bet: number) => {
        setCoinFlipState({ isActive: true, flipsRemaining: flips, currentMultiplier: 0, currentBet: bet, history: [], lastResult: null, isAnimating: false });
    }, []);

    const handleCoinGuess = useCallback((guess: 'heads' | 'tails') => {
        if (coinFlipState.isAnimating) return;
        setCoinFlipState(prev => ({ ...prev, isAnimating: true }));
        setTimeout(() => {
            const result: 'heads' | 'tails' = Math.random() < 0.5 ? 'heads' : 'tails';
            const isCorrect = guess === result;
            setCoinFlipState(prev => ({
                ...prev, isAnimating: false, lastResult: result,
                history: [...prev.history, result],
                currentMultiplier: isCorrect ? (prev.currentMultiplier === 0 ? 2 : prev.currentMultiplier * 2) : 0,
                flipsRemaining: isCorrect ? prev.flipsRemaining - 1 : 0
            }));
        }, 2000);
    }, [coinFlipState.isAnimating]);

    const closeCoinFlip = useCallback(() => {
        const raw = coinFlipState.currentBet * coinFlipState.currentMultiplier;
        if (raw > 0) propsRef.current.handleGain(propsRef.current.applyFinalGain(raw));
        setCoinFlipState(p => ({ ...p, isActive: false }));
    }, [coinFlipState.currentBet, coinFlipState.currentMultiplier]);

    const getSpinResult = useCallback((finalGrid: SymbolKey[], validKeys: SymbolKey[]) => {
        const { febreDocesAtivo, betValFebre, betVal, showMsg } = propsRef.current;
        const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        let totalSweetWin = 0, totalOtherWin = 0, hitCount = 0, sweetLinesCount = 0;
        const isCaminhoEstelarActive = getSkillLevel('caminhoEstelar') > 0;
        const isCaminhoFichaActive   = getSkillLevel('caminhoFicha')   > 0;
        const currentBet = febreDocesAtivo ? betValFebre : betVal;
        let starLinesFound = 0, tokenLinesFound = 0, hasStarHit = false;

        for (const line of lines) {
            const syms = line.map(i => finalGrid[i]);
            const wilds    = syms.filter(s => s === '\u2b50').length;
            const nonWilds = syms.filter(s => s !== '\u2b50');
            let winSymbol: SymbolKey | null = null;

            if      (syms.every(s => s === '\ud83e\ude99') && isCaminhoFichaActive)                           { winSymbol = '\ud83e\ude99'; }
            else if (wilds > 0 && nonWilds.length > 0 && nonWilds.every(s => s === nonWilds[0]))          { winSymbol = nonWilds[0]; }
            else if (wilds === 3 && isCaminhoEstelarActive)                                                { winSymbol = '\u2b50'; }
            else if (wilds === 0 && syms[0] === syms[1] && syms[1] === syms[2])                           { winSymbol = syms[0]; }

            if (winSymbol) {
                const lineWin = currentBet * midMultiplierValue(winSymbol);
                if (MID.includes(winSymbol as MidSymbolKey)) { totalSweetWin += lineWin; sweetLinesCount++; }
                else if (winSymbol !== '\ud83e\ude99' && winSymbol !== '\u2b50') totalOtherWin += lineWin;
                if (winSymbol === '\u2b50' && isCaminhoEstelarActive) { starLinesFound++; hasStarHit = true; }
                if (winSymbol === '\ud83e\ude99' && isCaminhoFichaActive) tokenLinesFound++;
                hitCount++;
            }
        }

        setStarStreak(prev => hasStarHit ? prev + 1 : 0);
        if (starLinesFound > 0) triggerStarBonus(validKeys, currentBet, starLinesFound);
        if (tokenLinesFound > 0) {
            for (let i = 0; i < tokenLinesFound; i++) {
                if (Math.random() < 0.5) {
                    const r = Math.random() * 100;
                    const extra = r < 53.33 ? 2 : r < 80 ? 4 : r < 93.33 ? 8 : 16;
                    if (extra > 0) { showMsg(`\ud83d\udd04\ufe0f +${extra} giros`, 2500, true); startCoinFlip(extra, currentBet); }
                }
            }
        }
        return { totalSweetWin, totalOtherWin, hitCount, sweetLinesCount };
    }, [getSkillLevel, midMultiplierValue, triggerStarBonus, startCoinFlip]);

    // ─── Núcleo da animação ─────────────────────────────────────────────────────
    const startAnimationCycle = useCallback((isQuick = false) => {
        setStoppingColumns([false, false, false]);
        const { inv } = propsRef.current;
        const finalGrid = Array.from({ length: 9 }, () => getRandomSymbolFromInventory(inv, availableKeys));
        const now = performance.now();
        animationState.current.startTime       = now;
        animationState.current.finalGrid       = finalGrid;
        animationState.current.availableKeys   = availableKeys;
        const durations = isQuick
            ? { spin: [250, 350, 450], decel: 150 }
            : { spin: [1500, 2000, 2500], decel: 500 };
        animationState.current.columns.forEach((col, i) => {
            col.status              = 'pending';
            col.lastUpdateTime      = now;
            col.spinStartTime       = [100, 200, 300][i];
            col.spinDuration        = durations.spin[i];
            col.decelerateDuration  = durations.decel;
        });
        isSpinningRef.current = true;
        setIsSpinning(true);
    }, [availableKeys]);

    // ─── Disparo de um quick spin síncrono (via refs, sem depender de render) ───
    const tryFireNextQuickSpin = useCallback(() => {
        // Bloqueia se já processando, girando ou com modal ativo
        if (
            isProcessingRef.current     ||
            isSpinningRef.current       ||
            starBonusActiveRef.current  ||
            coinFlipActiveRef.current
        ) return;

        if (quickSpinQueueRef.current <= 0) {
            isProcessingRef.current = false;
            return;
        }

        const { febreDocesAtivo, handleSpend, betVal, setWinMsg, cashbackMultiplier, paraisoDetector } = propsRef.current;
        if (paraisoDetector.activeAnimation !== null) return;

        // Debita a aposta antes de girar
        if (!febreDocesAtivo && !handleSpend(betVal * (1 - cashbackMultiplier))) {
            // Saldo insuficiente: cancela toda a fila
            quickSpinQueueRef.current = 0;
            setQuickSpinQueue(0);
            isProcessingRef.current = false;
            return;
        }

        isProcessingRef.current = true;
        setWinMsg('');
        syncQueue(-1); // consome 1 da fila
        startAnimationCycle(true);
    }, [startAnimationCycle]);

    // Quando isSpinning vira false, libera o mutex e tenta o próximo da fila
    useEffect(() => {
        if (isSpinning) return;
        isSpinningRef.current   = false;
        isProcessingRef.current = false;
        // Aguarda um frame para garantir que os estados de modal já foram aplicados
        const raf = requestAnimationFrame(() => { tryFireNextQuickSpin(); });
        return () => cancelAnimationFrame(raf);
    }, [isSpinning, tryFireNextQuickSpin]);

    // Quando a fila cresce (novo item adicionado) e não estiver girando, dispara
    useEffect(() => {
        if (quickSpinQueue > 0 && !isSpinning) tryFireNextQuickSpin();
    }, [quickSpinQueue, isSpinning, tryFireNextQuickSpin]);

    // ─── rAF loop da animação (não mudou) ─────────────────────────────────────
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
                const elapsed = timestamp - startTime;
                if (elapsed < col.spinStartTime) return;
                if (col.status === 'pending') {
                    col.status = 'spinning';
                    setSpinningColumns(prev => { const n = [...prev]; n[colIndex] = true; return n; });
                }
                const spinStopTime       = col.spinStartTime + col.spinDuration;
                const decelerateStart    = spinStopTime - col.decelerateDuration;
                if (elapsed >= spinStopTime) {
                    col.status = 'stopped';
                    [0, 3, 6].forEach(o => { nextGrid[colIndex + o] = finalGrid[colIndex + o]; });
                    setSpinningColumns(prev => { const n = [...prev]; n[colIndex] = false; return n; });
                    setStoppingColumns(prev => { const n = [...prev]; n[colIndex] = true;  return n; });
                } else {
                    const progress = elapsed >= decelerateStart ? (elapsed - decelerateStart) / col.decelerateDuration : 0;
                    col.currentInterval = 50 + 200 * progress * (2 - progress);
                    if (timestamp - col.lastUpdateTime >= col.currentInterval) {
                        col.lastUpdateTime = timestamp;
                        [0, 3, 6].forEach(o => { nextGrid[colIndex + o] = getRandomSymbolFromInventory(currentInv, availableKeys); });
                    }
                }
            });

            setGrid(nextGrid);

            if (allStopped) {
                setTimeout(() => {
                    const {
                        applyFinalGain, febreDocesAtivo, betValFebre, betVal, febreDocesGiros,
                        handleGain, setFebreDocesGiros, showMsg, setWinMsg, endFever,
                        setUnluckyPot, momentoLevel, setMomentoLevel, momentoProgress,
                        setMomentoProgress, setInv, setSugar, activeCookies, setActiveCookies,
                        sweetLadder, paraisoDetector
                    } = propsRef.current;

                    setStoppingColumns([false, false, false]);
                    const result = getSpinResult(animationState.current.finalGrid, animationState.current.availableKeys);

                    if (febreDocesAtivo && paraisoDetector.isActive) {
                        const candyHits = paraisoDetector.detectCandyHits(animationState.current.finalGrid);
                        if (candyHits.length > 0)
                            showMsg(`\ud83c\udf6c Para\u00edso Doce: ${candyHits.map(h => `${h.count}x ${h.symbol}`).join(' + ')}`, 2500, true);
                    }

                    const cookieMult   = febreDocesAtivo ? 1 : activeCookies.reduce((acc, c) => acc * c.multiplier, 1);
                    const boostedOther = result.totalOtherWin * cookieMult;

                    let ladderBonus = 0;
                    if (febreDocesAtivo && sweetLadder.state.isActive) {
                        if (result.sweetLinesCount > 0) {
                            const lr = sweetLadder.onCandyLinesHit(result.sweetLinesCount);
                            ladderBonus = lr.totalBonus;
                            if (lr.slotsUnlocked > 0) showMsg(`\ud83d\udd13 +${lr.slotsUnlocked} Slot!`, 3000, true);
                            if (lr.livesGained   > 0) showMsg(`\ud83d\udc9a +${lr.livesGained} Vidas!`, 2000, true);
                            if (lr.chainsCreated > 0) showMsg(`\u26d3\ufe0f +${lr.chainsCreated} Correntes!`, 2000, true);
                        } else {
                            const mr = sweetLadder.onMiss();
                            if (mr.livesUsed   > 0) showMsg(`\ud83d\udc94 ${mr.livesUsed} Vida usada!`, 2000, true);
                            if (mr.chainsBroken > 0) showMsg(`\ud83d\udca5 ${mr.chainsBroken} Corrente quebrada!`, 2500, true);
                        }
                    }

                    const rawTotal    = result.totalSweetWin + boostedOther + ladderBonus;
                    const finalWin    = applyFinalGain(rawTotal);
                    const currentBet  = febreDocesAtivo ? betValFebre : betVal;

                    if (!febreDocesAtivo && activeCookies.length > 0 && result.totalOtherWin > 0) {
                        setActiveCookies(prev =>
                            prev.map(c => ({ ...c, remainingSpins: c.remainingSpins - 1 })).filter(c => c.remainingSpins > 0)
                        );
                    }

                    if (finalWin > 0) handleGain(finalWin);

                    if (!febreDocesAtivo) {
                        const profit = Math.max(0, finalWin - currentBet);
                        let curL = momentoLevel;
                        let newP = momentoProgress + profit;
                        const rewards: Partial<Record<MidSymbolKey, number>> = {};
                        let totalS = 0;
                        while (newP >= 0) {
                            const nextThreshold = calculateMomentumThreshold(curL + 1);
                            if (newP < nextThreshold) break;
                            newP -= nextThreshold;
                            curL++;
                            const candies = curL;
                            for (let i = 0; i < candies; i++) {
                                const r = MID[Math.floor(Math.random() * MID.length)] as MidSymbolKey;
                                rewards[r] = (rewards[r] || 0) + 1;
                                totalS += SUGAR_CONVERSION[r];
                            }
                        }
                        if (totalS > 0) {
                            showMsg(`Momento N\u00edvel ${curL}! +${totalS} \ud83c\udf6c`, 4000, true);
                            setInv(prev => {
                                const n = { ...prev };
                                Object.entries(rewards).forEach(([k, v]) => {
                                    n[k as MidSymbolKey] = (n[k as MidSymbolKey] || 0) + v!;
                                });
                                return n;
                            });
                            setSugar(prev => prev + totalS);
                            setMomentoLevel(curL);
                        }
                        setMomentoProgress(newP);
                        if (finalWin < currentBet * 2) setUnluckyPot(p => p + currentBet);
                    } else {
                        const nextG = febreDocesGiros - 1;
                        if (nextG <= 0) endFever(); else setFebreDocesGiros(nextG);
                    }

                    if (finalWin > 0) setWinMsg(`\ud83c\udf89 ${result.hitCount} L! Ganhou $ ${finalWin.toFixed(2)}`);
                    setIsSpinning(false);
                }, 400);
            } else {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }, [isSpinning, getSpinResult, startAnimationCycle]);

    // ─── handleSpin (spin manual) ───────────────────────────────────────────────
    const handleSpin = useCallback(() => {
        const { febreDocesAtivo, handleSpend, betVal, setWinMsg, cashbackMultiplier, paraisoDetector } = propsRef.current;
        if (paraisoDetector.activeAnimation !== null) return;
        if (isSpinning || availableKeys.length === 0 || quickSpinQueueRef.current > 0 || starBonusState.isActive || coinFlipState.isActive) return;
        setWinMsg('');
        if (!febreDocesAtivo && !handleSpend(betVal * (1 - cashbackMultiplier))) return;
        startAnimationCycle(false);
    }, [isSpinning, availableKeys, startAnimationCycle, starBonusState.isActive, coinFlipState.isActive]);

    // ─── Quick spin API ─────────────────────────────────────────────────────
    const quickSpinStatus = useQuickSpinAvailability({
        bal:               props.bal,
        betVal:            props.betVal,
        febreDocesAtivo:   props.febreDocesAtivo,
        febreDocesGiros:   props.febreDocesGiros,
        isSpinning,
        quickSpinQueue,
        starBonusState,
        coinFlipState,
        paraisoDetector:   props.paraisoDetector,
        cashbackMultiplier: props.cashbackMultiplier,
        handleSpend:       props.handleSpend
    });

    const handleQuickSpin = useCallback((): boolean => {
        if (!quickSpinStatus.available) {
            if (quickSpinStatus.reason) props.showMsg(quickSpinStatus.reason, 1000);
            return false;
        }
        syncQueue(+1); // adiciona 1 à fila via ref+state
        return true;
    }, [quickSpinStatus, props.showMsg]);

    const cancelQuickSpins = useCallback(() => {
        quickSpinQueueRef.current = 0;
        setQuickSpinQueue(0);
    }, []);

    return {
        isSpinning, grid, spinningColumns, stoppingColumns, pool: availableKeys,
        midMultiplierValue, handleSpin,
        quickSpinQueue, handleQuickSpin, cancelQuickSpins, quickSpinStatus,
        starBonusState, closeStarBonus,
        coinFlipState, handleCoinGuess, closeCoinFlip,
        triggerStarBonus, startCoinFlip,
    };
};
