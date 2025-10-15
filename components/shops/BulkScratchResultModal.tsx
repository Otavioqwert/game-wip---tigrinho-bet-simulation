
import React from 'react';

interface BulkScratchResultModalProps {
    result: { count: number, cost: number, winnings: number };
    onClose: () => void;
}

const BulkScratchResultModal: React.FC<BulkScratchResultModalProps> = ({ result, onClose }) => {
    const netResult = result.winnings - result.cost;
    const isProfit = netResult >= 0;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-gray-800 to-black rounded-2xl p-6 shadow-2xl border-4 border-sky-500 w-full max-w-sm text-white text-center">
                <h2 className="text-3xl font-bold text-sky-300 neon-glow-text mb-4">Resultado da Compra</h2>
                <p className="text-lg mb-4">Você comprou <span className="font-bold text-white">{result.count}</span> raspadinhas.</p>

                <div className="space-y-3 bg-black/30 rounded-lg p-4 mb-6">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Custo Total:</span>
                        <span className="font-bold text-red-400">${result.cost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Ganhos Totais:</span>
                        <span className="font-bold text-green-400">${result.winnings.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between text-xl pt-2 border-t border-sky-500/30">
                        <span className="text-gray-300">Resultado:</span>
                        <span className={`font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                           {isProfit ? '+' : ''}${netResult.toFixed(2)}
                        </span>
                    </div>
                </div>

                <button onClick={onClose} className="w-full py-3 px-4 font-bold text-stone-900 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors">
                    OK
                </button>
            </div>
        </div>
    );
};

export default BulkScratchResultModal;