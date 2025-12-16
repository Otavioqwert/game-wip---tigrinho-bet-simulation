
import React, { useEffect, useState, useRef } from 'react';
import type { StarBonusResult } from '../../types';

interface StarBonusOverlayProps {
    results: StarBonusResult[];
    totalWin: number;
    onComplete: () => void;
}

const StarBonusOverlay: React.FC<StarBonusOverlayProps> = ({ results, totalWin, onComplete }) => {
    const [visibleResults, setVisibleResults] = useState<StarBonusResult[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [accumulatedWin, setAccumulatedWin] = useState(0);
    const [isTurbo, setIsTurbo] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    
    // Calcula o total de giros (pode ser 90, 180, 270...)
    const totalSpins = results.length;

    useEffect(() => {
        if (currentIndex >= totalSpins) {
            return;
        }

        // Base speed: 50ms (2x faster than original 100ms)
        // Turbo speed: 3ms (Very fast)
        const delay = isTurbo ? 3 : 50;

        const interval = setInterval(() => {
            setCurrentIndex(prev => {
                const next = prev + 1;
                if (next <= totalSpins) {
                    const newItem = results[prev];
                    
                    // Optimization: In turbo mode, we might batch updates visually if needed, 
                    // but React 18 automatic batching usually handles this fine.
                    setVisibleResults(old => [...old, newItem]);
                    
                    if (newItem.isWin) {
                        setAccumulatedWin(acc => acc + newItem.win);
                    }
                }
                return next;
            });
        }, delay);

        return () => clearInterval(interval);
    }, [currentIndex, results, isTurbo, totalSpins]);

    // Auto-scroll logic
    useEffect(() => {
        if (scrollRef.current) {
            // Only auto-scroll if close to bottom or in turbo to keep track
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [visibleResults, isTurbo]);

    const isFinished = currentIndex >= totalSpins;
    const progressPercent = Math.min(100, (currentIndex / totalSpins) * 100);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black">
            {/* Animated Space Background */}
            <div className="absolute inset-0 z-0 opacity-60">
                <div className="stars"></div>
                <div className="twinkling"></div>
            </div>
            
            <div className="relative z-10 w-full max-w-lg h-[90vh] bg-slate-900/90 rounded-3xl border-4 border-blue-500 shadow-[0_0_80px_rgba(59,130,246,0.6)] flex flex-col overflow-hidden backdrop-blur-xl">
                
                {/* Header Section */}
                <div className="shrink-0 p-5 bg-gradient-to-b from-blue-900/50 to-transparent border-b border-blue-500/30">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-100 to-purple-300 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)] animate-pulse">
                                CAMINHO ESTELAR
                            </h2>
                            <p className="text-blue-200 text-xs tracking-widest uppercase mt-1">Simulação Quântica em Progresso</p>
                        </div>
                        
                        {/* Turbo Switch */}
                        <button
                            onClick={() => setIsTurbo(!isTurbo)}
                            disabled={isFinished}
                            className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300
                                ${isTurbo 
                                    ? 'bg-yellow-500 border-yellow-300 text-black shadow-[0_0_15px_#eab308]' 
                                    : 'bg-transparent border-gray-500 text-gray-400 hover:border-yellow-500 hover:text-yellow-500'}
                                ${isFinished ? 'opacity-0 pointer-events-none' : 'opacity-100'}
                            `}
                        >
                            <span className="text-xl">⚡</span>
                            <span className="font-bold text-sm">TURBO</span>
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-4 border border-gray-700">
                        <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_10px_#3b82f6]"
                            style={{ width: `${progressPercent}%`, transition: isTurbo ? 'none' : 'width 0.1s linear' }}
                        />
                    </div>

                    {/* Stats Panel */}
                    <div className="flex justify-between items-end bg-black/40 rounded-xl p-3 border border-blue-500/20">
                        <div className="text-left">
                            <div className="text-xs text-blue-300 mb-1">Giros Processados</div>
                            <div className="text-xl font-mono font-bold text-white">
                                {Math.min(currentIndex, totalSpins)} <span className="text-gray-500 text-sm">/ {totalSpins}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-yellow-200 mb-1">Total Ganho</div>
                            <div className={`text-3xl font-black text-yellow-400 drop-shadow-md transition-transform duration-75 ${currentIndex > 0 && results[currentIndex-1]?.isWin ? 'scale-110 text-yellow-200' : 'scale-100'}`}>
                                ${accumulatedWin.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Simulation List */}
                <div className="relative flex-grow overflow-hidden bg-black/20">
                    <div 
                        ref={scrollRef}
                        className="absolute inset-0 overflow-y-auto px-4 py-2 space-y-2 custom-scrollbar"
                    >
                        {visibleResults.map((res, i) => (
                            <div 
                                key={i} 
                                className={`
                                    flex justify-between items-center p-2 rounded-lg border backdrop-blur-sm transition-all
                                    ${res.isWin 
                                        ? 'bg-blue-600/20 border-blue-400/50 shadow-[0_0_10px_rgba(59,130,246,0.2)] scale-[1.01]' 
                                        : 'bg-gray-800/30 border-white/5 opacity-60'}
                                    ${!isTurbo && 'animate-slide-in-right'}
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-xs text-gray-500 w-6">#{i + 1}</span>
                                    <div className="flex gap-1 text-xl sm:text-2xl filter drop-shadow-sm">
                                        <span className="w-8 text-center">{res.symbols[0]}</span>
                                        <span className="w-8 text-center">{res.symbols[1]}</span>
                                        <span className="w-8 text-center">{res.symbols[2]}</span>
                                    </div>
                                </div>
                                <div className={`font-bold text-sm sm:text-base ${res.isWin ? 'text-green-300' : 'text-gray-600'}`}>
                                    {res.isWin ? `+$${res.win.toFixed(2)}` : '---'}
                                </div>
                            </div>
                        ))}
                        {/* Spacer for auto-scroll visibility */}
                        <div className="h-4"></div>
                    </div>
                    
                    {/* Gradient Overlay at bottom for smooth fade */}
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent pointer-events-none"></div>
                </div>

                {/* Footer Action */}
                <div className="shrink-0 p-4 bg-slate-900 border-t border-blue-500/30">
                    <button 
                        onClick={onComplete}
                        disabled={!isFinished}
                        className={`
                            w-full py-4 rounded-xl font-bold text-xl uppercase tracking-wider transition-all duration-300
                            ${isFinished 
                                ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 bg-[length:200%_auto] text-black shadow-[0_0_20px_#eab308] hover:scale-[1.02] animate-shimmer' 
                                : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'}
                        `}
                        style={{
                            backgroundPosition: isFinished ? 'right center' : 'center'
                        }}
                    >
                        {isFinished ? '💰 COLETAR FORTUNA 💰' : 'CALCULANDO TRAJETÓRIA...'}
                    </button>
                </div>
            </div>
            
            {/* CSS for animations and background */}
            <style>{`
                .animate-slide-in-right {
                    animation: slideInRight 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
                @keyframes slideInRight {
                    from { transform: translateX(20px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                @keyframes move-twink-back {
                    from {background-position:0 0;}
                    to {background-position:-10000px 5000px;}
                }
                @keyframes move-clouds-back {
                    from {background-position:0 0;}
                    to {background-position:10000px 0;}
                }
                .stars, .twinkling {
                  position:absolute;
                  top:0;
                  left:0;
                  right:0;
                  bottom:0;
                  width:100%;
                  height:100%;
                  display:block;
                }
                .stars {
                  background:#000 url(http://www.script-tutorials.com/demos/360/images/stars.png) repeat top center;
                  z-index:0;
                }
                .twinkling{
                  background:transparent url(http://www.script-tutorials.com/demos/360/images/twinkling.png) repeat top center;
                  z-index:1;
                  animation:move-twink-back 200s linear infinite;
                }
                
                @keyframes shimmer {
                    0% {background-position: 0% 50%;}
                    100% {background-position: 100% 50%;}
                }
                .animate-shimmer {
                    animation: shimmer 3s infinite linear;
                }
            `}</style>
        </div>
    );
};

export default StarBonusOverlay;
