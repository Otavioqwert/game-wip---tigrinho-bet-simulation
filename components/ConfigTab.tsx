
import React, { useState, useRef } from 'react';
import { APP_VERSION } from '../constants';

interface ConfigTabProps {
    saveGame: (isManual: boolean) => void;
    hardReset: () => void;
    exportState: () => string;
    importState: (encodedState: string) => boolean;
    showMsg: (message: string, duration?: number, isExtra?: boolean) => void;
}

const ConfigTab: React.FC<ConfigTabProps> = ({ saveGame, hardReset, exportState, importState, showMsg }) => {
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isImportConfirmModalOpen, setIsImportConfirmModalOpen] = useState(false);
    const [importStringToLoad, setImportStringToLoad] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Função de "Hard Refresh" para atualizar o PWA
    const handleUpdateApp = () => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) {
                    registration.unregister();
                }
                window.location.reload();
            });
        } else {
            window.location.reload();
        }
    };

    const handleExportToFile = () => {
        try {
            const code = exportState();
            const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const timestamp = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
            link.download = `tigrinho_save_${timestamp}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showMsg('✅ Arquivo de save gerado!', 3000, true);
        } catch (error) {
            console.error('Failed to export save file:', error);
            showMsg('❌ Falha ao gerar arquivo de save.', 3000, true);
        }
    };

    // CLONE: Gera um HTML standalone com o save embutido
    const handleGenerateSnapshot = () => {
        const stateString = exportState();
        let stateObj: any = {};
        try {
             const parts = stateString.split(':');
             if (parts.length >= 3) {
                 stateObj = JSON.parse(decodeURIComponent(escape(atob(parts[2]))));
             }
        } catch (e) { console.error(e); }

        const htmlContent = `
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Snapshot Tigrinho - ${new Date().toLocaleDateString()}</title>
    <style>
        body { background-color: #0f0f0f; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
        .card { background: linear-gradient(145deg, #1a1a1a, #242424); border: 2px solid #ffd700; border-radius: 20px; padding: 30px; max-width: 400px; width: 100%; box-shadow: 0 10px 30px rgba(255, 215, 0, 0.15); text-align: center; }
        h1 { color: #ffd700; margin-bottom: 5px; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; }
        .badge { background: #333; color: #888; font-size: 12px; padding: 4px 10px; border-radius: 10px; display: inline-block; margin-bottom: 20px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
        .stat-box { background: rgba(0,0,0,0.3); padding: 10px; border-radius: 10px; border: 1px solid #333; }
        .label { font-size: 11px; color: #aaa; text-transform: uppercase; margin-bottom: 5px; display: block; }
        .val { font-weight: bold; color: #4ade80; font-size: 18px; }
        textarea { width: 100%; height: 80px; background: #000; color: #ffeebb; border: 1px solid #555; padding: 10px; border-radius: 8px; font-family: monospace; font-size: 10px; resize: none; margin-bottom: 15px; box-sizing: border-box; }
        button { background: #ffd700; color: #000; border: none; padding: 15px; width: 100%; font-weight: 900; font-size: 16px; border-radius: 10px; cursor: pointer; transition: transform 0.1s; text-transform: uppercase; }
        button:hover { background: #ffea00; transform: scale(1.02); }
        button:active { transform: scale(0.98); }
        .footer { margin-top: 20px; font-size: 11px; color: #555; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Tigrinho Idle</h1>
        <div class="badge">SNAPSHOT DE SEGURANÇA</div>
        
        <div class="grid">
            <div class="stat-box">
                <span class="label">Saldo</span>
                <span class="val">$${(stateObj.bal || 0).toLocaleString(undefined, {maximumFractionDigits:0})}</span>
            </div>
            <div class="stat-box">
                <span class="label">Prestígio (PA)</span>
                <span class="val" style="color: #d8b4fe;">${stateObj.prestigePoints || 0}</span>
            </div>
            <div class="stat-box">
                <span class="label">Tigres 🐯</span>
                <span class="val text-orange">${stateObj.inv?.['🐯'] || 0}</span>
            </div>
            <div class="stat-box">
                <span class="label">Meteoros ☄️</span>
                <span class="val" style="color: #f87171;">${stateObj.inv?.['☄️'] || 0}</span>
            </div>
        </div>
        
        <p style="font-size: 12px; color: #aaa; margin-bottom: 10px;">Copie o código abaixo e cole em "Importar Save" no jogo oficial.</p>
        
        <textarea id="saveString" readonly onclick="this.select()">${stateString}</textarea>
        <button onclick="copySave()">📋 COPIAR SAVE</button>
        
        <div class="footer">Gerado em ${new Date().toLocaleString()}</div>
    </div>
    <script>
        function copySave() {
            var copyText = document.getElementById("saveString");
            copyText.select();
            copyText.setSelectionRange(0, 99999);
            navigator.clipboard.writeText(copyText.value).then(() => {
                const btn = document.querySelector('button');
                const orig = btn.innerText;
                btn.innerText = "✅ COPIADO!";
                btn.style.background = "#4ade80";
                setTimeout(() => { 
                    btn.innerText = orig; 
                    btn.style.background = "#ffd700"; 
                }, 2000);
            });
        }
    </script>
</body>
</html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().slice(0, 10);
        link.download = `Tigrinho_Clone_${timestamp}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showMsg('📄 Clone gerado! Abra o arquivo no navegador.', 3000, true);
    };

    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (text) {
                setImportStringToLoad(text.trim());
                setIsImportConfirmModalOpen(true);
            } else {
                showMsg('❌ Arquivo de save vazio ou inválido.', 3000, true);
            }
            if(event.target) {
                event.target.value = '';
            }
        };
        reader.onerror = () => {
            showMsg('❌ Falha ao ler o arquivo.', 3000, true);
        };
        reader.readAsText(file);
    };

    const handleConfirmImport = () => {
        importState(importStringToLoad);
        setIsImportConfirmModalOpen(false);
        setImportStringToLoad('');
    };
    
    const handleHardReset = () => {
        hardReset();
        setIsResetModalOpen(false);
    }

    const btnClasses = "flex items-center justify-center gap-2 py-2 px-4 font-bold text-stone-900 bg-yellow-500 rounded-lg shadow-md hover:bg-yellow-400 transition-colors active:scale-95";
    const dangerBtnClasses = "flex items-center justify-center gap-2 py-2 px-4 font-bold text-white bg-red-600 rounded-lg shadow-md hover:bg-red-500 transition-colors active:scale-95";
    const modalBtnClasses = "py-2 px-4 font-bold rounded-lg shadow-md transition-colors active:scale-95";
    const htmlBtnClasses = "flex items-center justify-center gap-2 py-3 px-4 font-black uppercase tracking-wider text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl shadow-lg hover:brightness-110 transition-all active:scale-95 border border-cyan-400/30";

    const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6a1 1 0 10-2 0v5.586L7.707 10.293zM5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5z" /></svg>;
    const ResetIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;
    const ExportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>;
    const ImportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
    const CloneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" /></svg>;

    return (
        <div className="space-y-6 text-white pb-8">
            <div className="flex justify-between items-center text-xs text-gray-500 mb-2 px-2">
                <span>Versão: <span className="text-gray-300 font-mono">{APP_VERSION}</span></span>
                <button onClick={handleUpdateApp} className="text-blue-400 hover:text-blue-300 underline">
                    Forçar Atualização
                </button>
            </div>

            {/* Clonar / Snapshot (FEATURE PRINCIPAL PEDIDA) */}
            <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 rounded-xl p-5 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10 text-6xl">💾</div>
                <h3 className="text-xl font-bold text-cyan-300 mb-2 flex items-center gap-2">
                    <CloneIcon /> Clone Portátil
                </h3>
                <p className="text-sm text-cyan-100/70 mb-4 leading-relaxed">
                    Cria um arquivo <strong>.html independente</strong> com todo seu progresso. Você pode guardar no PC, enviar por email ou abrir em qualquer celular sem precisar instalar o app.
                </p>
                <button onClick={handleGenerateSnapshot} className={`${htmlBtnClasses} w-full`}>
                    GERAR CLONE DO JOGO (.html)
                </button>
            </div>

            {/* Local Save Management */}
            <div className="bg-black/20 rounded-xl p-4 inner-neon-border">
                <h3 className="text-xl font-bold text-yellow-400 mb-2">Gerenciamento Local</h3>
                <p className="text-sm text-gray-300 mb-3">Seu jogo é salvo automaticamente. Use os botões para ações manuais.</p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={() => saveGame(true)} className={btnClasses}><SaveIcon /> Salvar Agora</button>
                    <button onClick={() => setIsResetModalOpen(true)} className={dangerBtnClasses}><ResetIcon /> Resetar Jogo</button>
                </div>
            </div>

            {/* Export / Import */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black/20 rounded-xl p-4 inner-neon-border">
                    <h3 className="text-xl font-bold text-yellow-400 mb-2">Backup Texto</h3>
                    <p className="text-sm text-gray-300 mb-3">Gere um arquivo de texto (.txt) leve para backup.</p>
                    <button onClick={handleExportToFile} className={`${btnClasses} w-full`}><ExportIcon /> Salvar .txt</button>
                </div>

                <div className="bg-black/20 rounded-xl p-4 inner-neon-border">
                    <h3 className="text-xl font-bold text-yellow-400 mb-2">Restaurar</h3>
                    <p className="text-sm text-gray-300 mb-3">Carregue seu progresso de um arquivo .txt ou Clone.</p>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelected}
                        accept=".txt,.html,text/plain,text/html"
                        className="hidden"
                    />
                    <button onClick={() => fileInputRef.current?.click()} className={`${btnClasses} w-full`}>
                        <ImportIcon /> Carregar Arquivo
                    </button>
                </div>
            </div>

            {/* Modals */}
            {isResetModalOpen && (
                 <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="relative bg-gradient-to-br from-[#2a1810] to-[#1f1108] rounded-2xl p-6 shadow-2xl border-4 border-yellow-800 w-full max-w-md text-white">
                        <h3 className="text-2xl font-bold text-red-500 mb-4">Atenção!</h3>
                        <p className="text-gray-300 mb-6">Você tem certeza que deseja resetar todo o seu progresso? <strong className="text-yellow-400">Essa ação não pode ser desfeita.</strong></p>
                        <div className="flex justify-end gap-4">
                            <button onClick={() => setIsResetModalOpen(false)} className={`${modalBtnClasses} bg-gray-600 text-white hover:bg-gray-500`}>Cancelar</button>
                            <button onClick={handleHardReset} className={`${modalBtnClasses} bg-red-600 text-white hover:bg-red-500`}>Confirmar Reset</button>
                        </div>
                    </div>
                </div>
            )}

            {isImportConfirmModalOpen && (
                 <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="relative bg-gradient-to-br from-[#2a1810] to-[#1f1108] rounded-2xl p-6 shadow-2xl border-4 border-yellow-800 w-full max-w-md text-white">
                        <h3 className="text-2xl font-bold text-yellow-400 mb-4">Confirmar Importação</h3>
                        <p className="text-gray-300 mb-6">Isso irá <strong className="text-red-500">sobrescrever</strong> seu jogo atual. Tem certeza que deseja continuar?</p>
                        <div className="flex justify-end gap-4">
                            <button onClick={() => setIsImportConfirmModalOpen(false)} className={`${modalBtnClasses} bg-gray-600 text-white hover:bg-gray-500`}>Cancelar</button>
                            <button onClick={handleConfirmImport} className={`${modalBtnClasses} bg-yellow-500 text-stone-900 hover:bg-yellow-400`}>Confirmar</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ConfigTab;
