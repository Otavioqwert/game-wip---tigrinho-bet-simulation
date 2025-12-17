
import React from 'react';
import type { SecondarySkill, SecondarySkillId } from '../../../types';

interface SecondarySkillNodeProps {
    skill: SecondarySkill;
    level: number;
    prestigePoints: number;
    bal: number;
    isAvailable: boolean;
    buySkill: (id: SecondarySkillId) => void;
}

const SecondarySkillNode: React.FC<SecondarySkillNodeProps> = ({ skill, level, prestigePoints, bal, isAvailable, buySkill }) => {
    const isMaxLevel = level >= skill.maxLevel;
    const cost = isMaxLevel ? 0 : skill.getCost(level);
    const canAfford = skill.costType === 'pa' ? prestigePoints >= cost : bal >= cost;
    const costString = skill.costType === 'pa' ? `${cost} PA` : `$${cost.toFixed(0)}`;

    const icons: Record<string, string> = {
        startStop: '⏹️',
        snakeGame: '🐍',
        cashback: '💸',
        salary: '💼',
        decelerometer: '⏱️',
        sideQuest: '📜',
        hyperInterest: '💹',
        bankruptcy: '💳',
        mortgage: '🏠',
        ownBoss: '👔',
        echo: '🗣️',
        increment: '➕',
        hydra: '🐉'
    };

    const baseClasses = "relative w-24 h-24 sm:w-28 sm:h-28 flex flex-col items-center justify-center rounded-xl border-2 transition-all duration-300 cursor-pointer";
    
    const statusClasses = isMaxLevel 
        ? "border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
        : isAvailable 
            ? (canAfford ? "border-sky-500 bg-sky-500/10 hover:scale-105 shadow-[0_0_10px_rgba(14,165,233,0.2)]" : "border-sky-900 bg-black/40 opacity-80")
            : "border-gray-800 bg-gray-900/50 grayscale cursor-not-allowed opacity-40";

    return (
        <div className="relative group z-10 hover:z-50">
            <div 
                onClick={() => isAvailable && !isMaxLevel && canAfford && buySkill(skill.id)}
                className={`${baseClasses} ${statusClasses}`}
            >
                <span className="text-3xl sm:text-4xl mb-1">{icons[skill.id] || '🌀'}</span>
                <span className="text-[10px] font-black uppercase text-white/70 tracking-tighter text-center px-1 leading-tight">
                    {skill.name}
                </span>
                
                <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 shadow-lg
                    ${isMaxLevel ? 'bg-amber-600 border-amber-400' : 'bg-sky-600 border-sky-400'}`}>
                    {level}
                </div>

                {!isMaxLevel && isAvailable && (
                     <div className="absolute bottom-1 left-2 right-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-yellow-500" 
                            style={{ width: `${Math.min(100, ((skill.costType === 'pa' ? prestigePoints : bal) / (cost || 1)) * 100)}%` }}
                        />
                     </div>
                )}
            </div>

            {/* TOOLTIP: Corrigido com group-hover no pai */}
            <div className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-3 bg-gray-900 border-2 border-sky-500 rounded-lg shadow-2xl pointer-events-none text-left z-[60]">
                <h4 className="font-bold text-sky-300 text-sm border-b border-sky-500/30 pb-1 mb-1">{skill.name}</h4>
                <p className="text-[11px] text-gray-300 leading-tight mb-2">
                    {skill.description(level)}
                </p>
                {!isMaxLevel ? (
                    <div className="flex justify-between items-center mt-1 pt-1 border-t border-white/10">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">Custo:</span>
                        <span className={`text-xs font-black ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                            {costString}
                        </span>
                    </div>
                ) : (
                    <p className="text-center text-amber-400 font-black text-[10px] uppercase">Nível Máximo</p>
                )}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-sky-500"></div>
            </div>
        </div>
    );
};

export default SecondarySkillNode;
