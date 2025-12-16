
import React, { useState } from 'react';
import { SYM, MID_SELL } from '../../constants';
import type { SymbolKey, MidSymbolKey } from '../../types';

interface SymbolShopProps {
    bal: number;
    buy: (k: SymbolKey) => void;
    getPrice: (k: SymbolKey) => number;
    isCometUnlocked: boolean;
    momentoLevel: number;
}

const SymbolShop: React.FC<SymbolShopProps> = ({ bal, buy, getPrice, isCometUnlocked, momentoLevel }) => {
    const shopBtnClasses = "py-1.5 px-3 font-semibold text-stone-900 bg-yellow-400 rounded-md transition-all hover:bg-yellow-300 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-400";
    const [meteorMsg, setMeteorMsg] = useState(false);

    const handleBuyMeteor = () => {
        if (momentoLevel < 10) {
            setMeteorMsg(true);
            setTimeout(() => setMeteorMsg(false), 2000);
        } else {
            buy('☄️');
        }
    };

    return (
        <div className="space-y-2 relative">
            {(Object.keys(SYM) as SymbolKey[]).filter(k => {
                if (k === '☄️' && !isCometUnlocked) return false;
                return SYM[k].p > 0 || MID_SELL[k as MidSymbolKey]
            }).map(k => {
                const pr = getPrice(k);
                const isMeteor = k === '☄️';
                const isMeteorLocked = isMeteor && momentoLevel < 10;
                
                return (
                    <div key={k} className={`flex justify-between items-center bg-yellow-500/10 p-2 rounded-md ${isMeteorLocked ? 'opacity-70' : ''} relative`}>
                        <div>
                            <span className="text-2xl">{k}</span> $ {pr.toFixed(2)}
                            {isMeteorLocked && <span className="ml-2 text-xs text-red-400">🔒 Requer Nível 10</span>}
                        </div>
                        
                        <div className="relative">
                            <button 
                                onClick={isMeteor ? handleBuyMeteor : () => buy(k)} 
                                disabled={!isMeteorLocked && bal < pr} 
                                className={`${shopBtnClasses} ${isMeteorLocked ? 'bg-gray-600 text-gray-300 hover:bg-gray-600 cursor-not-allowed' : ''}`}
                            >
                                {isMeteorLocked ? 'Bloqueado' : 'Comprar'}
                            </button>

                             {/* Blue Floating Message for Meteor Lock */}
                             {isMeteor && meteorMsg && (
                                <div className="absolute bottom-full mb-2 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded shadow-lg animate-bounce z-10 whitespace-nowrap border border-blue-400">
                                    Precisa Momento Nível 10!
                                    <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-blue-600"></div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    );
};

export default SymbolShop;
