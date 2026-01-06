// 🔄 Sistema de Versionamento e Migração de Saves
// Previne saves corrompidos quando o código faz rollback para versões antigas

import type { SavedState } from '../hooks/useGameState';
import { INITIAL_INVENTORY, INITIAL_MULTIPLIERS } from '../constants';

// 📊 Histórico de versões com features adicionadas
export const VERSION_HISTORY = [
    { version: 1, date: '2025-01', features: ['Sistema básico de inventario e multiplicadores'] },
    { version: 5, date: '2025-02', features: ['Prestígio inicial', 'Skills básicos'] },
    { version: 10, date: '2025-03', features: ['Snake upgrades', 'Scratch cards'] },
    { version: 15, date: '2025-04', features: ['Sistema de dívida (creditCardDebt)', 'Unlucky pot'] },
    { version: 20, date: '2025-05', features: ['Momento system', 'Secondary skills', 'Cookies ativos'] },
    { version: 25, date: '2025-06', features: ['Confeitaria/Bakery', 'Crafting slots', 'Sugar system expandido'] },
    { version: 29, date: '2026-01', features: ['Fever snapshot isolation', 'Bakery slot validation', 'RoiSaldo tracking'] },
] as const;

// 🚨 Features críticas que não podem ser removidas sem quebrar o jogo
const CRITICAL_FEATURES = ['bal', 'inv', 'mult', 'betVal'];

// ⚠️ Features que podem ser removidas com segurança (reset para default)
const SAFE_REMOVABLE_FEATURES = [
    'bakery',           // Pode voltar pro estado inicial
    'activeCookies',    // Lista vazia é ok
    'feverSnapshot',    // Pode usar EMPTY_FEVER_SNAPSHOT
    'scratchMetrics',   // Pode resetar
    'lotericaState',    // Pode resetar
];

export interface VersionCompatibility {
    compatible: boolean;
    risk: 'none' | 'low' | 'medium' | 'high' | 'critical';
    saveVersion: number;
    codeVersion: number;
    message: string;
    missingFeatures: string[];   // Features que o código não tem mas o save tem
    extraFeatures: string[];     // Features que o código tem mas o save não tem
    canAutoMigrate: boolean;
    requiresManualAction: boolean;
}

// 🔍 Verifica compatibilidade entre versão do save e do código
export function checkVersionCompatibility(
    saveVersion: number,
    codeVersion: number,
    saveData: SavedState
): VersionCompatibility {
    // Mesma versão = 100% compatível
    if (saveVersion === codeVersion) {
        return {
            compatible: true,
            risk: 'none',
            saveVersion,
            codeVersion,
            message: 'Save 100% compatível com o código atual',
            missingFeatures: [],
            extraFeatures: [],
            canAutoMigrate: false,
            requiresManualAction: false
        };
    }
    
    // Save mais NOVO que o código (ROLLBACK)
    if (saveVersion > codeVersion) {
        const versionDiff = saveVersion - codeVersion;
        const missingFeatures = detectMissingFeatures(saveData);
        const hasCriticalFeatures = missingFeatures.some(f => CRITICAL_FEATURES.includes(f));
        
        let risk: VersionCompatibility['risk'];
        let message: string;
        let canAutoMigrate = false;
        let requiresManualAction = false;
        
        if (hasCriticalFeatures) {
            risk = 'critical';
            message = `⛔ BLOQUEADO: Save da v${saveVersion} contém features críticas que não existem na v${codeVersion}. Carregamento pode crashar o jogo.`;
            requiresManualAction = true;
        } else if (versionDiff >= 10) {
            risk = 'high';
            message = `⚠️ ALTO RISCO: Save é ${versionDiff} versões mais novo. Algumas features podem não funcionar. Recomendado fazer backup antes de carregar.`;
            canAutoMigrate = true;
            requiresManualAction = true;
        } else if (versionDiff >= 5) {
            risk = 'medium';
            message = `⚠️ RISCO MÉDIO: Save da v${saveVersion}, código na v${codeVersion}. Downgrade automático disponível, mas pode perder progressão recente.`;
            canAutoMigrate = true;
        } else {
            risk = 'low';
            message = `⚠️ Risco Baixo: Save ${versionDiff} versões à frente. Downgrade automático será aplicado.`;
            canAutoMigrate = true;
        }
        
        return {
            compatible: !hasCriticalFeatures,
            risk,
            saveVersion,
            codeVersion,
            message,
            missingFeatures,
            extraFeatures: [],
            canAutoMigrate,
            requiresManualAction
        };
    }
    
    // Save mais ANTIGO que o código (UPGRADE)
    const versionDiff = codeVersion - saveVersion;
    let risk: VersionCompatibility['risk'] = 'none';
    let message = `✅ Save da v${saveVersion} será atualizado para v${codeVersion} automaticamente.`;
    
    if (versionDiff >= 10) {
        risk = 'low';
        message = `ℹ️ Save muito antigo (v${saveVersion}). Será atualizado, mas algumas features novas estarão zeradas.`;
    }
    
    return {
        compatible: true,
        risk,
        saveVersion,
        codeVersion,
        message,
        missingFeatures: [],
        extraFeatures: detectExtraFeatures(saveData),
        canAutoMigrate: true,
        requiresManualAction: false
    };
}

// 🔍 Detecta features que o save tem mas o código não tem
function detectMissingFeatures(saveData: SavedState): string[] {
    const missing: string[] = [];
    
    // Verifica se o save tem propriedades que não estão no tipo SavedState atual
    const currentKeys = Object.keys(getInitialSaveState());
    const saveKeys = Object.keys(saveData);
    
    saveKeys.forEach(key => {
        if (!currentKeys.includes(key)) {
            missing.push(key);
        }
    });
    
    return missing;
}

// 🔍 Detecta features que o código tem mas o save não tem
function detectExtraFeatures(saveData: SavedState): string[] {
    const extra: string[] = [];
    
    const currentKeys = Object.keys(getInitialSaveState());
    const saveKeys = Object.keys(saveData);
    
    currentKeys.forEach(key => {
        if (!saveKeys.includes(key)) {
            extra.push(key);
        }
    });
    
    return extra;
}

// 🛠️ Estado inicial padrão (copiado de useGameState)
function getInitialSaveState(): SavedState {
    return {
        bal: 100,
        betVal: 1,
        inv: { ...INITIAL_INVENTORY },
        mult: { ...INITIAL_MULTIPLIERS },
        bonusMult: { ...INITIAL_MULTIPLIERS },
        roiSaldo: { '🍭': 0, '🍦': 0, '🍧': 0 },
        panificadoraLevel: { '🍭': 0, '🍦': 0, '🍧': 0 },
        estrelaPrecoAtual: 25,
        prestigePoints: 0,
        prestigeLevel: 0,
        skillLevels: {},
        secondarySkillLevels: {},
        snakeUpgrades: {},
        scratchCardPurchaseCounts: {},
        unluckyPot: 0,
        momentoLevel: 0,
        momentoProgress: 0,
        creditCardDebt: 0,
        renegotiationTier: 0,
        missedPayments: 0,
        paymentDueDate: null,
        isBettingLocked: false,
        itemPenaltyDue: null,
        sugar: 0,
        activeCookies: [],
        scratchMetrics: {
            tierPurchaseCounts: new Array(10).fill(0),
            tierLastPurchase: new Array(10).fill(0),
            tierCooldownRemaining: new Array(10).fill(0)
        },
        lotericaState: {
            lastInjectionTime: new Array(10).fill(0),
            injectionCooldownRemaining: new Array(10).fill(0),
            totalInjections: new Array(10).fill(0)
        },
        totalTokenPurchases: 0,
        mortgageUsages: 0,
        bakery: {
            inventory: { cookie: 0, cupcake: 0, cake: 0 },
            upgradeLevels: { cookie: 0, cupcake: 0, cake: 0 },
            craftingSlots: [
                { id: 0, productId: null, startTime: null, endTime: null, quantity: 0 }
            ],
            extraSlots: 0,
            speedLevel: 0
        },
        feverSnapshot: {
            hasSnapshot: false,
            snapshotInv: { ...INITIAL_INVENTORY },
            snapshotMult: { ...INITIAL_MULTIPLIERS }
        }
    } as SavedState;
}

// ⬇️ Faz downgrade seguro de um save "do futuro" para a versão atual
export function downgradeSave(saveData: SavedState, targetVersion: number): SavedState {
    const initial = getInitialSaveState();
    const downgraded: any = { ...initial };
    
    // Copia apenas as propriedades que existem no estado inicial (versão atual)
    Object.keys(initial).forEach(key => {
        if (key in saveData) {
            // Se a propriedade existe no save, usa o valor do save
            downgraded[key] = (saveData as any)[key];
        }
        // Senão, mantém o valor inicial
    });
    
    // Remove propriedades "do futuro" que não existem no código atual
    Object.keys(saveData).forEach(key => {
        if (!(key in initial) && !SAFE_REMOVABLE_FEATURES.includes(key)) {
            console.warn(`[SaveVersioning] Propriedade "${key}" removida no downgrade para v${targetVersion}`);
        }
    });
    
    return downgraded as SavedState;
}

// ⬆️ Faz upgrade de um save antigo para a versão atual
export function upgradeSave(saveData: SavedState, targetVersion: number): SavedState {
    const initial = getInitialSaveState();
    const upgraded = { ...initial, ...saveData };
    
    // Preenche propriedades que não existiam na versão antiga com valores default
    Object.keys(initial).forEach(key => {
        if (!(key in saveData)) {
            console.info(`[SaveVersioning] Propriedade "${key}" adicionada no upgrade para v${targetVersion}`);
        }
    });
    
    return upgraded as SavedState;
}

// 🔒 Valida se um save pode ser carregado com segurança
export function canSafelyLoadSave(
    saveVersion: number,
    codeVersion: number,
    saveData: SavedState
): { canLoad: boolean; reason?: string; needsMigration: boolean } {
    const compat = checkVersionCompatibility(saveVersion, codeVersion, saveData);
    
    if (!compat.compatible) {
        return {
            canLoad: false,
            reason: compat.message,
            needsMigration: false
        };
    }
    
    if (compat.risk === 'critical') {
        return {
            canLoad: false,
            reason: 'Save contém features críticas inexistentes nesta versão do código',
            needsMigration: false
        };
    }
    
    return {
        canLoad: true,
        needsMigration: saveVersion !== codeVersion
    };
}

// 🔄 Migra um save para a versão correta automaticamente
export function migrateSave(
    saveData: SavedState,
    saveVersion: number,
    targetVersion: number
): { success: boolean; data?: SavedState; error?: string } {
    try {
        if (saveVersion === targetVersion) {
            return { success: true, data: saveData };
        }
        
        if (saveVersion > targetVersion) {
            // Downgrade
            const downgraded = downgradeSave(saveData, targetVersion);
            return { success: true, data: downgraded };
        } else {
            // Upgrade
            const upgraded = upgradeSave(saveData, targetVersion);
            return { success: true, data: upgraded };
        }
    } catch (error) {
        return {
            success: false,
            error: `Erro na migração: ${error}`
        };
    }
}