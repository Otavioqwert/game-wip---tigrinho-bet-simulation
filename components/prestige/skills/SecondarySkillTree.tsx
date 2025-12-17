
import React from 'react';
import { SECONDARY_SKILLS } from '../../../constants/secondarySkills';
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

    const renderNode = (id: SecondarySkillId) => {
        const skill = SECONDARY_SKILLS[id];
        if (!skill) return null;
        return (
            <SecondarySkillNode
                key={id}
                skill={skill}
                level={getSecondarySkillLevel(id)}
                isAvailable={isSkillAvailable(skill)}
                prestigePoints={prestigePoints}
                bal={bal}
                buySkill={buySecondarySkill}
            />
        );
    };

    return (
        <div className="bg-black/50 p-6 rounded-b-2xl rounded-tr-2xl border-2 border-t-0 border-purple-500 shadow-[0_0_15px_#a855f7,0_0_25px_#8b5cf6] w-full h-full overflow-y-auto min-h-[600px]">
            <h2 className="text-2xl font-bold text-sky-400 neon-glow-text mb-10 text-center uppercase tracking-widest">Árvore de Especializações</h2>
            
            <div className="flex flex-col items-center">
                {/* --- Tier 1: Raiz --- */}
                <div className="flex flex-col items-center mb-12">
                    <span className="text-[10px] text-gray-500 font-bold uppercase mb-2">Habilidade Raiz</span>
                    {renderNode('startStop')}
                    <div className="w-1 h-12 bg-gradient-to-b from-sky-500 to-sky-900/50 mt-2"></div>
                </div>

                {/* --- Tier 2 & 3: Caminhos Lineares --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
                    
                    {/* Caminho do Jogo */}
                    <div className="flex flex-col items-center gap-6 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                        <span className="text-xs font-black text-green-400 uppercase">🕹️ Minigames</span>
                        {renderNode('snakeGame')}
                        <div className="w-px h-6 bg-green-500/30"></div>
                        <div className="flex flex-wrap justify-center gap-4">
                            {renderNode('sideQuest')}
                            {renderNode('hyperInterest')}
                        </div>
                    </div>

                    {/* Caminho do Retorno */}
                    <div className="flex flex-col items-center gap-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                        <span className="text-xs font-black text-blue-400 uppercase">💸 Retorno</span>
                        {renderNode('cashback')}
                        <div className="w-px h-6 bg-blue-500/30"></div>
                        <div className="flex flex-wrap justify-center gap-4">
                            {renderNode('bankruptcy')}
                            {renderNode('mortgage')}
                        </div>
                    </div>

                    {/* Caminho da Renda */}
                    <div className="flex flex-col items-center gap-6 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                        <span className="text-xs font-black text-amber-400 uppercase">💼 Salário</span>
                        {renderNode('salary')}
                        <div className="w-px h-6 bg-amber-500/30"></div>
                        <div className="flex flex-wrap justify-center gap-4">
                            {renderNode('ownBoss')}
                            {renderNode('echo')}
                        </div>
                    </div>

                    {/* Caminho da Eficiência */}
                    <div className="flex flex-col items-center gap-6 p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                        <span className="text-xs font-black text-purple-400 uppercase">⚙️ Eficiência</span>
                        {renderNode('decelerometer')}
                        <div className="w-px h-6 bg-purple-500/30"></div>
                        <div className="flex flex-wrap justify-center gap-4">
                            {renderNode('increment')}
                            {renderNode('hydra')}
                        </div>
                    </div>

                </div>
            </div>
            
            <div className="h-24"></div>
        </div>
    );
};

export default SecondarySkillTree;
