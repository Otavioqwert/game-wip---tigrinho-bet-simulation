
import React from 'react';
import { MID, PANI_INCREMENT } from '../../constants';
import type { MidSymbolKey } from '../../types';

interface PanificadoraShopProps {
    panificadoraLevel: { [key: string]: number };
    buyPanificadora: (d: MidSymbolKey) => void;
    roiSaldo: { [key: string]: number };
}

const PanificadoraShop: React.FC<PanificadoraShopProps> = (props) => {
    const { panificadoraLevel, buyPanificadora, roiSaldo } = props;
    const shopBtnClasses = "py-1.5 px-3 font-semibold text-stone-900 bg-yellow-400 rounded-md transition-all hover:bg-yellow-300 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-400";

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {MID.map(d => {
                const cost = 1 + Math.floor(((panificadoraLevel[d] || 0) + 1) / 3);
                return (
                    <div key={d} className="bg-yellow-500/10 p-3 rounded-lg text-center">
                        <div className="font-bold text-xl">{d} - Nível: {panificadoraLevel[d] || 0}</div>
                        <div className="my-1">Bônus: +{((panificadoraLevel[d] || 0) * (PANI_INCREMENT[d] || 0)).toFixed(3)}x</div>
                        <button onClick={() => buyPanificadora(d)} disabled={(roiSaldo[d] || 0) < cost}
                            className={`w-full mt-1 ${shopBtnClasses}`}>
                            Comprar (custa {cost} {d})
                        </button>
                    </div>
                )
            })}
        </div>
    );
};

export default PanificadoraShop;
