# 🔗 Sweet Ladder Integration Guide

## 🎯 Objetivo

Integrar a nova mecânica **Sweet Ladder (Doce Corrente)** no jogo, substituindo a implementação inline antiga por um sistema modular e organizado.

---

## 📚 Arquivos Criados

### 1. **`utils/mechanics/sweetLadder.ts`**
- Funções puras da mecânica
- Configurações constantes
- Lógica de processamento de acertos/erros

### 2. **`hooks/useSweetLadder.ts`**
- Hook React para gerenciar estado
- Interface limpa para uso externo
- Gerencia automação da lógica

### 3. **`utils/mechanics/index.ts`**
- Export central de todas as mecânicas

---

## ✅ Arquivo Já Atualizado

### **`hooks/useFebreDoce.ts`**

✅ **JÁ FEITO!** Integração completa:

```typescript
import { useSweetLadder } from './useSweetLadder';

// Dentro do hook
const sweetLadder = useSweetLadder();

// Ao iniciar fever
if (ladderActive) {
    sweetLadder.activateMechanic();
}

// Ao terminar fever
sweetLadder.deactivateMechanic();

// Expor para uso externo
return {
    // ... outros retornos
    sweetLadder,
};
```

---

## 🔧 Próximos Passos

### **PASSO 1: Atualizar `hooks/useSpinLogic.ts`**

#### **1.1. Remover props antigas:**

```diff
interface SpinLogicProps {
    // ... outras props
-   sweetLadderActive: boolean;
-   sweetLadderD: number;
-   setSweetLadderD: React.Dispatch<React.SetStateAction<number>>;
+   sweetLadder: UseSweetLadderResult;  // Adicionar tipo importado
}
```

#### **1.2. Importar tipos:**

```typescript
import type { UseSweetLadderResult } from './useSweetLadder';
import { isCandySymbol } from '../utils/mechanics/sweetLadder';
```

#### **1.3. Substituir lógica inline no `getSpinResult`:**

**ANTES (linhas ~190-200):**
```typescript
let ladderBonus = 0;
if (febreDocesAtivo && sweetLadderActive) {
    if (result.sweetLinesCount > 0) {
        let curD = sweetLadderD;
        for (let i = 0; i < result.sweetLinesCount; i++) { 
            curD++; 
            ladderBonus += (curD * 10); 
        }
        setSweetLadderD(curD);
    } else {
        if (sweetLadderD > 0) showMsg(`Corrente Quebrada! (Estava em ${sweetLadderD}x)`, 1500, true);
        setSweetLadderD(0);
    }
}
```

**DEPOIS:**
```typescript
const { sweetLadder } = propsRef.current;
let ladderBonus = 0;

// Processar Sweet Ladder se ativo
if (febreDocesAtivo && sweetLadder.state.isActive) {
    if (result.sweetLinesCount > 0) {
        // Processar cada linha de doce
        for (let i = 0; i < result.sweetLinesCount; i++) {
            const ladderResult = sweetLadder.onSymbolHit('🍭'); // Qualquer doce
            ladderBonus += ladderResult.bonus;
            
            if (ladderResult.gainedLife) {
                showMsg(`💚 +1 Vida! (${sweetLadder.state.lives} total)`, 2000, true);
            }
        }
    } else {
        // Errou (não acertou doce)
        const missResult = sweetLadder.onSymbolHit('🐯'); // Qualquer não-doce
        
        if (missResult.usedLife) {
            showMsg(`💔 Usou 1 vida! (${sweetLadder.state.lives} restantes)`, 2000, true);
        } else if (sweetLadder.state.chain > 0) {
            showMsg(`💥 Corrente caiu para ${sweetLadder.state.chain}!`, 2000, true);
        }
    }
}
```

---

### **PASSO 2: Atualizar `App.tsx` (ou componente principal)**

#### **2.1. Passar `sweetLadder` ao invés de props separadas:**

**ANTES:**
```tsx
<GameComponent
    sweetLadderActive={febreDoce.sweetLadderActive}
    sweetLadderD={febreDoce.sweetLadderD}
    setSweetLadderD={febreDoce.setSweetLadderD}
/>
```

**DEPOIS:**
```tsx
<GameComponent
    sweetLadder={febreDoce.sweetLadder}
/>
```

---

### **PASSO 3: Adicionar UI para mostrar estado da Sweet Ladder**

#### **3.1. Criar componente de UI (opcional):**

```tsx
// components/SweetLadderDisplay.tsx
import React from 'react';
import type { UseSweetLadderResult } from '../hooks/useSweetLadder';

interface Props {
    sweetLadder: UseSweetLadderResult;
}

export const SweetLadderDisplay: React.FC<Props> = ({ sweetLadder }) => {
    const { state, hitsUntilNextLife, totalBonusEarned } = sweetLadder;
    
    if (!state.isActive) return null;
    
    return (
        <div className="sweet-ladder-display">
            <div className="ladder-info">
                <span>🔗 Corrente: {state.chain}</span>
                <span>💚 Vidas: {state.lives}/2</span>
            </div>
            <div className="ladder-stats">
                <span>🎯 Próxima vida em: {hitsUntilNextLife} acertos</span>
                <span>💰 Bônus acumulado: ${totalBonusEarned}</span>
            </div>
        </div>
    );
};
```

#### **3.2. Usar no componente principal:**

```tsx
import { SweetLadderDisplay } from './components/SweetLadderDisplay';

// Durante fever mode
{febreDoce.feverPhase === 'ACTIVE' && (
    <SweetLadderDisplay sweetLadder={febreDoce.sweetLadder} />
)}
```

---

## 🎮 Comportamento Esperado

### **Cenário 1: Jogador acerta doce**
```
Giro 1: 🍭🍭🍭 → Corrente: 1, Bônus: $10
Giro 2: 🍦🍦🍦 → Corrente: 2, Bônus: $20
Giro 3: 🍧🍧🍧 → Corrente: 3, Bônus: $30
...
Giro 7: 🍭🍭🍭 → Corrente: 7, Bônus: $70, +1 VIDA! 💚
```

### **Cenário 2: Jogador erra COM vida**
```
Giro 8: 🐯🐯🐯 → Usou 1 vida, Corrente mantém: 7 💔
Giro 9: 🍭🍭🍭 → Corrente: 8, Bônus: $80
```

### **Cenário 3: Jogador erra SEM vida**
```
Giro 10: 🍀🍀🍀 → Sem vidas! Corrente: 7 → 3 💥 (-50%)
Giro 11: 🍭🍭🍭 → Corrente: 4, Bônus: $40
```

---

## ⚠️ Pontos de Atenção

### **1. Detecção de símbolos**
- Use `isCandySymbol(symbol)` para verificar se é doce
- Não hardcode `['🍭', '🍦', '🍧']`

### **2. Estado persistente**
- Sweet Ladder reseta ao sair do fever mode
- Não persiste entre sessões

### **3. Múltiplas linhas**
- Se acertar 2 linhas de doce no mesmo giro, processa 2 vezes
- Cada linha incrementa a corrente separadamente

### **4. Compatibilidade com wilds (⭐)**
- Linha com wilds completando doce CONTA como acerto
- Ex: 🍭🍭⭐ = acerto de doce

---

## 🧪 Testando

### **Teste 1: Acertos consecutivos**
```typescript
// Simular 10 acertos de doce
for (let i = 0; i < 10; i++) {
    const result = sweetLadder.onSymbolHit('🍭');
    console.log(`Corrente: ${sweetLadder.state.chain}, Bônus: $${result.bonus}`);
}
```

### **Teste 2: Erro sem vida**
```typescript
sweetLadder.state.chain = 10;
sweetLadder.state.lives = 0;
const result = sweetLadder.onSymbolHit('🐯'); // Errou
console.log(`Corrente após erro: ${sweetLadder.state.chain}`); // Esperado: 5
```

### **Teste 3: Ganhar vida**
```typescript
for (let i = 0; i < 7; i++) {
    const result = sweetLadder.onSymbolHit('🍭');
    if (result.gainedLife) {
        console.log(`Ganhou vida no acerto ${i + 1}!`);
    }
}
```

---

## ✅ Checklist de Integração

- [ ] Atualizar `useSpinLogic.ts` props
- [ ] Remover `sweetLadderD` e `setSweetLadderD`
- [ ] Importar `UseSweetLadderResult` e `isCandySymbol`
- [ ] Substituir lógica inline por `sweetLadder.onSymbolHit()`
- [ ] Atualizar `App.tsx` para passar `sweetLadder`
- [ ] Criar componente de UI (opcional)
- [ ] Testar cenários: acertos, erros com vida, erros sem vida
- [ ] Verificar mensagens de feedback
- [ ] Confirmar reset ao sair do fever

---

## 📝 Notas Finais

- **Modularidade:** Agora a mecânica está isolada e testavel
- **Reutilização:** Fácil adicionar novas mecânicas seguindo o mesmo padrão
- **Manutenção:** Lógica concentrada em um lugar
- **Performance:** Sem overhead, apenas reorganização

**Qualquer dúvida, cheque os arquivos criados em:**
- `utils/mechanics/sweetLadder.ts`
- `hooks/useSweetLadder.ts`
