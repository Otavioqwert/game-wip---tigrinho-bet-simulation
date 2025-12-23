import React, { useState, useEffect } from 'react';
import { useGameState } from '../hooks/useGameState';
import { spinParaisoDoce, initializeParaisoDoce } from '../utils/mechanics/paraisoDoce';
import type { ParaisoDoceState } from '../utils/mechanics/paraisoDoce';
import styles from './ParaisoDoceGame.module.css';

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
    <div className={styles.container}>
      <h1 className={styles.title}>🍰 Paraiso Doce 2.0 🍰</h1>

      <div className={styles.gridContainer}>
        {paraisoState?.gridSymbols.map((row, r) => (
          row.map((symbol, c) => {
            let cellClass = styles.gridCell;
            if (symbol === 1) cellClass += ` ${styles.cyan}`;
            else if (symbol === 2) cellClass += ` ${styles.yellow}`;
            else if (symbol === 3) cellClass += ` ${styles.magenta}`;
            else cellClass += ` ${styles.empty}`;

            return (
              <div key={`${r}-${c}`} className={cellClass}>
                {symbol === 0 ? '?' : symbol === 1 ? '🍧' : symbol === 2 ? '🍦' : '🍭'}
              </div>
            );
          })
        ))}
      </div>

      <div className={styles.statsContainer}>
        <div className={styles.stat}>
          RTP: {paraisoState?.rtpMultiplier.toFixed(2)}x
        </div>
        <div className={styles.stat}>
          Last Payout: ${lastPayout.toFixed(2)}
        </div>
      </div>

      {/* Progress bars for each color */}
      <div className={styles.barsContainer}>
        <div className={styles.barProgress}>
          <div className={styles.barLabel}>🍧 Cyan</div>
          <div className={styles.barVisual}>
            <div 
              className={`${styles.barFill} ${styles.cyan} ${paraisoState?.bars.cyan === 10 ? styles.complete : ''}`}
              style={{ height: `${(paraisoState?.bars.cyan || 0) * 10}%` }}
            />
          </div>
        </div>
        <div className={styles.barProgress}>
          <div className={styles.barLabel}>🍦 Yellow</div>
          <div className={styles.barVisual}>
            <div 
              className={`${styles.barFill} ${styles.yellow} ${paraisoState?.bars.yellow === 10 ? styles.complete : ''}`}
              style={{ height: `${(paraisoState?.bars.yellow || 0) * 10}%` }}
            />
          </div>
        </div>
        <div className={styles.barProgress}>
          <div className={styles.barLabel}>🍭 Magenta</div>
          <div className={styles.barVisual}>
            <div 
              className={`${styles.barFill} ${styles.magenta} ${paraisoState?.bars.magenta === 10 ? styles.complete : ''}`}
              style={{ height: `${(paraisoState?.bars.magenta || 0) * 10}%` }}
            />
          </div>
        </div>
      </div>

      <button 
        onClick={handleSpin} 
        disabled={isSpinning} 
        className={styles.spinButton}
      >
        {isSpinning ? '⚡ Spinning...' : '🎰 SPIN'}
      </button>

      <button onClick={onClose} className={styles.closeButton}>
        ✕ Close
      </button>
    </div>
  );
}