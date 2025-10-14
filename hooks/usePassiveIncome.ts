import { useEffect } from 'react';
import type { SkillId } from '../types';

interface PassiveIncomeProps {
    betVal: number;
    bal: number;
    getSkillLevel: (id: SkillId) => number;
    passiveSalary: number;
    isEchoUnlocked: boolean;
    totalIncomeMultiplier: number;
    showMsg: (msg: string, duration?: number, isExtra?: boolean) => void;
    handleGain: (amount: number) => void;
}

export const usePassiveIncome = (props: PassiveIncomeProps) => {
    const {
        betVal,
        getSkillLevel,
        passiveSalary,
        isEchoUnlocked,
        totalIncomeMultiplier,
        handleGain,
    } = props;

    // Main passive income from skills
    useEffect(() => {
        const economiaLevel = getSkillLevel('caminhoEconomia');
        const salaryIncome = passiveSalary;
        const constantIncome = 0.5;
        
        const intervalId = setInterval(() => {
            let totalPassive = constantIncome;
            // Economia
            if (economiaLevel > 0) {
                totalPassive += (0.5 + (economiaLevel * 0.1));
            }
            // Salary
            if (salaryIncome > 0) {
                let currentSalary = salaryIncome;
                if (isEchoUnlocked && Math.random() < 0.1) {
                    currentSalary *= 2;
                }
                totalPassive += currentSalary;
            }

            const finalIncome = totalPassive * totalIncomeMultiplier;
            handleGain(finalIncome);
        }, 1000); 
        
        return () => clearInterval(intervalId); 
    }, [getSkillLevel, passiveSalary, isEchoUnlocked, totalIncomeMultiplier, handleGain]);

    // Anti-stuck passive income
    useEffect(() => {
        const interval = setInterval(() => {
            // This logic is tricky with the new system, so we simplify it.
            // If the user has no money, give them a small boost.
            // It will prioritize paying debt, which is the intended "anti-stuck" mechanic.
            if (props.bal < betVal) {
                handleGain(0.5 * totalIncomeMultiplier);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [betVal, props.bal, handleGain, totalIncomeMultiplier]);
};
