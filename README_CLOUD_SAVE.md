# 🌐 Sistema de Cloud Save

## Visão Geral

Sistema completo de backup online com:
- ✅ Versionamento automático
- ✅ Detecção de conflitos inteligente
- ✅ Merge automático de saves
- ✅ Backup automático a cada 5 minutos
- ✅ Múltiplos backends (localStorage, API custom)
- ✅ Validação de integridade (checksum)
- ✅ UI completa para gerenciar saves

## Como Usar

### 1. Integrar no seu jogo

No `App.tsx` ou componente principal:

```tsx
import { useCloudBackup } from './hooks/useCloudBackup';
import { CloudSaveManager } from './components/CloudSaveManager';
import { useState } from 'react';

function App() {
    const gameState = useGameState({ showMsg });
    const [showCloudManager, setShowCloudManager] = useState(false);
    
    // Configura o cloud backup
    const cloudBackup = useCloudBackup({
        enabled: true,                    // Ativa backup automático
        interval: 5 * 60 * 1000,         // 5 minutos
        version: 29,                      // Versão do save (de useGameState)
        getCurrentState: () => ({         // Função que retorna o estado atual
            bal: gameState.bal,
            inv: gameState.inv,
            // ... todo o estado
        }),
        onSyncComplete: (result) => {
            if (result.action === 'conflict') {
                showMsg('⚠️ Conflito detectado nos saves!', 5000);
                setShowCloudManager(true); // Abre UI para resolver
            } else if (result.success) {
                console.log('✅ Sync automático completo:', result.message);
            }
        },
        // OPCIONAL: Configurar backend customizado
        backendConfig: {
            type: 'custom-api',
            endpoint: 'https://seu-backend.vercel.app/api',
            apiKey: 'sua-chave-opcional'
        }
    });
    
    return (
        <>
            {/* Botão para abrir gerenciador */}
            <button onClick={() => setShowCloudManager(true)}>
                ☁️ Cloud Saves
            </button>
            
            {/* UI do gerenciador */}
            {showCloudManager && (
                <CloudSaveManager
                    cloudBackup={cloudBackup}
                    onClose={() => setShowCloudManager(false)}
                />
            )}
        </>
    );
}
```

### 2. Criar Backend (OPCIONAL)

Se quiser usar API ao invés de localStorage:

#### Opção A: Vercel Edge Function

Crie `api/saves/[id].ts`:

```typescript
import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { id } = req.query;
    const playerId = req.headers['x-player-id'] || 'anonymous';
    
    // GET - Buscar save
    if (req.method === 'GET') {
        const saves = await kv.get(`saves:${playerId}`) || [];
        if (id) {
            const save = saves.find(s => s.id === id);
            return res.json(save || null);
        }
        return res.json(saves);
    }
    
    // PUT - Salvar
    if (req.method === 'PUT') {
        const saveData = req.body;
        const saves = await kv.get(`saves:${playerId}`) || [];
        const index = saves.findIndex(s => s.id === id);
        
        if (index >= 0) {
            saves[index] = saveData;
        } else {
            saves.push(saveData);
        }
        
        // Limita a 10 auto-saves
        const autoSaves = saves.filter(s => s.isAutoSave);
        if (autoSaves.length > 10) {
            // Remove os mais antigos
            // ...
        }
        
        await kv.set(`saves:${playerId}`, saves);
        return res.json({ success: true });
    }
    
    // DELETE
    if (req.method === 'DELETE') {
        const saves = await kv.get(`saves:${playerId}`) || [];
        const filtered = saves.filter(s => s.id !== id);
        await kv.set(`saves:${playerId}`, filtered);
        return res.json({ success: true });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
}
```

#### Opção B: Cloudflare Workers

```typescript
export default {
    async fetch(request: Request, env: any): Promise<Response> {
        const url = new URL(request.url);
        const id = url.pathname.split('/').pop();
        const playerId = request.headers.get('x-player-id') || 'anonymous';
        
        // Implementação similar usando KV do Cloudflare
        // ...
    }
};
```

#### Opção C: Firebase

```typescript
import { getFirestore, collection, doc, setDoc, getDoc } from 'firebase/firestore';

// No cloudSave.ts, adicione FirebaseBackend:
class FirebaseBackend {
    private db = getFirestore();
    
    async saveSlot(slot: CloudSaveSlot): Promise<void> {
        await setDoc(doc(this.db, 'saves', slot.id), slot);
    }
    
    // ...
}
```

## Features Avançadas

### Detecção de Conflitos

O sistema detecta conflitos quando:
- Dois dispositivos diferentes salvam ao mesmo tempo (< 5 min)
- Saves diferentes no mesmo dispositivo

### Merge Inteligente

Quando há conflito, o merge:
- Pega o **maior valor** para recursos (dinheiro, itens, etc)
- Mantém o **nível mais alto** para progressão
- Pega o **menor valor** para dívidas/penalidades
- **Soma inventários** (nunca perde itens)

### Validação de Integridade

Todo save tem um checksum que valida:
- Se os dados não foram corrompidos
- Se não houve modificação manual (anti-cheat básico)

### Versionamento

Cada save armazena:
- Versão do formato de save (`SAVE_VERSION`)
- Versão do jogo (`APP_VERSION`)
- Timestamp exato
- Device ID único

## Segurança

⚠️ **IMPORTANTE**: O sistema atual usa localStorage como fallback, que é acessível pelo usuário. Para produção:

1. Use um backend real (Vercel KV, Firebase, etc)
2. Adicione autenticação (Firebase Auth, Clerk, etc)
3. Criptografe os saves antes de enviar
4. Valide checksums no servidor

## Performance

- Saves são comprimidos com base64
- Auto-saves limitados a 10 por dispositivo
- Sync automático usa debounce de 5 minutos
- Validação de checksum é rápida (O(n))

## Roadmap

- [ ] Criptografia de saves
- [ ] Compressão LZ-string
- [ ] Login com Google/GitHub
- [ ] Histórico de saves (viagem no tempo)
- [ ] Compartilhamento de saves
- [ ] Achievements/stats na nuvem
