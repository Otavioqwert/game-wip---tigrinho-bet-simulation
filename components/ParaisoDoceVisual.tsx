'use client';

import React, { useState } from 'react';
import styles from './ParaisoDoceGame.module.css';

interface ParaisoDoceVisualProps {
  gridSymbols: number[][];
  bars: { cyan: number; yellow: number; magenta: number };
  rtpMultiplier: number;
  onSpin: () => void;
}

const symbolEmojis = {
  0: '⬜',
  1: '🔵',
  2: '🟡',
  3: '🔴'
};

export function ParaisoDoceVisual({
  gridSymbols,
  bars,
  rtpMultiplier,
  onSpin
}: ParaisoDoceVisualProps) {
  const [winners, setWinners] = useState<Set<number>>(new Set());

  const handleSpin = () => {
    onSpin();
  };

  const getSymbolColor = (symbol: number) => {
    switch (symbol) {
      case 1:
        return styles.cyan; // cyan
      case 2:
        return styles.yellow; // yellow
      case 3:
        return styles.magenta; // magenta
      default:
        return styles.empty;
    }
  };

  const getBarColor = (color: 'cyan' | 'yellow' | 'magenta') => {
    const maxBar = 10;
    const percentage = (bars[color] / maxBar) * 100;
    return {
      width: `${percentage}%`,
      backgroundColor: color === 'cyan' ? '#00ffff' : color === 'yellow' ? '#ffff00' : '#ff00ff'
    };
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🍭 Paraíso Doce - Febre Doce 🍭</h1>

      {/* Grid 3x3 */}
      <div className={styles.grid}>
        {gridSymbols.flat().map((symbol, idx) => (
          <div
            key={idx}
            className={`${styles.cell} ${getSymbolColor(symbol)} ${
              winners.has(idx) ? styles.winner : ''
            }`}
          >
            {symbolEmojis[symbol as keyof typeof symbolEmojis]}
          </div>
        ))}
      </div>

      {/* RTP Multiplicador */}
      <div className={styles.rtpInfo}>
        RTP Multiplicador: <span>{rtpMultiplier.toFixed(2)}x</span>
      </div>

      {/* Barras Progressivas */}
      <div className={styles.barsContainer}>
        <div className={styles.barItem}>
          <div className={styles.barLabel}>
            <span>🔵 Cyan</span>
            <span>{bars.cyan}/10</span>
          </div>
          <div className={styles.barBackground}>
            <div
              className={`${styles.barFill} ${styles.cyanBar}`}
              style={{ width: `${(bars.cyan / 10) * 100}%` }}
            >
              {bars.cyan > 0 && `${bars.cyan}`}
            </div>
          </div>
        </div>

        <div className={styles.barItem}>
          <div className={styles.barLabel}>
            <span>🟡 Yellow</span>
            <span>{bars.yellow}/10</span>
          </div>
          <div className={styles.barBackground}>
            <div
              className={`${styles.barFill} ${styles.yellowBar}`}
              style={{ width: `${(bars.yellow / 10) * 100}%` }}
            >
              {bars.yellow > 0 && `${bars.yellow}`}
            </div>
          </div>
        </div>

        <div className={styles.barItem}>
          <div className={styles.barLabel}>
            <span>🔴 Magenta</span>
            <span>{bars.magenta}/10</span>
          </div>
          <div className={styles.barBackground}>
            <div
              className={`${styles.barFill} ${styles.magentaBar}`}
              style={{ width: `${(bars.magenta / 10) * 100}%` }}
            >
              {bars.magenta > 0 && `${bars.magenta}`}
            </div>
          </div>
        </div>
      </div>

      {/* Botão de Spin */}
      <button className={styles.spinButton} onClick={handleSpin}>
        🎰 GIRAR
      </button>
    </div>
  );
}
