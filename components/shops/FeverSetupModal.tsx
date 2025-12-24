import React, { useState } from 'react';
import type { FeverPackage, PurchasedPackage, FeverTier, FeverType, FeverRollOption, FeverContentResult } from '../../types';
import { ALL_FEVER_PACKAGES } from '../../constants/feverPackages';

interface FeverSetupModalProps {
    bal: number;
    selectedPackages: PurchasedPackage[];
    buyPackage: (pkg: FeverPackage) => void;
    startFever: () => void;
    startParaisoFever: () => void; // NEW: Special Paraiso starter
    onClose: () => void;
    momentoLevel: number;
}

const FeverSetupModal: React.FC<FeverSetupModalProps> = ({ bal, selectedPackages, buyPackage, startFever, startParaisoFever, onClose, momentoLevel }) => {
    const [activeTier, setActiveTier] = useState<FeverTier>('budget');
    const [activeType, setActiveType] = useState<FeverType | 'all'>('all');
    const [inspectedPackage, setInspectedPackage] = useState<FeverPackage | null>(null);

    // Paraiso Doce costs 3 package slots = $30k
    const PARAISO_COST = 30000;
    const canAffordParaiso = bal >= PARAISO_COST;

    const filteredPackages = ALL_FEVER_PACKAGES.filter(p => 
        p.tier === activeTier && (activeType === 'all' || p.type === activeType) && p.id !== 'pkg_paraiso_doce' // REMOVE from normal packages
    );

    const getTierColor = (tier: FeverTier) => {
        switch(tier) {
            case 'budget': return 'text-blue-400 border-blue-500';
            case 'mid': return 'text-purple-400 border-purple-500';
            case 'premium': return 'text-orange-400 border-orange-500';
            case 'luxury': return 'text-yellow-400 border-yellow-500';
            default: return 'text-white border-gray-500';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-start overflow-hidden">
            {/* Header */}
            <div className="w-full bg-gradient-to-b from-purple-900 to-black p-4 border-b-4 border-pink-500 flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-yellow-500">
                        🍬 FEBRE DOCE: SETUP
                    </h1>
                    <p className="text-gray-300 text-sm">Monte seu arsenal para os 25 Giros Grátis!</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-green-400">${bal.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">Saldo Atual</p>
                </div>
            </div>

            {/* PARAISO DOCE SPECIAL BUTTON - PROMINENT PLACEMENT */}
            <div className="w-full max-w-6xl p-4 shrink-0">
                <div className="relative bg-gradient-to-br from-cyan-900 via-pink-900 to-yellow-900 border-4 border-rainbow rounded-xl p-6 shadow-2xl">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 via-pink-500 to-yellow-500 text-black px-6 py-1 rounded-full font-black text-sm">
                        ✨ MODO ESPECIAL ✨
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="text-6xl">🍭</div>
                        <div className="flex-grow">
                            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-pink-300 to-yellow-300 mb-2">
                                PARAÍSO DOCE
                            </h2>
                            <p className="text-white text-sm mb-1">Inicia uma febre especial com inventário próprio e minijogo exclusivo!</p>
                            <p className="text-cyan-300 font-bold text-xs">• 25 Giros Grátis com Aposta $10</p>
                            <p className="text-pink-300 font-bold text-xs">• Inventário Separado (10x 🍭 🍦 🍧, 5x 🍀 💵)</p>
                            <p className="text-yellow-300 font-bold text-xs">• Multiplicadores Próprios (20x em cada símbolo)</p>
                        </div>
                        <div className="text-right">
                            <p className="text-4xl font-black text-yellow-300 mb-2">${PARAISO_COST.toLocaleString()}</p>
                            <button
                                onClick={startParaisoFever}
                                disabled={!canAffordParaiso}
                                className={`px-8 py-4 rounded-xl font-black text-xl shadow-lg transition-all ${
                                    canAffordParaiso
                                        ? 'bg-gradient-to-r from-cyan-500 via-pink-500 to-yellow-500 hover:scale-105 text-black animate-pulse'
                                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                🍭 INICIAR AGORA
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="w-full max-w-6xl px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex-grow h-px bg-gray-700"></div>
                    <span className="text-gray-500 font-bold text-sm">OU MONTE SUA PRÓPRIA FEBRE (Máx 3 Pacotes)</span>
                    <div className="flex-grow h-px bg-gray-700"></div>
                </div>
            </div>

            {/* Selection Bar */}
            <div className="w-full bg-gray-900 p-2 border-b border-gray-700 flex justify-center gap-4 shrink-0">
                {selectedPackages.length === 0 ? (
                    <span className="text-gray-500 italic py-2">Nenhum pacote selecionado</span>
                ) : (
                    selectedPackages.map((p, i) => (
                        <div key={i} className="bg-gray-800 border border-gray-600 rounded px-3 py-1 flex items-center gap-2">
                             <span className="text-lg">{p.type === 'bet' ? '🎲' : '📦'}</span>
                             <div className="flex flex-col leading-none">
                                <span className="text-xs font-bold text-white">{p.name}</span>
                                <span className="text-[10px] text-green-400">{p.resultDescription}</span>
                             </div>
                        </div>
                    ))
                )}
            </div>

            {/* Filters */}
            <div className="w-full p-2 flex flex-col sm:flex-row gap-2 justify-center shrink-0">
                <div className="flex bg-gray-800 rounded p-1">
                    {(['budget', 'mid', 'premium', 'luxury'] as FeverTier[]).map(t => (
                        <button
                            key={t}
                            onClick={() => setActiveTier(t)}
                            className={`px-4 py-1 rounded capitalize font-bold text-sm ${activeTier === t ? 'bg-pink-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
                <div className="flex bg-gray-800 rounded p-1">
                    <button onClick={() => setActiveType('all')} className={`px-3 py-1 rounded font-bold text-sm ${activeType === 'all' ? 'bg-blue-600' : 'text-gray-400'}`}>Todos</button>
                    <button onClick={() => setActiveType('item')} className={`px-3 py-1 rounded font-bold text-sm ${activeType === 'item' ? 'bg-blue-600' : 'text-gray-400'}`}>Itens</button>
                    <button onClick={() => setActiveType('bet')} className={`px-3 py-1 rounded font-bold text-sm ${activeType === 'bet' ? 'bg-blue-600' : 'text-gray-400'}`}>Apostas</button>
                </div>
            </div>

            {/* Package Grid */}
            <div className="flex-grow overflow-y-auto w-full max-w-6xl p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredPackages.map(pkg => {
                    const isPurchased = selectedPackages.some(p => p.id === pkg.id);
                    const canAfford = bal >= pkg.cost;
                    const isFull = selectedPackages.length >= 3;
                    const isRisk = pkg.risk === 'risk';
                    
                    // Meteor Lock Logic
                    let hasMeteor = false;
                    if (typeof pkg.contents === 'object' && pkg.contents !== null && 'items' in pkg.contents) {
                        if ((pkg.contents as FeverContentResult).items['☄️']) hasMeteor = true;
                    }
                    
                    const isLocked = hasMeteor && momentoLevel < 10;

                    return (
                        <div key={pkg.id} className={`relative bg-gray-800 border-2 rounded-xl p-4 flex flex-col ${getTierColor(pkg.tier)} ${isPurchased ? 'opacity-50 ring-2 ring-green-500' : ''} ${isLocked ? 'opacity-60 grayscale' : ''}`}>
                            {isRisk && <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 rounded">RISK</div>}
                            
                            <div className="flex items-center gap-3 mb-2">
                                <div className="text-3xl">{pkg.type === 'bet' ? '🎰' : '📦'}</div>
                                <div className="flex-grow">
                                    <h3 className="font-bold leading-tight">{pkg.name}</h3>
                                    <p className="text-xs text-gray-400 line-clamp-2">{pkg.description}</p>
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setInspectedPackage(pkg); }}
                                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full text-white transition-colors"
                                    title="Ver Conteúdo"
                                >
                                    🔍
                                </button>
                            </div>

                            <div className="mt-auto pt-3 border-t border-gray-700">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xl font-bold text-white">${pkg.cost.toLocaleString()}</span>
                                    {pkg.expected_roi && (
                                        <span className={`text-xs font-bold ${pkg.expected_roi > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            ROI {pkg.expected_roi > 0 ? '+' : ''}{pkg.expected_roi}%
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => buyPackage(pkg)}
                                    disabled={isPurchased || !canAfford || isFull || isLocked}
                                    className={`w-full py-2 rounded font-bold ${
                                        isLocked ? 'bg-red-900/50 text-red-400 border border-red-500 cursor-not-allowed' :
                                        isPurchased ? 'bg-green-700 text-white cursor-default' :
                                        !canAfford ? 'bg-gray-700 text-gray-500' :
                                        isFull ? 'bg-gray-600 text-gray-400' :
                                        'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white'
                                    }`}
                                >
                                    {isLocked ? 'BLOQUEADO (NÍVEL 10)' : isPurchased ? 'COMPRADO' : isFull ? 'MAX 3' : 'COMPRAR'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer Action */}
            <div className="w-full bg-black border-t border-gray-800 p-4 flex justify-between items-center shrink-0">
                <button onClick={onClose} className="px-6 py-3 text-gray-400 hover:text-white font-bold">Cancelar / Voltar</button>
                <button 
                    onClick={startFever}
                    className="px-8 py-3 bg-green-500 hover:bg-green-400 text-black font-black text-xl rounded-lg shadow-lg shadow-green-500/30 animate-pulse"
                >
                    🔥 INICIAR FEBRE ({selectedPackages.length}/3)
                </button>
            </div>

            {/* INSPECTOR MODAL (Minecraft Style Tooltip) */}
            {inspectedPackage && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setInspectedPackage(null)}>
                    <div className="bg-[#100b16] border-4 border-purple-600 p-4 rounded-lg shadow-2xl max-w-sm w-full text-white relative font-sans" onClick={e => e.stopPropagation()}>
                        <button className="absolute top-2 right-2 text-gray-400 hover:text-white" onClick={() => setInspectedPackage(null)}>✕</button>
                        
                        <div className="mb-4 border-b border-purple-800 pb-2">
                            <h3 className="text-xl font-bold text-purple-300">{inspectedPackage.name}</h3>
                            <p className="text-gray-400 text-xs italic">{inspectedPackage.description}</p>
                        </div>

                        <div className="space-y-2 text-sm">
                            {/* RISK PACKAGES (ROLLS) */}
                            {inspectedPackage.rolls ? (
                                <div>
                                    <p className="text-yellow-500 font-bold mb-2 uppercase text-xs tracking-wider">Probabilidades:</p>
                                    <ul className="space-y-1">
                                        {Object.entries(inspectedPackage.rolls).map(([key, data]) => {
                                            const roll = data as FeverRollOption;
                                            let displayContent = "";
                                            if (roll.spins) {
                                                displayContent = `${roll.spins} Giros`;
                                            } else if (roll.contents) {
                                                // Format contents for display
                                                const items = roll.contents.items ? Object.entries(roll.contents.items).map(([k,v]) => `${v}x ${k}`).join(', ') : '';
                                                const mults = roll.contents.multipliers ? Object.entries(roll.contents.multipliers).map(([k,v]) => `${v}x ${k}`).join(', ') : '';
                                                displayContent = [items, mults].filter(Boolean).join(' + ');
                                            } else {
                                                displayContent = `$${(roll.value || 0).toLocaleString()}`;
                                            }
                                            
                                            return (
                                                <li key={key} className="flex justify-between items-center bg-white/5 p-1.5 rounded">
                                                    <span className="text-gray-300">{(roll.chance * 100).toFixed(0)}% Chance</span>
                                                    <span className="font-bold text-green-400 truncate max-w-[60%] text-right">
                                                        {displayContent}
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ) : (
                                /* SAFE PACKAGES (CONTENTS) */
                                <div>
                                    <p className="text-blue-400 font-bold mb-2 uppercase text-xs tracking-wider">Conteúdo Garantido:</p>
                                    
                                    {inspectedPackage.type === 'bet' && inspectedPackage.spins && (
                                         <div className="flex justify-between items-center bg-white/5 p-1.5 rounded mb-2">
                                            <span className="text-gray-300">Giros Totais</span>
                                            <span className="font-bold text-yellow-400">{inspectedPackage.spins}</span>
                                        </div>
                                    )}

                                    {typeof inspectedPackage.contents === 'object' && inspectedPackage.contents !== null && 'items' in inspectedPackage.contents && (
                                        <div className="space-y-1">
                                            {inspectedPackage.contents.items && Object.entries(inspectedPackage.contents.items).map(([item, qty]) => (
                                                <div key={item} className="flex justify-between items-center bg-white/5 p-1.5 rounded">
                                                    <span className="text-gray-300">Item: {item}</span>
                                                    <span className="font-bold text-white">x{qty as number}</span>
                                                </div>
                                            ))}
                                            {inspectedPackage.contents.multipliers && Object.entries(inspectedPackage.contents.multipliers).map(([item, mult]) => (
                                                <div key={item} className="flex justify-between items-center bg-white/5 p-1.5 rounded">
                                                    <span className="text-gray-300">Mult: {item}</span>
                                                    <span className="font-bold text-purple-400">+{mult as number}x</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        <div className="mt-4 pt-2 border-t border-purple-800 text-center">
                            <span className="text-gray-500 text-xs">Custo: ${inspectedPackage.cost.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeverSetupModal;