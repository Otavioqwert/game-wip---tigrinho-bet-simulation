
import React, { useRef, useEffect } from 'react';

interface ScratchSlotProps {
    prize: number;
    isRevealed: boolean;
    onReveal: () => void;
    isJackpot?: boolean;
}

const ScratchSlot: React.FC<ScratchSlotProps> = ({ prize, isRevealed, onReveal, isJackpot }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        // Se já estiver revelado, não precisamos desenhar o canvas (ele é removido do DOM ou escondido)
        if (isRevealed) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Limpar canvas antes de desenhar para evitar sobreposição em re-renders
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Preencher o fundo (a tinta da raspadinha - Prata/Cinza com textura)
        ctx.fillStyle = '#94a3b8'; // slate-400
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Adicionar textura/ruído para parecer raspadinha real
        ctx.fillStyle = '#64748b'; // slate-500
        for (let i = 0; i < 600; i++) {
             ctx.beginPath();
             ctx.arc(
                 Math.random() * canvas.width, 
                 Math.random() * canvas.height, 
                 Math.random() * 2.5, 
                 0, Math.PI * 2
             );
             ctx.fill();
        }
        
        // 3. Padrão ou ícone central (?)
        ctx.fillStyle = '#475569'; // slate-600
        ctx.font = 'bold 30px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', canvas.width / 2, canvas.height / 2);
        
        // 4. Bordas decorativas leves
        ctx.strokeStyle = '#cbd5e1'; // slate-300
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

    }, [isRevealed]); // Redesenha apenas se for resetado

    const scratch = (clientX: number, clientY: number) => {
        if (isRevealed) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        // Ajustar coordenadas baseadas no tamanho real do canvas vs tamanho de exibição (CSS)
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const drawX = x * scaleX;
        const drawY = y * scaleY;

        // A Mágica: "Apagar" a tinta tornando os pixels transparentes
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        // Tamanho do pincel aumentado para melhorar usabilidade
        ctx.arc(drawX, drawY, 35, 0, Math.PI * 2);
        ctx.fill();

        // Verificar o quanto foi raspado
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let transparentPixels = 0;
        const totalPixels = imageData.data.length / 4;
        
        // Otimização: Verificar 1 a cada 32 pixels
        for (let i = 3; i < imageData.data.length; i += 128) {
            if (imageData.data[i] === 0) transparentPixels++;
        }
        
        // Ajustar total baseado na amostragem (1/32 do total)
        const sampleSize = totalPixels / 32;
        
        // Se raspar mais de 40%, revela tudo automaticamente
        if (transparentPixels / sampleSize > 0.40) { 
             onReveal();
        }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        // Apenas raspa se o botão esquerdo estiver pressionado
        if (e.buttons === 1) scratch(e.clientX, e.clientY);
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        // O preventDefault é importante em alguns browsers mobile, mas no React moderno o evento pode ser passivo.
        // A melhor forma de prevenir scroll é via CSS (touch-action: none) que já está aplicado.
        scratch(e.touches[0].clientX, e.touches[0].clientY);
    }

    return (
        <div className={`relative w-full aspect-square rounded-xl overflow-hidden border-2 shadow-inner select-none touch-none transform transition-transform hover:scale-[1.02] ${isJackpot && isRevealed ? 'border-yellow-400 shadow-[0_0_15px_#eab308]' : 'border-gray-600'}`}>
            {/* CAMADA DE BAIXO: O Prêmio */}
            <div className={`absolute inset-0 flex flex-col items-center justify-center p-1 ${isJackpot ? 'bg-gradient-to-br from-yellow-700 via-yellow-600 to-yellow-800 animate-pulse' : 'bg-gradient-to-br from-black to-gray-800'}`}>
                {prize > 0 ? (
                    <>
                        {isJackpot && <span className="text-[10px] font-black text-yellow-100 uppercase tracking-tighter mb-1">JACKPOT</span>}
                        <span className={`text-lg sm:text-2xl font-black ${isJackpot ? 'text-white drop-shadow-md' : 'text-green-400'}`}>
                            ${prize >= 1000 ? (prize/1000).toFixed(1) + 'k' : prize.toFixed(0)}
                        </span>
                        <span className={`text-[10px] uppercase font-bold ${isJackpot ? 'text-yellow-200' : 'text-gray-500'}`}>Ganhou</span>
                    </>
                ) : (
                    <span className="text-4xl opacity-30 grayscale">✖️</span>
                )}
            </div>
            
            {/* CAMADA DE CIMA: O Canvas (Raspadinha) */}
            {!isRevealed && (
                <canvas 
                    ref={canvasRef}
                    width={250} 
                    height={250}
                    className="absolute inset-0 w-full h-full cursor-crosshair touch-none z-10"
                    onMouseMove={handleMouseMove}
                    onTouchMove={handleTouchMove}
                    onMouseDown={(e) => scratch(e.clientX, e.clientY)}
                    onTouchStart={(e) => scratch(e.touches[0].clientX, e.touches[0].clientY)}
                />
            )}
        </div>
    );
};

export default ScratchSlot;
