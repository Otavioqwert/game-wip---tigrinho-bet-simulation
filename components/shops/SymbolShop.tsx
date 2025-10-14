
import React from 'react';
import { SYM, MID_SELL } from '../../constants';
import type { SymbolKey, MidSymbolKey } from '../../types';

interface SymbolShopProps {
    bal: number;
    buy: (k: SymbolKey) => void;
    getPrice: (k: SymbolKey) => number;
    isCometUnlocked: boolean;
}

const SymbolShop: React.FC<SymbolShopProps> = ({ bal, buy, getPrice, isCometUnlocked }) => {
    const shopBtnClasses = "py-1.5 px-3 font-semibold text-stone-900 bg-yellow-400 rounded-md transition-all hover:bg-yellow-300 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-400";

    return (
        <div className="space-y-2">
            {(Object.keys(SYM) as SymbolKey[]).filter(k => {
                if (k === '☄️' && !isCometUnlocked) return false;
                return SYM[k].p > 0 || MID_SELL[k as MidSymbolKey]
            }).map(k => {
                const pr = getPrice(k);
                return (
                    <div key={k} className="flex justify-between items-center bg-yellow-500/10 p-2 rounded-md">
                        <div><span className="text-2xl">{k}</span> $ {pr.toFixed(2)}</div>
                        <button onClick={() => buy(k)} disabled={bal < pr} className={shopBtnClasses}>Comprar</button>
                    </div>
                )
            })}
        </div>
    );
};

export default SymbolShop;
