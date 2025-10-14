
import React from 'react';
import { MID } from '../../constants';
import type { SymbolKey, MidSymbolKey } from '../../types';

interface MultiplierShopProps {
    bal: number;
    mult: { [key: string]: number };
    multPrice: (k: SymbolKey) => number | null;
    midMultiplierValue: (k: SymbolKey) => number;
    buyMult: (k: SymbolKey) => void;
    isCometUnlocked: boolean;
}

const MultiplierShop: React.FC<MultiplierShopProps> = (props) => {
    const { bal, mult, multPrice, midMultiplierValue, buyMult, isCometUnlocked } = props;
    const shopBtnClasses = "py-1.5 px-3 font-semibold text-stone-900 bg-yellow-400 rounded-md transition-all hover:bg-yellow-300 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-400";

    return (
        <div className="space-y-2">
            {(Object.keys(mult) as SymbolKey[]).filter(k => {
                if (k === '⭐') return false;
                if (k === '☄️' && !isCometUnlocked) return false;
                if (MID.includes(k as MidSymbolKey)) return false;
                return true;
            }).map(k => {
                const price = multPrice(k);
                const currVal = midMultiplierValue(k).toFixed(2);
                return (
                    <div key={k} className="flex justify-between items-center bg-yellow-500/10 p-2 rounded-md">
                        <div><span className="text-2xl">{k}</span> {currVal}x ({mult[k]} ups)</div>
                        <button onClick={() => buyMult(k)} disabled={price === null || bal < price} className={shopBtnClasses}>
                            {price === null ? 'Máx.' : `$ ${price.toFixed(2)}`}
                        </button>
                    </div>
                )
            })}
        </div>
    );
};

export default MultiplierShop;
