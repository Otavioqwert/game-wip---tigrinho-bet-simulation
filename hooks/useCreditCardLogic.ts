import { useEffect, useRef } from 'react';
import type { RenegotiationTier } from '../types';

interface CreditCardLogicProps {
    bal: number;
    setBal: React.Dispatch<React.SetStateAction<number>>;
    creditCardDebt: number;
    setCreditCardDebt: React.Dispatch<React.SetStateAction<number>>;
    renegotiationTier: RenegotiationTier;
    creditCardLevel: number;
}

export const useCreditCardLogic = (props: CreditCardLogicProps) => {
    const propsRef = useRef(props);
    propsRef.current = props;

    // Payment timer (every 60s)
    useEffect(() => {
        const { creditCardLevel } = propsRef.current;
        if (creditCardLevel === 0) return;

        const interval = setInterval(() => {
            const { bal, setBal, creditCardDebt, setCreditCardDebt, renegotiationTier } = propsRef.current;
            if (creditCardDebt > 0) {
                const installmentDenominator = [24, 48, 60][renegotiationTier];
                const payment = creditCardDebt / installmentDenominator;
                
                if (bal >= payment) {
                    setBal(b => b - payment);
                    setCreditCardDebt(d => d - payment);
                } else {
                    // Not enough balance, add payment to debt
                    setCreditCardDebt(d => d + payment);
                }
            }
        }, 60000); // 60 seconds

        return () => clearInterval(interval);
    }, [props.creditCardLevel]); // Rerun if credit card is upgraded

    // Interest timer (every 300s)
    useEffect(() => {
        const { creditCardLevel } = propsRef.current;
        if (creditCardLevel === 0) return;

        const interval = setInterval(() => {
            const { creditCardDebt, setCreditCardDebt, renegotiationTier } = propsRef.current;
            if (creditCardDebt > 0) {
                const interestRate = [0.15, 0.21, 0.29][renegotiationTier];
                setCreditCardDebt(d => d * (1 + interestRate));
            }
        }, 300000); // 300 seconds

        return () => clearInterval(interval);
    }, [props.creditCardLevel]); // Rerun if credit card is upgraded
};
