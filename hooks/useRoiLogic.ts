// Fix: Import React to resolve 'Cannot find namespace React' error in type annotations.
import React, { useMemo, useEffect } from 'react';
import type { Inventory, MidSymbolKey, RoiSaldo } from '../types';

interface RoiLogicProps {
    roiPayoutHistory: number[];
    roiSpinHistory: number[];
    roiMax: number;
    setRoiMax: React.Dispatch<React.SetStateAction<number>>;
    roiBonusCandiesAwarded: number;
    setRoiBonusCandiesAwarded: React.Dispatch<React.SetStateAction<number>>;
    setInv: React.Dispatch<React.SetStateAction<Inventory>>;
    setRoiSaldo: React.Dispatch<React.SetStateAction<RoiSaldo>>;
    showMsg: (msg: string, duration?: number, isExtra?: boolean) => void;
}

export const useRoiLogic = (props: RoiLogicProps) => {
    const { roiPayoutHistory, roiSpinHistory, roiMax, setRoiMax, roiBonusCandiesAwarded, setRoiBonusCandiesAwarded, setInv, setRoiSaldo, showMsg } = props;

    const roi = useMemo(() => {
        const totalPay = roiPayoutHistory.reduce((a, b) => a + b, 0);
        const totalSpin = roiSpinHistory.reduce((a, b) => a + b, 0);
        if (totalSpin === 0) return 0;
        const calculated = (totalPay / totalSpin) * 100;
        return isFinite(calculated) ? calculated : 0;
    }, [roiPayoutHistory, roiSpinHistory]);

    useEffect(() => {
        if (!isFinite(roi) || roi <= roiMax) return;

        const newRoiMax = roi;
        setRoiMax(newRoiMax);

        if (newRoiMax < 100) return;

        let currentCandiesAwarded = roiBonusCandiesAwarded;
        const awardedInThisUpdate: Partial<Record<MidSymbolKey, number>> = {};

        const getThresholdForCandyNumber = (n: number) => {
            const baseThreshold = 5; // 5%
            const candiesOver30 = Math.max(0, (n - 1) - 30);
            const bonusThreshold = candiesOver30 * 0.5; // 0.5% increase per candy over 30
            return baseThreshold + bonusThreshold;
        };

        const getRoiRequiredForCandyNumber = (n: number) => {
            let required = 100;
            for (let i = 1; i <= n; i++) {
                required += getThresholdForCandyNumber(i);
            }
            return required;
        };
        
        // Loop and award candies as long as the new roiMax surpasses the required threshold for the *next* candy
        while (newRoiMax >= getRoiRequiredForCandyNumber(currentCandiesAwarded + 1)) {
            // Determine weights for this specific candy based on the count *before* this award
            const candiesAlreadyAwarded = currentCandiesAwarded;
            const candiesOver30 = Math.max(0, candiesAlreadyAwarded - 30);
            const weights = {
                '🍭': 33,
                '🍦': 33 + candiesOver30 * 1,
                '🍧': 34 + candiesOver30 * 2,
            };
            const totalWeight = weights['🍭'] + weights['🍦'] + weights['🍧'];
            const rand = Math.random() * totalWeight;

            let chosenCandy: MidSymbolKey;
            if (rand < weights['🍭']) {
                chosenCandy = '🍭';
            } else if (rand < weights['🍭'] + weights['🍦']) {
                chosenCandy = '🍦';
            } else {
                chosenCandy = '🍧';
            }

            // Award the candy
            setInv(prev => ({ ...prev, [chosenCandy]: (prev[chosenCandy] || 0) + 1 }));
            setRoiSaldo(prev => ({ ...prev, [chosenCandy]: (prev[chosenCandy] || 0) + 1 }));

            // Log for summary message and increment count for the next loop iteration
            awardedInThisUpdate[chosenCandy] = (awardedInThisUpdate[chosenCandy] || 0) + 1;
            currentCandiesAwarded++;
        }

        if (Object.keys(awardedInThisUpdate).length > 0) {
            // Update state with the new total count
            setRoiBonusCandiesAwarded(currentCandiesAwarded);

            // Create and show a summary message
            const msgParts = (Object.keys(awardedInThisUpdate) as MidSymbolKey[])
                .map(candy => `+${awardedInThisUpdate[candy]} ${candy}`);
            showMsg(`🏆 Bônus de ROI Máximo! ${msgParts.join(', ')}`, 4000, true);
        }
    }, [roi, roiMax, setRoiMax, roiBonusCandiesAwarded, setRoiBonusCandiesAwarded, setInv, setRoiSaldo, showMsg]);

    const roiAtual = roi.toFixed(0);
    
    return {
        roiAtual,
    };
};