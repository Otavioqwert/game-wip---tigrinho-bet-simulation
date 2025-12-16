
import React, { useState } from 'react';
import type { SymbolKey, MidSymbolKey, SkillId, ScratchCardTier, ScratchCardCell, Inventory, ActiveCookie, CookieId } from '../types';

// Import newly created shop components
import SymbolShop from './shops/SymbolShop';
import MultiplierShop from './shops/MultiplierShop';
import FurnaceShop from './shops/FurnaceShop';
import ScratchCardShop from './shops/ScratchCardShop';
import MinigamesShop from './shops/MinigamesShop';
import ScratchCardModal from './shops/ScratchCardModal';
import BulkScratchResultModal from './shops/BulkScratchResultModal';

interface ShopsTabProps {
    bal: number;
    inv: Inventory;
    buy: (k: SymbolKey) => void;
    getPrice: (k: SymbolKey) => number;
    mult: { [key: string]: number };
    multPrice: (k: SymbolKey) => number | null;
    midMultiplierValue: (k: SymbolKey) => number;
    buyMult: (k: SymbolKey) => void;
    panificadoraLevel: { [key: string]: number };
    buyPanificadora: (d: MidSymbolKey) => void;
    roiSaldo: { [key: string]: number };
    getSkillLevel: (id: SkillId) => number;
    unluckyPot: number;
    activeCard: { tier: ScratchCardTier; grid: ScratchCardCell[] } | null;
    winnings: number | null;
    getScratchCardPrice: (tierIndex: number) => number;
    buyScratchCard: (tierIndex: number) => void;
    revealSquare: (index: number) => void;
    revealAll: () => void;
    closeCard: () => void;
    isSnakeGameUnlocked: boolean;
    startSnakeGame: () => void;
    // Bulk buy props
    bulkResult: { count: number, cost: number, winnings: number } | null;
    buyMultipleScratchCards: (tierIndex: number, quantity: number) => void;
    closeBulkResultModal: () => void;
    // Febre Doce status
    febreDocesAtivo: boolean;
    // Furnace Props
    sugar: number;
    activeCookies: ActiveCookie[];
    craftCookie: (id: CookieId) => void;
    // Momento
    momentoLevel: number;
}

const ShopsTab: React.FC<ShopsTabProps> = (props) => {
    const { activeCard, winnings, revealSquare, revealAll, closeCard, isSnakeGameUnlocked, getSkillLevel, bulkResult, closeBulkResultModal, febreDocesAtivo, momentoLevel } = props;
    const [shopActiveTab, setShopActiveTab] = useState(0);

    const tabBtnClasses = (isActive: boolean) => `flex-1 p-2 rounded-t-lg font-bold cursor-pointer transition-colors text-sm sm:text-base ${isActive ? 'bg-yellow-500 text-stone-900' : 'bg-yellow-500/20 text-white hover:bg-yellow-500/30'}`;
    
    const isCometUnlocked = getSkillLevel('caminhoCometa') > 0;

    if (febreDocesAtivo) {
        return (
            <div className="bg-black/40 p-6 rounded-lg text-center border-2 border-pink-500">
                <h3 className="text-2xl font-bold text-pink-400 mb-2">Loja Fechada!</h3>
                <p className="text-gray-300">A Febre Doce está ativa. A loja normal está fechada temporariamente.</p>
            </div>
        );
    }

    const shopTabs = ['🛒 Loja', '⚡ Mult', '🔥 Fornalha', '🎫 Raspatinhas'];
    if (isSnakeGameUnlocked) {
        shopTabs.push('🕹️ Minigames');
    }

    return (
        <div>
            {activeCard && (
                <ScratchCardModal 
                    card={activeCard}
                    winnings={winnings}
                    revealSquare={revealSquare}
                    revealAll={revealAll}
                    closeCard={closeCard}
                />
            )}

            {bulkResult && (
                <BulkScratchResultModal
                    result={bulkResult}
                    onClose={closeBulkResultModal}
                />
            )}

            <div className="flex gap-1 mb-2">
                {shopTabs.map((label, i) => (
                    <button key={i} onClick={() => setShopActiveTab(i)} className={tabBtnClasses(shopActiveTab === i)}>
                        {label}
                    </button>
                ))}
            </div>
            <div className="bg-black/20 rounded-b-lg rounded-tr-lg p-4">
                {shopActiveTab === 0 && <SymbolShop {...props} isCometUnlocked={isCometUnlocked} momentoLevel={momentoLevel} />}
                {shopActiveTab === 1 && <MultiplierShop {...props} isCometUnlocked={isCometUnlocked} />}
                {shopActiveTab === 2 && <FurnaceShop {...props} />}
                {shopActiveTab === 3 && <ScratchCardShop {...props} />}
                {shopActiveTab === 4 && isSnakeGameUnlocked && <MinigamesShop {...props} />}
            </div>
        </div>
    );
};

export default ShopsTab;
