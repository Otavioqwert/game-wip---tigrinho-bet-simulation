import React, { useCallback } from 'react';
import { SKILLS } from '../constants/skills';
import type { SkillId, Inventory } from '../types';

interface PrestigeSkillsProps {
    prestigePoints: number;
    setPrestigePoints: React.Dispatch<React.SetStateAction<number>>;
    skillLevels: Record<string, number>;
    setSkillLevels: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    setInv: React.Dispatch<React.SetStateAction<Inventory>>;
    showMsg: (msg: string, duration?: number, isExtra?: boolean) => void;
}

export const usePrestigeSkills = (props: PrestigeSkillsProps) => {
    const { prestigePoints, setPrestigePoints, skillLevels, setSkillLevels, setInv, showMsg } = props;

    const getSkillLevel = useCallback((id: SkillId) => skillLevels[id] || 0, [skillLevels]);

    const buySkill = useCallback((id: SkillId) => {
        const skill = SKILLS[id];
        if (!skill) return;

        const currentLevel = skillLevels[id] || 0; // Use state directly
        if (currentLevel >= skill.maxLevel) {
            showMsg("Nível máximo atingido.", 2000, true);
            return;
        }

        const cost = skill.getCost(currentLevel);
        if (prestigePoints < cost) {
            showMsg(`PA insuficiente. Custa ${cost} PA.`, 2000, true);
            return;
        }

        // Check dependencies using state directly
        for (const dep of skill.dependencies) {
            if ((skillLevels[dep.id] || 0) < dep.level) {
                showMsg(`Requer ${SKILLS[dep.id].name} Nível ${dep.level}.`, 3000, true);
                return;
            }
        }
        
        setPrestigePoints(p => p - cost);
        setSkillLevels(p => ({ ...p, [id]: (p[id] || 0) + 1 }));
        showMsg(`Comprou ${skill.name} Nível ${currentLevel + 1}!`, 3000);

        // Handle one-off purchase effects
        if (id === 'caminhoEstelar' && currentLevel === 0) {
            setInv(p => ({...p, '⭐': (p['⭐'] || 0) + 3}));
            showMsg("+3 ⭐ adicionados ao inventário!", 3000, true);
        }

    }, [prestigePoints, skillLevels, setPrestigePoints, setSkillLevels, showMsg, setInv]);

    const grandeGanhoMultiplier = 1 + (getSkillLevel('grandeGanho') * 0.01);
    const economiaCostMultiplier = 1 - (getSkillLevel('caminhoEconomia') * 0.05);
    
    return {
        buySkill,
        getSkillLevel,
        grandeGanhoMultiplier,
        economiaCostMultiplier,
    };
};
