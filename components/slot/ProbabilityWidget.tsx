
import React, { useState, useMemo } from 'react';
import { calculatePoolDensity } from '../../utils/poolMetrics';
import type { Inventory, SymbolKey } from '../../types';
import PoolHealthIndicator from '../PoolHealthIndicator';

interface Props {
    inv: Inventory;
}

const ProbabilityWidget: React.FC<Props> = ({ inv }) => {
    const [isOpen, setIsOpen] = useState(false);
    const metrics = useMemo(() => calculatePoolDensity(inv), [inv]);

    return (
        <>
            {/* Botão Quadrado (Toggle) */}
            <button
                onClick={() => setIsOpen(true)}
                className="absolute -right-12 top-4 w-10 h-10 bg-blue-900/80 hover:bg-blue-800 border-2 border-blue-500 rounded-lg shadow-lg flex items-center justify-center text-xl transition-all active:scale-95 z-20 group backdrop-blur-sm"
                title="Ver Probabilidades"
            >
                <span className="group-hover:scale-110 transition-transform filter drop-shadow-md">📊</span>
            </button>

            {/* Modal de Estatísticas */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsOpen(false)}>
                    <div 
                        className="bg-gradient-to-br from-slate-900 to-black border-4 border-blue-600 rounded-2xl max-w-md w-full p-6 shadow-[0_0_50px_rgba(37,99,235,0.3)] flex flex-col gap-4 relative animate-in zoom-in-95 duration-200" 
                        onClick={e => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => setIsOpen(false)} 
                            className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold transition-colors"
                        >
                            &times;
                        </button>

                        <div className="border-b border-blue-900/50 pb-2">
                            <h2 className="text-2xl font-black text-blue-400 uppercase tracking-wide">
                                Probabilidades
                            </h2>
                            <p className="text-xs text-blue-200">Análise estatística do seu inventário</p>
                        </div>

                        {/* Reutiliza o indicador de saúde visual */}
                        <PoolHealthIndicator metrics={metrics} />

                        {/* Lista Detalhada */}
                        <div className="bg-black/40 rounded-xl p-1 border border-white/10 flex-grow max-h-[40vh] overflow-hidden flex flex-col">
                            <div className="grid grid-cols-3 px-3 py-2 text-[10px] uppercase font-bold text-gray-500 border-b border-white/5">
                                <span>Símbolo</span>
                                <span className="text-center">Qtd.</span>
                                <span className="text-right">Chance Linha</span>
                            </div>
                            <div className="overflow-y-auto custom-scrollbar p-1 space-y-1">
                                {Object.entries(metrics.symbolChances)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([symbol, chance]) => {
                                        const percent = (chance * 100);
                                        const count = inv[symbol as SymbolKey] || 0;
                                        return (
                                            <div key={symbol} className="grid grid-cols-3 items-center bg-white/5 p-2 rounded hover:bg-white/10 transition-colors">
                                                <div className="text-2xl leading-none filter drop-shadow-sm">{symbol}</div>
                                                <div className="text-center font-mono text-gray-300">{count}</div>
                                                <div className="text-right">
                                                    <span className={`font-mono font-bold ${symbol === '☄️' ? 'text-red-400' : 'text-blue-300'}`}>
                                                        {percent < 0.01 ? '<0.01' : percent.toFixed(2)}%
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                })}
                                {Object.keys(metrics.symbolChances).length === 0 && (
                                    <div className="text-center text-gray-500 py-4 italic">Nenhum item no inventário</div>
                                )}
                            </div>
                        </div>

                        <p className="text-[10px] text-gray-500 text-center italic px-4">
                            *A chance representa a probabilidade matemática aproximada de formar uma linha de 3 símbolos iguais em um único giro.
                        </p>

                        <button 
                            onClick={() => setIsOpen(false)}
                            className="w-full py-3 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
                        >
                            FECHAR
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProbabilityWidget;
