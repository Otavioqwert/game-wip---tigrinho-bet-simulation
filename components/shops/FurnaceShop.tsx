
import React from 'react';
import { COOKIE_RECIPES } from '../../constants';
import type { CookieId, ActiveCookie } from '../../types';

interface FurnaceShopProps {
    sugar: number;
    activeCookies: ActiveCookie[];
    craftCookie: (id: CookieId) => void;
}

const FurnaceShop: React.FC<FurnaceShopProps> = ({ sugar, activeCookies, craftCookie }) => {
    return (
        <div className="flex flex-col gap-6">
            {/* Status Panel */}
            <div className="bg-gradient-to-r from-orange-900/50 to-red-900/50 p-4 rounded-xl border-2 border-orange-500/50">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-orange-400">🔥 Fornalha</h3>
                    <div className="bg-black/40 px-4 py-2 rounded-lg border border-orange-500/30">
                        <span className="text-2xl">🍬</span>
                        <span className="text-xl font-bold text-white ml-2">{sugar.toLocaleString()}</span>
                    </div>
                </div>

                {/* Active Cookie Slot (Single) */}
                <div className="flex justify-center">
                    <div className="w-32 aspect-square bg-black/40 rounded-xl border-2 border-orange-500/30 flex flex-col items-center justify-center relative overflow-hidden shadow-lg shadow-orange-900/50">
                        {activeCookies.length > 0 ? (
                            <>
                                <span className="text-5xl mb-2 animate-bounce">{activeCookies[0].icon}</span>
                                <span className="text-xs font-bold text-orange-200 text-center leading-tight px-1">{activeCookies[0].name}</span>
                                <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gray-700">
                                    <div 
                                        className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-300"
                                        style={{ width: `${(activeCookies[0].remainingSpins / activeCookies[0].maxSpins) * 100}%` }}
                                    />
                                </div>
                                <span className="text-[10px] text-gray-300 mt-1 font-mono">{activeCookies[0].remainingSpins}/{activeCookies[0].maxSpins} giros</span>
                            </>
                        ) : (
                            <div className="text-center text-gray-500">
                                <span className="text-4xl opacity-30">🔥</span>
                                <p className="text-xs mt-1">Forno Vazio</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recipes */}
            <div className="space-y-3">
                <h4 className="font-bold text-lg text-yellow-500 border-b border-yellow-500/20 pb-1">Receitas Disponíveis</h4>
                {COOKIE_RECIPES.map(recipe => {
                    const canCraft = sugar >= recipe.sugarCost && activeCookies.length < 1;
                    return (
                        <div key={recipe.id} className="bg-black/30 p-3 rounded-lg border border-orange-500/10 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{recipe.icon}</span>
                                <div>
                                    <div className="font-bold text-white">{recipe.name}</div>
                                    <div className="text-xs text-orange-300">Boost: {recipe.multiplier}x | Duração: {recipe.duration} giros</div>
                                    <div className="text-xs text-gray-400 italic">{recipe.description}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => craftCookie(recipe.id)}
                                disabled={!canCraft}
                                className={`
                                    px-4 py-2 rounded-lg font-bold text-sm shadow-lg transition-all active:scale-95 min-w-[80px]
                                    ${canCraft 
                                        ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:brightness-110' 
                                        : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'}
                                `}
                            >
                                <div className="flex flex-col items-center leading-none gap-1">
                                    <span>ASSAR</span>
                                    <span className="text-[10px]">{recipe.sugarCost} 🍬</span>
                                </div>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default FurnaceShop;
