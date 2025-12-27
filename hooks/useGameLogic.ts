import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useGameState } from './useGameState';
import { useFebreDoce } from './useFebreDoce';
import { useSpinLogic } from './useSpinLogic';
import { useShopLogic } from './useShopLogic';
import { usePrestigeSkills } from './usePrestigeSkills';
import { useSecondaryPrestigeSkills } from './useSecondaryPrestigeSkills';
import { useScratchCardLogic } from './useScratchCardLogic';
import { usePassiveIncome } from './usePassiveIncome';
import { useSnakeUpgrades } from './useSnakeUpgrades';
import { useFurnaceLogic } from './useFurnaceLogic';
import { useBakeryLogic } from './useBakeryLogic';
import { useParaisoDoceDetector } from './useParaisoDoceDetector';
import { PRESTIGE_BASE_REQUIREMENT, PRESTIGE_GROWTH_FACTOR, CASH_TO_PA_RATIO } from '../constants/prestige';
import type { SkillId, SecondarySkillId, RenegotiationTier, SymbolKey } from '../types';

export const useGameLogic = () => {
    const [winMsg, setWinMsg] = useState('');
    const [extraMsg, setExtraMsg] = useState('');
    const [msgTimeout, setMsgTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

    const [isSnakeGameActive, setIsSnakeGameActive] = useState(false);
    const [isCreditCardModalOpen, setIsCreditCardModalOpen] = useState(false);
    const [isPaymentDueModalOpen, setIsPaymentDueModalOpen] = useState(false);
    const [isItemPenaltyModalOpen, setIsItemPenaltyModalOpen] = useState(false);

    const showMsg = useCallback((message: string, duration = 3000, isExtra = false) => {
        if (isExtra) setExtraMsg(message);
        else setWinMsg(message);
        if (msgTimeout) clearTimeout(msgTimeout);
        const timeout = setTimeout(() => {
            if (isExtra) setExtraMsg('');
            else setWinMsg('');
        }, duration);
        setMsgTimeout(timeout);
    }, [msgTimeout]);

    const gameState = useGameState({ showMsg });
    
    // Paraiso Doce Detector
    const paraisoDetector = useParaisoDoceDetector();
    
    const secondarySkills = useSecondaryPrestigeSkills({
        prestigePoints: gameState.prestigePoints,
        setPrestigePoints: gameState.setPrestigePoints,
        bal: gameState.bal,
        setBal: gameState.setBal,
        sugar: gameState.sugar,
        setSugar: gameState.setSugar,
        setMult: gameState.setMult,
        setBonusMult: gameState.setBonusMult,
        secondarySkillLevels: gameState.secondarySkillLevels,
        setSecondarySkillLevels: gameState.setSecondarySkillLevels,
        showMsg
    });

    const prestigeSkills = usePrestigeSkills({
        prestigePoints: gameState.prestigePoints,
        setPrestigePoints: gameState.setPrestigePoints,
        skillLevels: gameState.skillLevels,
        setSkillLevels: gameState.setSkillLevels,
        setInv: gameState.setInv,
        showMsg,
    });

    const finalGainCalculation = useCallback((baseAmount: number) => {
        if (baseAmount <= 0) return 0;
        const afterLinear = baseAmount * prestigeSkills.grandeGanhoMultiplier;
        const final = afterLinear > 1 
            ? Math.pow(afterLinear, secondarySkills.hydraExponent)
            : afterLinear;
        return final;
    }, [prestigeSkills.grandeGanhoMultiplier, secondarySkills.hydraExponent]);

    const secondarySkillsRef = useRef(secondarySkills);
    useEffect(() => { secondarySkillsRef.current = secondarySkills; }, [secondarySkills]);

    const handleSpend = useCallback((cost: number): boolean => {
        if (gameState.bal >= cost) {
            gameState.setBal(b => b - cost);
            return true;
        }
        const fromCredit = cost - gameState.bal;
        if (secondarySkills.getSecondarySkillLevel('bankruptcy') > 0 && gameState.creditCardDebt + fromCredit <= secondarySkills.creditLimit) {
            gameState.setBal(0);
            gameState.setCreditCardDebt(d => d + fromCredit);
            return true;
        }
        showMsg("Saldo e limite de crédito insuficientes.", 2000, true);
        return false;
    }, [gameState.bal, gameState.creditCardDebt, secondarySkills.creditLimit, secondarySkills, showMsg]);

    const handleGain = useCallback((amount: number) => {
        gameState.setBal(b => b + amount);
    }, [gameState]);

    // 🍭 HELPER: Processa recompensas do Paraíso Doce
    const handleParaisoReward = useCallback((amount: number, message: string) => {
        handleGain(amount);
        showMsg(message, 3000, true);
    }, [handleGain, showMsg]);

    const furnaceLogic = useFurnaceLogic({
        sugar: gameState.sugar,
        setSugar: gameState.setSugar,
        activeCookies: gameState.activeCookies,
        setActiveCookies: gameState.setActiveCookies,
        showMsg
    });

    const snakeUpgrades = useSnakeUpgrades({
        bal: gameState.bal,
        setBal: gameState.setBal,
        handleSpend,
        snakeUpgrades: gameState.snakeUpgrades,
        setSnakeUpgrades: gameState.setSnakeUpgrades,
        showMsg
    });

    const bakeryLogic = useBakeryLogic({
        sugar: gameState.sugar,
        setSugar: gameState.setSugar,
        bal: gameState.bal,
        handleSpend,
        handleGain,
        bakeryState: gameState.bakery,
        setBakeryState: gameState.setBakeryState,
        showMsg,
        applyFinalGain: finalGainCalculation,
        priceIncreaseModifier: secondarySkills.priceIncreaseModifier
    });

    const febreDoce = useFebreDoce({
        roiSaldo: gameState.roiSaldo,
        setRoiSaldo: gameState.setRoiSaldo,
        inv: gameState.inv,
        setInv: gameState.setInv,
        mult: gameState.mult,
        setMult: gameState.setMult,
        bal: gameState.bal,
        setBal: gameState.setBal,
        showMsg,
        feverSnapshot: gameState.feverSnapshot,
        setFeverSnapshot: gameState.setFeverSnapshot,
        paraisoDetector, // PASSA O DETECTOR
    });

    const spinLogic = useSpinLogic({
        ...gameState,
        febreDocesAtivo: febreDoce.feverPhase === 'ACTIVE',
        endFever: febreDoce.endFever,
        febreDocesGiros: febreDoce.febreDocesGiros,
        setFebreDocesGiros: febreDoce.setFebreDocesGiros,
        betValFebre: febreDoce.betValFebre,
        applyFinalGain: finalGainCalculation,
        showMsg, setWinMsg,
        cashbackMultiplier: secondarySkills.cashbackMultiplier,
        creditLimit: secondarySkills.creditLimit,
        multUpgradeBonus: secondarySkills.multUpgradeBonus,
        handleSpend, handleGain,
        sweetLadder: febreDoce.sweetLadder,
        paraisoDetector,
    });

    const shopLogic = useShopLogic({
        ...gameState,
        setBonusMult: gameState.setBonusMult,
        midMultiplierValue: spinLogic.midMultiplierValue,
        economiaCostMultiplier: prestigeSkills.economiaCostMultiplier,
        getSkillLevel: prestigeSkills.getSkillLevel,
        showMsg,
        cashbackMultiplier: secondarySkills.cashbackMultiplier,
        priceIncreaseModifier: secondarySkills.priceIncreaseModifier,
        multUpgradeBonus: secondarySkills.multUpgradeBonus,
        isSnakeGameUnlocked: secondarySkills.getSecondarySkillLevel('snakeGame') > 0,
        startSnakeGame: () => setIsSnakeGameActive(true),
        handleSpend, handleGain,
        totalTokenPurchases: gameState.totalTokenPurchases,
        mortgageUsages: gameState.mortgageUsages,
        sugar: gameState.sugar
    });

    const scratchCardLogic = useScratchCardLogic({
        ...gameState,
        unluckyPot: gameState.unluckyPot,
        setUnluckyPot: gameState.setUnluckyPot,
        scratchMetrics: gameState.scratchMetrics,
        setScratchMetrics: gameState.setScratchMetrics,
        lotericaState: gameState.lotericaState,
        setLotericaState: gameState.setLotericaState,
        applyFinalGain: finalGainCalculation,
        showMsg
    });

    usePassiveIncome({
        ...gameState,
        getSkillLevel: prestigeSkills.getSkillLevel,
        passiveSalary: secondarySkills.passiveSalary,
        echoChance: secondarySkills.echoChance,
        applyFinalGain: finalGainCalculation,
        showMsg, handleGain
    });

    const prestigeRequirement = useMemo(() => PRESTIGE_BASE_REQUIREMENT * Math.pow(PRESTIGE_GROWTH_FACTOR, gameState.prestigeLevel), [gameState.prestigeLevel]);

    const handlePrestige = useCallback(() => {
        if (gameState.bal < prestigeRequirement) {
            showMsg(`Meta não atingida! Falta $${(prestigeRequirement - gameState.bal).toFixed(2)}.`, 2000, true);
            return;
        }
        const pointsEarned = Math.floor(gameState.bal / CASH_TO_PA_RATIO);
        
        const currentSS = secondarySkillsRef.current;
        const initialBal = 100 + currentSS.startStopBonus;
        const initialSugar = currentSS.startStopSugar;
        const initialCloverMult = currentSS.startStopCloverMultBonus;

        gameState.softReset({
            points: gameState.prestigePoints + pointsEarned,
            level: gameState.prestigeLevel + 1,
            initialBal,
            initialSugar,
            initialCloverMult
        });
    }, [gameState, prestigeRequirement, showMsg]);

    const currentInstallment = useMemo(() => {
        const den = [24, 48, 60][gameState.renegotiationTier] || 24;
        const rate = [1.15, 1.21, 1.29][gameState.renegotiationTier] || 1.15;
        return (gameState.creditCardDebt * rate) / den;
    }, [gameState.creditCardDebt, gameState.renegotiationTier]);

    const handlePayInstallment = useCallback(() => {
        if (handleSpend(currentInstallment)) {
            gameState.setCreditCardDebt(d => Math.max(0, d - currentInstallment));
            showMsg(`Parcela de $${currentInstallment.toFixed(2)} paga!`, 2000, true);
            setIsPaymentDueModalOpen(false);
        }
    }, [handleSpend, currentInstallment, gameState, showMsg]);

    const handlePostponeInstallment = useCallback(() => {
        gameState.setCreditCardDebt(d => d + currentInstallment * 0.1);
        gameState.setMissedPayments(m => m + 1);
        setIsPaymentDueModalOpen(false);
        showMsg("Parcela adiada com 10% de juros.", 2000, true);
    }, [currentInstallment, gameState, showMsg]);

    const handlePayItemPenalty = useCallback((items: Partial<Record<SymbolKey, number>>) => {
        gameState.setInv(prev => {
            const next = { ...prev };
            Object.entries(items).forEach(([k, v]) => {
                next[k as SymbolKey] = Math.max(0, (next[k as SymbolKey] || 0) - (v as number));
            });
            return next;
        });
        gameState.setIsBettingLocked(false);
        gameState.setItemPenaltyDue(null);
        setIsItemPenaltyModalOpen(false);
        showMsg("Multa paga! Apostas liberadas.", 3000, true);
    }, [gameState, showMsg]);

    return {
        ...gameState, ...febreDoce, ...spinLogic, ...shopLogic, ...prestigeSkills, ...secondarySkills,
        ...scratchCardLogic, ...snakeUpgrades, ...furnaceLogic, ...bakeryLogic,
        bakeryState: gameState.bakery,
        winMsg, extraMsg, setWinMsg, showMsg, prestigeRequirement, handlePrestige,
        isPoolInvalid: spinLogic.pool.length <= 1,
        applyFinalGain: finalGainCalculation,
        febreDocesAtivo: febreDoce.feverPhase === 'ACTIVE',
        isSnakeGameUnlocked: secondarySkills.getSecondarySkillLevel('snakeGame') > 0,
        isSnakeGameActive,
        startSnakeGame: () => setIsSnakeGameActive(true),
        endSnakeGame: (score: number) => {
            setIsSnakeGameActive(false);
            const baseWinnings = ((0.05 * score * score) + (0.55 * score) + 0.4) * snakeUpgrades.scoreMultiplier;
            const final = finalGainCalculation(baseWinnings);
            handleGain(final);
        },
        paraisoDetector,
        handleParaisoReward, // 🍭 EXPORTA O HELPER
        isBankrupt: secondarySkills.getSecondarySkillLevel('bankruptcy') > 0 && gameState.creditCardDebt >= secondarySkills.creditLimit,
        creditCardLevel: secondarySkills.getSecondarySkillLevel('bankruptcy'),
        openCreditCardModal: () => setIsCreditCardModalOpen(true),
        closeCreditCardModal: () => setIsCreditCardModalOpen(false),
        isCreditCardModalOpen,
        payOffCreditCardDebt: () => {
            if (handleSpend(gameState.creditCardDebt)) {
                gameState.setCreditCardDebt(0);
                showMsg("Dívida quitada!", 2000, true);
            }
        },
        renegotiateCreditCard: (tier: RenegotiationTier) => gameState.setRenegotiationTier(tier),
        takeCreditCardLoan: (amount: number) => {
            gameState.setCreditCardDebt(d => d + amount);
            handleGain(amount);
            showMsg(`Empréstimo de $${amount.toFixed(2)} recebido!`, 2000, true);
        },
        currentInstallment,
        handlePayInstallment,
        isPaymentDueModalOpen,
        closePaymentDueModal: () => setIsPaymentDueModalOpen(false),
        handlePostponeInstallment,
        isItemPenaltyModalOpen,
        closeItemPenaltyModal: () => setIsItemPenaltyModalOpen(false),
        handlePayItemPenalty,
        criarEmbaixadorDoce: () => {}
    };
};
