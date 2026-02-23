import React from 'react';
import { calculateMomentumThreshold } from '../utils/mechanics/momentumCalculator';

interface HeaderProps {
    bal: number;
    betVal: number;
    betValFebre: number;
    febreDocesAtivo: boolean;
    momentoLevel: number;
    momentoProgress: number;
    momentoValue: number;
    candyStacksForMomento: number;
    openFeverSetup?: () => void;
    cooldownEnd?: number | null;
}

const Header: React.FC<HeaderProps> = ({
    bal, betVal, betValFebre, febreDocesAtivo,
    momentoLevel, momentoProgress,
    momentoValue, candyStacksForMomento,
    openFeverSetup, cooldownEnd
}) => {
    const nextThreshold = calculateMomentumThreshold(momentoLevel + 1);
    const displayProgress = Math.max(0, momentoProgress);
    const progressPercent = Math.min(100, (displayProgress / nextThreshold) * 100);
    const isCooldown = cooldownEnd && Date.now() < cooldownEnd;

    return (
        <header className="flex flex-col gap-4 justify-between items-center mb-5 p-3 bg-yellow-500/10 rounded-xl text-center">
            {/* Saldo e Aposta */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div>
                    <span className="text-xl font-bold text-yellow-400 text-shadow-lg shadow-yellow-500/50">💰 $ {bal.toFixed(2)}</span>
                    <span className="ml-4 text-lg bg-black/40 px-3 py-1 rounded-lg">Aposta: $ {(febreDocesAtivo ? betValFebre : betVal).toFixed(2)}</span>
                    {febreDocesAtivo && (
                        <span className="ml-2 text-lg font-bold text-purple-400 animate-pulse">
                            (FEBRE DOCE!)
                        </span>
                    )}
                </div>

                {/* Botão Febre Doce */}
                {!febreDocesAtivo && openFeverSetup && (
                    <button
                        onClick={openFeverSetup}
                        disabled={!!isCooldown}
                        className={`
                            px-4 py-1.5 rounded-full font-bold text-sm shadow-lg transition-all
                            ${isCooldown
                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:scale-105 active:scale-95 animate-pulse'}
                        `}
                    >
                        {isCooldown ? 'Febre em Recarga' : '🍭 INICIAR FEBRE DOCE'}
                    </button>
                )}
            </div>

            {/* Barra de Progresso do Momento + Tooltip */}
            <div className="w-full max-w-md">
                <div className="flex justify-between items-center mb-1 text-sm">
                    <span className="font-bold text-sky-300">⚡ Momento Nível {momentoLevel}</span>
                    <span className="text-gray-500 text-xs">{progressPercent.toFixed(1)}%</span>
                </div>

                <div className="relative group">
                    {/* Barra */}
                    <div className="w-full bg-gray-800 rounded-full h-3 border-2 border-sky-700 overflow-hidden cursor-help">
                        <div
                            className="bg-gradient-to-r from-sky-500 to-cyan-400 h-full rounded-full transition-all duration-500"
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
                                <span className="font-bold text-white">{displayProgress.toFixed(0)} / {nextThreshold}</span>
                            </div>

                            <div className="flex justify-between gap-6">
                                <span className="text-gray-400">Fórmula</span>
                                <span className="text-gray-500 italic">100x + x²/2 + 10y</span>
                            </div>
                        </div>

                        {/* Seta apontando para baixo (em direção ao cursor/barra) */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
                            border-l-[7px] border-l-transparent
                            border-r-[7px] border-r-transparent
                            border-t-[7px] border-t-sky-600">
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
