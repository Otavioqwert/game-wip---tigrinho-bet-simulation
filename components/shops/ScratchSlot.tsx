
import React, { useRef, useEffect } from 'react';

interface ScratchSlotProps {
    prize: number;
    isRevealed: boolean;
    onReveal: () => void;
    isJackpot?: boolean;
    revealAllTrigger?: boolean;
}

const ScratchSlot: React.FC<ScratchSlotProps> = ({ prize, isRevealed, onReveal, isJackpot, revealAllTrigger }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isRevealedRef = useRef(isRevealed);

    // Mantém a ref sincronizada para evitar closures no loop de animação
    useEffect(() => {
        isRevealedRef.current = isRevealed;
    }, [isRevealed]);

    useEffect(() => {
        if (revealAllTrigger && !isRevealed) {
            onReveal();
        }
    }, [revealAllTrigger, isRevealed, onReveal]);

    useEffect(() => {
        if (isRevealed) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Reset do canvas para desenho da "tinta"
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Gradiente Metálico Premium
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, '#94a3b8'); 
        grad.addColorStop(0.5, '#f1f5f9'); 
        grad.addColorStop(1, '#475569'); 
        
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Textura granulada para parecer papel real
        for (let i = 0; i < 400; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)';
            ctx.beginPath();
            ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Marca d'água central
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', canvas.width / 2, canvas.height / 2);
        
        // Bordas internas
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 12;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    }, [isRevealed]);

    const scratch = (clientX: number, clientY: number) => {
        if (isRevealedRef.current) return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

        // Aplica o efeito de "borracha"
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        // Aumentado de 40 para 55 para facilitar muito a raspagem
        ctx.arc(x, y, 55, 0, Math.PI * 2);
        ctx.fill();

        // Checagem de transparência ultra-rápida (amostra 1 a cada 64 pixels)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let transparentPixels = 0;
        const pixelData = imageData.data;
        const totalPixelsToSample = pixelData.length / 4;
        const step = 64; // Amostragem otimizada

        for (let i = 3; i < pixelData.length; i += (step * 4)) {
            if (pixelData[i] < 128) { // Se o alpha for baixo (transparente)
                transparentPixels++;
            }
        }
        
        const sampledCount = totalPixelsToSample / step;
        const transparencyRatio = transparentPixels / sampledCount;

        // Reduzido o limite para 30%. Raspar 1/3 do slot já revela o prêmio.
        if (transparencyRatio > 0.30) { 
             onReveal();
        }
    }

    // Eventos unificados para mouse e touch
    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (isRevealed) return;
        if ('buttons' in e && e.buttons !== 1) return; // Se for mouse e não estiver clicado

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        scratch(clientX, clientY);
    };

    return (
        <div className={`relative w-full aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-500 shadow-lg ${isJackpot && isRevealed ? 'border-yellow-400 scale-105 shadow-yellow-500/50 z-10' : 'border-white/5'}`}>
            {/* Camada de Prêmios (Fica por baixo) */}
            <div className={`absolute inset-0 flex flex-col items-center justify-center p-2 text-center select-none ${isJackpot ? 'bg-gradient-to-br from-yellow-600 via-amber-400 to-yellow-800' : 'bg-[#0a0a0a]'}`}>
                {prize > 0 ? (
                    <div className="animate-in zoom-in fade-in duration-500">
                        {isJackpot && <div className="text-[10px] font-black text-black bg-white px-2 rounded-full mb-1 uppercase tracking-tighter">JACKPOT</div>}
                        <div className={`text-2xl sm:text-3xl font-black leading-none ${isJackpot ? 'text-black' : 'text-green-400'}`}>
                            ${prize >= 1000 ? (prize/1000).toFixed(1)+'k' : prize.toFixed(0)}
                        </div>
                        <div className={`text-[9px] font-black uppercase mt-1 ${isJackpot ? 'text-black/60' : 'text-white/40'}`}>PRÊMIO</div>
                    </div>
                ) : (
                    <div className="text-3xl opacity-10 grayscale">💀</div>
                )}
            </div>
            
            {/* Camada de Raspagem (Canvas por cima) */}
            {!isRevealed && (
                <canvas 
                    ref={canvasRef}
                    width={300} 
                    height={300}
                    className="absolute inset-0 w-full h-full cursor-crosshair touch-none z-10"
                    onMouseMove={handleMove}
                    onTouchMove={handleMove}
                    onMouseDown={handleMove}
                />
            )}
        </div>
    );
};

export default ScratchSlot;
