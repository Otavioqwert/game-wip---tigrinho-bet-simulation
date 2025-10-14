// FIX: Implemented the main game logic hook to aggregate all other hooks and provide game state and actions to the App component.
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useGameState } from './useGameState';
import { useFebreDoce } from './useFebreDoce';
import { useSpinLogic } from './useSpinLogic';
import { useShopLogic } from './useShopLogic';
import { usePrestigeSkills } from './usePrestigeSkills';
import { useSecondaryPrestigeSkills } from './useSecondaryPrestigeSkills';
import { useScratchCardLogic } from './useScratchCardLogic';
import { usePassiveIncome } from './usePassiveIncome';
import { useSnakeUpgrades } from './useSnakeUpgrades';
import { useCreditCardLogic } from './useCreditCardLogic';
import type { SkillId, SecondarySkillId, RenegotiationTier } from '../types';

export const useGameLogic = () => {
    // --- Message State ---
    const [winMsg, setWinMsg] = useState('');
    const [extraMsg, setExtraMsg] = useState('');
    // FIX: Replaced NodeJS.Timeout with ReturnType<typeof setTimeout> for browser compatibility.
    const [msgTimeout, setMsgTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

    const showMsg = useCallback((message: string, duration = 3000, isExtra = false) => {
        if (isExtra) {
            setExtraMsg(message);
        } else {
            setWinMsg(message);
        }

        if (msgTimeout) clearTimeout(msgTimeout);

        const timeout = setTimeout(() => {
            if (isExtra) setExtraMsg('');
            else setWinMsg('');
        }, duration);
        setMsgTimeout(timeout);
    }, [msgTimeout]);

    // --- Core Game State ---
    const gameState = useGameState({ showMsg });

    // --- Secondary Skills Logic ---
    const secondarySkills = useSecondaryPrestigeSkills({
        prestigePoints: gameState.prestigePoints,
        setPrestigePoints: gameState.setPrestigePoints,
        bal: gameState.bal,
        setBal: gameState.setBal,
        secondarySkillLevels: gameState.secondarySkillLevels,
        setSecondarySkillLevels: gameState.setSecondarySkillLevels,
        showMsg
    });
    
    const creditCardLevel = secondarySkills.getSecondarySkillLevel('bankruptcy');

    // --- Centralized Economy Handlers ---
    const handleSpend = useCallback((cost: number): boolean => {
        if (gameState.bal >= cost) {
            gameState.setBal(b => b - cost);
            return true;
        }
        
        const fromBal = gameState.bal;
        const fromCredit = cost - fromBal;
        
        if (creditCardLevel > 0 && gameState.creditCardDebt + fromCredit <= secondarySkills.creditLimit) {
            gameState.setBal(0);
            gameState.setCreditCardDebt(d => d + fromCredit);
            return true;
        }

        showMsg("Saldo e limite de crédito insuficientes.", 2000, true);
        return false;
    }, [gameState.bal, gameState.setBal, gameState.creditCardDebt, gameState.setCreditCardDebt, secondarySkills.creditLimit, creditCardLevel, showMsg]);

    const handleGain = useCallback((amount: number) => {
        let toBal = amount;
        if (gameState.creditCardDebt > 0) {
            const payDebtAmount = Math.min(gameState.creditCardDebt, amount);
            gameState.setCreditCardDebt(d => d - payDebtAmount);
            toBal -= payDebtAmount;
        }
        if (toBal > 0) {
            gameState.setBal(b => b + toBal);
        }
    }, [gameState.creditCardDebt, gameState.setCreditCardDebt, gameState.setBal]);


    // --- Credit Card Logic ---
    useCreditCardLogic({
        bal: gameState.bal,
        setBal: gameState.setBal,
        creditCardDebt: gameState.creditCardDebt,
        setCreditCardDebt: gameState.setCreditCardDebt,
        renegotiationTier: gameState.renegotiationTier,
        creditCardLevel: creditCardLevel,
    });
    const [isCreditCardModalOpen, setIsCreditCardModalOpen] = useState(false);

    const takeCreditCardLoan = useCallback((amount: number) => {
        const availableCredit = secondarySkills.creditLimit - gameState.creditCardDebt;
        if (amount <= 0) return showMsg("Valor do empréstimo deve ser positivo.", 2000, true);
        if (amount > availableCredit) return showMsg("Valor excede seu limite de crédito disponível.", 2000, true);

        gameState.setCreditCardDebt(d => d + amount);
        gameState.setBal(b => b + amount); // Direct gain, not through handleGain
        showMsg(`Empréstimo de $${amount.toFixed(2)} realizado!`, 3000, true);
    }, [secondarySkills.creditLimit, gameState.creditCardDebt, gameState.setBal, gameState.setCreditCardDebt, showMsg]);

    const payCreditCardInstallment = useCallback(() => {
        const debt = gameState.creditCardDebt;
        if (debt <= 0) return showMsg("Você não tem dívidas.", 2000, true);

        const installmentDenominator = [24, 48, 60][gameState.renegotiationTier];
        const payment = debt / installmentDenominator;

        if (gameState.bal < payment) return showMsg("Saldo insuficiente.", 2000, true);
        
        gameState.setBal(b => b - payment);
        gameState.setCreditCardDebt(d => d - payment);
        showMsg(`Parcela de $${payment.toFixed(2)} paga!`, 2000, true);
        // TODO: Reset 60s timer if possible in a future update
    }, [gameState.bal, gameState.creditCardDebt, gameState.renegotiationTier, gameState.setBal, gameState.setCreditCardDebt, showMsg]);
    
    const payOffCreditCardDebt = useCallback(() => {
        const debt = gameState.creditCardDebt;
        if (debt <= 0) return showMsg("Você não tem dívidas.", 2000, true);
        if (gameState.bal < debt) return showMsg("Saldo insuficiente.", 2000, true);

        gameState.setBal(b => b - debt);
        gameState.setCreditCardDebt(0);
        showMsg(`Dívida de $${debt.toFixed(2)} quitada!`, 3000, true);
    }, [gameState.bal, gameState.creditCardDebt, gameState.setBal, gameState.setCreditCardDebt, showMsg]);

    const renegotiateCreditCard = useCallback((tier: RenegotiationTier) => {
        if (gameState.renegotiationTier >= tier) return showMsg("Plano de renegociação já é igual ou superior.", 3000, true);
        gameState.setRenegotiationTier(tier);
        const installments = tier === 1 ? 48 : 60;
        const interest = tier === 1 ? 21 : 29;
        showMsg(`Dívida renegociada para ${installments} parcelas com ${interest}% de juros.`, 4000, true);
    }, [gameState.renegotiationTier, gameState.setRenegotiationTier, showMsg]);


    // --- Prestige & Main Skills ---
    const prestigeSkills = usePrestigeSkills({
        prestigePoints: gameState.prestigePoints,
        setPrestigePoints: gameState.setPrestigePoints,
        skillLevels: gameState.skillLevels,
        setSkillLevels: gameState.setSkillLevels,
        setInv: gameState.setInv,
        showMsg,
    });
    
    // --- Snake Minigame Upgrades ---
    const snakeUpgrades = useSnakeUpgrades({
        bal: gameState.bal,
        handleSpend: handleSpend,
        snakeUpgrades: gameState.snakeUpgrades,
        setSnakeUpgrades: gameState.setSnakeUpgrades,
        showMsg
    });

    const totalIncomeMultiplier = useMemo(() => {
        return prestigeSkills.grandeGanhoMultiplier * secondarySkills.hydraMultiplier;
    }, [prestigeSkills.grandeGanhoMultiplier, secondarySkills.hydraMultiplier]);

    // --- Snake Minigame Logic ---
    const isSnakeGameUnlocked = secondarySkills.getSecondarySkillLevel('snakeGame') > 0;
    const [isSnakeGameActive, setIsSnakeGameActive] = useState(false);

    const startSnakeGame = useCallback(() => {
        if (handleSpend(snakeUpgrades.ticketCost)) {
            setIsSnakeGameActive(true);
        }
    }, [handleSpend, snakeUpgrades.ticketCost]);

    const endSnakeGame = useCallback((score: number) => {
        setIsSnakeGameActive(false);
        const baseWinnings = (0.05 * score * score) + (0.55 * score) + 0.4;
        const finalMultiplier = totalIncomeMultiplier * snakeUpgrades.scoreMultiplier;
        const winnings = baseWinnings * finalMultiplier;
        showMsg(`Você ganhou $${winnings.toFixed(2)}!`, 3000, true);
        handleGain(winnings);
    }, [handleGain, showMsg, totalIncomeMultiplier, snakeUpgrades.scoreMultiplier]);

    // --- Febre Doce Logic ---
    const febreDoce = useFebreDoce({
        roiSaldo: gameState.roiSaldo,
        setRoiSaldo: gameState.setRoiSaldo,
        inv: gameState.inv,
        setInv: gameState.setInv,
        showMsg,
    });

    // --- Spin Logic ---
    const spinLogic = useSpinLogic({
        bal: gameState.bal,
        betVal: gameState.betVal,
        inv: gameState.inv,
        setInv: gameState.setInv,
        mult: gameState.mult,
        panificadoraLevel: gameState.panificadoraLevel,
        febreDocesAtivo: febreDoce.febreDocesAtivo,
        setFebreDocesAtivo: febreDoce.setFebreDocesAtivo,
        febreDocesGiros: febreDoce.febreDocesGiros,
        setFebreDocesGiros: febreDoce.setFebreDocesGiros,
        betValFebre: febreDoce.betValFebre,
        restoreOriginalState: febreDoce.restoreOriginalState,
        totalIncomeMultiplier: totalIncomeMultiplier,
        skillLevels: gameState.skillLevels,
        showMsg,
        setWinMsg,
        unluckyPot: gameState.unluckyPot,
        setUnluckyPot: gameState.setUnluckyPot,
        cashbackMultiplier: secondarySkills.cashbackMultiplier,
        creditLimit: secondarySkills.creditLimit,
        momento: gameState.momento,
        setMomento: gameState.setMomento,
        maxMomentoReached: gameState.maxMomentoReached,
        setMaxMomentoReached: gameState.setMaxMomentoReached,
        setRoiSaldo: gameState.setRoiSaldo,
        handleSpend,
        handleGain,
    });

    // --- Shop Logic ---
    const shopLogic = useShopLogic({
        bal: gameState.bal,
        inv: gameState.inv,
        setInv: gameState.setInv,
        mult: gameState.mult,
        setMult: gameState.setMult,
        roiSaldo: gameState.roiSaldo,
        setRoiSaldo: gameState.setRoiSaldo,
        panificadoraLevel: gameState.panificadoraLevel,
        setPanificadoraLevel: gameState.setPanificadoraLevel,
        estrelaPrecoAtual: gameState.estrelaPrecoAtual,
        setEstrelaPrecoAtual: gameState.setEstrelaPrecoAtual,
        midMultiplierValue: spinLogic.midMultiplierValue,
        economiaCostMultiplier: prestigeSkills.economiaCostMultiplier,
        getSkillLevel: prestigeSkills.getSkillLevel,
        showMsg,
        cashbackMultiplier: secondarySkills.cashbackMultiplier,
        priceIncreaseModifier: secondarySkills.priceIncreaseModifier,
        multUpgradeBonus: secondarySkills.multUpgradeBonus,
        isSnakeGameUnlocked: isSnakeGameUnlocked,
        startSnakeGame: startSnakeGame,
        handleSpend,
    });
    
    // --- Scratch Card Logic ---
    const scratchCardLogic = useScratchCardLogic({
        bal: gameState.bal,
        unluckyPot: gameState.unluckyPot,
        setUnluckyPot: gameState.setUnluckyPot,
        scratchCardPurchaseCounts: gameState.scratchCardPurchaseCounts,
        setScratchCardPurchaseCounts: gameState.setScratchCardPurchaseCounts,
        totalIncomeMultiplier: totalIncomeMultiplier,
        showMsg,
        handleSpend,
        handleGain,
    });

    // --- Passive Income ---
    usePassiveIncome({
        betVal: gameState.betVal,
        bal: gameState.bal,
        getSkillLevel: prestigeSkills.getSkillLevel,
        passiveSalary: secondarySkills.passiveSalary,
        isEchoUnlocked: secondarySkills.isEchoUnlocked,
        totalIncomeMultiplier: totalIncomeMultiplier,
        showMsg,
        handleGain,
    });

    // --- Prestige Logic ---
    const prestigeRequirement = useMemo(() => 500 * Math.pow(1.5, gameState.prestigeLevel), [gameState.prestigeLevel]);
    const handlePrestige = useCallback(() => {
        if (gameState.bal < prestigeRequirement) return;
        const pointsEarned = Math.floor(gameState.bal / 100);
        const newTotalPoints = gameState.prestigePoints + pointsEarned;
        const newPrestigeLevel = gameState.prestigeLevel + 1;
        
        showMsg(`Você ganhou ${pointsEarned} PA!`, 5000, true);
        
        const initialBal = 100 + secondarySkills.startStopBonus;

        gameState.softReset({
            points: newTotalPoints,
            level: newPrestigeLevel,
            initialBal: initialBal,
        });
    }, [gameState, prestigeRequirement, showMsg, secondarySkills.startStopBonus]);

    const isBankrupt = creditCardLevel > 0 && gameState.creditCardDebt >= secondarySkills.creditLimit;

    return {
        ...gameState,
        ...febreDoce,
        ...spinLogic,
        ...shopLogic,
        ...prestigeSkills,
        ...secondarySkills,
        ...scratchCardLogic,
        ...snakeUpgrades,
        winMsg,
        extraMsg,
        setWinMsg,
        showMsg,
        prestigeRequirement,
        handlePrestige,
        isPoolInvalid: spinLogic.pool.length <= 1,
        totalIncomeMultiplier,
        isSnakeGameUnlocked,
        isSnakeGameActive,
        startSnakeGame,
        endSnakeGame,
        isBankrupt,
        // Credit Card specific
        creditCardLevel,
        isCreditCardModalOpen,
        openCreditCardModal: () => setIsCreditCardModalOpen(true),
        closeCreditCardModal: () => setIsCreditCardModalOpen(false),
        takeCreditCardLoan,
        payCreditCardInstallment,
        payOffCreditCardDebt,
        renegotiateCreditCard,
    };
};