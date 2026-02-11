import React from 'react';
import type { FeverReport } from '../../types';

interface FeverReportModalProps {
    report: FeverReport;
    onClose: () => void;
}

const FeverReportModal: React.FC<FeverReportModalProps> = ({ report, onClose }) => {
    const profit = report.endBalance - report.startBalance;
    const isProfit = profit >= 0;
    
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
            <div className={`
                relative bg-gradient-to-b from-gray-900 to-black 
                border-4 ${isProfit ? 'border-green-500' : 'border-red-500'} 
                rounded-3xl p-6 max-w-md w-full shadow-[0_0_60px_rgba(0,0,0,0.8)]
                flex flex-col items-center text-center animate-in zoom-in duration-300
            `}>
                {/* Glow Effect based on result */}
                <div className={`absolute inset-0 rounded-3xl opacity-20 pointer-events-none ${isProfit ? 'bg-green-500 blur-2xl' : 'bg-red-600 blur-2xl'}`}></div>

                <div className="z-10 w-full">
                    <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-1">
                        RELATÓRIO DA FEBRE
                    </h2>
                    <p className="text-gray-400 text-sm mb-6">Sessão Finalizada</p>

                    {/* 🍬 NOVO: Anúncio da mudança de moeda */}
                    <div className="bg-gradient-to-r from-pink-600/30 to-purple-600/30 border-2 border-pink-500 rounded-xl p-3 mb-4">
                        <p className="text-pink-300 font-bold text-sm">🍬 NOVA MOEDA: DOCES!</p>
                        <p className="text-gray-300 text-xs mt-1">
                            A Febre Doce agora usa <span className="text-pink-400 font-bold">Doces (🍬)</span> como moeda! 
                            <br />
                            <span className="text-yellow-400">100$ = 1 🍬</span>
                        </p>
                        <p className="text-gray-400 text-[10px] mt-1 italic">
                            Mais previsível, mais justo, mais doce! 🍭
                        </p>
                    </div>

                    {/* Main Result */}
                    <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
                        <p className="text-xs uppercase text-gray-400 font-bold mb-2">Resultado Líquido</p>
                        <div className={`text-5xl font-black mb-2 ${isProfit ? 'text-green-400' : 'text-red-500'}`}>
                            {isProfit ? '+' : ''}${profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p className="text-sm font-bold">
                            {isProfit ? '🎉 STONKS! LUCRO CONFIRMADO!' : '📉 PREJUÍZO! A BANCA VENCEU.'}
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                            <p className="text-gray-500 text-xs">Saldo Inicial</p>
                            <p className="text-white font-bold">${report.startBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                            <p className="text-gray-500 text-xs">Saldo Final</p>
                            <p className="text-white font-bold">${report.endBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                            <p className="text-gray-500 text-xs">Giros Totais</p>
                            <p className="text-yellow-400 font-bold">{report.totalSpins}</p>
                        </div>
                        <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                            <p className="text-gray-500 text-xs">Pacotes</p>
                            <p className="text-pink-400 font-bold">{report.packagesUsed.length}</p>
                        </div>
                    </div>

                    {/* Close Button */}
                    <button 
                        onClick={onClose}
                        className={`
                            w-full py-4 rounded-xl font-bold text-xl uppercase tracking-wider transition-all
                            shadow-lg active:scale-95
                            ${isProfit 
                                ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white hover:brightness-110' 
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}
                        `}
                    >
                        {isProfit ? '💰 EMBOLSAR LUCRO' : 'ACEITAR DERROTA'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FeverReportModal;
