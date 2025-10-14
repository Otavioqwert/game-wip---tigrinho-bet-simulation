import React from 'react';

const Reel: React.FC<{ symbol: string; isSpinning: boolean; isStopping: boolean; delay: string; }> = ({ symbol, isSpinning, isStopping, delay }) => (
    <div className={`w-full aspect-square bg-black/40 rounded-xl flex items-center justify-center text-5xl shadow-inner shadow-black/60 overflow-hidden`}>
        <span
            key={Math.random()}
            className={`transition-all duration-200 neon-glow-text ${isSpinning ? 'symbol-spinning symbol-blur' : ''} ${isStopping ? 'symbol-stopping' : ''}`}
            style={isSpinning ? { animationDelay: delay } : {}}
        >
            {symbol}
        </span>
    </div>
);

export default Reel;