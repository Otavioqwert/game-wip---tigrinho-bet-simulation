
import React, { useState } from 'react';
import { SYM, MID_SELL } from '../../constants';
import type { SymbolKey, MidSymbolKey, Inventory, SecondarySkillId } from '../../types';
import { useMeteorTutorial } from '../../hooks/useMeteorTutorial';
import MeteorTutorialModal from './MeteorTutorialModal';

interface SymbolShopProps {
    bal: number;
    buy: (k: SymbolKey) => void;
    buyWithSugar: (k: SymbolKey) => void; // New prop
    getPrice: (k: SymbolKey) => number;
    isCometUnlocked: boolean;
    isTokenUnlocked: boolean;
    momentoLevel: number;
    inv: Inventory;
    sellMeteor: () => void;
    flipTokens: (amount: number) => void;
    getSecondarySkillLevel: (id: SecondarySkillId) => number; // New prop for checking Hipoteca
    mortgageUsages: number;
    sugar: number;
}

const SymbolShop: React.FC<SymbolShopProps> = ({ 
    bal, buy, buyWithSugar, getPrice, isCometUnlocked, isTokenUnlocked, 
    momentoLevel, inv, sellMeteor, flipTokens, getSecondarySkillLevel, mortgageUsages, sugar 
}) => {
    const shopBtnClasses = "py-1.5 px-3 font-semibold text-stone-900 bg-yellow-400 rounded-md transition-all hover:bg-yellow-300 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-400";
    const mortgageBtnClasses = "py-1.5 px-3 font-bold text-white bg-gradient-to-r from-orange-500 to-red-600 rounded-md transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-md";
    
    const [meteorMsg, setMeteorMsg] = useState(false);
    
    const hasMortgage = getSecondarySkillLevel('mortgage') > 0;
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

    const sweetCount = (inv['🍭'] || 0) + (inv['🍦'] || 0) + (inv['🍧'] || 0);
    const meteorRatio = meteorCount > 0 ? sweetCount / meteorCount : 999;
    const showWarning = meteorCount >= 3 && meteorRatio < 15;

    const tokenCount = inv['🪙'] || 0;
    const tokenPrice = getPrice('🪙');

    // Mapeamento de custos em açúcar
    const sugarCosts: Partial<Record<SymbolKey, number>> = { '🍀': 1, '💵': 2, '💎': 4, '🐯': 8 };
    // Taxa de penalidade atual: 100 + usos * 50
    const currentPenaltyRate = 100 + (mortgageUsages * 50);

    return (
        <div className="space-y-2 relative">
            {showTutorial && <MeteorTutorialModal onClose={closeTutorial} />}

            {hasMortgage && (
                <div className="bg-orange-500/10 border border-orange-500/30 p-2 rounded-lg text-center text-xs text-orange-200 mb-2">
                    🏠 <strong>HIPOTECA:</strong> Taxa p/ 🍬: <strong>${currentPenaltyRate}</strong> (+ $50/uso)
                </div>
            )}

            {isCometUnlocked && meteorCount > 0 && (
                <div className={`p-3 rounded-lg mb-4 border ${showWarning ? 'bg-red-900/30 border-red-500' : 'bg-blue-900/20 border-blue-500/30'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-200 text-sm">Gerenciar Meteoros</h4>
                        <div className="text-xs text-gray-400">Possuídos: <span className="text-white font-bold">{meteorCount}</span></div>
                    </div>
                    {showWarning && (
                        <div className="mb-2 text-xs text-red-300 bg-red-950/50 p-2 rounded">
                            <p className="font-bold">⚠️ DILUIÇÃO CRÍTICA!</p>
                            <p>Mantenha a proporção de doces elevada para não zerar suas chances.</p>
                        </div>
                    )}
                    <button onClick={sellMeteor} className="w-full bg-red-600/80 hover:bg-red-500 text-white text-xs font-bold py-2 rounded transition-colors flex items-center justify-center gap-2">
                        <span>🔥</span> Vender 1 Meteoro (Reembolso 50%)
                    </button>
                </div>
            )}

            {(Object.keys(SYM) as SymbolKey[]).filter(k => {
                if (k === '☄️' && !isCometUnlocked) return false;
                if (k === '🪙' && !isTokenUnlocked) return false;
                return SYM[k].p > 0 || MID_SELL[k as MidSymbolKey]
            }).map(k => {
                const pr = getPrice(k);
                const isMeteor = k === '☄️';
                const isToken = k === '🪙';
                const isMortgageable = sugarCosts[k] !== undefined;
                const isMeteorLocked = isMeteor && momentoLevel < 10;
                
                return (
                    <React.Fragment key={k}>
                    <div className={`flex justify-between items-center bg-yellow-500/10 p-2 rounded-md ${isMeteorLocked ? 'opacity-70' : ''} relative`}>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">{k}</span> 
                            <span className="font-bold">$ {pr.toFixed(2)}</span>
                            {isMeteorLocked && <span className="text-[10px] text-red-400 bg-red-900/40 px-1 rounded">🔒 NÍVEL 10</span>}
                        </div>
                        
                        <div className="flex gap-2 relative">
                            {hasMortgage && isMortgageable && (
                                <button 
                                    onClick={() => buyWithSugar(k)}
                                    disabled={sugar < sugarCosts[k]!}
                                    className={mortgageBtnClasses}
                                    title={`Custo: ${sugarCosts[k]} 🍬 e penalidade de $${(sugarCosts[k]! * currentPenaltyRate).toFixed(0)}`}
                                >
                                    {sugarCosts[k]} 🍬
                                </button>
                            )}

                            <button 
                                onClick={isMeteor ? handleBuyMeteor : () => buy(k)} 
                                disabled={!isMeteorLocked && bal < pr} 
                                className={`${shopBtnClasses} ${isMeteorLocked ? 'bg-gray-600 text-gray-300' : ''} ${isMeteor ? 'bg-purple-500 hover:bg-purple-400 text-white' : ''}`}
                            >
                                {isMeteorLocked ? 'Bloqueado' : 'Comprar'}
                            </button>

                             {isMeteor && meteorMsg && (
                                <div className="absolute bottom-full mb-2 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded shadow-lg animate-bounce z-10 whitespace-nowrap border border-blue-400">
                                    Precisa Momento Nível 10!
                                    <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-blue-600"></div>
                                </div>
                            )}
                        </div>
                    </div>
                    {isToken && tokenCount > 0 && (
                        <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 p-2 rounded-lg border border-red-500/30 mb-2">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-red-200 font-bold uppercase tracking-wider">Fundo de Emergência</span>
                                <span className="text-xs text-gray-300">Resgate (Se der Cara): <span className="text-green-400 font-bold">${tokenPrice.toFixed(2)}</span></span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => flipTokens(1)} className="bg-red-700 hover:bg-red-600 text-white text-xs font-bold py-1.5 rounded active:scale-95">Lançar 1</button>
                                <button onClick={() => flipTokens(Math.min(10, tokenCount))} className="bg-red-700 hover:bg-red-600 text-white text-xs font-bold py-1.5 rounded disabled:opacity-50" disabled={tokenCount < 2}>Lançar 10</button>
                                <button onClick={() => flipTokens(tokenCount)} className="bg-orange-700 hover:bg-orange-600 text-white text-xs font-bold py-1.5 rounded disabled:opacity-50" disabled={tokenCount < 2}>Lançar Tudo ({tokenCount})</button>
                            </div>
                        </div>
                    )}
                    </React.Fragment>
                )
            })}
        </div>
    );
};

export default SymbolShop;
