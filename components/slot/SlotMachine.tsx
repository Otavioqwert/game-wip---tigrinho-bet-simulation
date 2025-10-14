import React from 'react';
import Reel from './Reel';
import SlotMachineControls from './SlotMachineControls';
import type { RoiSaldo } from '../../types';

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
    isPoolInvalid: boolean;
    quickSpinQueue: number;
    handleQuickSpin: () => boolean;
    showMsg: (msg: string, duration?: number, isExtra?: boolean) => void;
    isBankrupt: boolean;
    isBettingLocked: boolean;
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
        isBettingLocked
    } = props;
    
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
             {(isBankrupt || isBettingLocked) && (
                <div className="bg-gradient-to-r from-red-600 to-red-800 text-white rounded-lg p-2 mb-3 font-bold shadow-lg shadow-red-500/40 text-center text-md w-full max-w-sm">
                     {isBankrupt ? 'LIMITE ATINGIDO!' : 'PAGAMENTO ATRASADO!'} Apostas bloqueadas.
                     {isBettingLocked && ' Pague a multa para desbloquear.'}
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
            
            <SlotMachineControls {...props} />
        </div>
    );
};

export default SlotMachine;