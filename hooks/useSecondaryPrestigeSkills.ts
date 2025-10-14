// Fix: Import React to resolve 'Cannot find namespace React' error for type annotations.
import React, { useCallback } from 'react';
import { SECONDARY_SKILLS } from '../constants/secondarySkills';
import type { SecondarySkillId } from '../types';

interface SecondaryPrestigeSkillsProps {
    prestigePoints: number;
    setPrestigePoints: React.Dispatch<React.SetStateAction<number>>;
    bal: number;
    setBal: React.Dispatch<React.SetStateAction<number>>;
    secondarySkillLevels: Record<string, number>;
    setSecondarySkillLevels: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    showMsg: (msg: string, duration?: number, isExtra?: boolean) => void;
}

export const useSecondaryPrestigeSkills = (props: SecondaryPrestigeSkillsProps) => {
    const {
        prestigePoints, setPrestigePoints, bal, setBal,
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
            showMsg(`Insuficiente. Custa ${cost.toFixed(2)} ${skill.costType === 'pa' ? 'PA' : '$'}.`, 2000, true);
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
        
        setSecondarySkillLevels(p => ({ ...p, [id]: currentLevel + 1 }));
        showMsg(`Comprou ${skill.name} Nível ${currentLevel + 1}!`, 3000);
    }, [prestigePoints, bal, getSecondarySkillLevel, setPrestigePoints, setBal, setSecondarySkillLevels, showMsg]);

    // Calculate skill effects
    const startStopBonus = getSecondarySkillLevel('startStop') * 10;
    const cashbackMultiplier = getSecondarySkillLevel('cashback') * 0.01;
    const passiveSalary = getSecondarySkillLevel('salary') * 0.10;
    const isEchoUnlocked = getSecondarySkillLevel('echo') > 0;
    
    const creditCardLevel = getSecondarySkillLevel('bankruptcy');
    const creditLimit = creditCardLevel > 0 ? (50 * creditCardLevel + 50 * Math.pow(1.25, creditCardLevel)) : 0;
    
    const hydraMultiplier = Math.pow(1.005, getSecondarySkillLevel('hydra'));
    const priceIncreaseModifier = 1 - (getSecondarySkillLevel('decelerometer') * 0.02);
    const multUpgradeBonus = getSecondarySkillLevel('increment') * 0.01;

    return {
        secondarySkillLevels,
        getSecondarySkillLevel,
        buySecondarySkill,
        startStopBonus,
        cashbackMultiplier,
        passiveSalary,
        isEchoUnlocked,
        creditLimit,
        hydraMultiplier,
        priceIncreaseModifier,
        multUpgradeBonus,
    };
};