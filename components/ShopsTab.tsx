
import React, { useState } from 'react';
import type { SymbolKey, MidSymbolKey, SkillId, Inventory, Multipliers, ActiveCookie, CookieId, ScratchCardMetrics, LotericaInjectionState, ActiveScratchCard, SecondarySkillId } from '../types';

// Import newly created shop components
import SymbolShop from './shops/SymbolShop';
import MultiplierShop from './shops/MultiplierShop';
import FurnaceShop from './shops/FurnaceShop';
import ScratchCardShop from './shops/ScratchCardShop';
import MinigamesShop from './shops/MinigamesShop';
import ScratchCardModal from './shops/ScratchCardModal';

interface ShopsTabProps {
    bal: number;
    inv: Inventory;
    buy: (k: SymbolKey) => void;
    getPrice: (k: SymbolKey) => number;
    // Updated mult type to match Multipliers definition and added bonusMult
    mult: Multipliers;
    bonusMult: Multipliers;
    // Add multUpgradeBonus to satisfy MultiplierShop requirements
    multUpgradeBonus: number;
    multPrice: (k: SymbolKey) => number | null;
    midMultiplierValue: (k: SymbolKey) => number;
    buyMult: (k: SymbolKey) => void;
    panificadoraLevel: { [key: string]: number };
    roiSaldo: { [key: string]: number };
    getSkillLevel: (id: SkillId) => number;
    unluckyPot: number; // Deprecated for Scratch Card V3 but kept for interface compatibility if needed
    isSnakeGameUnlocked: boolean;
    startSnakeGame: () => void;
    // Febre Doce status
    febreDocesAtivo: boolean;
    // Furnace Props
    sugar: number;
    activeCookies: ActiveCookie[];
    craftCookie: (id: CookieId) => void;
    // Momento
    momentoLevel: number;
    // Scratch Card V3 Props
    scratchMetrics: ScratchCardMetrics;
    lotericaState: LotericaInjectionState;
    activeScratchCard: ActiveScratchCard | null;
    calculateCurrentCost: (tier: number) => number;
    calculateCurrentRTP: (tier: number) => number;
    buyScratchCard: (tier: number) => void;
    finishScratchCard: () => void;
    injetarLoterica: (tier: number) => void;
    // New Shop Logic Props
    sellMeteor: () => void;
    flipTokens: (amount: number) => void;
    // Fixed: Added missing properties to satisfy SymbolShop requirements
    buyWithSugar: (k: SymbolKey) => void;
    getSecondarySkillLevel: (id: SecondarySkillId) => number;
    mortgageUsages: number;
}

const ShopsTab: React.FC<ShopsTabProps> = (props) => {
    const { 
        isSnakeGameUnlocked, getSkillLevel, febreDocesAtivo, momentoLevel,
        activeScratchCard, finishScratchCard, inv, sellMeteor, flipTokens
    } = props;
    
    const [shopActiveTab, setShopActiveTab] = useState(0);

    const tabBtnClasses = (isActive: boolean) => `flex-1 p-2 rounded-t-lg font-bold cursor-pointer transition-colors text-sm sm:text-base ${isActive ? 'bg-yellow-500 text-stone-900' : 'bg-yellow-500/20 text-white hover:bg-yellow-500/30'}`;
    
    const isCometUnlocked = getSkillLevel('caminhoCometa') > 0;
    const isTokenUnlocked = getSkillLevel('caminhoFicha') > 0;

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
            {/* V3 Scratch Card Modal */}
            {activeScratchCard && (
                <ScratchCardModal
                    card={activeScratchCard}
                    onClose={finishScratchCard}
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
                {shopActiveTab === 0 && <SymbolShop {...props} isCometUnlocked={isCometUnlocked} isTokenUnlocked={isTokenUnlocked} momentoLevel={momentoLevel} inv={inv} sellMeteor={sellMeteor} flipTokens={flipTokens} />}
                {shopActiveTab === 1 && <MultiplierShop {...props} isCometUnlocked={isCometUnlocked} />}
                {shopActiveTab === 2 && <FurnaceShop {...props} />}
                {shopActiveTab === 3 && <ScratchCardShop {...props} />}
                {shopActiveTab === 4 && isSnakeGameUnlocked && <MinigamesShop {...props} />}
            </div>
        </div>
    );
};

export default ShopsTab;
