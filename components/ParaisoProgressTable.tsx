import React, { useEffect, useRef, useState } from 'react';

type CandySymbol = '🍭' | '🍦' | '🍧';

interface ParaisoProgressTableProps {
  progress: Record<CandySymbol, number>;
  activeAnimation: CandySymbol | 'rainbow' | null;
  onCandyComplete: (candy: CandySymbol) => number;
  onRainbowComplete: () => number;
  onReward: (amount: number, message: string) => void;
  level: number;
  unlockedCandy: {
    '🍭': boolean;
    '🍦': boolean;
    '🍧': boolean;
    'rainbow': boolean;
  };
}

export const ParaisoProgressTable: React.FC<ParaisoProgressTableProps> = ({
  progress,
  activeAnimation,
  onCandyComplete,
  onRainbowComplete,
  onReward,
  level,
  unlockedCandy
}) => {
  const candies: CandySymbol[] = ['🍭', '🍦', '🍧'];
  
  const [localAnimation, setLocalAnimation] = useState<CandySymbol | 'rainbow' | null>(null);
  const processingRef = useRef(false);
  
  useEffect(() => {
    if (activeAnimation && !processingRef.current) {
      setLocalAnimation(activeAnimation);
      processingRef.current = true;
      
      const timer = setTimeout(() => {
        if (activeAnimation === 'rainbow') {
          const reward = onRainbowComplete();
          onReward(reward, `🌈 RAINBOW JACKPOT! +$${reward.toLocaleString()}!`);
        } else {
          const reward = onCandyComplete(activeAnimation);
          onReward(reward, `${activeAnimation} Barra completa! +$${reward}!`);
        }
        
        setLocalAnimation(null);
        processingRef.current = false;
      }, 3000);
      
      return () => clearTimeout(timer);
    }
    
    if (!activeAnimation && localAnimation) {
      setLocalAnimation(null);
      processingRef.current = false;
    }
  }, [activeAnimation]);

  const isRainbowActive = localAnimation === 'rainbow';
  const rainbowReady = candies.every(c => progress[c] === 3);

  const REWARDS = {
    '🍭': 150,
    '🍦': 300,
    '🍧': 2500,
    '🌈': 49999,
  };

  const UNLOCK_INFO = {
    '🍦': 25,
    '🍧': 100,
    'rainbow': 300
  };

  const renderProgress = (symbol: CandySymbol) => {
    const count = progress[symbol];
    const isAnimating = localAnimation === symbol;
    const isUnlocked = unlockedCandy[symbol];
    
    const colorMap = {
      '🍭': { emoji: '🟦' },
      '🍦': { emoji: '🟨' },
      '🍧': { emoji: '🟥' },
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
            filter: isUnlocked ? 'none' : 'grayscale(1) brightness(0.5)'
          }}
        >
          {i < count ? emoji : (isUnlocked ? '⏹️' : '⬜')}
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
        transform: localAnimation ? 'scale(1.05)' : 'scale(1)',
      }}
    >
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {candies.map(candy => {
          const count = progress[candy];
          const isComplete = count === 3;
          const isAnimating = localAnimation === candy;
          const isUnlocked = unlockedCandy[candy];
          
          return (
            <div key={candy} style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: isUnlocked ? 1 : 0.5 }}>
              <span style={{ fontSize: '18px', filter: isUnlocked ? 'none' : 'grayscale(1)' }}>{candy}</span>
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
              {!isUnlocked && <span style={{fontSize: '10px'}}>🔒</span>}
              <span
                style={{
                  fontSize: '10px',
                  color: isUnlocked ? '#22c55e' : '#6b7280',
                  marginLeft: 'auto',
                  fontWeight: 'bold',
                }}
              >
                ${REWARDS[candy]}
              </span>
            </div>
          );
        })}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid #374151',
            opacity: unlockedCandy['rainbow'] ? 1 : 0.5
          }}
        >
          <span style={{ fontSize: '18px', filter: unlockedCandy['rainbow'] ? 'none' : 'grayscale(1)' }}>🌈</span>
          <span>-</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <span 
              style={{ 
                fontSize: '16px',
                animation: isRainbowActive ? 'pulse 1s ease-in-out infinite' : 'none',
              }}
            >
              {unlockedCandy['rainbow'] ? (rainbowReady ? '⬜' : '⏹️') : '🔒'}
            </span>
            <span style={{ fontSize: '16px', opacity: 0.1 }}>⬛</span>
            <span style={{ fontSize: '16px', opacity: 0.1 }}>⬛</span>
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
          <span
            style={{
              fontSize: '10px',
              color: unlockedCandy['rainbow'] ? '#22c55e' : '#6b7280',
              marginLeft: 'auto',
              fontWeight: 'bold',
            }}
          >
            ${REWARDS['🌈'].toLocaleString()}
          </span>
        </div>
      </div>

      <div
        style={{
          marginTop: '15px',
          padding: '8px',
          backgroundColor: 'rgba(251, 191, 36, 0.15)',
          border: '1px solid #fbbf24',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 'bold' }}>NÍVEL ATUAL</span>
            <div style={{
                backgroundColor: '#fbbf24',
                color: '#1a1a1a',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: '900',
                fontSize: '14px'
            }}>
                {level}
            </div>
        </div>
        
        <div style={{ fontSize: '9px', color: '#9ca3af', textAlign: 'center', marginTop: '4px' }}>
            {level < UNLOCK_INFO['🍦'] ? `🍦 Libera no nível ${UNLOCK_INFO['🍦']}` : 
             level < UNLOCK_INFO['🍧'] ? `🍧 Libera no nível ${UNLOCK_INFO['🍧']}` : 
             level < UNLOCK_INFO['rainbow'] ? `🌈 Libera no nível ${UNLOCK_INFO['rainbow']}` : '✨ Tudo desbloqueado!'}
        </div>
      </div>

      {localAnimation && (
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
          {localAnimation === 'rainbow' ? '🌈 ARCO-ÍRIS ATIVADO!' : `${localAnimation} COMPLETO!`}
        </div>
      )}

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