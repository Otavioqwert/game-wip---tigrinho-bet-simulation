import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MID } from '../../constants';
import type { RoiSaldo } from '../../types';

interface ControlsProps {
    febreDocesAtivo: boolean;
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
}

const SlotMachineControls: React.FC<ControlsProps> = (props) => {
    const {
        febreDocesAtivo,
        isSpinning,
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
        isBankrupt,
        isBettingLocked,
    } = props;
    
    const quickSpinIntervalRef = useRef<number | null>(null);
    const [isQuickSpinPressed, setIsQuickSpinPressed] = useState(false);

    const betAdjustIntervalRef = useRef<number | null>(null);
    const betAdjustTimeoutRef = useRef<number | null>(null);
    const balRef = useRef(bal);
    useEffect(() => { balRef.current = bal; }, [bal]);


    const stopQuickSpin = useCallback((reason?: 'insufficient_funds' | 'no_free_spins') => {
        setIsQuickSpinPressed(false);
        if (quickSpinIntervalRef.current) {
            clearInterval(quickSpinIntervalRef.current);
            quickSpinIntervalRef.current = null;
        }
        if (reason === 'insufficient_funds') {
            showMsg("Saldo/Crédito esgotado!", 1500, true);
        } else if (reason === 'no_free_spins') {
            showMsg("Giros grátis acabaram!", 1500, true);
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
            if (!handleQuickSpin()) {
                stopQuickSpin(febreDocesAtivo ? 'no_free_spins' : 'insufficient_funds');
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

    useEffect(() => {
        return () => {
            stopQuickSpin();
            stopBetAdjustment();
        };
    }, [stopQuickSpin, stopBetAdjustment]);

    const btnClasses = "py-3 px-4 font-bold text-stone-900 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl shadow-lg shadow-yellow-500/25 transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none";
    const isControlsDisabled = isSpinning || quickSpinQueue > 0;
    const isBettingDisabled = isBankrupt || isBettingLocked;

    return (
        <div className="w-full max-w-sm">
            <div className="flex flex-col gap-2.5 mb-4">
                <button 
                    onClick={handleSpin} 
                    disabled={isControlsDisabled || isBettingDisabled || isPoolInvalid || (!febreDocesAtivo && bal < betVal)} 
                    className={`${btnClasses} text-xl h-16`}
                >
                    {isBettingDisabled ? '⛓️ BLOQUEADO ⛓️' : '🎰 GIRAR'}
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
            <button onClick={criarEmbaixadorDoce} disabled={febreDocesAtivo || !MID.every(d => (roiSaldo[d] || 0) >= 10)} className={`${btnClasses} w-full !bg-gradient-to-r !from-purple-400 !to-pink-400 !text-white`}>
                🍭 Trocar saldo diabético por Embaixador doce!
            </button>
        </div>
    );
};

export default SlotMachineControls;