import React from 'react';
import { SECONDARY_SKILLS, SECONDARY_SKILL_TREE_LAYOUT } from '../../../constants/secondarySkills';
import type { SecondarySkill, SecondarySkillId } from '../../../types';
import SecondarySkillNode from './SecondarySkillNode';

interface SecondarySkillTreeProps {
    prestigePoints: number;
    bal: number;
    setBal: React.Dispatch<React.SetStateAction<number>>;
    secondarySkillLevels: Record<string, number>;
    buySecondarySkill: (id: SecondarySkillId) => void;
    getSecondarySkillLevel: (id: SecondarySkillId) => number;
}

const SecondarySkillTree: React.FC<SecondarySkillTreeProps> = (props) => {
    const { prestigePoints, bal, buySecondarySkill, getSecondarySkillLevel } = props;

    const isSkillAvailable = (skill: SecondarySkill): boolean => {
        if (skill.dependencies.length === 0) return true;
        return skill.dependencies.every(dep => getSecondarySkillLevel(dep.id) >= dep.level);
    };

    return (
        <div className="bg-black/50 p-6 rounded-b-2xl rounded-tr-2xl border-2 border-t-0 border-purple-500 shadow-[0_0_15px_#a855f7,0_0_25px_#8b5cf6] w-full h-full overflow-y-auto">
            <h2 className="text-3xl font-bold text-purple-400 neon-glow-text mb-6 text-center">Árvore de Habilidades Secundária</h2>
            <div className="space-y-8">
                {SECONDARY_SKILL_TREE_LAYOUT.map((tierData, tierIndex) => (
                    <div key={tierIndex}>
                        {tierData.groups.map((group, groupIndex) => (
                            <div key={groupIndex} className="relative mb-8">
                                 {tierIndex > 0 && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 h-4 w-px bg-purple-500/50"></div>
                                )}
                                <div className="flex flex-col sm:flex-row justify-center items-stretch gap-4">
                                    {group.skills.map(skillId => {
                                        const skill = SECONDARY_SKILLS[skillId as SecondarySkillId];
                                        if (!skill) return null;
                                        return (
                                            <div key={skillId} className="flex-1 min-w-[200px]">
                                                <SecondarySkillNode
                                                    skill={skill}
                                                    level={getSecondarySkillLevel(skillId as SecondarySkillId)}
                                                    isAvailable={isSkillAvailable(skill)}
                                                    prestigePoints={prestigePoints}
                                                    bal={bal}
                                                    buySkill={buySecondarySkill}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SecondarySkillTree;