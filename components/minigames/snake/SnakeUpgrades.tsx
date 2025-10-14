import React, { useState } from 'react';
import { SNAKE_UPGRADES, calculateSnakeUpgradeCost, SNAKE_UPGRADE_LAYOUT } from '../../../constants/snakeUpgrades';
import type { SnakeUpgradeId } from '../../../types';

interface SnakeUpgradesProps {
    bal: number;
    snakeUpgrades: Record<string, number>;
    buySnakeUpgrade: (id: SnakeUpgradeId) => void;
    resetSnakeUpgrades: () => void;
}

const SnakeUpgrades: React.FC<SnakeUpgradesProps> = ({ bal, snakeUpgrades, buySnakeUpgrade, resetSnakeUpgrades }) => {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const handleResetConfirm = () => {
        resetSnakeUpgrades();
        setIsConfirmOpen(false);
    }
    
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

    const modalBtnClasses = "py-2 px-4 font-bold rounded-lg shadow-md transition-colors active:scale-95";

    return (
        <div className="text-white h-full overflow-y-auto">
            {isConfirmOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="relative bg-gradient-to-br from-gray-800 to-black rounded-2xl p-6 shadow-2xl border-2 border-red-500 w-full max-w-md text-white">
                        <h3 className="text-2xl font-bold text-red-500 mb-4">Confirmar Reset</h3>
                        <p className="text-gray-300 mb-6">Tem certeza que deseja resetar todos os upgrades da cobrinha? O custo total será reembolsado.</p>
                        <div className="flex justify-end gap-4">
                            <button onClick={() => setIsConfirmOpen(false)} className={`${modalBtnClasses} bg-gray-600 text-white hover:bg-gray-500`}>Cancelar</button>
                            <button onClick={handleResetConfirm} className={`${modalBtnClasses} bg-red-600 text-white hover:bg-red-500`}>Confirmar</button>
                        </div>
                    </div>
                </div>
            )}
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
                 <div className="pt-4 mt-4 border-t border-red-500/30">
                    <h4 className="font-bold text-lg text-red-400 mb-2 text-center">Opções de Risco</h4>
                     <div className="text-center bg-black/30 p-4 rounded-lg">
                        <button onClick={() => setIsConfirmOpen(true)} className="py-2 px-4 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-500 transition-colors">
                            Resetar Upgrades
                        </button>
                        <p className="text-xs text-gray-400 mt-2">Isso irá resetar todos os upgrades acima e reembolsar o custo total gasto.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SnakeUpgrades;