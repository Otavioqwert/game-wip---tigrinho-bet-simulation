
import { useEffect } from 'react';
import type { SkillId } from '../types';

interface PassiveIncomeProps {
    betVal: number;
    bal: number;
    getSkillLevel: (id: SkillId) => number;
    passiveSalary: number;
    echoChance: number;
    applyFinalGain: (baseAmount: number) => number;
    showMsg: (msg: string, duration?: number, isExtra?: boolean) => void;
    handleGain: (amount: number) => void;
}

export const usePassiveIncome = (props: PassiveIncomeProps) => {
    const {
        betVal,
        getSkillLevel,
        passiveSalary,
        echoChance,
        applyFinalGain,
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
                if (echoChance > 0 && Math.random() < echoChance) {
                    currentSalary *= 2;
                }
                totalPassive += currentSalary;
            }

            // Aplica Grande Ganho e Hidra
            const finalIncome = applyFinalGain(totalPassive);
            handleGain(finalIncome);
        }, 1000); 
        
        return () => clearInterval(intervalId); 
    }, [getSkillLevel, passiveSalary, echoChance, applyFinalGain, handleGain]);

    // Anti-stuck passive income
    useEffect(() => {
        const interval = setInterval(() => {
            // If the user has no money, give them a small boost.
            if (props.bal < betVal) {
                handleGain(applyFinalGain(0.5));
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [betVal, props.bal, handleGain, applyFinalGain]);
};
