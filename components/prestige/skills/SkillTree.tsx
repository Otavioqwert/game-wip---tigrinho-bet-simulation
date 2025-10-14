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
        <div className="bg-black/50 p-6 rounded-2xl border-2 border-purple-500 shadow-[0_0_15px_#a855f7,0_0_25px_#8b5cf6] w-full">
            <h2 className="text-3xl font-bold text-purple-400 neon-glow-text mb-6 text-center">Árvore de Habilidades</h2>
            <div className="space-y-8">
                {SKILL_TREE_LAYOUT.map((tier, tierIndex) => (
                    <div key={tierIndex} className="relative">
                        {/* Render connector lines for tiers after the first one */}
                        {tierIndex > 0 && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 h-4 w-px bg-purple-500/50"></div>
                        )}
                        <div className="flex flex-col sm:flex-row justify-center items-stretch gap-4">
                           {tier.map(skillId => {
                                const skill = SKILLS[skillId];
                                if (!skill) return null;
                                return (
                                    <div key={skillId} className="flex-1 min-w-[200px]">
                                        <SkillNode 
                                            skill={skill}
                                            level={getSkillLevel(skillId)}
                                            isAvailable={isSkillAvailable(skill)}
                                            prestigePoints={prestigePoints}
                                            buySkill={buySkill}
                                        />
                                    </div>
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