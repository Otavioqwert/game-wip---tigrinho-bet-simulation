import { useEffect, useRef } from 'react';
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
    isGameReady?: boolean; // pausa durante troca de slot
}

export const usePassiveIncome = (props: PassiveIncomeProps) => {
    // ─── Ref que sempre aponta para os props mais recentes ─────────────────────
    // Isso permite que os dois setIntervals sejam montados UMA única vez
    // (array de deps vazio) e sempre leiam os valores mais atuais sem
    // precisar ser recriados, o que só resetaria o timer.
    const propsRef = useRef(props);
    propsRef.current = props;

    // ─── Renda passiva principal (1x por segundo garantido) ─────────────────
    useEffect(() => {
        const id = setInterval(() => {
            const {
                getSkillLevel,
                passiveSalary,
                echoChance,
                applyFinalGain,
                handleGain,
                isGameReady,
            } = propsRef.current;

            // Não processa durante troca de slot
            if (isGameReady === false) return;

            const economiaLevel = getSkillLevel('caminhoEconomia');
            let total = 0.5; // renda constante base

            if (economiaLevel > 0) {
                total += 0.5 + economiaLevel * 0.1;
            }

            if (passiveSalary > 0) {
                const salary = (echoChance > 0 && Math.random() < echoChance)
                    ? passiveSalary * 2
                    : passiveSalary;
                total += salary;
            }

            handleGain(applyFinalGain(total));
        }, 1000);

        return () => clearInterval(id);
    }, []); // monta uma única vez — nunca reseta o timer

    // ─── Anti-stuck (1x por segundo garantido) ─────────────────────────
    useEffect(() => {
        const id = setInterval(() => {
            const { bal, betVal, handleGain, applyFinalGain, isGameReady } = propsRef.current;
            if (isGameReady === false) return;
            if (bal < betVal) handleGain(applyFinalGain(0.5));
        }, 1000);

        return () => clearInterval(id);
    }, []); // idem
};
