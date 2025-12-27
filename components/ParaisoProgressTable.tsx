import React, { useEffect } from 'react';

interface ParaisoProgressTableProps {
  progress: Record<'🍭' | '🍦' | '🍧', number>;
  isRainbowAnimating: boolean;
  onRainbowComplete: () => void;
}

export const ParaisoProgressTable: React.FC<ParaisoProgressTableProps> = ({
  progress,
  isRainbowAnimating,
  onRainbowComplete,
}) => {
  // Quando o arco-íris completa, congela por 3 segundos
  useEffect(() => {
    if (isRainbowAnimating) {
      const timer = setTimeout(() => {
        onRainbowComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isRainbowAnimating, onRainbowComplete]);

  // Função para renderizar os cubos de progresso
  const renderProgress = (symbol: '🍭' | '🍦' | '🍧', color: string) => {
    const count = progress[symbol];
    const squares = [];
    
    for (let i = 0; i < 3; i++) {
      if (i < count) {
        // Preenchido
        squares.push(
          <span key={i} style={{ color, fontSize: '16px' }}>
            {color === '#3b82f6' ? '🟦' : color === '#eab308' ? '🟨' : '🟥'}
          </span>
        );
      } else {
        // Vazio
        squares.push(
          <span key={i} style={{ fontSize: '16px' }}>
            ⏹️
          </span>
        );
      }
    }
    return squares;
  };

  // Verifica se o arco-íris está completo
  const rainbowComplete = progress['🍭'] >= 3 && progress['🍦'] >= 3 && progress['🍧'] >= 3;

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
        transform: isRainbowAnimating ? 'scale(1.05)' : 'scale(1)',
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

      {/* Linhas de progresso */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* 🍭 Pirulito */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🍭</span>
          <span>-</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {renderProgress('🍭', '#3b82f6')}
          </div>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>
            [{progress['🍭']}/3]
          </span>
        </div>

        {/* 🍦 Sorvete */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🍦</span>
          <span>-</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {renderProgress('🍦', '#eab308')}
          </div>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>
            [{progress['🍦']}/3]
          </span>
        </div>

        {/* 🍧 Raspadinha */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🍧</span>
          <span>-</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {renderProgress('🍧', '#ef4444')}
          </div>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>
            [{progress['🍧']}/3]
          </span>
        </div>

        {/* Linha do Arco-íris */}
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
            {rainbowComplete ? (
              <span style={{ fontSize: '16px' }}>⬜</span>
            ) : (
              <>
                <span style={{ fontSize: '16px' }}>⬛</span>
                <span style={{ fontSize: '16px' }}>⬛</span>
              </>
            )}
          </div>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>
            [{rainbowComplete ? '1' : '0'}/1]
          </span>
        </div>
      </div>

      {/* Animação de arco-íris completo */}
      {isRainbowAnimating && (
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
      `}</style>
    </div>
  );
};
