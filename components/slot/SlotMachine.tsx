
import React from 'react';
import Reel from './Reel';
import SlotMachineControls from './SlotMachineControls';
import StarBonusOverlay from './StarBonusOverlay';
import CoinFlipOverlay from './CoinFlipOverlay';
import ProbabilityWidget from './ProbabilityWidget';
import type { RoiSaldo, StarBonusState, CoinFlipState, Inventory } from '../../types';

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
    roiSaldo: RoiSaldo;
    inv: Inventory; // Added prop for widget
    isPoolInvalid: boolean;
    quickSpinQueue: number;
    handleQuickSpin: () => boolean;
    showMsg: (msg: string, duration?: number, isExtra?: boolean) => void;
    isBankrupt: boolean;
    isBettingLocked: boolean;
    // New Props for Star Bonus
    starBonusState: StarBonusState;
    closeStarBonus: () => void;
    // New Props for Coin Flip
    coinFlipState: CoinFlipState;
    handleCoinGuess: (guess: 'heads' | 'tails') => void;
    closeCoinFlip: () => void;
}

const SlotMachine: React.FC<SlotMachineProps> = (props) => {
    const {
        febreDocesAtivo,
        febreDocesGiros,
        grid,
        spinningColumns,
        stoppingColumns,
        winMsg,
        extraMsg,
        isPoolInvalid,
        isBankrupt,
        isBettingLocked,
        starBonusState,
        closeStarBonus,
        coinFlipState,
        handleCoinGuess,
        closeCoinFlip,
        inv
    } = props;
    
    return (
        <div className="flex flex-col items-center justify-center h-full relative">
            {/* Overlay for Star Bonus Animation */}
            {starBonusState.isActive && (
                <StarBonusOverlay 
                    results={starBonusState.results}
                    totalWin={starBonusState.totalWin}
                    onComplete={closeStarBonus}
                />
            )}
            
            {/* Overlay for Coin Flip Minigame */}
            {coinFlipState.isActive && (
                <CoinFlipOverlay 
                    coinState={coinFlipState}
                    onGuess={handleCoinGuess}
                    onComplete={closeCoinFlip}
                />
            )}

            {febreDocesAtivo && (
                <div className="bg-gradient-to-r from-purple-500 via-pink-600 to-purple-500 bg-[length:200%_auto] animate-shimmer text-white rounded-xl p-3 mb-3 font-black shadow-lg shadow-pink-500/40 text-center text-xl w-full max-w-sm border-2 border-yellow-300">
                    🔥 FEBRE DOCE 🔥<br/>
                    <span className="text-3xl text-yellow-300 drop-shadow-md">{febreDocesGiros} Giros Restantes</span>
                </div>
            )}
             {isPoolInvalid && (
                <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg p-2 mb-3 font-bold shadow-lg shadow-red-500/40 text-center text-md w-full max-w-sm">
                    ⚠️ Roleta travada! Adicione símbolos pela Loja.
                </div>
            )}
             {(isBankrupt || isBettingLocked) && (
                <div className="bg-gradient-to-r from-red-600 to-red-800 text-white rounded-lg p-2 mb-3 font-bold shadow-lg shadow-red-500/40 text-center text-md w-full max-w-sm">
                     {isBankrupt ? 'LIMITE ATINGIDO!' : 'PAGAMENTO ATRASADO!'} Apostas bloqueadas.
                     {isBettingLocked && ' Pague a multa para desbloquear.'}
                </div>
            )}
            
            {/* Slot Machine Container - Added relative for widget positioning */}
            <div className="w-full max-w-sm relative">
                
                {/* PROBABILITY WIDGET (Attached to right side) */}
                <ProbabilityWidget inv={inv} />

                <div className="bg-black/50 rounded-2xl p-4 sm:p-5 mb-5 inner-neon-border relative z-10">
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
            </div>
            
            <SlotMachineControls {...props} />
            <style>{`
                @keyframes shimmer {
                    0% {background-position: 0% 50%;}
                    100% {background-position: 100% 50%;}
                }
                .animate-shimmer {
                    animation: shimmer 3s infinite linear;
                }
            `}</style>
        </div>
    );
};

export default SlotMachine;
