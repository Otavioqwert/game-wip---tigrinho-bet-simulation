
import React from 'react';
import { MID } from '../../constants';
import type { SymbolKey, MidSymbolKey, Multipliers } from '../../types';

interface MultiplierShopProps {
    bal: number;
    mult: Multipliers;
    bonusMult: Multipliers;
    multUpgradeBonus: number; // Multiplicador de eficácia do Incremento (ex: 1.25)
    multPrice: (k: SymbolKey) => number | null;
    midMultiplierValue: (k: SymbolKey) => number;
    buyMult: (k: SymbolKey) => void;
    isCometUnlocked: boolean;
}

const MultiplierShop: React.FC<MultiplierShopProps> = (props) => {
    const { bal, mult, bonusMult, multUpgradeBonus, multPrice, midMultiplierValue, buyMult, isCometUnlocked } = props;
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
                const currVal = midMultiplierValue(k);
                const isUpgradeable = !['⭐', '🪙'].includes(k);
                const incBonusPercent = isUpgradeable ? (multUpgradeBonus - 1) * 100 : 0;
                
                // Níveis extras apenas do Start/Stop
                const startStopBonus = bonusMult[k] || 0;
                
                return (
                    <div key={k} className="flex justify-between items-center bg-yellow-500/10 p-2 rounded-md">
                        <div>
                            <span className="text-2xl">{k}</span> 
                            <span className="font-bold ml-1">{currVal.toFixed(4)}x</span>
                            
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-gray-400">
                                    {mult[k]} ups
                                    {startStopBonus > 0 && <span className="text-green-400 font-bold ml-1">(+{startStopBonus}x)</span>}
                                </span>
                                {incBonusPercent > 0 && (
                                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1 rounded font-black border border-blue-500/30">
                                        +{incBonusPercent.toFixed(0)}% Eficácia
                                    </span>
                                )}
                            </div>
                        </div>
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
