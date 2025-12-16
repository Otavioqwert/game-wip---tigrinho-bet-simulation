
import React from 'react';

interface HeaderProps {
    bal: number;
    betVal: number;
    betValFebre: number;
    febreDocesAtivo: boolean;
    momentoLevel: number;
    momentoProgress: number;
    // New Props for Triggering Fever
    openFeverSetup?: () => void;
    cooldownEnd?: number | null;
}

const Header: React.FC<HeaderProps> = ({ bal, betVal, betValFebre, febreDocesAtivo, momentoLevel, momentoProgress, openFeverSetup, cooldownEnd }) => {
    const nextThreshold = (momentoLevel + 1) * 100;
    const displayProgress = Math.max(0, momentoProgress);
    const progressPercent = Math.min(100, (displayProgress / nextThreshold) * 100);

    const isCooldown = cooldownEnd && Date.now() < cooldownEnd;

    return (
        <header className="flex flex-col gap-4 justify-between items-center mb-5 p-3 bg-yellow-500/10 rounded-xl text-center">
            {/* Balance and Bet Info */}
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
                
                {/* Fever Trigger Button (Only show if not active) */}
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

            {/* Momento Progress Bar */}
            <div className="w-full max-w-md">
                <div className="flex justify-between items-center mb-1 text-sm">
                    <span className="font-bold text-sky-300">Momento Nível {momentoLevel}</span>
                    <span className="text-gray-300">{momentoProgress.toFixed(2)} / {nextThreshold}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3 border-2 border-sky-700 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-sky-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                </div>
            </div>
        </header>
    );
};

export default Header;
