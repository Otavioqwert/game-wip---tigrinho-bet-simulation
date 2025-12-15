
import React, { useState } from 'react';
import { 
    SCRATCH_CARD_TIERS, 
    SCRATCH_CARD_BASE_PRIZES, 
    SCRATCH_CARD_WIN_CHANCE_MODIFIERS, 
    SCRATCH_CARD_BASE_WIN_CHANCE 
} from '../../constants';
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
    const [showOddsFor, setShowOddsFor] = useState<number | null>(null);

    const handleQuantityChange = (tierIndex: number, value: string) => {
        const num = parseInt(value, 10);
        setQuantities(prev => ({
            ...prev,
            [tierIndex]: isNaN(num) || num < 1 ? 1 : num
        }));
    };
    
    const shopBtnClasses = "py-1.5 px-3 font-semibold text-stone-900 bg-yellow-400 rounded-md transition-all hover:bg-yellow-300 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-400";
    
    // Get base max prize (first element of prizes array)
    const baseMaxPrize = SCRATCH_CARD_BASE_PRIZES[0].value;

    const prizeLabels = [
        "JACKPOT (100x)",
        "Grande (25x)",
        "Médio (10x)",
        "Dobro (2x)",
        "Metade (0.5x)",
        "Nada (0x)"
    ];

    return (
        <div className="space-y-2">
            <div className="text-center bg-black/30 p-3 rounded-lg mb-4">
                <p className="font-bold text-lg text-yellow-300">Pote de Azar: ${unluckyPot.toFixed(2)}</p>
                <p className="text-sm text-gray-400">O Pote de Azar cresce quando você perde apostas. Use-o para recuperar perdas!</p>
            </div>
            {SCRATCH_CARD_TIERS.map((tier, index) => {
                const currentPrice = getScratchCardPrice(index);
                const quantity = quantities[index] || 1;
                const maxPrize = baseMaxPrize * tier.multiplier;
                const isOddsOpen = showOddsFor === index;

                // Probability Calculations
                const tierModifier = SCRATCH_CARD_WIN_CHANCE_MODIFIERS[index] || 0;
                // Calculate win chance per slot (sum of all winning probabilities)
                const baseWinChance = SCRATCH_CARD_BASE_PRIZES.filter(p => p.value > 0).reduce((acc, p) => acc + p.probability, 0);
                const tierWinChance = Math.min(1, Math.max(0, baseWinChance + tierModifier));

                return (
                    <div key={tier.name} className="bg-yellow-500/10 p-2 rounded-md border border-yellow-500/20">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <span className="font-bold text-yellow-400 text-lg">{tier.name}</span>
                                <div className="text-sm text-gray-300">Preço: <span className="text-white font-bold">$ {currentPrice.toFixed(2)}</span></div>
                                <div className="text-xs text-green-400">Jackpot: ${maxPrize.toLocaleString()}</div>
                                <button 
                                    onClick={() => setShowOddsFor(isOddsOpen ? null : index)}
                                    className="text-xs text-sky-400 underline mt-1 hover:text-sky-300"
                                >
                                    {isOddsOpen ? 'Ocultar Chances' : '📊 Ver Chances (por slot)'}
                                </button>
                            </div>
                            <button 
                                onClick={() => buyScratchCard(index)} 
                                disabled={unluckyPot < currentPrice || !!activeCard} 
                                className={`${shopBtnClasses} h-full self-center`}
                            >
                                Raspar (1)
                            </button>
                        </div>
                        
                        {isOddsOpen && (
                            <div className="bg-black/40 p-2 rounded mb-2 text-xs">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-gray-400 border-b border-gray-600">
                                            <th className="pb-1">Prêmio (x6 slots)</th>
                                            <th className="pb-1 text-right">Valor</th>
                                            <th className="pb-1 text-right">Chance/Slot</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {SCRATCH_CARD_BASE_PRIZES.map((prize, pIdx) => {
                                            if (prize.value === 0) return null; // Don't show "Nada" row in detail
                                            const val = prize.value * tier.multiplier;
                                            const prob = (prize.probability * 100).toFixed(2);
                                            const isJackpot = pIdx === 0;
                                            return (
                                                <tr key={pIdx} className={isJackpot ? "text-yellow-300 font-bold" : "text-gray-300"}>
                                                    <td className="py-0.5">{prizeLabels[pIdx]}</td>
                                                    <td className="py-0.5 text-right">${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                                    <td className="py-0.5 text-right">{prob}%</td>
                                                </tr>
                                            );
                                        })}
                                        <tr className="border-t border-gray-600 text-gray-400 font-bold">
                                            <td className="pt-1">Chance Vitória/Slot</td>
                                            <td className="pt-1 text-right">-</td>
                                            <td className="pt-1 text-right">{(tierWinChance * 100).toFixed(1)}%</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-yellow-500/20 bg-black/20 p-2 rounded">
                           <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400">Qtd:</span>
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
                                disabled={!!activeCard || unluckyPot < (currentPrice * quantity)}
                                className={`${shopBtnClasses} !bg-sky-600 !text-white hover:!bg-sky-500 text-xs`}
                            >
                                Compra em Massa
                            </button>
                        </div>
                    </div>
                )
            })}
        </div>
    );
};

export default ScratchCardShop;
