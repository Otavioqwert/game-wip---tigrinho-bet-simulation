import React from 'react';
import { SNAKE_UPGRADES, calculateSnakeUpgradeCost, SNAKE_UPGRADE_LAYOUT } from '../../../constants/snakeUpgrades';
import type { SnakeUpgradeId } from '../../../types';

interface SnakeUpgradesProps {
    bal: number;
    snakeUpgrades: Record<string, number>;
    buySnakeUpgrade: (id: SnakeUpgradeId) => void;
}

const SnakeUpgrades: React.FC<SnakeUpgradesProps> = ({ bal, snakeUpgrades, buySnakeUpgrade }) => {
    
    const UpgradeNode: React.FC<{ upgradeId: SnakeUpgradeId }> = ({ upgradeId }) => {
        const upgrade = SNAKE_UPGRADES[upgradeId];
        const level = snakeUpgrades[upgradeId] || 0;
        const isMaxLevel = level >= upgrade.maxLevel;
        const cost = isMaxLevel ? 0 : calculateSnakeUpgradeCost(upgrade, level);
        const canAfford = bal >= cost;

        const btnClasses = "w-full mt-2 py-1.5 px-2 font-bold text-sm rounded-md transition-all duration-200 disabled:cursor-not-allowed";
        const btnActiveClasses = "bg-yellow-500 text-stone-900 hover:bg-yellow-400 active:scale-95";
        const btnDisabledClasses = "bg-gray-600 text-gray-400 opacity-70";
        const btnMaxedClasses = "bg-green-600 text-white cursor-default";

        return (
            <div className="bg-black/30 p-3 rounded-lg text-left h-full flex flex-col">
                <div className="flex-grow">
                    <div className="flex justify-between items-start">
                        <h4 className="font-bold text-green-300 pr-2">{upgrade.nome}</h4>
                        <span className="text-xs font-bold bg-green-500/30 text-green-200 px-2 py-0.5 rounded-full flex-shrink-0">
                            {level}/{upgrade.maxLevel}
                        </span>
                    </div>
                    <p className="text-xs text-gray-300 mt-1 min-h-[3em]">{upgrade.description(level)}</p>
                </div>
                <button
                    onClick={() => buySnakeUpgrade(upgrade.id)}
                    disabled={isMaxLevel || !canAfford}
                    className={`${btnClasses} ${isMaxLevel ? btnMaxedClasses : (canAfford ? btnActiveClasses : btnDisabledClasses)}`}
                >
                    {isMaxLevel ? 'MAX' : `Custo: $${cost.toFixed(2)}`}
                </button>
            </div>
        );
    };

    return (
        <div className="text-white h-full overflow-y-auto">
            <h3 className="text-xl font-bold mb-3 text-center">Upgrades da Cobrinha</h3>
            <p className="text-center text-sm mb-3">Saldo Atual: <span className="font-bold text-yellow-400">${bal.toFixed(2)}</span></p>
            <div className="space-y-4">
                <div>
                    <h4 className="font-bold text-lg text-yellow-400 mb-2 border-b border-yellow-400/30 pb-1">Pontuação</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {SNAKE_UPGRADE_LAYOUT.pontuacao.map(id => <UpgradeNode key={id} upgradeId={id} />)}
                    </div>
                </div>
                 <div>
                    <h4 className="font-bold text-lg text-yellow-400 mb-2 border-b border-yellow-400/30 pb-1">Gameplay</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                         {SNAKE_UPGRADE_LAYOUT.gameplay.map(id => <UpgradeNode key={id} upgradeId={id} />)}
                    </div>
                </div>
                 <div>
                    <h4 className="font-bold text-lg text-yellow-400 mb-2 border-b border-yellow-400/30 pb-1">Especial</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                         {SNAKE_UPGRADE_LAYOUT.especial.map(id => <UpgradeNode key={id} upgradeId={id} />)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SnakeUpgrades;
