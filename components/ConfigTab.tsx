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

    // Nova função: Gera um arquivo HTML autônomo com o estado atual
    const handleGenerateSnapshot = () => {
        const stateString = exportState();
        let stateObj: any = {};
        try {
             // Decode basic state for display
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
        body { background-color: #121212; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; padding: 20px; }
        .card { background: #1e1e1e; border: 2px solid #ffd700; border-radius: 15px; padding: 20px; max-width: 500px; width: 100%; box-shadow: 0 0 20px rgba(255, 215, 0, 0.3); }
        h1 { color: #ffd700; text-align: center; }
        .stat { display: flex; justify-content: space-between; border-bottom: 1px solid #333; padding: 10px 0; }
        .val { font-weight: bold; color: #4ade80; }
        textarea { width: 100%; height: 100px; background: #000; color: #aaa; border: 1px solid #333; margin-top: 15px; padding: 10px; border-radius: 5px; }
        button { background: #ffd700; color: #000; border: none; padding: 15px; width: 100%; font-weight: bold; font-size: 16px; border-radius: 8px; cursor: pointer; margin-top: 10px; transition: 0.2s; }
        button:hover { background: #e6c200; }
    </style>
</head>
<body>
    <div class="card">
        <h1>🐯 Snapshot do Jogo</h1>
        <div class="stat"><span>Data:</span> <span>${new Date().toLocaleString()}</span></div>
        <div class="stat"><span>Saldo:</span> <span class="val">$${(stateObj.bal || 0).toLocaleString()}</span></div>
        <div class="stat"><span>Prestígio (PA):</span> <span class="val">${stateObj.prestigePoints || 0}</span></div>
        <div class="stat"><span>Tigres:</span> <span>${stateObj.inv?.['🐯'] || 0}</span></div>
        <div class="stat"><span>Meteoros:</span> <span>${stateObj.inv?.['☄️'] || 0}</span></div>
        
        <p style="text-align:center; margin-top:20px; font-size: 0.9em; color: #888;">
            Este arquivo contém seu progresso salvo. Copie o código abaixo e importe no jogo oficial.
        </p>
        
        <textarea id="saveString" readonly>${stateString}</textarea>
        <button onclick="copySave()">COPIAR CÓDIGO DE SAVE</button>
    </div>
    <script>
        function copySave() {
            var copyText = document.getElementById("saveString");
            copyText.select();
            copyText.setSelectionRange(0, 99999);
            navigator.clipboard.writeText(copyText.value);
            alert("Código copiado! Vá para Config > Importar no jogo.");
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
        link.download = `Tigrinho_Snapshot_${timestamp}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showMsg('📄 Snapshot HTML baixado!', 3000, true);
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
                event.target.value = ''; // Reset file input to allow re-uploading the same file
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
    const htmlBtnClasses = "flex items-center justify-center gap-2 py-2 px-4 font-bold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-500 transition-colors active:scale-95";

    const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6a1 1 0 10-2 0v5.586L7.707 10.293zM5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5z" /></svg>;
    const ResetIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;
    const ExportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>;
    const ImportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
    const HtmlIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>;

    return (
        <div className="space-y-6 text-white">
            <div className="text-center text-xs text-gray-500 mb-2">
                Versão do App: <span className="text-gray-300 font-mono">{APP_VERSION}</span>
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

            {/* Clonar / Snapshot */}
            <div className="bg-black/20 rounded-xl p-4 border border-blue-500/30">
                <h3 className="text-xl font-bold text-blue-400 mb-2">Clone Portátil (Snapshot)</h3>
                <p className="text-sm text-gray-300 mb-3">
                    Gera um arquivo HTML único com seu progresso atual. Você pode abrir este arquivo em qualquer dispositivo para ver seus status ou copiar o código de save.
                </p>
                <button onClick={handleGenerateSnapshot} className={`${htmlBtnClasses} w-full`}><HtmlIcon /> Baixar Snapshot (.html)</button>
            </div>

            {/* Export / Import */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black/20 rounded-xl p-4 inner-neon-border">
                    <h3 className="text-xl font-bold text-yellow-400 mb-2">Exportar Arquivo</h3>
                    <p className="text-sm text-gray-300 mb-3">Gere um arquivo de texto (.txt) para backup tradicional.</p>
                    <button onClick={handleExportToFile} className={`${btnClasses} w-full`}><ExportIcon /> Salvar .txt</button>
                </div>

                <div className="bg-black/20 rounded-xl p-4 inner-neon-border">
                    <h3 className="text-xl font-bold text-yellow-400 mb-2">Importar Save</h3>
                    <p className="text-sm text-gray-300 mb-3">Carregue seu progresso de um arquivo .txt ou cole o código.</p>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelected}
                        accept=".txt,text/plain"
                        className="hidden"
                    />
                    <button onClick={() => fileInputRef.current?.click()} className={`${btnClasses} w-full`}>
                        <ImportIcon /> Carregar Arquivo
                    </button>
                </div>
            </div>

            {/* Modals */}
            {isResetModalOpen && (
                 <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
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
                 <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
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