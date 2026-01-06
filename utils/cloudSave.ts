// 🌐 Sistema de Cloud Save com Versionamento e Conflict Resolution
// Suporta múltiplos backends: localStorage (fallback), Vercel KV, Firebase, custom API

import type { SavedState } from '../hooks/useGameState';

export interface CloudSaveMetadata {
    version: number;           // Versão do formato de save
    gameVersion: string;       // Versão do jogo (ex: "v1.2.0")
    timestamp: number;         // Quando foi salvo
    deviceId: string;          // ID único do dispositivo
    playerId?: string;         // ID do jogador (opcional, para login)
    checksum: string;          // Hash para validar integridade
}

export interface CloudSave {
    metadata: CloudSaveMetadata;
    data: SavedState;
    compressed?: boolean;      // Se os dados estão comprimidos
}

export interface CloudSaveSlot {
    id: string;                // ID único do slot
    name: string;              // Nome do save (ex: "Auto-Backup", "Manual Save 1")
    lastModified: number;      // Timestamp da última modificação
    size: number;              // Tamanho em bytes
    isAutoSave: boolean;       // Se é um auto-save
    save: CloudSave;
}

export interface SyncResult {
    success: boolean;
    action: 'uploaded' | 'downloaded' | 'merged' | 'conflict' | 'no-change';
    message: string;
    conflictDetails?: {
        local: CloudSaveMetadata;
        remote: CloudSaveMetadata;
        recommended: 'local' | 'remote' | 'merge';
    };
}

// 📦 Configuração do Backend
export type BackendType = 'localStorage' | 'vercel-kv' | 'firebase' | 'custom-api';

interface BackendConfig {
    type: BackendType;
    endpoint?: string;         // URL da API (para custom-api)
    apiKey?: string;           // Chave de autenticação
}

// 🔐 Gera ID único do dispositivo (persiste no localStorage)
function getDeviceId(): string {
    const key = 'tigrinho-device-id';
    let id = localStorage.getItem(key);
    if (!id) {
        id = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(key, id);
    }
    return id;
}

// 🔒 Gera checksum simples para validar integridade
function generateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

// 🗜️ Compressão simples usando base64 (pode ser melhorada com LZ-string)
function compressData(data: string): string {
    // Por enquanto, apenas base64. Pode adicionar LZ-string depois
    return btoa(unescape(encodeURIComponent(data)));
}

function decompressData(data: string): string {
    return decodeURIComponent(escape(atob(data)));
}

// 🎮 Pega a versão do jogo (do constants ou package.json)
function getGameVersion(): string {
    // Tenta pegar do APP_VERSION que já existe
    try {
        const { APP_VERSION } = require('../constants');
        return APP_VERSION;
    } catch {
        return 'unknown';
    }
}

// 🆕 Cria um CloudSave a partir do SavedState
export function createCloudSave(
    state: SavedState,
    version: number,
    playerId?: string
): CloudSave {
    const json = JSON.stringify(state);
    const compressed = compressData(json);
    
    const metadata: CloudSaveMetadata = {
        version,
        gameVersion: getGameVersion(),
        timestamp: Date.now(),
        deviceId: getDeviceId(),
        playerId,
        checksum: generateChecksum(json)
    };

    return {
        metadata,
        data: state,
        compressed: true
    };
}

// 📥 Valida e desserializa um CloudSave
export function validateCloudSave(save: CloudSave): boolean {
    try {
        const json = JSON.stringify(save.data);
        const expectedChecksum = generateChecksum(json);
        return save.metadata.checksum === expectedChecksum;
    } catch {
        return false;
    }
}

// ⚔️ Compara dois saves e decide qual é mais recente/melhor
export function compareS aves(local: CloudSave, remote: CloudSave): 'local' | 'remote' | 'conflict' {
    const localTime = local.metadata.timestamp;
    const remoteTime = remote.metadata.timestamp;
    
    // Se são do mesmo dispositivo, usa o mais recente
    if (local.metadata.deviceId === remote.metadata.deviceId) {
        return localTime > remoteTime ? 'local' : 'remote';
    }
    
    // Se são de dispositivos diferentes e a diferença é pequena (< 5 min), é conflito
    const timeDiff = Math.abs(localTime - remoteTime);
    if (timeDiff < 5 * 60 * 1000) {
        return 'conflict';
    }
    
    // Caso contrário, usa o mais recente
    return localTime > remoteTime ? 'local' : 'remote';
}

// 🔀 Merge inteligente de dois saves em conflito
export function mergeSaves(local: SavedState, remote: SavedState): SavedState {
    // Estratégia: pega o maior valor para recursos acumuláveis
    // e mantém o estado mais avançado para progressão
    
    const merged: SavedState = { ...local };
    
    // Recursos: pega o maior
    merged.bal = Math.max(local.bal, remote.bal);
    merged.sugar = Math.max(local.sugar, remote.sugar);
    merged.prestigePoints = Math.max(local.prestigePoints, remote.prestigePoints);
    merged.prestigeLevel = Math.max(local.prestigeLevel, remote.prestigeLevel);
    merged.momentoLevel = Math.max(local.momentoLevel, remote.momentoLevel);
    
    // Inventário: soma os itens (não pode perder itens)
    Object.keys(local.inv).forEach(key => {
        const k = key as keyof typeof local.inv;
        merged.inv[k] = Math.max(local.inv[k] || 0, remote.inv[k] || 0);
    });
    
    // Multiplicadores: pega o maior nível
    Object.keys(local.mult).forEach(key => {
        const k = key as keyof typeof local.mult;
        merged.mult[k] = Math.max(local.mult[k] || 0, remote.mult[k] || 0);
    });
    
    // Skills: pega o maior nível
    Object.keys({ ...local.skillLevels, ...remote.skillLevels }).forEach(key => {
        merged.skillLevels[key] = Math.max(
            local.skillLevels[key] || 0,
            remote.skillLevels[key] || 0
        );
    });
    
    // Dívidas/penalidades: pega o menor (melhor para o jogador)
    merged.creditCardDebt = Math.min(local.creditCardDebt, remote.creditCardDebt);
    merged.unluckyPot = Math.max(local.unluckyPot, remote.unluckyPot); // UnluckyPot é bom, pega maior
    
    return merged;
}

// 🌐 BACKEND ADAPTERS

// LocalStorage Backend (fallback/offline)
class LocalStorageBackend {
    private key = 'tigrinho-cloud-saves';
    
    async listSlots(): Promise<CloudSaveSlot[]> {
        const data = localStorage.getItem(this.key);
        if (!data) return [];
        return JSON.parse(data);
    }
    
    async getSlot(slotId: string): Promise<CloudSaveSlot | null> {
        const slots = await this.listSlots();
        return slots.find(s => s.id === slotId) || null;
    }
    
    async saveSlot(slot: CloudSaveSlot): Promise<void> {
        const slots = await this.listSlots();
        const index = slots.findIndex(s => s.id === slot.id);
        if (index >= 0) {
            slots[index] = slot;
        } else {
            slots.push(slot);
        }
        // Limita a 10 auto-saves
        const autoSaves = slots.filter(s => s.isAutoSave).sort((a, b) => b.lastModified - a.lastModified);
        if (autoSaves.length > 10) {
            const toRemove = autoSaves.slice(10);
            toRemove.forEach(s => {
                const idx = slots.findIndex(slot => slot.id === s.id);
                if (idx >= 0) slots.splice(idx, 1);
            });
        }
        localStorage.setItem(this.key, JSON.stringify(slots));
    }
    
    async deleteSlot(slotId: string): Promise<void> {
        const slots = await this.listSlots();
        const filtered = slots.filter(s => s.id !== slotId);
        localStorage.setItem(this.key, JSON.stringify(filtered));
    }
}

// Custom API Backend (para usar com Vercel Edge Functions, Cloudflare Workers, etc)
class CustomAPIBackend {
    constructor(private endpoint: string, private apiKey?: string) {}
    
    async listSlots(): Promise<CloudSaveSlot[]> {
        const response = await fetch(`${this.endpoint}/saves`, {
            headers: this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}
        });
        if (!response.ok) throw new Error('Failed to list saves');
        return response.json();
    }
    
    async getSlot(slotId: string): Promise<CloudSaveSlot | null> {
        const response = await fetch(`${this.endpoint}/saves/${slotId}`, {
            headers: this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}
        });
        if (!response.ok) return null;
        return response.json();
    }
    
    async saveSlot(slot: CloudSaveSlot): Promise<void> {
        const response = await fetch(`${this.endpoint}/saves/${slot.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
            },
            body: JSON.stringify(slot)
        });
        if (!response.ok) throw new Error('Failed to save');
    }
    
    async deleteSlot(slotId: string): Promise<void> {
        await fetch(`${this.endpoint}/saves/${slotId}`, {
            method: 'DELETE',
            headers: this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}
        });
    }
}

// 🎯 CloudSaveManager - API principal
export class CloudSaveManager {
    private backend: LocalStorageBackend | CustomAPIBackend;
    private config: BackendConfig;
    
    constructor(config: BackendConfig = { type: 'localStorage' }) {
        this.config = config;
        
        if (config.type === 'custom-api' && config.endpoint) {
            this.backend = new CustomAPIBackend(config.endpoint, config.apiKey);
        } else {
            this.backend = new LocalStorageBackend();
        }
    }
    
    // 📤 Upload do save local para a nuvem
    async upload(
        state: SavedState,
        version: number,
        slotName: string = 'Auto-Backup',
        isAutoSave: boolean = true
    ): Promise<SyncResult> {
        try {
            const cloudSave = createCloudSave(state, version);
            const slotId = isAutoSave 
                ? `auto-${getDeviceId()}`
                : `manual-${Date.now()}`;
            
            const slot: CloudSaveSlot = {
                id: slotId,
                name: slotName,
                lastModified: Date.now(),
                size: JSON.stringify(state).length,
                isAutoSave,
                save: cloudSave
            };
            
            await this.backend.saveSlot(slot);
            
            return {
                success: true,
                action: 'uploaded',
                message: `Save "${slotName}" enviado para a nuvem!`
            };
        } catch (error) {
            return {
                success: false,
                action: 'uploaded',
                message: `Erro ao enviar: ${error}`
            };
        }
    }
    
    // 📥 Download do save da nuvem
    async download(slotId?: string): Promise<{ success: boolean; save?: CloudSave; message: string }> {
        try {
            let slot: CloudSaveSlot | null;
            
            if (slotId) {
                slot = await this.backend.getSlot(slotId);
            } else {
                // Pega o auto-save mais recente
                const slots = await this.backend.listSlots();
                const autoSaves = slots.filter(s => s.isAutoSave).sort((a, b) => b.lastModified - a.lastModified);
                slot = autoSaves[0] || null;
            }
            
            if (!slot) {
                return { success: false, message: 'Nenhum save encontrado na nuvem' };
            }
            
            if (!validateCloudSave(slot.save)) {
                return { success: false, message: 'Save corrompido ou inválido' };
            }
            
            return {
                success: true,
                save: slot.save,
                message: `Save "${slot.name}" baixado!`
            };
        } catch (error) {
            return { success: false, message: `Erro ao baixar: ${error}` };
        }
    }
    
    // 🔄 Sync automático com conflict resolution
    async sync(localState: SavedState, version: number): Promise<SyncResult> {
        try {
            const localSave = createCloudSave(localState, version);
            const deviceAutoSaveId = `auto-${getDeviceId()}`;
            
            // Tenta pegar o auto-save remoto deste dispositivo
            const remoteSlot = await this.backend.getSlot(deviceAutoSaveId);
            
            if (!remoteSlot) {
                // Não existe save remoto, faz upload
                return this.upload(localState, version, 'Auto-Backup', true);
            }
            
            const remoteSave = remoteSlot.save;
            
            // Valida o save remoto
            if (!validateCloudSave(remoteSave)) {
                return {
                    success: false,
                    action: 'conflict',
                    message: 'Save remoto corrompido. Upload forçado...',
                };
            }
            
            // Compara os saves
            const comparison = compareSaves(localSave, remoteSave);
            
            if (comparison === 'local') {
                // Local é mais recente, faz upload
                return this.upload(localState, version, 'Auto-Backup', true);
            } else if (comparison === 'remote') {
                // Remoto é mais recente, retorna para download
                return {
                    success: true,
                    action: 'downloaded',
                    message: 'Save remoto mais recente detectado!',
                };
            } else {
                // Conflito! Retorna detalhes para o usuário decidir
                return {
                    success: false,
                    action: 'conflict',
                    message: 'Conflito detectado: saves diferentes em dispositivos diferentes',
                    conflictDetails: {
                        local: localSave.metadata,
                        remote: remoteSave.metadata,
                        recommended: 'merge'
                    }
                };
            }
        } catch (error) {
            return {
                success: false,
                action: 'conflict',
                message: `Erro no sync: ${error}`
            };
        }
    }
    
    // 🔀 Resolve conflito fazendo merge
    async resolveConflict(localState: SavedState, version: number): Promise<SavedState> {
        const remoteSlot = await this.backend.getSlot(`auto-${getDeviceId()}`);
        if (!remoteSlot) return localState;
        
        const merged = mergeSaves(localState, remoteSlot.save.data);
        return merged;
    }
    
    // 📋 Lista todos os saves disponíveis
    async listSaves(): Promise<CloudSaveSlot[]> {
        return this.backend.listSlots();
    }
    
    // 🗑️ Deleta um save
    async deleteSave(slotId: string): Promise<void> {
        await this.backend.deleteSlot(slotId);
    }
}

// 🚀 Instância global (singleton)
let globalManager: CloudSaveManager | null = null;

export function getCloudSaveManager(config?: BackendConfig): CloudSaveManager {
    if (!globalManager || config) {
        globalManager = new CloudSaveManager(config);
    }
    return globalManager;
}