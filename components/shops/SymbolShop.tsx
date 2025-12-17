
import React, { useState } from 'react';
import { SYM, MID_SELL } from '../../constants';
import type { SymbolKey, MidSymbolKey, Inventory } from '../../types';
import { useMeteorTutorial } from '../../hooks/useMeteorTutorial';
import MeteorTutorialModal from './MeteorTutorialModal';

interface SymbolShopProps {
    bal: number;
    buy: (k: SymbolKey) => void;
    getPrice: (k: SymbolKey) => number;
    isCometUnlocked: boolean;
    momentoLevel: number;
    inv: Inventory; // Needed for count check
    sellMeteor: () => void;
}

const SymbolShop: React.FC<SymbolShopProps> = ({ bal, buy, getPrice, isCometUnlocked, momentoLevel, inv, sellMeteor }) => {
    const shopBtnClasses = "py-1.5 px-3 font-semibold text-stone-900 bg-yellow-400 rounded-md transition-all hover:bg-yellow-300 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-400";
    const [meteorMsg, setMeteorMsg] = useState(false);
    
    // Tutorial Logic
    const meteorCount = inv['☄️'] || 0;
    const { showTutorial, closeTutorial } = useMeteorTutorial(meteorCount);

    const handleBuyMeteor = () => {
        if (momentoLevel < 10) {
            setMeteorMsg(true);
            setTimeout(() => setMeteorMsg(false), 2000);
        } else {
            buy('☄️');
        }
    };

    // Warning Logic
    const sweetCount = (inv['🍭'] || 0) + (inv['🍦'] || 0) + (inv['🍧'] || 0);
    const meteorRatio = meteorCount > 0 ? sweetCount / meteorCount : 999;
    const showWarning = meteorCount >= 3 && meteorRatio < 15;

    return (
        <div className="space-y-2 relative">
            {showTutorial && <MeteorTutorialModal onClose={closeTutorial} />}

            {/* Meteor Specific Warning Section */}
            {isCometUnlocked && meteorCount > 0 && (
                <div className={`p-3 rounded-lg mb-4 border ${showWarning ? 'bg-red-900/30 border-red-500' : 'bg-blue-900/20 border-blue-500/30'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-200 text-sm">Gerenciar Meteoros</h4>
                        <div className="text-xs text-gray-400">
                            Possuídos: <span className="text-white font-bold">{meteorCount}</span>
                        </div>
                    </div>
                    
                    {showWarning && (
                        <div className="mb-2 text-xs text-red-300 bg-red-950/50 p-2 rounded">
                            <p className="font-bold">⚠️ DILUIÇÃO CRÍTICA!</p>
                            <p>Você tem muitos meteoros e poucos doces. Suas chances de ganhar estão baixas.</p>
                        </div>
                    )}

                    <button 
                        onClick={sellMeteor}
                        className="w-full bg-red-600/80 hover:bg-red-500 text-white text-xs font-bold py-2 rounded transition-colors flex items-center justify-center gap-2"
                    >
                        <span>🔥</span> Vender 1 Meteoro (Reembolso 50%)
                    </button>
                </div>
            )}

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
                                className={`${shopBtnClasses} ${isMeteorLocked ? 'bg-gray-600 text-gray-300 hover:bg-gray-600 cursor-not-allowed' : ''} ${isMeteor ? 'bg-purple-500 hover:bg-purple-400 text-white' : ''}`}
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
