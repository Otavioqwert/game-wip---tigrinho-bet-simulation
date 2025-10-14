import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { SYM, MID, MID_BASE, MID_STEP, PANI_INCREMENT } from '../constants';
import type { SymbolKey, MidSymbolKey, Inventory, Multipliers, PanificadoraLevels, SkillId, RoiSaldo } from '../types';

// Define a comprehensive props interface for clarity
interface SpinLogicProps {
    bal: number;
    betVal: number;
    inv: Inventory;
    setInv: React.Dispatch<React.SetStateAction<Inventory>>;
    mult: Multipliers;
    panificadoraLevel: PanificadoraLevels;
    febreDocesAtivo: boolean;
    setFebreDocesAtivo: React.Dispatch<React.SetStateAction<boolean>>;
    febreDocesGiros: number;
    setFebreDocesGiros: React.Dispatch<React.SetStateAction<number>>;
    betValFebre: number;
    restoreOriginalState: () => void;
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
    momento: number;
    setMomento: React.Dispatch<React.SetStateAction<number>>;
    maxMomentoReached: number;
    setMaxMomentoReached: React.Dispatch<React.SetStateAction<number>>;
    setRoiSaldo: React.Dispatch<React.SetStateAction<RoiSaldo>>;
    // Economy handlers
    handleSpend: (cost: number) => boolean;
    handleGain: (amount: number) => void;
}

export const useSpinLogic = (props: SpinLogicProps) => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [grid, setGrid] = useState<SymbolKey[]>(Array(9).fill('🍭'));
    const [spinningColumns, setSpinningColumns] = useState([false, false, false]);
    const [stoppingColumns, setStoppingColumns] = useState([false, false, false]);
    const [quickSpinQueue, setQuickSpinQueue] = useState(0);

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
        if (getSkillLevel('caminhoCometa') === 0) {
            basePool = basePool.filter(s => s !== '☄️');
        }
        return basePool.length > 0 ? basePool : ['🍭'];
    }, [props.inv, getSkillLevel]);

    const midMultiplierValue = useCallback((sym: SymbolKey) => {
        const { mult, panificadoraLevel } = propsRef.current;
        const multLevel = mult[sym] || 0;
        if (sym === '☄️') {
            const baseValue = SYM[sym]?.v || 64;
            return baseValue * Math.pow(1.01, multLevel);
        }
        if (MID.includes(sym as MidSymbolKey)) {
            const midSym = sym as MidSymbolKey;
            const v = (MID_BASE[midSym] * Math.pow(MID_STEP[midSym], multLevel)) + ((panificadoraLevel[midSym] || 0) * PANI_INCREMENT[midSym]);
            return isFinite(v) ? Number(v.toFixed(4)) : 0;
        }
        const val = (SYM[sym]?.v || 0) * (1 + multLevel * 0.25);
        return isFinite(val) ? Number(val.toFixed(4)) : 0;
    }, []);

    const getSpinResult = useCallback((finalGrid: SymbolKey[], spinPool: SymbolKey[]) => {
        const { febreDocesAtivo, betValFebre, betVal, showMsg, inv } = propsRef.current;
        const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
        let totalWin = 0;
        let hitCount = 0;
        const isCaminhoEstelarActive = getSkillLevel('caminhoEstelar') > 0;
        const currentBet = febreDocesAtivo ? betValFebre : betVal;

        for (const line of lines) {
            const syms = line.map(i => finalGrid[i]);
            const wilds = syms.filter(s => s === '⭐').length;
            const nonWilds = syms.filter(s => s !== '⭐');
            let winSymbol: SymbolKey | null = null;
            
            if (wilds === 3) {
                 if (isCaminhoEstelarActive) {
                    winSymbol = '⭐'; // Special symbol to trigger skill effect below
                } else {
                    // Default behavior: wildcard for the best owned candy
                    const eligibleSymbols = MID
                        .filter(key => (inv[key] || 0) >= 3)
                        .sort((a, b) => (SYM[b]?.v || 0) - (SYM[a]?.v || 0));

                    if (eligibleSymbols.length > 0) {
                        winSymbol = eligibleSymbols[0];
                    } else {
                        winSymbol = null; // No win if no symbol qualifies
                    }
                }
            } else if (wilds === 2 && nonWilds.length === 1) winSymbol = nonWilds[0];
            else if (wilds === 1 && nonWilds.length === 2 && nonWilds[0] === nonWilds[1]) winSymbol = nonWilds[0];
            else if (wilds === 0 && syms[0] === syms[1] && syms[1] === syms[2]) winSymbol = syms[0];

            if (winSymbol) {
                 let lineWin = 0;
                
                if (winSymbol === '⭐' && isCaminhoEstelarActive && spinPool.length > 0) {
                    let bonusWin = 0;
                    for (let i = 0; i < 30; i++) {
                        const s1 = spinPool[Math.floor(Math.random() * spinPool.length)];
                        const s2 = spinPool[Math.floor(Math.random() * spinPool.length)];
                        const s3 = spinPool[Math.floor(Math.random() * spinPool.length)];
                        if (s1 && s1 !== '⭐' && s1 === s2 && s2 === s3) {
                            bonusWin += (currentBet * midMultiplierValue(s1)) * 0.05;
                        }
                    }
                    if (bonusWin > 0) {
                        showMsg(`Bônus Estelar: +$${bonusWin.toFixed(2)}`, 4000, true);
                        lineWin = bonusWin; // Line win is ONLY the bonus
                    }
                } else {
                    lineWin = currentBet * midMultiplierValue(winSymbol);
                }

                totalWin += lineWin;
                hitCount++;
            }
        }
        return { totalWin, hitCount };
    }, [getSkillLevel, midMultiplierValue]);
    
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
                    const { totalIncomeMultiplier, febreDocesAtivo, betValFebre, betVal, febreDocesGiros, handleGain, setFebreDocesAtivo, setFebreDocesGiros, showMsg, setWinMsg, restoreOriginalState, setUnluckyPot, momento, setMomento, maxMomentoReached, setMaxMomentoReached, setInv, setRoiSaldo } = propsRef.current;
                    setStoppingColumns([false, false, false]);
                    const result = getSpinResult(animationState.current.finalGrid, animationState.current.spinPool);
                    const finalWinnings = result.totalWin * totalIncomeMultiplier;
                    
                    if (finalWinnings > 0) {
                        handleGain(finalWinnings);
                    }
                    
                    const currentSpinBet = febreDocesAtivo ? betValFebre : betVal;
                    if (!febreDocesAtivo) {
                        // Momento Logic
                        const netGain = finalWinnings - currentSpinBet;
                        const newMomento = momento + netGain;

                        const previousMaxThreshold = Math.floor(maxMomentoReached / 100);
                        const newPotentialThreshold = Math.floor(newMomento / 100);
                        
                        if (newPotentialThreshold > previousMaxThreshold) {
                            const thresholdsCrossed = newPotentialThreshold - previousMaxThreshold;
                            const rewards: Partial<Record<MidSymbolKey, number>> = {};
                            for (let i = 0; i < thresholdsCrossed; i++) {
                                const randomCandy = MID[Math.floor(Math.random() * MID.length)] as MidSymbolKey;
                                rewards[randomCandy] = (rewards[randomCandy] || 0) + 1;
                            }

                            const rewardMsgParts = (Object.keys(rewards) as MidSymbolKey[]).map(
                                candy => `+${rewards[candy]} ${candy}`
                            );
                            showMsg(`Momento Bônus! ${rewardMsgParts.join(', ')}`, 3000, true);

                            setInv(prevInv => {
                                const newInv = { ...prevInv };
                                for (const candy in rewards) {
                                    newInv[candy as MidSymbolKey] = (newInv[candy as MidSymbolKey] || 0) + rewards[candy as MidSymbolKey]!;
                                }
                                return newInv;
                            });

                            setRoiSaldo(prevSaldo => {
                                const newSaldo = { ...prevSaldo };
                                for (const candy in rewards) {
                                    newSaldo[candy as MidSymbolKey] = (newSaldo[candy as MidSymbolKey] || 0) + rewards[candy as MidSymbolKey]!;
                                }
                                return newSaldo;
                            });
                        }
                        
                        setMomento(newMomento);

                        if (newMomento > maxMomentoReached) {
                            setMaxMomentoReached(newMomento);
                        }

                        // Unlucky Pot
                        if (finalWinnings < currentSpinBet * 2) {
                            setUnluckyPot(p => p + currentSpinBet);
                            showMsg(`+ $${currentSpinBet.toFixed(2)} para Pote Bônus!`, 2000, true);
                        }
                    } else {
                        const nextGiros = febreDocesGiros - 1;
                        if (nextGiros <= 0) {
                            showMsg('Febre doce terminou!', 4000, true);
                            setFebreDocesAtivo(false);
                            restoreOriginalState();
                        }
                        setFebreDocesGiros(nextGiros);
                    }

                    if (finalWinnings > 0) {
                        const msg = result.hitCount > 0 ? `🎉 ${result.hitCount} L! Ganhou $ ${finalWinnings.toFixed(2)}` : '';
                        if (msg) setWinMsg(msg);
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
        if (isSpinning || pool.length === 0 || quickSpinQueue > 0) return;
        
        setWinMsg('');
        if (!febreDocesAtivo) {
            const cost = betVal * (1 - cashbackMultiplier);
            if (!handleSpend(cost)) return;
        }
        startAnimationCycle(false);
    }, [isSpinning, pool, quickSpinQueue, startAnimationCycle]);
    
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
    }, [quickSpinQueue, isSpinning, startAnimationCycle]);


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
    };
};