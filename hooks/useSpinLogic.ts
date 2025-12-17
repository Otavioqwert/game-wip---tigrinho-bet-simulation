
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { SYM, MID, MID_BASE, MID_STEP, SUGAR_CONVERSION } from '../constants';
import type { SymbolKey, MidSymbolKey, Inventory, Multipliers, PanificadoraLevels, SkillId, RoiSaldo, ActiveCookie, StarBonusState, StarBonusResult, CoinFlipState } from '../types';

// Define a comprehensive props interface for clarity
interface SpinLogicProps {
    bal: number;
    betVal: number;
    inv: Inventory;
    setInv: React.Dispatch<React.SetStateAction<Inventory>>;
    mult: Multipliers;
    panificadoraLevel: PanificadoraLevels;
    febreDocesAtivo: boolean;
    // Removed old props, use endFever callback
    endFever: () => void;
    febreDocesGiros: number;
    setFebreDocesGiros: React.Dispatch<React.SetStateAction<number>>;
    betValFebre: number;
    totalIncomeMultiplier: number;
    skillLevels: Record<string, number>;
    showMsg: (msg: string, duration?: number, isExtra?: boolean) => void;
    setWinMsg: React.Dispatch<React.SetStateAction<string>>;
    unluckyPot: number; // For bad luck protection
    setUnluckyPot: React.Dispatch<React.SetStateAction<number>>; // For bad luck protection
    // Secondary skills props
    cashbackMultiplier: number;
    creditLimit: number;
    // Momento props
    momentoLevel: number;
    setMomentoLevel: React.Dispatch<React.SetStateAction<number>>;
    momentoProgress: number;
    setMomentoProgress: React.Dispatch<React.SetStateAction<number>>;
    setRoiSaldo: React.Dispatch<React.SetStateAction<RoiSaldo>>;
    // Economy handlers
    handleSpend: (cost: number) => boolean;
    handleGain: (amount: number) => void;
    // Furnace Props
    activeCookies: ActiveCookie[];
    setActiveCookies: React.Dispatch<React.SetStateAction<ActiveCookie[]>>;
    setSugar: React.Dispatch<React.SetStateAction<number>>;
    // Sweet Ladder Props
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

    // Star Bonus State
    const [starBonusState, setStarBonusState] = useState<StarBonusState>({
        isActive: false,
        results: [],
        totalWin: 0
    });

    // Coin Flip State
    const [coinFlipState, setCoinFlipState] = useState<CoinFlipState>({
        isActive: false,
        flipsRemaining: 0,
        currentMultiplier: 0,
        currentBet: 0,
        history: [],
        lastResult: null,
        isAnimating: false
    });

    const propsRef = useRef(props);
    propsRef.current = props;
    
    const gridRef = useRef(grid);
    useEffect(() => { gridRef.current = grid; }, [grid]);

    const animationState = useRef({
        startTime: 0,
        finalGrid: [] as SymbolKey[],
        spinPool: [] as SymbolKey[],
        columns: [
            { status: 'idle', spinStartTime: 0, spinDuration: 1500, decelerateDuration: 500, lastUpdateTime: 0, currentInterval: 50 },
            { status: 'idle', spinStartTime: 100, spinDuration: 2000, decelerateDuration: 500, lastUpdateTime: 0, currentInterval: 50 },
            { status: 'idle', spinStartTime: 200, spinDuration: 2500, decelerateDuration: 500, lastUpdateTime: 0, currentInterval: 50 },
        ]
    });

    const getSkillLevel = useCallback((id: SkillId) => propsRef.current.skillLevels[id] || 0, []);
    
    const pool = useMemo(() => {
        const { inv } = props;
        let basePool = (Object.keys(inv) as SymbolKey[]).flatMap(k => Array(inv[k] || 0).fill(k));
        
        // Filter based on unlocked skills
        if (getSkillLevel('caminhoCometa') === 0) {
            basePool = basePool.filter(s => s !== '☄️');
        }
        if (getSkillLevel('caminhoFicha') === 0) {
            basePool = basePool.filter(s => s !== '🪙');
        }

        return basePool.length > 0 ? basePool : (['🍭'] as SymbolKey[]);
    }, [props.inv, getSkillLevel]);

    const midMultiplierValue = useCallback((sym: SymbolKey) => {
        const { mult } = propsRef.current;
        const multLevel = mult[sym] || 0;
        if (sym === '☄️') {
            const baseValue = SYM[sym]?.v || 64;
            return baseValue * Math.pow(1.01, multLevel);
        }
        if (MID.includes(sym as MidSymbolKey)) {
            const midSym = sym as MidSymbolKey;
            // Removed Panificadora logic, just base + multiplier upgrades
            const v = (MID_BASE[midSym] * Math.pow(MID_STEP[midSym], multLevel));
            return isFinite(v) ? Number(v.toFixed(4)) : 0;
        }
        const val = (SYM[sym]?.v || 0) * (1 + multLevel * 0.25);
        return isFinite(val) ? Number(val.toFixed(4)) : 0;
    }, []);

    // Function to calculate the 90 simulated spins for Star Bonus
    // UPDATED: Now accepts a multiplier for the number of spins (90 * multiplier)
    const triggerStarBonus = useCallback((spinPool: SymbolKey[], currentBet: number, multiplier: number = 1) => {
        const results: StarBonusResult[] = [];
        let totalSimulatedWin = 0;
        const totalSpins = 90 * multiplier;

        // Ensure Stars are in the pool for the bonus simulation, or create a fallback pool
        const effectivePool = spinPool.length > 0 ? spinPool : (['🍭'] as SymbolKey[]);

        for (let i = 0; i < totalSpins; i++) {
            const s1 = effectivePool[Math.floor(Math.random() * effectivePool.length)];
            const s2 = effectivePool[Math.floor(Math.random() * effectivePool.length)];
            const s3 = effectivePool[Math.floor(Math.random() * effectivePool.length)];
            
            let win = 0;
            let isWin = false;

            // --- Wildcard Logic for Bonus ---
            const line = [s1, s2, s3];
            const nonStars = line.filter(s => s !== '⭐');
            const uniqueNonStars = [...new Set(nonStars)]; // Unique symbols excluding stars

            if (uniqueNonStars.length === 0) {
                // Case: 3 Stars [⭐, ⭐, ⭐]
                isWin = true;
                // FIX: Changed from 0.01 to 0.05 (5% of Total Bet)
                win = currentBet * 0.05; 
            } else if (uniqueNonStars.length === 1) {
                // Case: Mixed with Wildcards (e.g., [🍭, ⭐, 🍭] or [🍦, 🍦, ⭐])
                const winSymbol = uniqueNonStars[0];
                
                if (winSymbol === '🪙') {
                    // FIX: Ficha inside Star Bonus has 50% chance to pay $1
                    if (Math.random() < 0.5) {
                        isWin = true;
                        win = 1;
                    } else {
                        isWin = false;
                        win = 0;
                    }
                } else {
                    isWin = true;
                    // Standard items pay the reduced bonus rate (5% of their line value)
                    win = (currentBet * midMultiplierValue(winSymbol)) * 0.05;
                }
            } else {
                // Case: No match (e.g., [🍭, 🍦, ⭐])
                isWin = false;
                win = 0;
            }
            
            results.push({ symbols: [s1, s2, s3], win, isWin });
            totalSimulatedWin += win;
        }
        
        // Guarantee Minimum Win (5x Bet * multiplier) if bad luck
        if (totalSimulatedWin === 0) {
            totalSimulatedWin = (currentBet * 5) * multiplier;
            // Hack the last result to show a win
            if (results.length > 0) {
                results[results.length - 1] = {
                    symbols: ['🍭', '🍭', '🍭'] as SymbolKey[],
                    win: totalSimulatedWin,
                    isWin: true
                };
            }
        }

        setStarBonusState({
            isActive: true,
            results,
            totalWin: totalSimulatedWin
        });
        
        return totalSimulatedWin;

    }, [midMultiplierValue]);

    const closeStarBonus = useCallback(() => {
        const { handleGain, showMsg } = propsRef.current;
        const win = starBonusState.totalWin;
        
        if (win > 0) {
            handleGain(win);
            showMsg(`Bônus Estelar Finalizado! +$${win.toFixed(2)}`, 3000, true);
        }

        setStarBonusState({ isActive: false, results: [], totalWin: 0 });
    }, [starBonusState.totalWin]);

    // --- COIN FLIP LOGIC ---

    const startCoinFlip = useCallback((flips: number, currentBet: number) => {
        setCoinFlipState({
            isActive: true,
            flipsRemaining: flips,
            currentMultiplier: 0,
            currentBet: currentBet,
            history: [],
            lastResult: null,
            isAnimating: false
        });
    }, []);

    const handleCoinGuess = useCallback((guess: 'heads' | 'tails') => {
        if (coinFlipState.isAnimating || coinFlipState.flipsRemaining <= 0) return;

        setCoinFlipState(prev => ({ ...prev, isAnimating: true }));

        // Simulate delay for animation
        setTimeout(() => {
            const result: 'heads' | 'tails' = Math.random() > 0.5 ? 'heads' : 'tails';
            const isWin = guess === result;

            setCoinFlipState(prev => {
                let newMultiplier = prev.currentMultiplier;
                
                if (isWin) {
                    // Win: Double the multiplier (0 -> 2, 2 -> 4, etc)
                    newMultiplier = newMultiplier === 0 ? 2 : newMultiplier * 2;
                } else {
                    // Loss: Lose everything
                    newMultiplier = 0;
                }

                // If loss, we stop immediately regardless of remaining flips
                const nextFlips = isWin ? prev.flipsRemaining - 1 : 0;

                return {
                    ...prev,
                    isAnimating: false,
                    lastResult: result,
                    history: [...prev.history, result],
                    currentMultiplier: newMultiplier,
                    flipsRemaining: nextFlips
                };
            });

        }, 2000); // 2 seconds spin animation
    }, [coinFlipState.isAnimating, coinFlipState.flipsRemaining]);

    const closeCoinFlip = useCallback(() => {
        const { handleGain, showMsg } = propsRef.current;
        const win = coinFlipState.currentBet * coinFlipState.currentMultiplier;

        if (win > 0) {
            handleGain(win);
            showMsg(`Cara ou Coroa: Ganhou $${win.toFixed(2)}!`, 3000, true);
        } else {
             showMsg(`Cara ou Coroa: Mais sorte na próxima.`, 2000, true);
        }

        setCoinFlipState(prev => ({ ...prev, isActive: false }));
    }, [coinFlipState]);


    const getSpinResult = useCallback((finalGrid: SymbolKey[], spinPool: SymbolKey[]) => {
        const { febreDocesAtivo, betValFebre, betVal, showMsg, inv } = propsRef.current;
        const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
        
        let totalSweetWin = 0;
        let totalOtherWin = 0;
        let hitCount = 0;
        let sweetLinesCount = 0;
        
        const isCaminhoEstelarActive = getSkillLevel('caminhoEstelar') > 0;
        const isCaminhoFichaActive = getSkillLevel('caminhoFicha') > 0;
        const currentBet = febreDocesAtivo ? betValFebre : betVal;
        
        // Count how many star lines triggered in this single spin
        let starLinesFound = 0;
        // Count how many token lines
        let tokenLinesFound = 0;

        for (const line of lines) {
            const syms = line.map(i => finalGrid[i]);
            const wilds = syms.filter(s => s === '⭐').length;
            const nonWilds = syms.filter(s => s !== '⭐');
            let winSymbol: SymbolKey | null = null;
            
            // Check for 3 Tokens separately to enforce exact match for minigame trigger
            if (syms.every(s => s === '🪙')) {
                 if (isCaminhoFichaActive) {
                     winSymbol = '🪙';
                 }
            } else if (wilds === 3) {
                 if (isCaminhoEstelarActive) {
                    winSymbol = '⭐'; // Special symbol to trigger skill effect below
                } else {
                    const eligibleSymbols = MID
                        .filter(key => (inv[key] || 0) >= 3)
                        .sort((a, b) => (SYM[b]?.v || 0) - (SYM[a]?.v || 0));

                    if (eligibleSymbols.length > 0) {
                        winSymbol = eligibleSymbols[0];
                    } else {
                        winSymbol = null;
                    }
                }
            } else if (wilds === 2 && nonWilds.length === 1) winSymbol = nonWilds[0];
            else if (wilds === 1 && nonWilds.length === 2 && nonWilds[0] === nonWilds[1]) winSymbol = nonWilds[0];
            else if (wilds === 0 && syms[0] === syms[1] && syms[1] === syms[2]) winSymbol = syms[0];

            if (winSymbol) {
                 let lineWin = 0;
                
                if (winSymbol === '⭐' && isCaminhoEstelarActive) {
                    // Accumulate star triggers, do not trigger instantly
                    starLinesFound++;
                    lineWin = 0; 
                } else if (winSymbol === '🪙' && isCaminhoFichaActive) {
                    tokenLinesFound++;
                    lineWin = 0;
                } else {
                    lineWin = currentBet * midMultiplierValue(winSymbol);
                    
                    if (MID.includes(winSymbol as MidSymbolKey)) {
                        totalSweetWin += lineWin;
                        sweetLinesCount++;
                    } else {
                        totalOtherWin += lineWin;
                    }
                }

                hitCount++;
            }
        }

        // Trigger the bonuses based on counts
        if (starLinesFound > 0) {
            triggerStarBonus(spinPool, currentBet, starLinesFound);
        }

        if (tokenLinesFound > 0) {
            startCoinFlip(tokenLinesFound, currentBet);
        }

        return { totalSweetWin, totalOtherWin, hitCount, sweetLinesCount };
    }, [getSkillLevel, midMultiplierValue, triggerStarBonus, startCoinFlip]);
    
    const startAnimationCycle = useCallback((isQuick = false) => {
        setStoppingColumns([false, false, false]);
        const finalGrid = Array.from({ length: 9 }, () => pool[Math.floor(Math.random() * pool.length)] || '🍭') as SymbolKey[];
        
        const now = performance.now();
        animationState.current.startTime = now;
        animationState.current.finalGrid = finalGrid;
        animationState.current.spinPool = pool;
        
        const durations = {
            normal: { spin: [1500, 2000, 2500], decel: 500 },
            quick:  { spin: [250, 350, 450], decel: 150 }
        };
        const selectedDurations = isQuick ? durations.quick : durations.normal;

        animationState.current.columns.forEach((col, i) => {
            col.status = 'pending';
            col.lastUpdateTime = now;
            col.spinStartTime = [100, 200, 300][i];
            col.spinDuration = selectedDurations.spin[i];
            col.decelerateDuration = selectedDurations.decel;
        });
        setIsSpinning(true);
    }, [pool]);

    useEffect(() => {
        if (!isSpinning) return;

        let animationFrameId: number;
        const easeOutQuad = (t: number) => t * (2 - t);
        const initialInterval = 50;
        const finalInterval = 250;

        const animate = (timestamp: number) => {
            const { startTime, columns, finalGrid, spinPool } = animationState.current;
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
                    col.currentInterval = initialInterval + (finalInterval - initialInterval) * easeOutQuad(progress);
                    if (timestamp - col.lastUpdateTime >= col.currentInterval) {
                        col.lastUpdateTime = timestamp;
                        [0, 3, 6].forEach(offset => { nextGrid[colIndex + offset] = spinPool[Math.floor(Math.random() * spinPool.length)] || '🍭'; });
                    }
                }
            });
            
            setGrid(nextGrid);

            if (allStopped) {
                setTimeout(() => {
                    const { 
                        totalIncomeMultiplier, febreDocesAtivo, betValFebre, betVal, 
                        febreDocesGiros, handleGain, setFebreDocesGiros, showMsg, 
                        setWinMsg, endFever, setUnluckyPot, momentoLevel, setMomentoLevel, 
                        momentoProgress, setMomentoProgress, setInv, setSugar,
                        activeCookies, setActiveCookies,
                        sweetLadderActive, sweetLadderD, setSweetLadderD
                    } = propsRef.current;
                    
                    setStoppingColumns([false, false, false]);
                    const result = getSpinResult(animationState.current.finalGrid, animationState.current.spinPool);
                    
                    // --- Calculate Cookie Multiplier ---
                    const cookieMultiplier = activeCookies.reduce((acc, cookie) => acc * cookie.multiplier, 1);
                    
                    // NEW LOGIC: Cookies DO NOT affect Sweets (Candy) wins.
                    // Sweets get base multipliers + Prestige. Other items get Cookie Multiplier + Prestige.
                    const boostedOtherWins = result.totalOtherWin * cookieMultiplier;
                    
                    // --- Doce Escada Logic (Sweet Ladder) ---
                    let ladderBonus = 0;
                    if (febreDocesAtivo && sweetLadderActive && result.sweetLinesCount > 0) {
                        let currentD = sweetLadderD;
                        for (let i = 0; i < result.sweetLinesCount; i++) {
                            currentD++;
                            ladderBonus += ((1 + currentD) * currentD) / 2;
                        }
                        setSweetLadderD(currentD);
                    }

                    const finalWinnings = (result.totalSweetWin + boostedOtherWins + ladderBonus) * totalIncomeMultiplier;
                    
                    // --- Decrement Active Cookies (Conditional) ---
                    // Only consume cookie charge if a "Boostable" win occurred (non-sweet)
                    const didUseCookie = result.totalOtherWin > 0;

                    if (activeCookies.length > 0 && didUseCookie) {
                        setActiveCookies(prevCookies => {
                            return prevCookies.map(c => ({
                                ...c,
                                remainingSpins: c.remainingSpins - 1
                            })).filter(c => c.remainingSpins > 0);
                        });
                    }

                    if (finalWinnings > 0) {
                        handleGain(finalWinnings);
                    }
                    
                    const currentSpinBet = febreDocesAtivo ? betValFebre : betVal;
                    if (!febreDocesAtivo) {
                        // --- New Momento Logic (Sugar Based) ---
                        const netGain = finalWinnings - currentSpinBet;
                        let currentLevel = momentoLevel;
                        let newProgress = momentoProgress + netGain;
                        let threshold = (currentLevel + 1) * 100;
                        const rewards: Partial<Record<MidSymbolKey, number>> = {};
                        let levelsGained = 0;
                        let totalSugarGained = 0;

                        if (newProgress > 0) {
                            while (newProgress >= threshold) {
                                newProgress -= threshold;
                                const candiesToAward = currentLevel + 1;
                                for (let i = 0; i < candiesToAward; i++) {
                                    const randomCandy = MID[Math.floor(Math.random() * MID.length)] as MidSymbolKey;
                                    rewards[randomCandy] = (rewards[randomCandy] || 0) + 1;
                                    totalSugarGained += SUGAR_CONVERSION[randomCandy];
                                }
                                currentLevel++;
                                levelsGained++;
                                threshold = (currentLevel + 1) * 100;
                            }
                        }

                        if (levelsGained > 0) {
                            const rewardMsgParts = (Object.keys(rewards) as MidSymbolKey[]).map(candy => `+${rewards[candy]} ${candy}`);
                            showMsg(`Momento Nível ${currentLevel}! +${totalSugarGained} 🍬`, 4000, true);

                            setInv(prevInv => {
                                const newInv = { ...prevInv };
                                for (const candy in rewards) { newInv[candy as MidSymbolKey] = (newInv[candy as MidSymbolKey] || 0) + rewards[candy as MidSymbolKey]!; }
                                return newInv;
                            });

                            // Add Sugar based on momento gains
                            setSugar(prev => prev + totalSugarGained);
                            
                            setMomentoLevel(currentLevel);
                        }
                        
                        setMomentoProgress(newProgress);
                        // --- End Momento Logic ---

                        // Unlucky Pot
                        if (finalWinnings < currentSpinBet * 2) {
                            setUnluckyPot(p => p + currentSpinBet);
                            showMsg(`+ $${currentSpinBet.toFixed(2)} para Pote Bônus!`, 2000, true);
                        }
                    } else {
                        const nextGiros = febreDocesGiros - 1;
                        if (nextGiros <= 0) {
                            // Call end fever logic directly
                            endFever();
                        } else {
                            setFebreDocesGiros(nextGiros);
                        }
                    }

                    if (finalWinnings > 0) {
                        let msg = `🎉 ${result.hitCount} L! Ganhou $ ${finalWinnings.toFixed(2)}`;
                        if (ladderBonus > 0) {
                            msg += ` (Escada: +$${(ladderBonus * totalIncomeMultiplier).toFixed(2)})`;
                        }
                        setWinMsg(msg);
                    }
                    setIsSpinning(false);
                }, 400);
            } else {
                animationFrameId = requestAnimationFrame(animate);
            }
        };
        animationFrameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameId);
    }, [isSpinning, getSpinResult, startAnimationCycle]);

    const handleSpin = useCallback(() => {
        const { febreDocesAtivo, handleSpend, betVal, setWinMsg, cashbackMultiplier } = propsRef.current;
        // Block if bonus is active to freeze background game
        if (isSpinning || pool.length === 0 || quickSpinQueue > 0 || starBonusState.isActive || coinFlipState.isActive) return;
        
        setWinMsg('');
        if (!febreDocesAtivo) {
            const cost = betVal * (1 - cashbackMultiplier);
            if (!handleSpend(cost)) return;
        }
        startAnimationCycle(false);
    }, [isSpinning, pool, quickSpinQueue, startAnimationCycle, starBonusState.isActive, coinFlipState.isActive]);
    
    const handleQuickSpin = useCallback((): boolean => {
        const { febreDocesAtivo, febreDocesGiros, bal, betVal, handleSpend, cashbackMultiplier } = propsRef.current;

        if (febreDocesAtivo) {
            if (febreDocesGiros > 0) {
                setQuickSpinQueue(p => p + 1);
                return true;
            }
            return false;
        }

        const cost = betVal * (1 - cashbackMultiplier);
        if (handleSpend(cost)) {
            setQuickSpinQueue(p => p + 1);
            return true;
        }
        return false;
    }, []);

    // Effect to manage the quick spin queue
    useEffect(() => {
        if (quickSpinQueue > 0 && !isSpinning) {
            // Block queue processing if bonus is active to freeze background game
            if (starBonusState.isActive || coinFlipState.isActive) return;

            const { febreDocesAtivo, febreDocesGiros, bal, betVal, creditLimit } = propsRef.current;
            
            if (febreDocesAtivo) {
                if (febreDocesGiros <= 0) {
                    setQuickSpinQueue(0);
                    return;
                }
            } 
            setQuickSpinQueue(p => p - 1);
            startAnimationCycle(true);
        }
    }, [quickSpinQueue, isSpinning, startAnimationCycle, starBonusState.isActive, coinFlipState.isActive]);


    return {
        isSpinning,
        grid,
        spinningColumns,
        stoppingColumns,
        pool,
        midMultiplierValue,
        handleSpin,
        quickSpinQueue,
        handleQuickSpin,
        // Star Bonus
        starBonusState,
        closeStarBonus,
        // Coin Flip
        coinFlipState,
        handleCoinGuess,
        closeCoinFlip
    };
};
