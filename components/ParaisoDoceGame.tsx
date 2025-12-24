import React, { useState, useEffect } from 'react';
import { spinParaisoDoce, initializeParaisoDoce } from '../utils/mechanics/paraisoDoce';
import type { ParaisoDoceState } from '../utils/mechanics/paraisoDoce';
import { ParaisoDoceVisual } from './ParaisoDoceVisual';
import styles from './ParaisoDoceGame.module.css';

interface ParaisoDoceGameProps {
  onClose: () => void;
  onPayout: (amount: number) => void;
  initialState?: ParaisoDoceState;
  onStateChange?: (state: ParaisoDoceState) => void;
  isFeverMode?: boolean;
}

export function ParaisoDoceGame({ onClose, onPayout, initialState, onStateChange, isFeverMode = false }: ParaisoDoceGameProps) {
  const [paraisoState, setParaisoState] = useState<ParaisoDoceState>(
    initialState || initializeParaisoDoce()
  );
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastPayout, setLastPayout] = useState(0);

  // Update parent state when local state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange(paraisoState);
    }
  }, [paraisoState, onStateChange]);

  const handleSpin = () => {
    if (!paraisoState || isSpinning) return;
    setIsSpinning(true);
    
    // Create a deep copy to avoid mutation
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
    <ParaisoDoceVisual
      gridSymbols={paraisoState.gridSymbols}
      bars={paraisoState.bars}
      rtpMultiplier={paraisoState.rtpMultiplier}
      onSpin={handleSpin}
      isFeverMode={isFeverMode}
    />
  );
}
