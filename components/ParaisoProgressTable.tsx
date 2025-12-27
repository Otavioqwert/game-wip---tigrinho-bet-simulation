import React, { useEffect, useRef } from 'react';

type CandySymbol = '🍭' | '🍦' | '🍧';

interface ParaisoProgressTableProps {
  progress: Record<CandySymbol, number>;
  activeAnimation: CandySymbol | 'rainbow' | null;
  onCandyComplete: (candy: CandySymbol) => number;
  onRainbowComplete: () => number;
  onReward: (amount: number, message: string) => void;
}

export const ParaisoProgressTable: React.FC<ParaisoProgressTableProps> = ({
  progress,
  activeAnimation,
  onCandyComplete,
  onRainbowComplete,
  onReward,
}) => {
  const candies: CandySymbol[] = ['🍭', '🍦', '🍧'];
  
  // 🔒 Flag para evitar processamento múltiplo
  const isProcessing = useRef(false);
  const lastProcessedAnimation = useRef<CandySymbol | 'rainbow' | null>(null);
  
  // 💰 Handle individual candy completion (freeze 3s + REWARD)
  useEffect(() => {
    if (activeAnimation && activeAnimation !== 'rainbow') {
      // Evita reprocessar a mesma animação
      if (isProcessing.current || lastProcessedAnimation.current === activeAnimation) {
        return;
      }
      
      isProcessing.current = true;
      lastProcessedAnimation.current = activeAnimation;
      
      const timer = setTimeout(() => {
        const reward = onCandyComplete(activeAnimation);
        onReward(reward, `${activeAnimation} Barra completa! +$${reward}!`);
        isProcessing.current = false;
        lastProcessedAnimation.current = null;
      }, 3000);
      
      return () => {
        clearTimeout(timer);
        isProcessing.current = false;
      };
    } else if (!activeAnimation) {
      // Reseta quando não há animação ativa
      lastProcessedAnimation.current = null;
    }
  }, [activeAnimation, onCandyComplete, onReward]);
  
  // 🌈 Handle rainbow completion (freeze 3s + MEGA REWARD)
  useEffect(() => {
    if (activeAnimation === 'rainbow') {
      // Evita reprocessar a mesma animação
      if (isProcessing.current || lastProcessedAnimation.current === 'rainbow') {
        return;
      }
      
      isProcessing.current = true;
      lastProcessedAnimation.current = 'rainbow';
      
      const timer = setTimeout(() => {
        const reward = onRainbowComplete();
        onReward(reward, `🌈 RAINBOW JACKPOT! +$${reward.toLocaleString()}!`);
        isProcessing.current = false;
        lastProcessedAnimation.current = null;
      }, 3000);
      
      return () => {
        clearTimeout(timer);
        isProcessing.current = false;
      };
    }
  }, [activeAnimation, onRainbowComplete, onReward]);

  const isRainbowActive = activeAnimation === 'rainbow';
  const rainbowReady = candies.every(c => progress[c] === 3);

  // Recompensas para exibição visual
  const REWARDS = {
    '🍭': 150,
    '🍦': 300,
    '🍧': 2500,
    '🌈': 49999,
  };

  // Função para renderizar os cubos de progresso
  const renderProgress = (symbol: CandySymbol) => {
    const count = progress[symbol];
    const isAnimating = activeAnimation === symbol;
    const colorMap = {
      '🍭': { emoji: '🟦', color: '#3b82f6' },
      '🍦': { emoji: '🟨', color: '#eab308' },
      '🍧': { emoji: '🟥', color: '#ef4444' },
    };
    const { emoji } = colorMap[symbol];
    const squares = [];
    
    for (let i = 0; i < 3; i++) {
      squares.push(
        <span
          key={i}
          style={{
            fontSize: '16px',
            animation: isAnimating ? 'pulse 1s ease-in-out infinite' : 'none',
          }}
        >
          {i < count ? emoji : '⏹️'}
        </span>
      );
    }
    return squares;
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        width: '250px',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        border: '3px solid #fbbf24',
        borderRadius: '12px',
        padding: '12px',
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#fff',
        zIndex: 100,
        boxShadow: '0 4px 20px rgba(251, 191, 36, 0.5)',
        transition: 'all 0.3s ease',
        transform: activeAnimation ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      {/* Título */}
      <div
        style={{
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '16px',
          marginBottom: '10px',
          color: '#fbbf24',
          textShadow: '0 0 10px rgba(251, 191, 36, 0.8)',
        }}
      >
        Paraíso Doce
      </div>

      {/* Linhas de progresso dos doces */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {candies.map(candy => {
          const count = progress[candy];
          const isComplete = count === 3;
          const isAnimating = activeAnimation === candy;
          
          return (
            <div key={candy} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>{candy}</span>
              <span>-</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {renderProgress(candy)}
              </div>
              <span
                style={{
                  fontSize: '12px',
                  color: isComplete ? '#10b981' : '#9ca3af',
                  fontWeight: isComplete ? 'bold' : 'normal',
                }}
              >
                [{count}/3]
              </span>
              {isAnimating && (
                <span style={{ fontSize: '10px', color: '#fbbf24', marginLeft: '4px' }}>
                  ✨
                </span>
              )}
              {/* 💰 Exibe recompensa */}
              <span
                style={{
                  fontSize: '10px',
                  color: '#22c55e',
                  marginLeft: 'auto',
                  fontWeight: 'bold',
                }}
              >
                ${REWARDS[candy]}
              </span>
            </div>
          );
        })}

        {/* Linha do Arco-íris - BARRA PRÓPRIA */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid #374151',
          }}
        >
          <span style={{ fontSize: '18px' }}>🌈</span>
          <span>-</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <span 
              style={{ 
                fontSize: '16px',
                animation: isRainbowActive ? 'pulse 1s ease-in-out infinite' : 'none',
              }}
            >
              {rainbowReady ? '⬜' : '⏹️'}
            </span>
            <span style={{ fontSize: '16px', opacity: 0.3 }}>⬛</span>
            <span style={{ fontSize: '16px', opacity: 0.3 }}>⬛</span>
          </div>
          <span
            style={{
              fontSize: '12px',
              color: rainbowReady ? '#10b981' : '#9ca3af',
              fontWeight: rainbowReady ? 'bold' : 'normal',
            }}
          >
            [{rainbowReady ? '1' : '0'}/1]
          </span>
          {/* 💰 Exibe MEGA recompensa */}
          <span
            style={{
              fontSize: '10px',
              color: '#22c55e',
              marginLeft: 'auto',
              fontWeight: 'bold',
            }}
          >
            ${REWARDS['🌈'].toLocaleString()}
          </span>
        </div>
      </div>

      {/* Indicador de animação ativa */}
      {activeAnimation && (
        <div
          style={{
            marginTop: '10px',
            textAlign: 'center',
            fontSize: '11px',
            color: '#fbbf24',
            fontWeight: 'bold',
            animation: 'pulse 1s ease-in-out infinite',
          }}
        >
          {activeAnimation === 'rainbow' ? '🌈 ARCO-ÍRIS ATIVADO!' : `${activeAnimation} COMPLETO!`}
        </div>
      )}

      {/* Animação de arco-íris completo */}
      {isRainbowActive && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255,0,0,0.3) 0%, rgba(255,154,0,0.3) 20%, rgba(208,222,33,0.3) 40%, rgba(79,220,74,0.3) 60%, rgba(63,218,216,0.3) 80%, rgba(47,201,226,0.3) 100%)',
            borderRadius: '12px',
            animation: 'rainbow-pulse 1s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
      )}

      <style>{`
        @keyframes rainbow-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};
