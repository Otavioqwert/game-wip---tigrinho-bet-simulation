import React from 'react';
import type { Inventory, SymbolKey, RoiSaldo, MidSymbolKey } from '../types';
import { MID } from '../constants';

interface InventoryTabProps {
    inv: Inventory;
    roiSaldo: RoiSaldo;
    momento: number;
}

const InventoryTab: React.FC<InventoryTabProps> = ({ inv, roiSaldo, momento }) => {
    const momentoProgress = momento < 0 ? 0 : (momento % 100);
    const nextThreshold = Math.floor(momento / 100) * 100 + 100;

    return (
        <div>
            {/* Stats Display */}
            <h3 className="text-xl font-bold text-yellow-400 mb-3 text-center">Estatísticas</h3>
            <div className="bg-black/20 rounded-xl p-3 mb-6 space-y-4">
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-lg text-purple-300">Momento</span>
                        <span className="text-gray-300">{momento.toFixed(2)} / {nextThreshold}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-4 border-2 border-purple-700 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-purple-500 to-fuchsia-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${momentoProgress}%` }}
                        ></div>
                    </div>
                </div>
                <div>
                    <h4 className="font-bold text-lg text-pink-300 mb-2">Saldo Diabético</h4>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        {MID.map(d => (
                            <div key={d} className="bg-pink-500/10 p-2 rounded-lg">
                                <span className="text-2xl">{d}</span>
                                <span className="block text-sm text-pink-300 mt-1">{(roiSaldo[d as MidSymbolKey] || 0)}</span>
                            </div>
                        ))}
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