
import React from 'react';
import type { SymbolKey, Inventory } from '../../types';

interface RemovalShopProps {
    bal: number;
    inv: Inventory;
    getRemovalPrice: (k: SymbolKey) => number;
    removeSymbol: (k: SymbolKey) => void;
}

const RemovalShop: React.FC<RemovalShopProps> = ({ bal, inv, getRemovalPrice, removeSymbol }) => {
    return (
        <div className="space-y-2">
            <p className="text-center text-gray-300 mb-3">Pague para remover símbolos do seu inventário e aumentar a chance de conseguir os melhores.</p>
            {(Object.keys(inv) as SymbolKey[])
            .filter(k => inv[k] > 0)
            .map(k => {
                const pr = getRemovalPrice(k);
                return (
                    <div key={k} className="flex justify-between items-center bg-red-900/30 p-2 rounded-md">
                        <div><span className="text-2xl">{k}</span> (Você tem: {inv[k]})</div>
                        <button 
                            onClick={() => removeSymbol(k)} 
                            disabled={bal < pr} 
                            className="py-1.5 px-3 font-semibold text-white bg-red-600 rounded-md transition-all hover:bg-red-500 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Remover por ${pr.toFixed(2)}
                        </button>
                    </div>
                )
            })}
        </div>
    );
};

export default RemovalShop;
