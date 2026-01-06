import React from 'react';
import Reel from './Reel';
import SlotMachineControls from './SlotMachineControls';
import StarBonusOverlay from './StarBonusOverlay';
import CoinFlipOverlay from './CoinFlipOverlay';
import ProbabilityWidget from './ProbabilityWidget';
import type { RoiSaldo, StarBonusState, CoinFlipState, Inventory, LeafState } from '../../types';

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
    inv: Inventory; 
    isPoolInvalid: boolean;
    quickSpinQueue: number;
    handleQuickSpin: () => boolean;
    showMsg: (msg: string, duration?: number, isExtra?: boolean) => void;
    isBankrupt: boolean;
    isBettingLocked: boolean;
    starBonusState: StarBonusState;
    closeStarBonus: () => void;
    coinFlipState: CoinFlipState;
    handleCoinGuess: (guess: 'heads' | 'tails') => void;
    closeCoinFlip: () => void;
    // 🍁 Novas Props do Leaf System
    leafState: LeafState;
    handleCellReroll: (index: number) => void;
    handleGlobalReroll: () => void;
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
        inv,
        leafState,
        handleCellReroll,
        handleGlobalReroll,
        isSpinning
    } = props;
    
    return (
        <div className="flex flex-col items-center justify-center h-full relative">
            {starBonusState.isActive && (
                <StarBonusOverlay 
                    results={starBonusState.results}
                    totalWin={starBonusState.totalWin}
                    onComplete={closeStarBonus}
                />
            )}
            
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
            
            <div className="w-full max-w-sm relative">
                <ProbabilityWidget inv={inv} />

                {/* 📦 Contador de Folhas (Canto Inferior Direito da Slot) */}
                {leafState.isActive && (
                    <div className="absolute -bottom-2 -right-2 z-20 flex flex-col items-end gap-2">
                         {/* Botão de Reroll Global (🎰) */}
                        <button
                            onClick={handleGlobalReroll}
                            disabled={isSpinning || leafState.count < 3}
                            className={`
                                w-12 h-12 rounded-full border-2 border-yellow-400 bg-stone-900 
                                flex items-center justify-center text-2xl shadow-lg transition-transform active:scale-90
                                ${isSpinning || leafState.count < 3 ? 'opacity-50 grayscale' : 'hover:scale-110 animate-pulse'}
                            `}
                            title="Rerolar Roleta (3🍁)"
                        >
                            🎰
                        </button>

                        <div className="bg-stone-900/90 border-2 border-green-500 rounded-lg px-2 py-1 flex items-center gap-1 shadow-md">
                            <span className="text-sm font-black text-green-400 tabular-nums">{leafState.count}</span>
                            <span className="text-base">🍁</span>
                        </div>
                    </div>
                )}

                <div className="bg-black/50 rounded-2xl p-4 sm:p-5 mb-5 inner-neon-border relative z-10">
                    <div className="grid grid-cols-3 gap-3 mb-3">
                        {grid.map((s, i) => {
                            const column = i % 3;
                            const delay = `${column * 100}ms`;
                            const isColumnSpinning = spinningColumns[column];
                            const isColumnStopping = stoppingColumns[column];
                            
                            // Tornamos a célula tocável se o Leaf System estiver ativo
                            return (
                                <div 
                                    key={i} 
                                    className={`relative transition-transform ${!isSpinning && leafState.isActive && leafState.count > 0 ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}`}
                                    onClick={() => !isSpinning && leafState.isActive && handleCellReroll(i)}
                                >
                                    <Reel symbol={s} isSpinning={isColumnSpinning} isStopping={isColumnStopping} delay={delay} />
                                    
                                    {/* Indicador visual de que a célula pode ser rerolada */}
                                    {!isSpinning && leafState.isActive && leafState.count > 0 && (
                                        <div className="absolute top-0 right-0 text-[10px] animate-bounce pointer-events-none">🍁</div>
                                    )}
                                </div>
                            );
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
