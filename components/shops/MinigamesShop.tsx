// FIX: Implemented the shop tab for purchasing minigame entries.
import React from 'react';

interface MinigamesShopProps {
    startSnakeGame: () => void;
    bal: number;
}

const MinigamesShop: React.FC<MinigamesShopProps> = ({ startSnakeGame, bal }) => {
    const ticketPrice = 10;
    const canAfford = bal >= ticketPrice;
    
    const btnClasses = `
        w-full py-4 px-6 text-lg font-bold rounded-lg transition-all 
        bg-green-600 text-white hover:bg-green-500 
        disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-95
    `;

    return (
        <div className="flex flex-col items-center justify-center h-full p-4">
            <div className="text-center bg-black/30 p-6 rounded-lg w-full max-w-sm">
                <h3 className="text-2xl font-bold text-green-400 mb-2">Snake Game</h3>
                <p className="text-gray-300 mb-4">
                    Jogue uma partida do clássico jogo da cobrinha. Cada maçã coletada recompensa você com base no seu multiplicador de renda total!
                </p>
                <button 
                    onClick={startSnakeGame}
                    disabled={!canAfford}
                    className={btnClasses}
                >
                    Jogar (Custa ${ticketPrice.toFixed(2)})
                </button>
                {!canAfford && <p className="text-red-500 mt-2 text-sm">Saldo insuficiente.</p>}
            </div>
        </div>
    );
};

export default MinigamesShop;
