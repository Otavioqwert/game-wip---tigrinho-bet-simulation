import React, { useCallback } from 'react';
import { SNAKE_UPGRADES, calculateSnakeUpgradeCost } from '../constants/snakeUpgrades';
import type { SnakeUpgradeId } from '../types';

interface SnakeUpgradesProps {
    bal: number;
    handleSpend: (cost: number) => boolean;
    snakeUpgrades: Record<string, number>;
    setSnakeUpgrades: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    showMsg: (msg: string, duration?: number, isExtra?: boolean) => void;
}

export const useSnakeUpgrades = (props: SnakeUpgradesProps) => {
    const { bal, handleSpend, snakeUpgrades, setSnakeUpgrades, showMsg } = props;

    const getUpgradeLevel = useCallback((id: SnakeUpgradeId) => snakeUpgrades[id] || 0, [snakeUpgrades]);

    const buySnakeUpgrade = useCallback((id: SnakeUpgradeId) => {
        const upgrade = SNAKE_UPGRADES[id];
        if (!upgrade) return;

        const currentLevel = getUpgradeLevel(id);
        if (currentLevel >= upgrade.maxLevel) {
            showMsg("Nível máximo atingido.", 2000, true);
            return;
        }

        const cost = calculateSnakeUpgradeCost(upgrade, currentLevel);
        
        if (handleSpend(cost)) {
            setSnakeUpgrades(p => ({ ...p, [id]: (p[id] || 0) + 1 }));
            showMsg(`Comprou ${upgrade.nome} Nível ${currentLevel + 1}!`, 3000, true);
        }

    }, [getUpgradeLevel, handleSpend, setSnakeUpgrades, showMsg]);

    // --- Calculated Effects ---
    const ticketCost = 10 * (1 - Math.min(
        SNAKE_UPGRADES.turboCash.efeitoMaximo || 0.5,
        getUpgradeLevel('turboCash') * SNAKE_UPGRADES.turboCash.efeitoPorNivel
    ));

    const scoreMultiplier = (1 + getUpgradeLevel('basicMultiplier') * SNAKE_UPGRADES.basicMultiplier.efeitoPorNivel) *
                            (1 + getUpgradeLevel('premiumMultiplier') * SNAKE_UPGRADES.premiumMultiplier.efeitoPorNivel);

    const snakeGameSettings = {
        speedModifier: 1 - Math.min(
            SNAKE_UPGRADES.slowSpeed.efeitoMaximo || 0.25,
            getUpgradeLevel('slowSpeed') * SNAKE_UPGRADES.slowSpeed.efeitoPorNivel
        ),
        initialLength: 3 - getUpgradeLevel('smallerStart'),
        lives: 1 + getUpgradeLevel('secondChance'),
        goldenAppleChance: Math.min(
            SNAKE_UPGRADES.goldenApple.efeitoMaximo || 0.5,
            getUpgradeLevel('goldenApple') * SNAKE_UPGRADES.goldenApple.efeitoPorNivel
        ),
        frenzyChance: Math.min(
            SNAKE_UPGRADES.frenzy.efeitoMaximo || 0.25,
            getUpgradeLevel('frenzy') * SNAKE_UPGRADES.frenzy.efeitoPorNivel
        ),
        applePointBonus: Math.min(
            SNAKE_UPGRADES.comboMaster.efeitoMaximo || 0.5,
            getUpgradeLevel('comboMaster') * SNAKE_UPGRADES.comboMaster.efeitoPorNivel
        )
    };
    
    return {
        snakeUpgrades,
        buySnakeUpgrade,
        getUpgradeLevel,
        ticketCost,
        scoreMultiplier,
        snakeGameSettings,
    };
};