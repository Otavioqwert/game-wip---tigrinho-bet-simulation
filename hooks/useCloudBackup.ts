// 🔄 Hook para gerenciar backups automáticos na nuvem

import { useEffect, useRef, useState, useCallback } from 'react';
import { getCloudSaveManager, type SyncResult, type CloudSaveSlot, type BackendConfig } from '../utils/cloudSave';
import type { SavedState } from './useGameState';

interface UseCloudBackupOptions {
    enabled: boolean;                // Se o backup automático está ativo
    interval: number;                // Intervalo em ms (padrão: 5 minutos)
    version: number;                 // Versão do save
    getCurrentState: () => SavedState; // Função para pegar o estado atual
    onSyncComplete?: (result: SyncResult) => void; // Callback após sync
    backendConfig?: BackendConfig;   // Configuração do backend
}

interface UseCloudBackupResult {
    isSyncing: boolean;
    lastSync: number | null;
    lastSyncResult: SyncResult | null;
    manualSync: () => Promise<SyncResult>;
    manualUpload: (name: string) => Promise<SyncResult>;
    manualDownload: (slotId?: string) => Promise<void>;
    listSaves: () => Promise<CloudSaveSlot[]>;
    deleteSave: (slotId: string) => Promise<void>;
    resolveConflict: (action: 'keep-local' | 'keep-remote' | 'merge') => Promise<void>;
}

export function useCloudBackup(options: UseCloudBackupOptions): UseCloudBackupResult {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<number | null>(null);
    const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
    
    const managerRef = useRef(getCloudSaveManager(options.backendConfig));
    const optionsRef = useRef(options);
    
    useEffect(() => {
        optionsRef.current = options;
    }, [options]);
    
    // 🔄 Sync automático
    const performSync = useCallback(async () => {
        if (!optionsRef.current.enabled || isSyncing) return;
        
        setIsSyncing(true);
        try {
            const state = optionsRef.current.getCurrentState();
            const result = await managerRef.current.sync(state, optionsRef.current.version);
            
            setLastSyncResult(result);
            setLastSync(Date.now());
            
            if (optionsRef.current.onSyncComplete) {
                optionsRef.current.onSyncComplete(result);
            }
            
            // Se o remoto é mais recente, baixa automaticamente (se não houver conflito)
            if (result.action === 'downloaded' && result.success) {
                const downloadResult = await managerRef.current.download();
                if (downloadResult.success && downloadResult.save) {
                    // Aqui você precisa aplicar o save baixado ao estado do jogo
                    // Isso deve ser feito pelo componente pai via callback
                    console.log('[CloudBackup] Remote save is newer, download available');
                }
            }
            
            return result;
        } catch (error) {
            console.error('[CloudBackup] Sync error:', error);
            const errorResult: SyncResult = {
                success: false,
                action: 'conflict',
                message: `Erro no sync: ${error}`
            };
            setLastSyncResult(errorResult);
            return errorResult;
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing]);
    
    // ⏰ Configura o intervalo de sync automático
    useEffect(() => {
        if (!options.enabled) return;
        
        // Faz o primeiro sync imediatamente
        performSync();
        
        // Configura o intervalo
        const intervalId = setInterval(performSync, options.interval);
        
        return () => clearInterval(intervalId);
    }, [options.enabled, options.interval, performSync]);
    
    // 📤 Upload manual
    const manualUpload = useCallback(async (name: string): Promise<SyncResult> => {
        setIsSyncing(true);
        try {
            const state = optionsRef.current.getCurrentState();
            const result = await managerRef.current.upload(
                state,
                optionsRef.current.version,
                name,
                false // não é auto-save
            );
            setLastSyncResult(result);
            setLastSync(Date.now());
            return result;
        } finally {
            setIsSyncing(false);
        }
    }, []);
    
    // 📥 Download manual
    const manualDownload = useCallback(async (slotId?: string): Promise<void> => {
        setIsSyncing(true);
        try {
            const result = await managerRef.current.download(slotId);
            if (result.success && result.save) {
                // Retorna o save para ser aplicado pelo componente pai
                console.log('[CloudBackup] Download successful:', result.save);
            }
        } finally {
            setIsSyncing(false);
        }
    }, []);
    
    // 📋 Lista saves
    const listSaves = useCallback(async (): Promise<CloudSaveSlot[]> => {
        return managerRef.current.listSaves();
    }, []);
    
    // 🗑️ Deleta save
    const deleteSave = useCallback(async (slotId: string): Promise<void> => {
        await managerRef.current.deleteSave(slotId);
    }, []);
    
    // ⚔️ Resolve conflito
    const resolveConflict = useCallback(async (action: 'keep-local' | 'keep-remote' | 'merge'): Promise<void> => {
        const state = optionsRef.current.getCurrentState();
        
        if (action === 'keep-local') {
            // Força upload do local
            await managerRef.current.upload(state, optionsRef.current.version, 'Conflict Resolution', true);
        } else if (action === 'keep-remote') {
            // Baixa o remoto
            await manualDownload();
        } else if (action === 'merge') {
            // Faz merge inteligente
            const merged = await managerRef.current.resolveConflict(state, optionsRef.current.version);
            // Retorna o merged para ser aplicado
            console.log('[CloudBackup] Merged state:', merged);
        }
    }, [manualDownload]);
    
    return {
        isSyncing,
        lastSync,
        lastSyncResult,
        manualSync: performSync,
        manualUpload,
        manualDownload,
        listSaves,
        deleteSave,
        resolveConflict
    };
}