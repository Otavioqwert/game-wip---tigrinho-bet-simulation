
import React from 'react';

interface Props {
    onClose: () => void;
}

const MeteorTutorialModal: React.FC<Props> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-slate-900 to-black border-2 border-red-500 rounded-2xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(239,68,68,0.3)] animate-in fade-in zoom-in duration-300">
                <div className="text-center mb-6">
                    <span className="text-5xl mb-2 block">☄️</span>
                    <h2 className="text-2xl font-black text-red-500 uppercase tracking-wider">
                        Cuidado com o Meteoro!
                    </h2>
                </div>
                
                <div className="space-y-4 text-gray-300 text-sm mb-8 leading-relaxed">
                    <p className="font-bold text-white text-base">
                        Você acabou de comprar um item super raro, mas ele tem um custo oculto:
                    </p>
                    
                    <ul className="space-y-2 bg-red-900/20 p-4 rounded-lg border border-red-500/30">
                        <li className="flex items-start gap-2">
                            <span>📉</span>
                            <span><strong>Diluição:</strong> Quanto mais itens diferentes você tem, MENOR a chance de fazer uma linha de 3 iguais.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span>🚫</span>
                            <span><strong>Bloqueio:</strong> Se comprar muitos meteoros sem ter doces suficientes, você vai parar de ganhar prêmios!</span>
                        </li>
                    </ul>

                    <p className="text-center text-yellow-400 font-bold">
                        Dica de Ouro: Mantenha pelo menos 20 Doces (🍭🍦🍧) para cada Meteoro.
                    </p>
                </div>
                
                <button
                    onClick={onClose}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95"
                >
                    ENTENDI O RISCO
                </button>
            </div>
        </div>
    );
};

export default MeteorTutorialModal;
