import React, { useState, useEffect } from 'react';
import { useGameState } from '../hooks/useGameState';
import { spinParaisoDoce, initializeParaisoDoce } from '../utils/mechanics/paraisoDoce';
import type { ParaisoDoceState } from '../utils/mechanics/paraisoDoce';

interface ParaisoDoceGameProps {
  onClose: () => void;
  onPayout: (amount: number) => void;
}

export function ParaisoDoceGame({ onClose, onPayout }: ParaisoDoceGameProps) {
  const { gameState } = useGameState();
  const [paraisoState, setParaisoState] = useState<ParaisoDoceState | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastPayout, setLastPayout] = useState(0);

  useEffect(() => {
    const savedParaiso = gameState.paraisoDoceState || initializeParaisoDoce();
    setParaisoState(savedParaiso);
  }, [gameState]);

  const handleSpin = () => {
    if (!paraisoState || isSpinning) return;
    setIsSpinning(true);
    const newState = JSON.parse(JSON.stringify(paraisoState));
    const result = spinParaisoDoce(newState);
    setLastPayout(result.payout);
    setParaisoState(newState);
    if (result.payout > 0) {
      onPayout(result.payout);
    }
    setTimeout(() => setIsSpinning(false), 1000);
  };

  return (
    <div className="paraiso-doce-container" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <h1 style={{color: '#fff', marginBottom: '20px', textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>Paraiso Doce 2.0</h1>
      
      <div className="grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 80px)',
        gap: '10px',
        marginBottom: '30px'
      }}>
        {paraisoState?.gridSymbols.map((row, r) => (
          row.map((symbol, c) => (
            <div key={`${r}-${c}`} style={{
              width: '80px',
              height: '80px',
              background: symbol === 0 ? '#333' : symbol === 1 ? '#FFD700' : symbol === 2 ? '#FF69B4' : '#00CED1',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#fff',
              transform: isSpinning ? 'scale(0.95)' : 'scale(1)',
              transition: 'transform 0.3s'
            }}>
              {symbol}
            </div>
          ))
        ))}
      </div>
      
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        alignItems: 'center'
      }}>
        <div style={{color: '#fff', fontSize: '18px'}}>
          RTP: {paraisoState?.rtpMultiplier.toFixed(2)}x
        </div>
        <div style={{color: '#fff', fontSize: '18px'}}>
          Last Payout: {lastPayout.toFixed(2)}
        </div>
      </div>
      
      <button onClick={handleSpin} disabled={isSpinning} style={{
        padding: '15px 40px',
        fontSize: '18px',
        background: isSpinning ? '#666' : '#FFD700',
        color: '#000',
        border: 'none',
        borderRadius: '8px',
        cursor: isSpinning ? 'not-allowed' : 'pointer',
        fontWeight: 'bold',
        marginBottom: '20px',
        transition: 'all 0.3s'
      }}>
        {isSpinning ? 'Spinning...' : 'SPIN'}
      </button>
      
      <button onClick={onClose} style={{
        padding: '10px 30px',
        fontSize: '16px',
        background: '#666',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer'
      }}>
        Close
      </button>
    </div>
  );
}
