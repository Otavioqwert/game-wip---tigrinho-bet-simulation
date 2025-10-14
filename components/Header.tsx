import React from 'react';

interface HeaderProps {
    bal: number;
    betVal: number;
    betValFebre: number;
    febreDocesAtivo: boolean;
    momento: number;
}

const Header: React.FC<HeaderProps> = ({ bal, betVal, betValFebre, febreDocesAtivo, momento }) => {
    const momentoProgress = momento < 0 ? 0 : (momento % 100);
    const nextThreshold = Math.floor(momento / 100) * 100 + 100;

    return (
        <header className="flex flex-col gap-4 justify-between items-center mb-5 p-3 bg-yellow-500/10 rounded-xl text-center">
            {/* Balance and Bet Info */}
            <div>
                <span className="text-xl font-bold text-yellow-400 text-shadow-lg shadow-yellow-500/50">💰 $ {bal.toFixed(2)}</span>
                <span className="ml-4 text-lg bg-black/40 px-3 py-1 rounded-lg">Aposta: $ {(febreDocesAtivo ? betValFebre : betVal).toFixed(2)}</span>
                {febreDocesAtivo && (
                     <span className="ml-2 text-lg font-bold text-purple-400">
                        (FEBRE DOCE!)
                     </span>
                )}
            </div>

            {/* Momento Progress Bar */}
            <div className="w-full max-w-md">
                <div className="flex justify-between items-center mb-1 text-sm">
                    <span className="font-bold text-sky-300">Momento</span>
                    <span className="text-gray-300">{momento.toFixed(2)} / {nextThreshold}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3 border-2 border-sky-700 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-sky-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${momentoProgress}%` }}
                    ></div>
                </div>
            </div>
        </header>
    );
};

export default Header;