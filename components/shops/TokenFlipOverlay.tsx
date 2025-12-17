
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { TokenFlipState } from '../../types';

interface TokenFlipOverlayProps {
    flipState: TokenFlipState;
    onClose: (totalWinnings: number) => void;
}

const TokenFlipOverlay: React.FC<TokenFlipOverlayProps> = ({ flipState, onClose }) => {
    const { results, tokenValue } = flipState;
    const [currentIndex, setCurrentIndex] = useState(0);
    const [accumulatedWin, setAccumulatedWin] = useState(0);
    const [currentStatus, setCurrentStatus] = useState<'spinning' | 'heads' | 'tails'>('spinning');
    const [isFinished, setIsFinished] = useState(false);
    const [popEffect, setPopEffect] = useState(false);

    // Determines animation speed based on batch size
    const totalFlips = results.length;
    const animationDuration = totalFlips > 10 ? 150 : 600; 

    useEffect(() => {
        if (currentIndex >= totalFlips) {
            setIsFinished(true);
            return;
        }

        setCurrentStatus('spinning');
        
        const spinTimer = setTimeout(() => {
            const isWin = results[currentIndex];
            setCurrentStatus(isWin ? 'heads' : 'tails');
            
            if (isWin) {
                // UPDATE: Valor ganho agora é 1x o preço atual (Aposta foi 50% do preço)
                // Antes era tokenValue * 2. Agora é tokenValue.
                const winAmount = tokenValue; 
                setAccumulatedWin(prev => prev + winAmount);
                // Trigger pop animation
                setPopEffect(true);
                setTimeout(() => setPopEffect(false), 200);
            }

            // Move to next
            setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
            }, animationDuration / 2);

        }, animationDuration);

        return () => clearTimeout(spinTimer);
    }, [currentIndex, results, tokenValue, animationDuration, totalFlips]);

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md">
            <div className="flex flex-col items-center justify-center w-full max-w-md p-6">
                
                {/* Header Stats */}
                <div className="w-full flex justify-between items-end mb-10 text-gray-400 font-mono text-sm">
                    <div>
                        <p>PREÇO MERCADO</p>
                        <p className="text-white font-bold text-lg">${tokenValue.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                        <p>RESTANTES</p>
                        <p className="text-white font-bold text-lg">{totalFlips - currentIndex}</p>
                    </div>
                </div>

                {/* THE COIN */}
                <div className="relative mb-12 perspective-1000">
                    <div className={`w-40 h-40 rounded-full border-4 flex items-center justify-center text-6xl shadow-[0_0_50px_rgba(255,255,255,0.1)] transition-all duration-300
                        ${currentStatus === 'spinning' ? 'animate-flip-fast border-yellow-500 bg-yellow-900/20' : ''}
                        ${currentStatus === 'heads' ? 'border-green-500 bg-green-900/20 shadow-[0_0_50px_#22c55e] scale-110' : ''}
                        ${currentStatus === 'tails' ? 'border-red-500 bg-red-900/20 grayscale scale-95' : ''}
                    `}>
                        {currentStatus === 'spinning' ? '🪙' : (currentStatus === 'heads' ? '🤑' : '💸')}
                    </div>
                </div>

                {/* Accumulated Value with POP effect */}
                <div className="text-center mb-8">
                    <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">Total Recuperado</p>
                    <div className={`transition-transform duration-100 ${popEffect ? 'scale-150' : 'scale-100'}`}>
                        <p className={`text-5xl font-black ${accumulatedWin > 0 ? 'text-green-400' : 'text-gray-600'}`}>
                            ${accumulatedWin.toFixed(2)}
                        </p>
                    </div>
                </div>

                {/* Action Button */}
                {isFinished ? (
                    <button 
                        onClick={() => onClose(accumulatedWin)}
                        className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-black text-xl rounded-xl shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-all active:scale-95 animate-in slide-in-from-bottom-4"
                    >
                        COLETAR SAQUE
                    </button>
                ) : (
                    <div className="w-full h-14 flex items-center justify-center text-yellow-500 font-bold animate-pulse">
                        PROCESSANDO...
                    </div>
                )}

            </div>
            
            <style>{`
                .perspective-1000 { perspective: 1000px; }
                @keyframes flipFast {
                    0% { transform: rotateY(0deg); }
                    100% { transform: rotateY(360deg); }
                }
                .animate-flip-fast {
                    animation: flipFast 0.3s linear infinite;
                }
            `}</style>
        </div>,
        document.body
    );
};

export default TokenFlipOverlay;
