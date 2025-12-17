
import React, { useEffect, useState } from 'react';

// Memoized to prevent re-renders if props don't change
const Reel = React.memo(({ symbol, isSpinning, isStopping, delay }: { symbol: string; isSpinning: boolean; isStopping: boolean; delay: string; }) => {
    
    // Internal state to manage visual class transitions smoothly
    const [animationClass, setAnimationClass] = useState('');

    useEffect(() => {
        if (isSpinning) {
            setAnimationClass('symbol-spinning');
        } else if (isStopping) {
            setAnimationClass('symbol-stopping');
            // Remove class after animation finishes to reset state for idle
            const timer = setTimeout(() => setAnimationClass(''), 400);
            return () => clearTimeout(timer);
        } else {
            setAnimationClass('');
        }
    }, [isSpinning, isStopping]);

    return (
        <div className="w-full aspect-square bg-black/40 rounded-xl flex items-center justify-center overflow-hidden shadow-inner shadow-black/60 relative border border-white/5">
            {/* 
               CRITICAL OPTIMIZATION:
               1. Removed key={Math.random()}. This prevents React from destroying/recreating the node every 50ms.
               2. Added 'gpu-accelerated' class for hardware acceleration.
               3. The symbol changes inside the same span, allowing for high FPS updates without GC stutter.
            */}
            <div className={`w-full h-full flex items-center justify-center gpu-accelerated ${animationClass}`}
                 style={isSpinning ? { animationDelay: delay } : {}}>
                <span className="text-5xl transition-none neon-glow-text select-none">
                    {symbol}
                </span>
            </div>
            
            {/* Visual scanline/shine overlay for "glass" effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-xl"></div>
        </div>
    );
});

export default Reel;
