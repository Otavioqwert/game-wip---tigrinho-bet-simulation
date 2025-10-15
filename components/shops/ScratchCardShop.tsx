
import React, { useState } from 'react';
import { SCRATCH_CARD_TIERS } from '../../constants';
import type { ScratchCardTier, ScratchCardCell } from '../../types';

interface ScratchCardShopProps {
    unluckyPot: number;
    activeCard: { tier: ScratchCardTier; grid: ScratchCardCell[] } | null;
    getScratchCardPrice: (tierIndex: number) => number;
    buyScratchCard: (tierIndex: number) => void;
    buyMultipleScratchCards: (tierIndex: number, quantity: number) => void;
}

const ScratchCardShop: React.FC<ScratchCardShopProps> = (props) => {
    const { unluckyPot, activeCard, getScratchCardPrice, buyScratchCard, buyMultipleScratchCards } = props;
    const [quantities, setQuantities] = useState<Record<number, number>>({});

    const handleQuantityChange = (tierIndex: number, value: string) => {
        const num = parseInt(value, 10);
        setQuantities(prev => ({
            ...prev,
            [tierIndex]: isNaN(num) || num < 1 ? 1 : num
        }));
    };
    
    const shopBtnClasses = "py-1.5 px-3 font-semibold text-stone-900 bg-yellow-400 rounded-md transition-all hover:bg-yellow-300 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-400";

    return (
        <div className="space-y-2">
            <div className="text-center bg-black/30 p-3 rounded-lg mb-4">
                <p className="font-bold text-lg text-yellow-300">Pote de Azar: ${unluckyPot.toFixed(2)}</p>
                <p className="text-sm text-gray-400">Use o dinheiro perdido em giros para comprar raspatinhas.</p>
            </div>
            {SCRATCH_CARD_TIERS.map((tier, index) => {
                const currentPrice = getScratchCardPrice(index);
                const quantity = quantities[index] || 1;

                return (
                    <div key={tier.name} className="bg-yellow-500/10 p-2 rounded-md">
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="font-bold text-yellow-400">Raspatinha {tier.name}</span>
                                <span className="block text-sm text-gray-300">$ {currentPrice.toFixed(2)}</span>
                            </div>
                            <button 
                                onClick={() => buyScratchCard(index)} 
                                disabled={unluckyPot < currentPrice || !!activeCard} 
                                className={shopBtnClasses}
                            >
                                Comprar 1
                            </button>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-yellow-500/20">
                           <div className="flex items-center gap-2">
                                <span className="text-sm">Qtd:</span>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                                    min="1"
                                    className="w-16 bg-black/50 text-white p-1 rounded border border-gray-600 text-center"
                                />
                           </div>
                            <button
                                onClick={() => buyMultipleScratchCards(index, quantity)}
                                disabled={!!activeCard}
                                className={`${shopBtnClasses} !bg-sky-500 !text-white`}
                            >
                                Comprar Várias
                            </button>
                        </div>
                    </div>
                )
            })}
        </div>
    );
};

export default ScratchCardShop;