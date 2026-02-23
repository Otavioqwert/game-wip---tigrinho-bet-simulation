import React, { useMemo } from 'react';
import type { Inventory, SymbolKey, RoiSaldo, ActiveCookie } from '../types';
import PoolHealthIndicator from './PoolHealthIndicator';
import { calculatePoolDensity } from '../utils/poolMetrics';
import MomentoBar from './MomentoBar';

interface InventoryTabProps {
    inv: Inventory;
    roiSaldo: RoiSaldo;
    momentoLevel: number;
    momentoProgress: number;
    momentoValue: number;
    candyStacksForMomento: number;
    sugar: number;
    activeCookies: ActiveCookie[];
}

const InventoryTab: React.FC<InventoryTabProps> = ({
    inv, roiSaldo, momentoLevel, momentoProgress,
    momentoValue, candyStacksForMomento, sugar, activeCookies
}) => {
    const poolMetrics = useMemo(() => calculatePoolDensity(inv), [inv]);

    return (
        <div>
            <h3 className="text-xl font-bold text-yellow-400 mb-3 text-center">Estatísticas</h3>
            <div className="bg-black/20 rounded-xl p-3 mb-4 space-y-4">
                <MomentoBar
                    momentoLevel={momentoLevel}
                    momentoProgress={momentoProgress}
                    momentoValue={momentoValue}
                    candyStacksForMomento={candyStacksForMomento}
                    variant="inventory"
                />

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

            <PoolHealthIndicator metrics={poolMetrics} />

            <h3 className="text-xl font-bold text-yellow-400 mb-3 text-center">Inventário de Símbolos</h3>
            <div className="grid grid-cols-4 gap-2 p-2.5 bg-black/20 rounded-xl mb-6">
                {(Object.keys(inv) as SymbolKey[]).map(k => (
                    <div key={k} className="text-center bg-yellow-500/10 p-2 rounded-lg text-2xl relative">
                        {k}
                        <span className="block text-xs text-yellow-400 mt-1">{inv[k]}x</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InventoryTab;
