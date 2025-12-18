
import React, { useState, useEffect } from 'react';
import { BAKERY_PRODUCTS } from '../../constants';
import type { BakeryState, BakeryProductId, CraftingSlot } from '../../types';

interface BakeryShopProps {
    sugar: number;
    bakeryState: BakeryState;
    startCraft: (id: BakeryProductId, qty: number) => void;
    sellProduct: (id: BakeryProductId, qty: number) => void;
    buyProductUpgrade: (id: BakeryProductId) => void;
    buyExtraSlot: () => void;
    buySpeedUpgrade: () => void;
    getProductUpgradeCost: (id: BakeryProductId, level: number) => number;
    getExtraSlotCost: (extraSlots: number) => number;
    getSpeedUpgradeCost: (level: number) => number;
    getModifiedCraftTime: (base: number, level: number) => number;
    calculateSpeedDiscount: (level: number) => number;
    calculateProductPassiveIncome: (id: BakeryProductId, count: number, level: number) => number;
    currentPassiveIncome: number;
    applyFinalGain: (val: number) => number;
}

const BakeryShop: React.FC<BakeryShopProps> = (props) => {
    const { 
        sugar, bakeryState, startCraft, sellProduct, buyProductUpgrade, 
        buyExtraSlot, buySpeedUpgrade, getProductUpgradeCost, getExtraSlotCost, 
        getSpeedUpgradeCost, getModifiedCraftTime, calculateSpeedDiscount, 
        calculateProductPassiveIncome, currentPassiveIncome, applyFinalGain
    } = props;

    const [activeTab, setActiveTab] = useState<'craft' | 'inventory' | 'upgrades'>('craft');
    
    // Local ticker for progress bars
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 100);
        return () => clearInterval(interval);
    }, []);

    const tabBtnClasses = (isActive: boolean) => `flex-1 py-2 font-bold text-sm transition-colors rounded-t-lg ${isActive ? 'bg-pink-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`;

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-[#2a1b1b] to-[#1a1010] rounded-xl overflow-hidden border border-pink-900/50">
            {/* Header */}
            <div className="bg-black/40 p-4 border-b border-pink-500/30 flex justify-between items-center shrink-0">
                <div>
                    <h3 className="text-xl font-bold text-pink-400 flex items-center gap-2">
                        🧁 Confeitaria
                        <span className="text-xs bg-pink-900/50 px-2 py-0.5 rounded text-pink-200 border border-pink-500/30">Próprio Chefe</span>
                    </h3>
                    <p className="text-xs text-green-400 font-mono mt-1">Renda Passiva: +${currentPassiveIncome.toFixed(2)}/s</p>
                </div>
                <div className="text-right">
                    <div className="bg-gray-900 px-3 py-1 rounded border border-gray-700 flex items-center gap-2">
                        <span className="text-xl">🍬</span>
                        <span className="font-bold text-white text-lg">{sugar.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex bg-black/60 border-b border-gray-700 shrink-0">
                <button onClick={() => setActiveTab('craft')} className={tabBtnClasses(activeTab === 'craft')}>🍳 Cozinha</button>
                <button onClick={() => setActiveTab('inventory')} className={tabBtnClasses(activeTab === 'inventory')}>📦 Estoque</button>
                <button onClick={() => setActiveTab('upgrades')} className={tabBtnClasses(activeTab === 'upgrades')}>⬆️ Melhorias</button>
            </div>

            {/* Content Area */}
            <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
                
                {/* --- CRAFTING TAB --- */}
                {activeTab === 'craft' && (
                    <div className="space-y-6">
                        {/* Slots - Layout Flex Centralizado e Simétrico */}
                        <div className="flex flex-wrap justify-center gap-3">
                            {bakeryState.craftingSlots.map((slot, i) => {
                                const isActive = slot.productId !== null && slot.endTime !== null;
                                let progress = 0;
                                let timeLeft = 0;
                                
                                if (isActive) {
                                    const total = slot.endTime! - slot.startTime!;
                                    const elapsed = now - slot.startTime!;
                                    progress = Math.min(100, (elapsed / total) * 100);
                                    timeLeft = Math.max(0, slot.endTime! - now);
                                }

                                const product = slot.productId ? BAKERY_PRODUCTS[slot.productId] : null;

                                return (
                                    <div key={slot.id} className="w-[90px] sm:w-[100px] aspect-square bg-gray-800/80 rounded-lg p-2 border border-gray-600 flex flex-col items-center justify-center relative overflow-hidden shadow-inner shrink-0">
                                        {isActive ? (
                                            <>
                                                <div className="text-3xl mb-1 animate-bounce">{product?.icon}</div>
                                                <div className="text-[10px] text-gray-300 font-bold bg-black/50 px-1 rounded z-10">{Math.ceil(timeLeft / 1000)}s</div>
                                                <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-700">
                                                    <div className="h-full bg-green-500 transition-all duration-100" style={{ width: `${progress}%` }} />
                                                </div>
                                            </>
                                        ) : (
                                            <span className="text-2xl opacity-20">♨️</span>
                                        )}
                                        <span className="absolute top-1 left-1 text-[9px] text-gray-500 font-mono">#{i + 1}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Recipes */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-bold text-yellow-500 uppercase tracking-wider border-b border-yellow-500/20 pb-1">Receitas</h4>
                            {Object.values(BAKERY_PRODUCTS).map(prod => {
                                const modifiedTime = getModifiedCraftTime(prod.craftTime * 1000, bakeryState.speedLevel);
                                const canAfford = sugar >= prod.craftCost;
                                const hasSlot = bakeryState.craftingSlots.some(s => s.productId === null);

                                return (
                                    <div key={prod.id} className="bg-black/30 border border-gray-700 rounded-lg p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="text-3xl bg-gray-800 p-2 rounded-lg">{prod.icon}</div>
                                            <div>
                                                <div className="font-bold text-white">{prod.name}</div>
                                                <div className="text-xs text-gray-400 flex gap-2">
                                                    <span className="text-blue-300">⏱️ {(modifiedTime / 1000).toFixed(1)}s</span>
                                                    <span className="text-pink-300">🍬 {prod.craftCost}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => startCraft(prod.id, 1)}
                                            disabled={!canAfford || !hasSlot}
                                            className={`px-4 py-2 rounded font-bold text-xs uppercase transition-all active:scale-95 ${canAfford && hasSlot ? 'bg-pink-600 text-white hover:bg-pink-500' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                                        >
                                            Assar
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* --- INVENTORY TAB --- */}
                {activeTab === 'inventory' && (
                    <div className="space-y-4">
                        <div className="bg-green-900/20 p-3 rounded border border-green-500/30 text-center text-xs text-green-300">
                            Produtos no estoque geram renda passiva automaticamente!
                        </div>
                        {Object.values(BAKERY_PRODUCTS).map(prod => {
                            const count = bakeryState.inventory[prod.id] || 0;
                            const level = bakeryState.upgradeLevels[prod.id] || 0;
                            const passive = applyFinalGain(calculateProductPassiveIncome(prod.id, count, level));
                            const sellVal = applyFinalGain(prod.sellPrice);

                            return (
                                <div key={prod.id} className="bg-black/30 border border-gray-700 rounded-lg p-3">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{prod.icon}</span>
                                            <div>
                                                <div className="font-bold text-white">{prod.name} <span className="text-gray-500 text-xs">x{count}</span></div>
                                                <div className="text-xs text-green-400">+${passive.toFixed(2)}/s</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-gray-400 uppercase">Valor Venda</div>
                                            <div className="font-bold text-yellow-400">${sellVal.toFixed(0)}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2 mt-2">
                                        <button 
                                            onClick={() => sellProduct(prod.id, 1)}
                                            disabled={count < 1}
                                            className="flex-1 bg-yellow-600/80 hover:bg-yellow-500 text-white py-1.5 rounded text-xs font-bold disabled:opacity-50"
                                        >
                                            Vender 1
                                        </button>
                                        <button 
                                            onClick={() => sellProduct(prod.id, count)}
                                            disabled={count < 1}
                                            className="flex-1 bg-red-600/80 hover:bg-red-500 text-white py-1.5 rounded text-xs font-bold disabled:opacity-50"
                                        >
                                            Vender Tudo
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* --- UPGRADES TAB --- */}
                {activeTab === 'upgrades' && (
                    <div className="space-y-6">
                        {/* Global Upgrades */}
                        <div>
                            <h4 className="text-sm font-bold text-purple-400 uppercase tracking-wider border-b border-purple-500/20 pb-1 mb-2">Estrutura</h4>
                            
                            {/* Extra Slot */}
                            <div className="bg-purple-900/10 border border-purple-500/30 rounded-lg p-3 mb-2 flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-purple-200">Novo Forno</div>
                                    <div className="text-xs text-purple-400">Total Atual: {3 + bakeryState.extraSlots}</div>
                                </div>
                                <button
                                    onClick={buyExtraSlot}
                                    className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded text-xs font-bold shadow active:scale-95"
                                >
                                    ${getExtraSlotCost(bakeryState.extraSlots).toLocaleString()}
                                </button>
                            </div>

                            {/* Speed Upgrade */}
                            <div className="bg-purple-900/10 border border-purple-500/30 rounded-lg p-3 flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-purple-200">Velocidade Cozinha</div>
                                    <div className="text-xs text-purple-400">
                                        Nível {bakeryState.speedLevel} ({(calculateSpeedDiscount(bakeryState.speedLevel) * 100).toFixed(1)}% Rápido)
                                    </div>
                                </div>
                                <button
                                    onClick={buySpeedUpgrade}
                                    className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded text-xs font-bold shadow active:scale-95"
                                >
                                    ${getSpeedUpgradeCost(bakeryState.speedLevel).toLocaleString()}
                                </button>
                            </div>
                        </div>

                        {/* Product Upgrades */}
                        <div>
                            <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider border-b border-blue-500/20 pb-1 mb-2">Qualidade do Produto</h4>
                            {Object.values(BAKERY_PRODUCTS).map(prod => {
                                const level = bakeryState.upgradeLevels[prod.id] || 0;
                                const cost = getProductUpgradeCost(prod.id, level);
                                const bonus = (prod.upgradeBonus * 100).toFixed(0);

                                return (
                                    <div key={prod.id} className="bg-blue-900/10 border border-blue-500/30 rounded-lg p-3 mb-2 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="text-2xl">{prod.icon}</div>
                                            <div>
                                                <div className="font-bold text-blue-200">{prod.name} <span className="text-xs text-gray-500 bg-black/30 px-1 rounded">Lv {level}</span></div>
                                                <div className="text-xs text-blue-400">+{bonus}% Renda Passiva</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => buyProductUpgrade(prod.id)}
                                            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-bold shadow active:scale-95"
                                        >
                                            ${cost.toLocaleString()}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default BakeryShop;
