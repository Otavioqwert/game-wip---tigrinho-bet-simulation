
import React, { useState, useMemo, useEffect } from 'react';
import { calculatePoolDensity } from '../../utils/poolMetrics';
import { SYM } from '../../constants';
import type { Inventory, SymbolKey } from '../../types';
import PoolHealthIndicator from '../PoolHealthIndicator';

interface Props {
    inv: Inventory;
}

type Tab = 'stats' | 'calculator';
type CalcMode = 'chance' | 'required';

const ProbabilityWidget: React.FC<Props> = ({ inv }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('stats');
    const metrics = useMemo(() => calculatePoolDensity(inv), [inv]);

    // --- STATE DO CALCULADOR ---
    const [calcMode, setCalcMode] = useState<CalcMode>('chance');
    
    // Inputs Físicos
    const [selectedTarget, setSelectedTarget] = useState<SymbolKey>('🐯');
    const [targetItemCount, setTargetItemCount] = useState(9); 
    const [otherItemsCount, setOtherItemsCount] = useState(45); 
    const [spins, setSpins] = useState(125);
    
    // Inputs Financeiros
    const [betValue, setBetValue] = useState(250);
    const [powerLevel, setPowerLevel] = useState(550);
    const [baseSymbolValue, setBaseSymbolValue] = useState(16); // Valor base do Tigre

    // Inputs Reversos
    const [desiredChance, setDesiredChance] = useState(25); // %

    // Resultados
    const [resultChance, setResultChance] = useState(0);
    const [resultExpectedWins, setResultExpectedWins] = useState(0);
    const [resultMoney, setResultMoney] = useState(0);
    const [resultRequired, setResultRequired] = useState(0);

    // Symbols available for calculation (high value mostly)
    const CALC_SYMBOLS: SymbolKey[] = ['🐯', '☄️', '💎', '💵', '🍀', '🍦', '🍭', '🍧'];

    const handleTargetChange = (sym: SymbolKey) => {
        setSelectedTarget(sym);
        // Auto-update base value based on constant
        if (SYM[sym]) {
            setBaseSymbolValue(SYM[sym].v);
        }
    };

    const loadInventoryCount = () => {
        setTargetItemCount(inv[selectedTarget] || 0);
        
        // Calculate others: Total items - Target items
        let total = 0;
        (Object.keys(inv) as SymbolKey[]).forEach(k => total += inv[k] || 0);
        setOtherItemsCount(Math.max(0, total - (inv[selectedTarget] || 0)));
    };

    // Lógica de Cálculo
    useEffect(() => {
        if (calcMode === 'chance') {
            // Calcular Chance baseada nos itens
            const total = targetItemCount + otherItemsCount;
            if (total === 0) { setResultChance(0); setResultMoney(0); return; }

            const probSingleSlot = targetItemCount / total;
            const probLine = Math.pow(probSingleSlot, 3);
            const probWinSpin = Math.min(1, probLine * 8); // 8 linhas (aproximação)
            
            // Chance acumulada em N giros: 1 - (1 - p)^n
            const chanceSession = 1 - Math.pow(1 - probWinSpin, spins);
            setResultChance(chanceSession * 100);

            // Expectativa Matemática (Média de vitórias)
            const expectedWins = spins * probWinSpin;
            setResultExpectedWins(expectedWins);

            // Cálculo Financeiro
            // Multiplicador = (1 + Nivel * 0.25)
            // Valor Linha = Aposta * ValorBase * Multiplicador
            const multiplier = 1 + (powerLevel * 0.25);
            const winPerLine = betValue * baseSymbolValue * multiplier;
            const totalExpectedMoney = expectedWins * winPerLine;
            
            setResultMoney(totalExpectedMoney);

        } else {
            // Lógica Reversa (existente)
            const pSessionDecimal = desiredChance / 100;
            if (pSessionDecimal >= 1 || spins <= 0) { setResultRequired(0); return; }

            const pSpinNeeded = 1 - Math.pow(1 - pSessionDecimal, 1 / spins);
            const ratio = Math.pow(pSpinNeeded / 8, 1/3); // Raiz cubica
            
            if (ratio >= 1) {
                setResultRequired(9999); 
            } else {
                const needed = (ratio * otherItemsCount) / (1 - ratio);
                setResultRequired(needed);
            }
        }
    }, [calcMode, targetItemCount, otherItemsCount, spins, desiredChance, betValue, powerLevel, baseSymbolValue]);


    return (
        <>
            {/* Botão Quadrado (Toggle) */}
            <button
                onClick={() => setIsOpen(true)}
                className="absolute -right-12 top-4 w-10 h-10 bg-blue-900/80 hover:bg-blue-800 border-2 border-blue-500 rounded-lg shadow-lg flex items-center justify-center text-xl transition-all active:scale-95 z-20 group backdrop-blur-sm"
                title="Estatísticas e Simulador"
            >
                <span className="group-hover:scale-110 transition-transform filter drop-shadow-md">📊</span>
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsOpen(false)}>
                    <div 
                        className="bg-gradient-to-br from-slate-900 to-black border-4 border-blue-600 rounded-2xl max-w-md w-full p-6 shadow-[0_0_50px_rgba(37,99,235,0.3)] flex flex-col gap-4 relative animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]" 
                        onClick={e => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => setIsOpen(false)} 
                            className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold transition-colors z-10"
                        >
                            &times;
                        </button>

                        {/* Tabs */}
                        <div className="flex gap-2 border-b border-blue-900/50 pb-2 mb-2">
                            <button 
                                onClick={() => setActiveTab('stats')}
                                className={`px-4 py-2 rounded-t-lg font-bold transition-colors ${activeTab === 'stats' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                Inventário
                            </button>
                            <button 
                                onClick={() => setActiveTab('calculator')}
                                className={`px-4 py-2 rounded-t-lg font-bold transition-colors ${activeTab === 'calculator' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                Simulador ROI 💰
                            </button>
                        </div>

                        {activeTab === 'stats' ? (
                            <>
                                <PoolHealthIndicator metrics={metrics} />

                                <div className="bg-black/40 rounded-xl p-1 border border-white/10 flex-grow max-h-[40vh] overflow-hidden flex flex-col">
                                    <div className="grid grid-cols-3 px-3 py-2 text-[10px] uppercase font-bold text-gray-500 border-b border-white/5">
                                        <span>Símbolo</span>
                                        <span className="text-center">Qtd.</span>
                                        <span className="text-right">Chance Linha</span>
                                    </div>
                                    <div className="overflow-y-auto custom-scrollbar p-1 space-y-1">
                                        {Object.entries(metrics.symbolChances)
                                            .sort(([, a], [, b]) => (b as number) - (a as number))
                                            .map(([symbol, chance]) => {
                                                const percent = ((chance as number) * 100);
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
                            </>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex bg-gray-800 rounded p-1">
                                    <button onClick={() => setCalcMode('chance')} className={`flex-1 py-1 rounded text-xs font-bold ${calcMode === 'chance' ? 'bg-blue-500 text-white' : 'text-gray-400'}`}>Calculadora de Ganhos</button>
                                    <button onClick={() => setCalcMode('required')} className={`flex-1 py-1 rounded text-xs font-bold ${calcMode === 'required' ? 'bg-blue-500 text-white' : 'text-gray-400'}`}>Calculadora Reversa</button>
                                </div>

                                <div className="bg-black/20 p-4 rounded-xl space-y-3 border border-white/5">
                                    {calcMode === 'chance' ? (
                                        <>
                                            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-white/10">
                                                <div className="col-span-2">
                                                    <label className="text-[10px] uppercase text-gray-400 font-bold block mb-1">Selecione Símbolo Alvo</label>
                                                    <div className="flex gap-2">
                                                        <select 
                                                            value={selectedTarget} 
                                                            onChange={(e) => handleTargetChange(e.target.value as SymbolKey)}
                                                            className="flex-grow bg-gray-700 rounded p-2 text-white font-bold"
                                                        >
                                                            {CALC_SYMBOLS.map(s => (
                                                                <option key={s} value={s}>{s} (Base: {SYM[s]?.v})</option>
                                                            ))}
                                                        </select>
                                                        <button 
                                                            onClick={loadInventoryCount}
                                                            className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-2 rounded"
                                                            title="Carregar quantidade do seu inventário atual"
                                                        >
                                                            Usar Qtd. do Inv.
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-[10px] uppercase text-gray-400 font-bold block mb-1">Qtd. Alvo ({selectedTarget})</label>
                                                    <input type="number" value={targetItemCount} onChange={e => setTargetItemCount(Number(e.target.value))} className="w-full bg-gray-700 rounded p-2 text-center text-white font-bold" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] uppercase text-gray-400 font-bold block mb-1">Outros Itens</label>
                                                    <input type="number" value={otherItemsCount} onChange={e => setOtherItemsCount(Number(e.target.value))} className="w-full bg-gray-700 rounded p-2 text-center text-white font-bold" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] uppercase text-gray-400 font-bold block mb-1">Giros</label>
                                                    <input type="number" value={spins} onChange={e => setSpins(Number(e.target.value))} className="w-full bg-gray-700 rounded p-2 text-center text-white font-bold" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] uppercase text-gray-400 font-bold block mb-1">Aposta ($)</label>
                                                    <input type="number" value={betValue} onChange={e => setBetValue(Number(e.target.value))} className="w-full bg-gray-700 rounded p-2 text-center text-green-400 font-bold" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] uppercase text-gray-400 font-bold block mb-1">Nível de Poder</label>
                                                    <input type="number" value={powerLevel} onChange={e => setPowerLevel(Number(e.target.value))} className="w-full bg-gray-700 rounded p-2 text-center text-purple-400 font-bold" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] uppercase text-gray-400 font-bold block mb-1">Valor Base Item</label>
                                                    <input type="number" value={baseSymbolValue} onChange={e => setBaseSymbolValue(Number(e.target.value))} className="w-full bg-gray-700 rounded p-2 text-center text-gray-300 font-bold" />
                                                </div>
                                            </div>
                                            
                                            <div className="pt-2 text-center space-y-2">
                                                <div className="flex justify-between text-xs text-gray-400">
                                                    <span>Chance de Ganhar (Mín 1x)</span>
                                                    <span className="text-white">{resultChance.toFixed(2)}%</span>
                                                </div>
                                                <div className="flex justify-between text-xs text-gray-400">
                                                    <span>Vitórias Esperadas</span>
                                                    <span className="text-white">{resultExpectedWins.toFixed(2)} vezes</span>
                                                </div>
                                                
                                                <div className="bg-green-900/30 p-3 rounded-lg border border-green-500/30 mt-2">
                                                    <p className="text-xs text-green-300 uppercase tracking-widest font-bold">Retorno Esperado</p>
                                                    <p className="text-3xl font-black text-green-400 drop-shadow-lg">
                                                        ${resultMoney.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                    </p>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-center">
                                                <label className="text-sm text-gray-300">Chance Desejada (%)</label>
                                                <input type="number" value={desiredChance} onChange={e => setDesiredChance(Number(e.target.value))} className="w-20 bg-gray-700 rounded p-1 text-center text-white font-bold" />
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <label className="text-sm text-gray-300">Em quantos Giros?</label>
                                                <input type="number" value={spins} onChange={e => setSpins(Number(e.target.value))} className="w-20 bg-gray-700 rounded p-1 text-center text-white font-bold" />
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <label className="text-sm text-gray-300">Tenho de Lixo (Outros)</label>
                                                <input type="number" value={otherItemsCount} onChange={e => setOtherItemsCount(Number(e.target.value))} className="w-20 bg-gray-700 rounded p-1 text-center text-white font-bold" />
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-white/10 text-center">
                                                <p className="text-xs text-gray-400 uppercase">Você precisa de</p>
                                                <p className="text-3xl font-black text-yellow-400">{Math.ceil(resultRequired)} Alvos</p>
                                                <p className="text-[10px] text-gray-500">(Total de {otherItemsCount + Math.ceil(resultRequired)} itens)</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={() => setIsOpen(false)}
                            className="w-full py-3 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 mt-auto"
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
