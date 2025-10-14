import React from 'react';
import type { Skill, SkillId } from '../../../types';

interface SkillNodeProps {
    skill: Skill;
    level: number;
    prestigePoints: number;
    isAvailable: boolean;
    buySkill: (id: SkillId) => void;
}

const SkillNode: React.FC<SkillNodeProps> = ({ skill, level, prestigePoints, isAvailable, buySkill }) => {
    const isMaxLevel = level >= skill.maxLevel;
    const cost = isMaxLevel ? 0 : skill.getCost(level);
    const canAfford = prestigePoints >= cost;

    const baseClasses = "relative bg-black/50 p-4 rounded-lg border-2 transition-all duration-300 w-full text-left";
    const availabilityClasses = isAvailable 
        ? "border-purple-500 shadow-[0_0_8px_#a855f7] hover:border-purple-400 hover:scale-105" 
        : "border-gray-700 bg-black/70 text-gray-500";
    
    const btnClasses = `
        w-full mt-3 py-2 px-3 font-bold text-sm rounded-md transition-all duration-200
        disabled:cursor-not-allowed disabled:transform-none
    `;
    const btnActiveClasses = "bg-yellow-500 text-stone-900 hover:bg-yellow-400 active:scale-95";
    const btnDisabledClasses = "bg-gray-600 text-gray-400 opacity-70";
    const btnMaxedClasses = "bg-green-600 text-white cursor-default";

    return (
        <div className={`${baseClasses} ${availabilityClasses}`}>
            <h4 className={`font-bold text-lg ${isAvailable ? 'text-purple-300' : ''}`}>{skill.name}</h4>
            <div className={`absolute top-2 right-3 px-2 py-0.5 rounded text-xs font-bold ${isAvailable ? 'bg-purple-500/50 text-purple-200' : 'bg-gray-600'}`}>
                {level} / {skill.maxLevel}
            </div>
            <p className="text-sm mt-1 min-h-[40px] text-gray-300">{skill.description(level)}</p>
            <button
                onClick={() => buySkill(skill.id)}
                disabled={!isAvailable || isMaxLevel || !canAfford}
                className={`
                    ${btnClasses} 
                    ${isMaxLevel ? btnMaxedClasses : (isAvailable && canAfford ? btnActiveClasses : btnDisabledClasses)}
                `}
            >
                {isMaxLevel ? 'MAX' : `Custo: ${cost} PA`}
            </button>
        </div>
    );
};

export default SkillNode;