
import React, { useCallback } from 'react';
import { SECONDARY_SKILLS } from '../constants/secondarySkills';
import { START_STOP_CASH_PER_LEVEL, START_STOP_SUGAR_PER_LEVEL, START_STOP_CLOVER_STEP } from '../constants/prestige';
import type { SecondarySkillId, Multipliers } from '../types';

interface SecondaryPrestigeSkillsProps {
    prestigePoints: number;
    setPrestigePoints: React.Dispatch<React.SetStateAction<number>>;
    bal: number;
    setBal: React.Dispatch<React.SetStateAction<number>>;
    sugar: number;
    setSugar: React.Dispatch<React.SetStateAction<number>>;
    setMult: React.Dispatch<React.SetStateAction<Multipliers>>;
    setBonusMult: React.Dispatch<React.SetStateAction<Multipliers>>;
    secondarySkillLevels: Record<string, number>;
    setSecondarySkillLevels: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    showMsg: (msg: string, duration?: number, isExtra?: boolean) => void;
}

export const useSecondaryPrestigeSkills = (props: SecondaryPrestigeSkillsProps) => {
    const {
        prestigePoints, setPrestigePoints, bal, setBal, setSugar, setMult, setBonusMult,
        secondarySkillLevels, setSecondarySkillLevels, showMsg
    } = props;

    const getSecondarySkillLevel = useCallback((id: SecondarySkillId) => secondarySkillLevels[id] || 0, [secondarySkillLevels]);

    const buySecondarySkill = useCallback((id: SecondarySkillId) => {
        const skill = SECONDARY_SKILLS[id];
        if (!skill) return;

        const currentLevel = getSecondarySkillLevel(id);
        if (currentLevel >= skill.maxLevel) {
            showMsg("Nível máximo atingido.", 2000, true);
            return;
        }

        const cost = skill.getCost(currentLevel);
        const hasFunds = skill.costType === 'pa' ? prestigePoints >= cost : bal >= cost;

        if (!hasFunds) {
            showMsg(`Insuficiente. Custa ${cost.toFixed(0)} ${skill.costType === 'pa' ? 'PA' : '$'}.`, 2000, true);
            return;
        }

        for (const dep of skill.dependencies) {
            if (getSecondarySkillLevel(dep.id) < dep.level) {
                showMsg(`Requer ${SECONDARY_SKILLS[dep.id].name} Nível ${dep.level}.`, 3000, true);
                return;
            }
        }
        
        if (skill.costType === 'pa') {
            setPrestigePoints(p => p - cost);
        } else {
            setBal(p => p - cost);
        }
        
        // --- EFEITOS IMEDIATOS DA COMPRA ---
        if (id === 'startStop') {
            const nextLevel = currentLevel + 1;
            setBal(prev => prev + START_STOP_CASH_PER_LEVEL);
            setSugar(prev => prev + START_STOP_SUGAR_PER_LEVEL);
            
            // Bônus de Trevo como Nível AVULSO (BonusMult) - Multiplos de 10
            if (nextLevel % START_STOP_CLOVER_STEP === 0) {
                setBonusMult(prev => ({ ...prev, '🍀': (prev['🍀'] || 0) + 1 }));
                showMsg(`✨ Start/Stop: +$${START_STOP_CASH_PER_LEVEL}, +${START_STOP_SUGAR_PER_LEVEL} 🍬 e +1 Nv Avulso de Trevo!`, 4000, true);
            } else {
                showMsg(`✨ Start/Stop: +$${START_STOP_CASH_PER_LEVEL} e +${START_STOP_SUGAR_PER_LEVEL} 🍬 concedidos!`, 3000, true);
            }
        }

        setSecondarySkillLevels(p => ({ ...p, [id]: currentLevel + 1 }));
        if (id !== 'startStop') {
            showMsg(`Comprou ${skill.name} Nível ${currentLevel + 1}!`, 3000);
        }
    }, [prestigePoints, bal, getSecondarySkillLevel, setPrestigePoints, setBal, setSugar, setMult, setBonusMult, setSecondarySkillLevels, showMsg]);

    // --- CÁLCULO DE EFEITOS ---
    const ssLevel = getSecondarySkillLevel('startStop');
    const startStopBonus = ssLevel * START_STOP_CASH_PER_LEVEL;
    const startStopSugar = ssLevel * START_STOP_SUGAR_PER_LEVEL;
    const startStopCloverMultBonus = Math.floor(ssLevel / START_STOP_CLOVER_STEP);

    const cashbackMultiplier = getSecondarySkillLevel('cashback') * 0.01;
    const passiveSalary = getSecondarySkillLevel('salary') * 0.10;
    const echoChance = getSecondarySkillLevel('echo') * 0.10;
    
    const creditCardLevel = getSecondarySkillLevel('bankruptcy');
    const creditLimit = creditCardLevel > 0 ? (50 * creditCardLevel + 50 * Math.pow(1.25, creditCardLevel)) : 0;
    
    // HIDRA: Exponente Composto (1 + nível * 0.005)
    // Nv 1: ^1.005 | Nv 2: ^1.010 | Nv 10: ^1.050
    const hydraExponent = 1 + (getSecondarySkillLevel('hydra') * 0.005);
    
    const priceIncreaseModifier = 1 - (getSecondarySkillLevel('decelerometer') * 0.02);
    
    // Incremento: multiplicador de eficácia final sobre os níveis (1.0 a 1.25)
    const incrementMultiplier = 1 + (getSecondarySkillLevel('increment') * 0.01);

    return {
        secondarySkillLevels,
        getSecondarySkillLevel,
        buySecondarySkill,
        startStopBonus,
        startStopSugar,
        startStopCloverMultBonus,
        cashbackMultiplier,
        passiveSalary,
        echoChance,
        creditLimit,
        hydraExponent, // Alterado de hydraMultiplier para hydraExponent
        priceIncreaseModifier,
        multUpgradeBonus: incrementMultiplier,
    };
};
