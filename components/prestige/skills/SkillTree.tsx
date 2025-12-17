
import React from 'react';
import { SKILLS, SKILL_TREE_LAYOUT } from '../../../constants/skills';
import type { Skill, SkillId } from '../../../types';
import SkillNode from './SkillNode';

interface SkillTreeProps {
    prestigePoints: number;
    skillLevels: Record<string, number>;
    buySkill: (id: SkillId) => void;
    getSkillLevel: (id: SkillId) => number;
}

const SkillTree: React.FC<SkillTreeProps> = (props) => {
    const { prestigePoints, buySkill, getSkillLevel } = props;

    const isSkillAvailable = (skill: Skill): boolean => {
        if (skill.dependencies.length === 0) return true;
        return skill.dependencies.every(dep => getSkillLevel(dep.id) >= dep.level);
    };

    return (
        <div className="bg-black/50 p-6 rounded-2xl border-2 border-purple-500 shadow-[0_0_15px_#a855f7,0_0_25px_#8b5cf6] w-full min-h-[400px]">
            <h2 className="text-2xl font-bold text-purple-400 neon-glow-text mb-8 text-center uppercase tracking-widest">Habilidades Primárias</h2>
            <div className="flex flex-col items-center gap-12">
                {SKILL_TREE_LAYOUT.map((tier, tierIndex) => (
                    <div key={tierIndex} className="relative flex flex-col items-center w-full">
                        {/* Linha conectora vertical entre Tiers */}
                        {tierIndex > 0 && (
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-1 h-12 bg-gradient-to-b from-purple-900 to-purple-500 opacity-50"></div>
                        )}
                        
                        <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
                           {tier.map(skillId => {
                                const skill = SKILLS[skillId];
                                if (!skill) return null;
                                return (
                                    <SkillNode 
                                        key={skillId}
                                        skill={skill}
                                        level={getSkillLevel(skillId)}
                                        isAvailable={isSkillAvailable(skill)}
                                        prestigePoints={prestigePoints}
                                        buySkill={buySkill}
                                    />
                                );
                           })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SkillTree;
