
import React from 'react';
import type { Inventory, SymbolKey, RoiSaldo, ActiveCookie } from '../types';

interface InventoryTabProps {
    inv: Inventory;
    roiSaldo: RoiSaldo;
    momentoLevel: number;
    momentoProgress: number;
    sugar: number;
    activeCookies: ActiveCookie[];
}

const InventoryTab: React.FC<InventoryTabProps> = ({ inv, roiSaldo, momentoLevel, momentoProgress, sugar, activeCookies }) => {
    const nextThreshold = (momentoLevel + 1) * 100;
    const displayProgress = Math.max(0, momentoProgress);
    const progressPercent = Math.min(100, (displayProgress / nextThreshold) * 100);

    return (
        <div>
            {/* Stats Display */}
            <h3 className="text-xl font-bold text-yellow-400 mb-3 text-center">Estatísticas</h3>
            <div className="bg-black/20 rounded-xl p-3 mb-6 space-y-4">
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-lg text-purple-300">Momento Nível {momentoLevel}</span>
                        <span className="text-gray-300">{momentoProgress.toFixed(2)} / {nextThreshold}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-4 border-2 border-purple-700 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-purple-500 to-fuchsia-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                </div>
                
                {/* Sugar & Cookies Panel */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-orange-900/30 p-3 rounded-lg border border-orange-500/30 text-center">
                        <h4 className="font-bold text-orange-300 mb-1">🍬 Açúcar</h4>
                        <span className="text-2xl font-bold text-white">{sugar.toLocaleString()}</span>
                    </div>
                    <div className="bg-blue-900/30 p-3 rounded-lg border border-blue-500/30 text-center">
                        <h4 className="font-bold text-blue-300 mb-1">🔥 Fornalha</h4>
                        <span className="text-sm text-gray-300">{activeCookies.length > 0 ? `${activeCookies.length} Cookie(s) Ativo(s)` : 'Nenhum efeito'}</span>
                    </div>
                </div>
            </div>

            {/* Inventory Display */}
            <h3 className="text-xl font-bold text-yellow-400 mb-3 text-center">Inventário de Símbolos</h3>
            <div className="grid grid-cols-4 gap-2 p-2.5 bg-black/20 rounded-xl mb-6">
                {(Object.keys(inv) as SymbolKey[]).map(k => (
                    <div key={k} className="text-center bg-yellow-500/10 p-2 rounded-lg text-2xl">
                        {k}
                        <span className="block text-xs text-yellow-400 mt-1">{inv[k]}x</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InventoryTab;
