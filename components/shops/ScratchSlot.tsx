
import React, { useRef, useEffect } from 'react';

interface ScratchSlotProps {
    prize: number;
    isRevealed: boolean;
    onReveal: () => void;
}

const ScratchSlot: React.FC<ScratchSlotProps> = ({ prize, isRevealed, onReveal }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        // Se já estiver revelado, não precisamos desenhar o canvas
        if (isRevealed) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Limpar canvas antes de desenhar
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Preencher o fundo (a tinta da raspadinha - Prata/Cinza)
        ctx.fillStyle = '#9ca3af'; // gray-400
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Adicionar textura/ruído para parecer raspadinha real
        ctx.fillStyle = '#6b7280'; // gray-500
        for (let i = 0; i < 400; i++) {
             ctx.beginPath();
             ctx.arc(
                 Math.random() * canvas.width, 
                 Math.random() * canvas.height, 
                 Math.random() * 2, 
                 0, Math.PI * 2
             );
             ctx.fill();
        }
        
        // 3. Texto ou ícone central (?)
        ctx.fillStyle = '#374151'; // gray-700
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', canvas.width / 2, canvas.height / 2);
        
        // 4. Bordas decorativas leves
        ctx.strokeStyle = '#d1d5db'; // gray-300
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

    }, [isRevealed]); // Redesenha apenas se o estado de revelação mudar (reset)

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
        // Tamanho do pincel
        ctx.arc(drawX, drawY, 25, 0, Math.PI * 2);
        ctx.fill();

        // Verificar o quanto foi raspado
        // Otimização: Não verificar a cada pixel, usar amostragem
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let transparentPixels = 0;
        const totalPixels = imageData.data.length / 4;
        
        // Verificar 1 a cada 16 pixels para performance (step = 4 * 16)
        for (let i = 3; i < imageData.data.length; i += 64) {
            if (imageData.data[i] === 0) transparentPixels++;
        }
        
        // Ajustar total baseado na amostragem (1/16 do total)
        const sampleSize = totalPixels / 16;
        
        // Se raspar mais de 45%, revela tudo
        if (transparentPixels / sampleSize > 0.45) { 
             onReveal();
        }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        // Apenas raspa se o botão esquerdo estiver pressionado
        if (e.buttons === 1) scratch(e.clientX, e.clientY);
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        // Previne scroll da tela enquanto raspa no celular
        // e.preventDefault(); // Removido pois o React gerencia eventos passivos, melhor tratar no CSS (touch-action: none)
        scratch(e.touches[0].clientX, e.touches[0].clientY);
    }

    return (
        <div className="relative w-full aspect-square bg-gray-900 rounded-lg overflow-hidden border-2 border-yellow-600 shadow-inner select-none touch-none transform transition-transform hover:scale-[1.02]">
            {/* CAMADA DE BAIXO: O Prêmio */}
            <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black to-gray-800`}>
                <span className={`text-xl sm:text-2xl font-bold ${prize > 0 ? 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]' : 'text-gray-600'}`}>
                    {prize > 0 ? `$${prize >= 100 ? prize.toFixed(0) : prize.toFixed(2)}` : '❌'}
                </span>
            </div>
            
            {/* CAMADA DE CIMA: O Canvas (Raspadinha) */}
            {!isRevealed && (
                <canvas 
                    ref={canvasRef}
                    width={200} 
                    height={200}
                    className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
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
