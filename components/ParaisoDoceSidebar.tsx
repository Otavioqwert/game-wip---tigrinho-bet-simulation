import React from 'react';
import styles from './ParaisoDoceSidebar.module.css';

interface ParaisoDoceSidebarProps {
  bars: { cyan: number; yellow: number; magenta: number };
  isActive: boolean;
}

export function ParaisoDoceSidebar({ bars, isActive }: ParaisoDoceSidebarProps) {
  if (!isActive) return null;

  const icons = [
    { emoji: '🍦', color: 'cyan' },
    { emoji: '🍭', color: 'yellow' },
    { emoji: '🍭', color: 'magenta' }
  ];

  return (
    <div className={styles.sidebar}>
      <div className={styles.container}>
        {/* Ícone do sorvete no topo */}
        <div className={styles.topIcon}>🍦</div>
        
        {/* Barra Amarela (Yellow) */}
        <div className={styles.barSection}>
          <div className={styles.icon}>🍭</div>
          <div className={styles.barWrapper}>
            <div 
              className={`${styles.barFill} ${styles.yellow}`}
              style={{ height: `${(bars.yellow / 10) * 100}%` }}
            />
          </div>
        </div>

        {/* Barra Rosa/Magenta */}
        <div className={styles.barSection}>
          <div className={styles.icon}>🍭</div>
          <div className={styles.barWrapper}>
            <div 
              className={`${styles.barFill} ${styles.magenta}`}
              style={{ height: `${(bars.magenta / 10) * 100}%` }}
            />
          </div>
        </div>

        {/* Barra Ciano (Cyan) */}
        <div className={styles.barSection}>
          <div className={styles.icon}>🍦</div>
          <div className={styles.barWrapper}>
            <div 
              className={`${styles.barFill} ${styles.cyan}`}
              style={{ height: `${(bars.cyan / 10) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
