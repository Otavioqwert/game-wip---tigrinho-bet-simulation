

import React from 'react';
import { ALL_FEVER_PACKAGES as FEVER_PACKAGES } from '../../constants/feverPackages';
import type { FeverPackage } from '../../types';

interface FeverShopProps {
    bal: number;
    purchasePackage: (pkg: FeverPackage) => void;
    onClose?: () => void;
}

const FeverShop: React.FC<FeverShopProps> = ({ bal, purchasePackage, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-pink-900 via-purple-900 to-red-900 overflow-hidden">
            
            {/* Header */}
            <div className="bg-black/60 backdrop-blur-md border-b-4 border-yellow-500 p-4 shadow-xl z-10 shrink-0 relative">
                {/* Botão de Fechar/Voltar */}
                {onClose && (
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-stone-900 font-bold py-2 px-4 rounded-lg shadow-lg active:scale-95 transition-all z-20"
                    >
                        🎰 IR PARA ROLETA
                    </button>
                )}

                <h1 className="text-3xl sm:text-4xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                    🍭 DOCES OU TRAVESSURAS 🎃
                </h1>
                <p className="text-center text-yellow-300 font-bold mt-1 text-sm sm:text-base">
                    LOJA ESPECIAL DE FEBRE DOCE ABERTA!
                </p>
                <div className="text-center mt-2 bg-black/40 inline-block px-6 py-2 rounded-full border border-green-500/50 mx-auto block w-max">
                    <span className="text-xl sm:text-2xl font-bold text-green-400">
                        Saldo: ${bal.toFixed(2)}
                    </span>
                </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-grow overflow-y-auto p-4 sm:p-6 pb-20">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
                    {FEVER_PACKAGES.map(pkg => (
                        <FeverPackageCard 
                            key={pkg.id}
                            pkg={pkg}
                            canAfford={bal >= pkg.cost}
                            onBuy={() => purchasePackage(pkg)}
                        />
                    ))}
                </div>
            </div>
            
            {/* Footer */}
            <div className="bg-black/80 backdrop-blur border-t border-white/10 p-3 text-center text-xs sm:text-sm text-gray-400 shrink-0">
                <p>⚠️ A loja normal retornará assim que a Febre Doce acabar.</p>
                <p className="text-yellow-500 font-bold mt-1">
                    💡 Dica: Aproveite para conseguir meteoros e multiplicadores raros!
                </p>
            </div>
        </div>
    );
};

const FeverPackageCard: React.FC<{ pkg: FeverPackage, canAfford: boolean, onBuy: () => void }> = ({ pkg, canAfford, onBuy }) => {
    
    const getTierStyle = () => {
        if (pkg.cost <= 1000) return 'from-blue-900/80 to-blue-950/80 border-blue-500';
        if (pkg.cost <= 5000) return 'from-purple-900/80 to-purple-950/80 border-purple-500';
        if (pkg.cost <= 15000) return 'from-orange-900/80 to-orange-950/80 border-orange-500';
        return 'from-red-900/80 to-red-950/80 border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)]';
    };
    
    // Type guards for content rendering
    const hasItems = typeof pkg.contents === 'object' && pkg.contents !== null && 'items' in pkg.contents && pkg.contents.items;
    const hasMultipliers = typeof pkg.contents === 'object' && pkg.contents !== null && 'multipliers' in pkg.contents && pkg.contents.multipliers;

    return (
        <div className={`bg-gradient-to-br ${getTierStyle()} border-2 rounded-xl p-4 relative flex flex-col h-full transform transition-all hover:scale-[1.02] shadow-lg`}>
            
            {/* Badge Premium */}
            {pkg.cost >= 10000 && (
                <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse shadow-md">
                    PREMIUM
                </div>
            )}
            
            {/* Header do Card */}
            <div className="text-center mb-3">
                <div className="text-5xl mb-2 filter drop-shadow-md">{pkg.icon}</div>
                <h3 className="text-xl font-bold text-white leading-tight">{pkg.name}</h3>
                <p className="text-xs text-gray-300 mt-1 italic">{pkg.description}</p>
            </div>
            
            {/* Conteúdo */}
            <div className="bg-black/40 rounded-lg p-3 mb-4 flex-grow border border-white/5">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-2 font-bold text-center">Contém:</p>
                
                {pkg.contents === 'RANDOM' ? (
                     <div className="text-center py-4">
                        <div className="text-yellow-400 font-bold animate-bounce">❓ ALEATÓRIO ❓</div>
                        <p className="text-xs text-gray-400 mt-1">Sorte ou Azar?</p>
                     </div>
                ) : (
                    <div className="space-y-2">
                        {/* Items List */}
                        {hasItems && typeof pkg.contents === 'object' && pkg.contents.items && (
                            <div className="flex flex-wrap justify-center gap-1.5">
                                {Object.entries(pkg.contents.items).map(([sym, qty]) => (
                                    <span key={sym} className="bg-gray-800 px-2 py-1 rounded text-xs border border-gray-600">
                                        {sym} <span className="text-green-400 font-bold">x{qty as number}</span>
                                    </span>
                                ))}
                            </div>
                        )}
                        
                        {/* Multipliers List */}
                        {hasMultipliers && typeof pkg.contents === 'object' && pkg.contents.multipliers && (
                            <div className="flex flex-wrap justify-center gap-1.5 pt-1 border-t border-white/10 mt-1">
                                {Object.entries(pkg.contents.multipliers).map(([sym, bonus]) => (
                                    <span key={sym} className="bg-purple-900/50 px-2 py-1 rounded text-xs border border-purple-500/30">
                                        {sym} <span className="text-purple-300 font-bold">+{bonus as number}x</span>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* Botão de Compra */}
            <div className="mt-auto">
                <div className="text-center mb-2">
                     <span className={`text-2xl font-black ${canAfford ? 'text-yellow-400' : 'text-red-400'}`}>
                        ${pkg.cost.toLocaleString()}
                    </span>
                </div>
                
                <button
                    onClick={onBuy}
                    disabled={!canAfford}
                    className={`w-full py-3 rounded-lg font-bold text-sm sm:text-base transition-all shadow-lg active:scale-95 ${
                        canAfford 
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white hover:brightness-110 hover:shadow-yellow-500/20'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-70'
                    }`}
                >
                    {canAfford ? '✨ COMPRAR' : '🔒 SALDO INSUFICIENTE'}
                </button>
            </div>
            
        </div>
    );
};

export default FeverShop;
