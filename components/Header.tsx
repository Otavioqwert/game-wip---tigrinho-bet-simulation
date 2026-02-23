import React from 'react';
import MomentoBar from './MomentoBar';

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

            <MomentoBar
                momentoLevel={momentoLevel}
                momentoProgress={momentoProgress}
                momentoValue={momentoValue}
                candyStacksForMomento={candyStacksForMomento}
                variant="header"
            />
        </header>
    );
};

export default Header;
