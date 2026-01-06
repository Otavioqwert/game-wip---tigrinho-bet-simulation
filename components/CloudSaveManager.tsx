// 🌐 Interface visual para gerenciar Cloud Saves

import React, { useState, useEffect } from 'react';
import type { CloudSaveSlot, SyncResult } from '../utils/cloudSave';
import type { UseCloudBackupResult } from '../hooks/useCloudBackup';

interface CloudSaveManagerProps {
    cloudBackup: UseCloudBackupResult;
    onClose: () => void;
}

export function CloudSaveManager({ cloudBackup, onClose }: CloudSaveManagerProps) {
    const [saves, setSaves] = useState<CloudSaveSlot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newSaveName, setNewSaveName] = useState('');
    const [showConflictDialog, setShowConflictDialog] = useState(false);
    
    useEffect(() => {
        loadSaves();
    }, []);
    
    const loadSaves = async () => {
        setIsLoading(true);
        try {
            const list = await cloudBackup.listSaves();
            setSaves(list.sort((a, b) => b.lastModified - a.lastModified));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleUpload = async () => {
        if (!newSaveName.trim()) return;
        await cloudBackup.manualUpload(newSaveName);
        setNewSaveName('');
        loadSaves();
    };
    
    const handleDownload = async (slotId: string) => {
        await cloudBackup.manualDownload(slotId);
        onClose();
    };
    
    const handleDelete = async (slotId: string) => {
        if (confirm('Tem certeza que deseja deletar este save?')) {
            await cloudBackup.deleteSave(slotId);
            loadSaves();
        }
    };
    
    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('pt-BR');
    };
    
    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };
    
    // Detecta se tem conflito no último sync
    const hasConflict = cloudBackup.lastSyncResult?.action === 'conflict';
    
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border-2 border-blue-500/30 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            ☁️ Cloud Save Manager
                        </h2>
                        <p className="text-blue-100 text-sm mt-1">
                            Gerencie seus saves na nuvem
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white text-3xl leading-none"
                    >
                        ×
                    </button>
                </div>
                
                {/* Status do Sync */}
                <div className="p-4 border-b border-slate-700/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {cloudBackup.isSyncing ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
                                    <span className="text-blue-400 text-sm">Sincronizando...</span>
                                </>
                            ) : (
                                <>
                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                    <span className="text-green-400 text-sm">
                                        {cloudBackup.lastSync 
                                            ? `Último sync: ${formatDate(cloudBackup.lastSync)}`
                                            : 'Nunca sincronizado'}
                                    </span>
                                </>
                            )}
                        </div>
                        <button
                            onClick={() => cloudBackup.manualSync()}
                            disabled={cloudBackup.isSyncing}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg text-white text-sm font-medium transition-colors"
                        >
                            🔄 Sincronizar Agora
                        </button>
                    </div>
                    
                    {hasConflict && (
                        <div className="mt-3 p-3 bg-yellow-900/30 border border-yellow-500/50 rounded-lg">
                            <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium mb-2">
                                ⚠️ Conflito Detectado
                            </div>
                            <p className="text-yellow-200 text-xs mb-2">
                                {cloudBackup.lastSyncResult?.message}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => cloudBackup.resolveConflict('keep-local')}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white"
                                >
                                    Manter Local
                                </button>
                                <button
                                    onClick={() => cloudBackup.resolveConflict('keep-remote')}
                                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs text-white"
                                >
                                    Manter Remoto
                                </button>
                                <button
                                    onClick={() => cloudBackup.resolveConflict('merge')}
                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs text-white"
                                >
                                    Mesclar (Recomendado)
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Criar Novo Save */}
                <div className="p-4 border-b border-slate-700/50">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newSaveName}
                            onChange={(e) => setNewSaveName(e.target.value)}
                            placeholder="Nome do novo save..."
                            className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            onKeyPress={(e) => e.key === 'Enter' && handleUpload()}
                        />
                        <button
                            onClick={handleUpload}
                            disabled={!newSaveName.trim() || cloudBackup.isSyncing}
                            className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-600 rounded-lg text-white font-medium transition-all"
                        >
                            📤 Upload
                        </button>
                    </div>
                </div>
                
                {/* Lista de Saves */}
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
                        </div>
                    ) : saves.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <div className="text-4xl mb-2">☁️</div>
                            <p>Nenhum save na nuvem ainda</p>
                            <p className="text-sm mt-1">Crie seu primeiro backup!</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {saves.map(save => (
                                <div
                                    key={save.id}
                                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-blue-500/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-white font-medium">
                                                    {save.name}
                                                </h3>
                                                {save.isAutoSave && (
                                                    <span className="px-2 py-0.5 bg-blue-900/50 border border-blue-500/50 rounded text-blue-300 text-xs">
                                                        Auto
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-400 space-y-0.5">
                                                <div>📅 {formatDate(save.lastModified)}</div>
                                                <div>💾 {formatSize(save.size)}</div>
                                                <div>🎮 Versão {save.save.metadata.version} ({save.save.metadata.gameVersion})</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleDownload(save.id)}
                                                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium transition-colors"
                                            >
                                                📥 Baixar
                                            </button>
                                            {!save.isAutoSave && (
                                                <button
                                                    onClick={() => handleDelete(save.id)}
                                                    className="px-3 py-2 bg-red-600/80 hover:bg-red-700 rounded-lg text-white text-sm font-medium transition-colors"
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}