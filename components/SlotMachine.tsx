import React, { useState, useRef, useCallback, useEffect } from 'react';
import Reel from './Reel';
import { MID } from '../constants';

// Props should match the return type of useGameLogic for simplicity
interface SlotMachineProps {
    febreDocesAtivo: boolean;
    febreDocesGiros: number;
    grid: string[];
    isSpinning: boolean;
    spinningColumns: boolean[];
    stoppingColumns: boolean[];
    winMsg: string;
    extraMsg: string;
    bal: number;
    betVal: number;
    handleSpin: () => void;
    setBetVal: React.Dispatch<React.SetStateAction<number>>;
    criarEmbaixadorDoce: () => void;
    roiSaldo: { [key: string]: number };
    isPoolInvalid: boolean;
    quickSpinQueue: number;
    handleQuickSpin: () => boolean; // Updated signature
    showMsg: (msg: string, duration?: number, isExtra?: boolean) => void;
}

const SlotMachine: React.FC<SlotMachineProps> = (props) => {
    const {
        febreDocesAtivo,
        febreDocesGiros,
        grid,
        isSpinning,
        spinningColumns,
        stoppingColumns,
        winMsg,
        extraMsg,
        bal,
        betVal,
        handleSpin,
        setBetVal,
        criarEmbaixadorDoce,
        roiSaldo,
        isPoolInvalid,
        quickSpinQueue,
        handleQuickSpin,
        showMsg,
    } = props;
    
    const quickSpinIntervalRef = useRef<number | null>(null);
    const [isQuickSpinPressed, setIsQuickSpinPressed] = useState(false);

    // Refs for bet adjustment press-and-hold
    const betAdjustIntervalRef = useRef<number | null>(null);
    const betAdjustTimeoutRef = useRef<number | null>(null);
    const balRef = useRef(bal);
    useEffect(() => {
        balRef.current = bal;
    }, [bal]);


    const stopQuickSpin = useCallback((reason?: 'insufficient_funds' | 'no_free_spins') => {
        setIsQuickSpinPressed(false);
        if (quickSpinIntervalRef.current) {
            clearInterval(quickSpinIntervalRef.current);
            quickSpinIntervalRef.current = null;
        }
        if (reason === 'insufficient_funds') {
            showMsg("Saldo esgotado!", 1500, true);
        } else if (reason === 'no_free_spins') {
            showMsg("Giros grátis acabaram!", 1500, true);
        }
    }, [showMsg]);

    const startQuickSpin = useCallback(() => {
        stopQuickSpin(); // Ensure no lingering intervals

        // Attempt one spin immediately on press
        if (!handleQuickSpin()) {
            if (febreDocesAtivo) {
                showMsg("Sem giros grátis!", 1500, true);
            } else if (bal < betVal) {
                showMsg("Saldo insuficiente!", 1500, true);
            }
            return;
        }

        setIsQuickSpinPressed(true);

        // After the first successful spin, start an interval for more
        quickSpinIntervalRef.current = window.setInterval(() => {
            if (!handleQuickSpin()) {
                stopQuickSpin(febreDocesAtivo ? 'no_free_spins' : 'insufficient_funds');
            }
        }, 150); // Queue a new spin every 150ms
    }, [handleQuickSpin, stopQuickSpin, showMsg, bal, betVal, febreDocesAtivo]);

    // --- Bet Adjustment Handlers ---
    const stopBetAdjustment = useCallback(() => {
        if (betAdjustTimeoutRef.current) {
            clearTimeout(betAdjustTimeoutRef.current);
            betAdjustTimeoutRef.current = null;
        }
        if (betAdjustIntervalRef.current) {
            clearInterval(betAdjustIntervalRef.current);
            betAdjustIntervalRef.current = null;
        }
    }, []);

    const startBetAdjustment = useCallback((direction: 'increase' | 'decrease') => {
        stopBetAdjustment(); // Clear any existing timers

        const adjust = () => {
            setBetVal(prevBet => {
                if (direction === 'increase') {
                    // Use ref for the most up-to-date balance to avoid stale state in interval
                    return Math.min(balRef.current, prevBet + 0.5);
                } else {
                    return Math.max(0.5, prevBet - 0.5);
                }
            });
        };

        adjust(); // Adjust once immediately

        betAdjustTimeoutRef.current = window.setTimeout(() => {
            betAdjustIntervalRef.current = window.setInterval(adjust, 75); // Then adjust rapidly
        }, 400);
    }, [setBetVal, stopBetAdjustment]);

    // Cleanup effect to ensure intervals are cleared on component unmount
    useEffect(() => {
        return () => {
            stopQuickSpin();
            stopBetAdjustment();
        };
    }, [stopQuickSpin, stopBetAdjustment]);


    const btnClasses = "py-3 px-4 font-bold text-stone-900 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl shadow-lg shadow-yellow-500/25 transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none";
    const isControlsDisabled = isSpinning || quickSpinQueue > 0;

    return (
        <div className="flex flex-col items-center justify-center h-full">
            {febreDocesAtivo && (
                <div className="bg-gradient-to-r from-purple-400 to-pink-500 text-white rounded-lg p-2 mb-3 font-bold shadow-lg shadow-pink-500/40 text-center text-md w-full max-w-sm">
                    FEBRE DOCE 🔥 - {febreDocesGiros} Giros Grátis!
                </div>
            )}
             {isPoolInvalid && (
                <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg p-2 mb-3 font-bold shadow-lg shadow-red-500/40 text-center text-md w-full max-w-sm">
                    ⚠️ Roleta travada! Adicione símbolos pela Loja.
                </div>
            )}
             {bal < 0 && (
                <div className="bg-gradient-to-r from-red-600 to-red-800 text-white rounded-lg p-2 mb-3 font-bold shadow-lg shadow-red-500/40 text-center text-md w-full max-w-sm">
                     NEGATIVADO! Apostas bloqueadas.
                </div>
            )}
            <div className="w-full max-w-sm bg-black/50 rounded-2xl p-4 sm:p-5 mb-5 inner-neon-border">
                <div className="grid grid-cols-3 gap-3 mb-3">
                    {grid.map((s, i) => {
                        const column = i % 3;
                        const delay = `${column * 100}ms`;
                        const isColumnSpinning = spinningColumns[column];
                        const isColumnStopping = stoppingColumns[column];
                        return <Reel key={i} symbol={s} isSpinning={isColumnSpinning} isStopping={isColumnStopping} delay={delay} />;
                    })}
                </div>
                <div className="text-center text-lg font-bold text-green-300 min-h-[28px] text-shadow shadow-green-400/50">{winMsg}</div>
                <div className="text-center text-yellow-400 min-h-[24px]">{extraMsg}</div>
            </div>
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-2.5 mb-4">
                    <button 
                        onClick={handleSpin} 
                        disabled={isControlsDisabled || (!febreDocesAtivo && bal < betVal) || isPoolInvalid || bal < 0} 
                        className={`${btnClasses} text-xl h-16`}
                    >
                        🎰 GIRAR
                    </button>
                    <div className="grid grid-cols-3 gap-2.5">
                        <button 
                            onMouseDown={() => startBetAdjustment('decrease')}
                            onMouseUp={stopBetAdjustment}
                            onMouseLeave={stopBetAdjustment}
                            onTouchStart={(e) => { e.preventDefault(); startBetAdjustment('decrease'); }}
                            onTouchEnd={stopBetAdjustment}
                            disabled={febreDocesAtivo || betVal <= 0.5 || isControlsDisabled} 
                            className={btnClasses}
                        >
                            ➖
                        </button>
                        <button 
                             onMouseDown={() => startBetAdjustment('increase')}
                             onMouseUp={stopBetAdjustment}
                             onMouseLeave={stopBetAdjustment}
                             onTouchStart={(e) => { e.preventDefault(); startBetAdjustment('increase'); }}
                             onTouchEnd={stopBetAdjustment}
                            disabled={febreDocesAtivo || betVal >= bal || isControlsDisabled} 
                            className={btnClasses}
                        >
                            ➕
                        </button>
                        <button 
                            onMouseDown={startQuickSpin}
                            {/* FIX: Wrap stopQuickSpin in arrow functions to prevent passing event objects as arguments, resolving type errors. */}
                            onMouseUp={() => stopQuickSpin()}
                            onMouseLeave={() => stopQuickSpin()}
                            onTouchStart={(e) => { e.preventDefault(); startQuickSpin(); }}
                            onTouchEnd={() => stopQuickSpin()}
                            disabled={isSpinning || isPoolInvalid || bal < 0} 
                            className={`${btnClasses} relative !bg-sky-500 !from-sky-400 !to-sky-600 text-white ${isQuickSpinPressed ? 'scale-95 brightness-90' : ''}`}
                        >
                            Rápido
                            {quickSpinQueue > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-white">
                                    {quickSpinQueue}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
                <button onClick={criarEmbaixadorDoce} disabled={febreDocesAtivo || !MID.every(d => (roiSaldo[d] || 0) >= 10)} className={`${btnClasses} w-full !bg-gradient-to-r !from-purple-400 !to-pink-400 !text-white`}>
                    🍭 Trocar saldo diabético por Embaixador doce!
                </button>
            </div>
        </div>
    );
};

export default SlotMachine;