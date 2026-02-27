import React from 'react';
import { calculateMomentumThreshold } from '../utils/mechanics/momentumCalculator';

interface MomentoBarProps {
    momentoLevel: number;
    momentoProgress: number;
    momentoValue: number;
    candyStacksForMomento: number;
    /** 'header' = azul compacto (h-3) | 'inventory' = roxo maior (h-4) */
    variant?: 'header' | 'inventory';
}

const MomentoBar: React.FC<MomentoBarProps> = ({
    momentoLevel, momentoProgress, momentoValue, candyStacksForMomento, variant = 'header'
}) => {
    const nextThreshold = calculateMomentumThreshold(momentoLevel + 1);
    const displayProgress = Math.max(0, momentoProgress);
    const progressPercent = momentoValue > 0
        ? Math.min(100, (displayProgress / momentoValue) * 100)
        : 0;
    const isHeader = variant === 'header';

    return (
        <div className={isHeader ? 'w-full max-w-md' : 'w-full'}>
            <div className="flex justify-between items-center mb-1">
                <span className={`font-bold ${isHeader ? 'text-sky-300 text-sm' : 'text-purple-300 text-lg'}`}>
                    ⚡ Momento Nível {momentoLevel}
                </span>
                <span className="text-gray-500 text-xs">{progressPercent.toFixed(1)}%</span>
            </div>

            <div className="relative group">
                {/* Barra */}
                <div className={`w-full bg-gray-800 rounded-full border-2 overflow-hidden cursor-help ${
                    isHeader ? 'h-3 border-sky-700' : 'h-4 border-purple-700'
                }`}>
                    <div
                        className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                            isHeader ? 'from-sky-500 to-cyan-400' : 'from-purple-500 to-fuchsia-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
                    <div className="bg-black border border-sky-600 rounded p-3 text-xs text-left space-y-1.5 min-w-[210px] shadow-xl">
                        <div className="text-sky-300 font-bold text-sm pb-1 border-b border-sky-900">⚡ Momento</div>

                        <div className="flex justify-between gap-6">
                            <span className="text-gray-400">Nível</span>
                            <span className="font-bold text-white">{momentoLevel}</span>
                        </div>
                        <div className="flex justify-between gap-6">
                            <span className="text-gray-400">Valor</span>
                            <span className="font-bold text-cyan-300">{momentoValue.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between gap-6">
                            <span className="text-gray-400">🍭 Doces (y)</span>
                            <span className="font-bold text-pink-300">{candyStacksForMomento}</span>
                        </div>
                        <div className="flex justify-between gap-6 pt-1 border-t border-gray-800">
                            <span className="text-gray-400">Progresso</span>
                            <span className="font-bold text-white">{displayProgress.toFixed(0)} / {momentoValue.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between gap-6">
                            <span className="text-gray-400">Próx. nível</span>
                            <span className="text-gray-500">{displayProgress.toFixed(0)} / {nextThreshold}</span>
                        </div>
                        <div className="flex justify-between gap-6">
                            <span className="text-gray-400">Fórmula</span>
                            <span className="text-gray-500 italic">100x + x²/2 + 10y</span>
                        </div>
                    </div>
                    {/* Seta apontando para o cursor */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
                        border-l-[7px] border-l-transparent
                        border-r-[7px] border-r-transparent
                        border-t-[7px] border-t-sky-600">
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MomentoBar;
