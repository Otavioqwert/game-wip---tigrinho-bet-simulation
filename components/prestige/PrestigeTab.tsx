import React, { useState } from 'react';
import type { SkillId, SecondarySkillId } from '../../types';
import SkillTree from './skills/SkillTree';
import SecondarySkillTree from './skills/SecondarySkillTree';

// This interface is now a superset of props needed by all sub-components
interface PrestigeTabProps {
    bal: number;
    setBal: React.Dispatch<React.SetStateAction<number>>;
    prestigePoints: number;
    setPrestigePoints: React.Dispatch<React.SetStateAction<number>>;
    prestigeLevel: number;
    prestigeRequirement: number;
    handlePrestige: () => void;
    // Main skills
    skillLevels: Record<string, number>;
    buySkill: (id: SkillId) => void;
    getSkillLevel: (id: SkillId) => number;
    // Secondary skills
    secondarySkillLevels: Record<string, number>;
    buySecondarySkill: (id: SecondarySkillId) => void;
    getSecondarySkillLevel: (id: SecondarySkillId) => number;
}


const PrestigeTab: React.FC<PrestigeTabProps> = (props) => {
    const { bal, prestigePoints, prestigeLevel, prestigeRequirement, handlePrestige } = props;
    const [activeTab, setActiveTab] = useState(0);

    const progress = Math.min((bal / prestigeRequirement) * 100, 100);
    const canPrestige = bal >= prestigeRequirement;

    const btnClasses = `
        w-full py-4 text-xl font-bold rounded-lg transition-all duration-300 transform 
        shadow-[0_0_10px_#a855f7,0_0_20px_#8b5cf6] border-2 border-purple-400
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
    `;
    const btnEnabledClasses = 'bg-purple-600 text-white hover:bg-purple-500 hover:scale-105 active:scale-100';
    const btnDisabledClasses = 'bg-gray-700 text-gray-400';
    const tabBtnClasses = (isActive: boolean) => `flex-1 p-2 rounded-t-lg font-bold cursor-pointer transition-colors ${isActive ? 'bg-purple-500/20 text-white' : 'bg-black/20 text-gray-400 hover:bg-black/40'}`;


    return (
        <div className="w-full h-full flex flex-col lg:flex-row items-stretch justify-center gap-8 p-4">
            {/* --- Left Column: Prestige Controls --- */}
            <div className="text-center bg-black/50 p-6 sm:p-8 rounded-2xl border-2 border-purple-500 shadow-[0_0_15px_#a855f7,0_0_25px_#8b5cf6] w-full lg:w-auto lg:max-w-md flex-shrink-0">
                <h2 className="text-4xl font-bold text-purple-400 neon-glow-text mb-2">Prestígio</h2>
                <p className="text-gray-300 text-lg mb-6">Nível de Prestígio: {prestigeLevel}</p>

                <div className="bg-black/30 p-4 rounded-lg mb-6 inner-neon-border border-purple-700">
                    <p className="text-2xl font-bold text-yellow-300 neon-glow-text">
                        {prestigePoints} <span className="text-xl text-purple-300">PA</span>
                    </p>
                    <p className="text-sm text-gray-400">(Pontos de Prestígio)</p>
                </div>

                <div className="mb-6">
                    <h3 className="text-2xl text-white mb-3">Próximo Nível</h3>
                    <div className="w-full bg-gray-800 rounded-full h-6 border-2 border-purple-700 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-purple-500 to-fuchsia-500 h-full rounded-full transition-all duration-500 text-center text-white font-bold text-sm flex items-center justify-center"
                            style={{ width: `${progress}%` }}
                        >
                           {progress.toFixed(0)}%
                        </div>
                    </div>
                    <p className="mt-2 text-lg text-gray-300">
                        Meta: <span className="font-bold text-white">${bal.toFixed(2)}</span> / <span className="font-bold text-yellow-400">${prestigeRequirement.toFixed(2)}</span>
                    </p>
                </div>
                
                <div className="mb-6 text-gray-400 text-sm leading-relaxed">
                    <p>Ao atingir a meta, você pode converter todo o seu dinheiro em <span className="font-bold text-purple-300">Pontos de Prestígio (PA)</span>.</p>
                    <p>Taxa de conversão: <span className="font-bold text-white">1 PA</span> para cada <span className="font-bold text-white">$100</span>.</p>
                    <p className="mt-2 text-yellow-500">Essa ação irá <span className="font-bold">reiniciar seu progresso</span> (dinheiro, itens, etc), mas você manterá seus Pontos de Prestígio e habilidades.</p>
                </div>

                <button
                    onClick={handlePrestige}
                    disabled={!canPrestige}
                    className={`${btnClasses} ${canPrestige ? btnEnabledClasses : btnDisabledClasses}`}
                >
                    Converter em PA e Prestigiar
                </button>
            </div>
            
            {/* --- Right Column: Skill Trees --- */}
            <div className="w-full lg:flex-1 flex flex-col">
                <div className="flex gap-1">
                    <button onClick={() => setActiveTab(0)} className={tabBtnClasses(activeTab === 0)}>Habilidades Principais</button>
                    <button onClick={() => setActiveTab(1)} className={tabBtnClasses(activeTab === 1)}>Árvore Secundária</button>
                </div>

                <div className="flex-grow">
                    {activeTab === 0 && <SkillTree {...props} />}
                    {activeTab === 1 && <SecondarySkillTree {...props} />}
                </div>
            </div>

        </div>
    );
}

export default PrestigeTab;