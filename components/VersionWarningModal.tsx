// ⚠️ Modal de aviso de incompatibilidade de versão

import React from 'react';
import type { VersionCompatibility } from '../utils/saveVersioning';

interface VersionWarningModalProps {
    compatibility: VersionCompatibility;
    onContinue: () => void;
    onCancel: () => void;
    onDownload: () => void; // Faz backup antes de continuar
}

export function VersionWarningModal({
    compatibility,
    onContinue,
    onCancel,
    onDownload
}: VersionWarningModalProps) {
    const getRiskColor = () => {
        switch (compatibility.risk) {
            case 'critical': return 'from-red-600 to-red-800';
            case 'high': return 'from-orange-600 to-red-600';
            case 'medium': return 'from-yellow-600 to-orange-600';
            case 'low': return 'from-blue-600 to-yellow-600';
            default: return 'from-green-600 to-blue-600';
        }
    };
    
    const getRiskIcon = () => {
        switch (compatibility.risk) {
            case 'critical': return '⛔';
            case 'high': return '🚨';
            case 'medium': return '⚠️';
            case 'low': return 'ℹ️';
            default: return '✅';
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl border-2 border-red-500/50 shadow-2xl max-w-lg w-full overflow-hidden">
                {/* Header */}
                <div className={`bg-gradient-to-r ${getRiskColor()} p-6`}>
                    <div className="flex items-center gap-3">
                        <div className="text-4xl">{getRiskIcon()}</div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                Incompatibilidade de Versão
                            </h2>
                            <p className="text-white/80 text-sm mt-1">
                                Save: v{compatibility.saveVersion} | Código: v{compatibility.codeVersion}
                            </p>
                        </div>
                    </div>
                </div>
                
                {/* Body */}
                <div className="p-6 space-y-4">
                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                        <p className="text-white text-sm leading-relaxed">
                            {compatibility.message}
                        </p>
                    </div>
                    
                    {compatibility.missingFeatures.length > 0 && (
                        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                            <h3 className="text-red-400 font-semibold text-sm mb-2">
                                ⛔ Features do save que NÃO existem nesta versão:
                            </h3>
                            <ul className="text-red-300 text-xs space-y-1">
                                {compatibility.missingFeatures.map(f => (
                                    <li key={f} className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                                        <code className="bg-black/30 px-2 py-0.5 rounded">{f}</code>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    {compatibility.extraFeatures.length > 0 && (
                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                            <h3 className="text-blue-400 font-semibold text-sm mb-2">
                                ℹ️ Features NOVAS que estarão zeradas:
                            </h3>
                            <ul className="text-blue-300 text-xs space-y-1">
                                {compatibility.extraFeatures.slice(0, 5).map(f => (
                                    <li key={f} className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                        <code className="bg-black/30 px-2 py-0.5 rounded">{f}</code>
                                    </li>
                                ))}
                                {compatibility.extraFeatures.length > 5 && (
                                    <li className="text-blue-400/60 text-xs">
                                        ... e mais {compatibility.extraFeatures.length - 5}
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}
                    
                    {compatibility.canAutoMigrate && (
                        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                            <p className="text-green-400 text-sm flex items-center gap-2">
                                <span>✅</span>
                                <span>Migração automática disponível! O save será ajustado automaticamente.</span>
                            </p>
                        </div>
                    )}
                    
                    {compatibility.requiresManualAction && (
                        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                            <p className="text-yellow-400 text-sm flex items-center gap-2">
                                <span>⚠️</span>
                                <span>
                                    <strong>Recomendado:</strong> Faça backup do save antes de continuar.
                                    Você pode perder progressão ou encontrar bugs.
                                </span>
                            </p>
                        </div>
                    )}
                </div>
                
                {/* Actions */}
                <div className="bg-slate-800/50 p-6 flex gap-3">
                    {compatibility.requiresManualAction && (
                        <button
                            onClick={onDownload}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2"
                        >
                            📥 Fazer Backup Primeiro
                        </button>
                    )}
                    
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors"
                    >
                        ❌ Cancelar
                    </button>
                    
                    {compatibility.compatible && (
                        <button
                            onClick={onContinue}
                            className={`flex-1 px-4 py-3 bg-gradient-to-r ${
                                compatibility.risk === 'critical' || compatibility.risk === 'high'
                                    ? 'from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700'
                                    : 'from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                            } rounded-lg text-white font-medium transition-all`}
                        >
                            {compatibility.canAutoMigrate ? '✅ Continuar e Migrar' : '⚠️ Carregar Mesmo Assim'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}