import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { RoiSaldo } from '../../types';

interface ControlsProps {
    febreDocesAtivo: boolean;
    febreDocesGiros: number; // Added prop
    isSpinning: boolean;
    bal: number;
    betVal: number;
    handleSpin: () => void;
    setBetVal: React.Dispatch<React.SetStateAction<number>>;
    criarEmbaixadorDoce: () => void;
    roiSaldo: RoiSaldo;
    isPoolInvalid: boolean;
    quickSpinQueue: number;
    handleQuickSpin: () => boolean;
    showMsg: (msg: string, duration?: number, isExtra?: boolean) => void;
    isBankrupt: boolean;
    isBettingLocked: boolean;
    cancelQuickSpins?: () => void; // 🆕 Nova prop para cancelar giros
}

const SlotMachineControls: React.FC<ControlsProps> = (props) => {
    const {
        febreDocesAtivo,
        febreDocesGiros,
        isSpinning,
        bal,
        betVal,
        handleSpin,
        setBetVal,
        isPoolInvalid,
        quickSpinQueue,
        handleQuickSpin,
        showMsg,
        isBankrupt,
        isBettingLocked,
        cancelQuickSpins,
    } = props;
    
    // Use a ref to access the latest value inside the interval closure without dependencies issues
    const febreDocesAtivoRef = useRef(febreDocesAtivo);
    useEffect(() => { febreDocesAtivoRef.current = febreDocesAtivo; }, [febreDocesAtivo]);

    const febreDocesGirosRef = useRef(febreDocesGiros);
    useEffect(() => { febreDocesGirosRef.current = febreDocesGiros; }, [febreDocesGiros]);

    const quickSpinIntervalRef = useRef<number | null>(null);
    const [isQuickSpinPressed, setIsQuickSpinPressed] = useState(false);

    const betAdjustIntervalRef = useRef<number | null>(null);
    const betAdjustTimeoutRef = useRef<number | null>(null);
    const balRef = useRef(bal);
    useEffect(() => { balRef.current = bal; }, [bal]);

    const quickSpinQueueRef = useRef(quickSpinQueue);
    useEffect(() => { quickSpinQueueRef.current = quickSpinQueue; }, [quickSpinQueue]);


    const stopQuickSpin = useCallback((reason?: 'insufficient_funds' | 'no_free_spins' | 'limit_reached') => {
        setIsQuickSpinPressed(false);
        if (quickSpinIntervalRef.current) {
            clearInterval(quickSpinIntervalRef.current);
            quickSpinIntervalRef.current = null;
        }
        if (reason === 'insufficient_funds') {
            showMsg("Saldo/Crédito esgotado!", 1500, true);
        } else if (reason === 'no_free_spins') {
            showMsg("Giros grátis acabaram!", 1500, true);
        } else if (reason === 'limit_reached') {
            showMsg("🔒 Limite de giros atingido!", 1500, true);
        }
    }, [showMsg]);

    const startQuickSpin = useCallback(() => {
        stopQuickSpin();

        if (!handleQuickSpin()) {
            if (febreDocesAtivo) {
                showMsg("Sem giros grátis!", 1500, true);
            } else if (bal < betVal && !isBankrupt) { 
                showMsg("Saldo/Crédito insuficiente!", 1500, true);
            }
            return;
        }

        setIsQuickSpinPressed(true);

        quickSpinIntervalRef.current = window.setInterval(() => {
            // 🔍 Verifica se ultrapassou o limite de giros da febre
            if (febreDocesAtivoRef.current) {
                const girosRestantes = febreDocesGirosRef.current;
                const girosNaFila = quickSpinQueueRef.current;
                
                // Se já tem giros enfileirados >= giros restantes, para
                if (girosNaFila >= girosRestantes) {
                    stopQuickSpin('limit_reached');
                    return;
                }
            }
            
            if (!handleQuickSpin()) {
                const isFever = febreDocesAtivoRef.current;
                stopQuickSpin(isFever ? 'no_free_spins' : 'insufficient_funds');
            }
        }, 150);
    }, [handleQuickSpin, stopQuickSpin, showMsg, bal, betVal, febreDocesAtivo, isBankrupt]);

    const stopBetAdjustment = useCallback(() => {
        if (betAdjustTimeoutRef.current) clearTimeout(betAdjustTimeoutRef.current);
        if (betAdjustIntervalRef.current) clearInterval(betAdjustIntervalRef.current);
        betAdjustTimeoutRef.current = null;
        betAdjustIntervalRef.current = null;
    }, []);

    const startBetAdjustment = useCallback((direction: 'increase' | 'decrease') => {
        stopBetAdjustment();

        const adjust = () => {
            setBetVal(prevBet => {
                if (direction === 'increase') {
                    return Math.min(balRef.current, prevBet + 0.5);
                } else {
                    return Math.max(0.5, prevBet - 0.5);
                }
            });
        };

        adjust();
        betAdjustTimeoutRef.current = window.setTimeout(() => {
            betAdjustIntervalRef.current = window.setInterval(adjust, 75);
        }, 400);
    }, [setBetVal, stopBetAdjustment]);

    // New logic for percentage bets
    const setPercentageBet = useCallback((percentage: number) => {
        const amount = balRef.current * percentage;
        // Ensure minimum bet is 0.5 or balance if lower, rounded to 2 decimals
        const newBet = Math.max(0.5, Math.floor(amount * 100) / 100);
        
        if (newBet > balRef.current && !isBankrupt) {
             setBetVal(Math.max(0.5, balRef.current));
        } else {
             setBetVal(newBet);
        }
    }, [setBetVal, isBankrupt]);

    // 🗑️ Handler para cancelar giros rápidos
    const handleCancelQuickSpins = useCallback(() => {
        stopQuickSpin();
        if (cancelQuickSpins) {
            cancelQuickSpins();
            showMsg("❌ Giros rápidos cancelados!", 1500);
        }
    }, [stopQuickSpin, cancelQuickSpins, showMsg]);

    useEffect(() => {
        return () => {
            stopQuickSpin();
            stopBetAdjustment();
        };
    }, [stopQuickSpin, stopBetAdjustment]);

    const btnClasses = "py-3 px-4 font-bold text-stone-900 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl shadow-lg shadow-yellow-500/25 transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none";
    const percentBtnClasses = "py-2 px-2 font-bold text-xs sm:text-sm text-yellow-400 bg-yellow-900/40 border border-yellow-600/50 rounded-lg hover:bg-yellow-600/40 active:scale-95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    
    const isControlsDisabled = isSpinning || quickSpinQueue > 0;
    const isBettingDisabled = isBankrupt || isBettingLocked;

    const getMainButtonText = () => {
        if (isBettingDisabled) return '⛓️ BLOQUEADO ⛓️';
        if (febreDocesAtivo) return `🍭 GIRAR (${febreDocesGiros})`;
        return '🎰 GIRAR';
    };

    return (
        <div className="w-full max-w-sm">
            <div className="flex flex-col gap-2.5 mb-4">
                {/* Main Spin Button */}
                <button 
                    onClick={handleSpin} 
                    disabled={isControlsDisabled || isBettingDisabled || isPoolInvalid || (!febreDocesAtivo && bal < betVal)} 
                    className={`${btnClasses} text-xl h-16 ${febreDocesAtivo ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white border-2 border-yellow-300' : ''}`}
                >
                    {getMainButtonText()}
                </button>

                {/* 🗑️ Botão Cancelar Giros Rápidos (aparece quando tem giros na fila) */}
                {quickSpinQueue > 0 && (
                    <button
                        onClick={handleCancelQuickSpins}
                        className="py-2 px-4 font-bold text-white bg-gradient-to-br from-red-500 to-red-700 rounded-xl shadow-lg shadow-red-500/25 transition-transform hover:-translate-y-0.5 active:translate-y-0 border-2 border-red-300 animate-pulse"
                    >
                        ❌ Cancelar Giros Rápidos ({quickSpinQueue})
                    </button>
                )}

                {/* Percentage Bets Row */}
                {!febreDocesAtivo && (
                    <div className="grid grid-cols-2 gap-2.5">
                        <button 
                            onClick={() => setPercentageBet(0.01)}
                            disabled={isControlsDisabled || isBettingDisabled}
                            className={percentBtnClasses}
                        >
                            Apostar 1%
                        </button>
                        <button 
                            onClick={() => setPercentageBet(0.10)}
                            disabled={isControlsDisabled || isBettingDisabled}
                            className={percentBtnClasses}
                        >
                            Apostar 10%
                        </button>
                    </div>
                )}

                {/* Manual Adjustments Row */}
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
                        onMouseUp={() => stopQuickSpin()}
                        onMouseLeave={() => stopQuickSpin()}
                        onTouchStart={(e) => { e.preventDefault(); startQuickSpin(); }}
                        onTouchEnd={() => stopQuickSpin()}
                        disabled={isSpinning || isPoolInvalid || isBettingDisabled} 
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
        </div>
    );
};

export default SlotMachineControls;
