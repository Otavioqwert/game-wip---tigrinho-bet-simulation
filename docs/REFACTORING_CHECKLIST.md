# ✅ Checklist de Refatoração e Validação

> Use este checklist SEMPRE que adicionar uma nova feature que conecta lógica e UI

---

## 🔍 PRÉ-IMPLEMENTAÇÃO

### 1. Definir Tipos
- [ ] Criar/atualizar tipos em `types.ts`
- [ ] Exportar interfaces necessárias
- [ ] Documentar estrutura de dados com comentários

**Exemplo:**
```typescript
// types.ts
export interface LeafState {
    count: number;
    isActive: boolean;
}
```

### 2. Planejar Fluxo de Dados
- [ ] Desenhar fluxo: Hook → useGameLogic → App → Componente
- [ ] Identificar onde a lógica vai viver (qual hook?)
- [ ] Identificar quais componentes precisam dos dados

---

## 🛠️ IMPLEMENTAÇÃO DA LÓGICA

### 3. Criar/Atualizar Hook de Lógica
- [ ] Adicionar estado interno (`useState`, `useRef`)
- [ ] Criar funções de manipulação
- [ ] Adicionar validações necessárias
- [ ] Integrar com outros hooks via `propsRef.current`

**Exemplo (useSpinLogic.ts):**
```typescript
const [leafCount, setLeafCount] = useState(0);

const handleCellReroll = useCallback((index: number) => {
    if (!props.isCloverPackActive) return;
    if (isSpinning) return;
    if (leafCount < 1) {
        showMsg("🍁 Folhas insuficientes!", 1500, true);
        return;
    }
    // ... lógica
}, [leafCount, isSpinning, props.isCloverPackActive]);
```

### 4. Atualizar Interface de Retorno do Hook
- [ ] Adicionar novas props no tipo `UseXXXResult`
- [ ] Exportar funções e estado no `return` do hook

**Exemplo:**
```typescript
export interface UseSpinLogicResult {
    // ... props existentes
    leafState: LeafState;
    handleCellReroll: (index: number) => void;
    handleGlobalReroll: () => void;
}

return {
    // ... outros retornos
    leafState: { count: leafCount, isActive: props.isCloverPackActive || false },
    handleCellReroll,
    handleGlobalReroll
};
```

---

## 🔗 CONEXÃO COM useGameLogic

### 5. Passar Props Necessárias para o Hook
- [ ] Identificar dados de entrada que o hook precisa
- [ ] Passar via spread de outros hooks OU calcular no useGameLogic
- [ ] **NUNCA** calcular no `App.tsx`

**Exemplo (useGameLogic.ts):**
```typescript
const spinLogic = useSpinLogic({
    ...gameState,
    // ... outras props
    isCloverPackActive: febreDoce.selectedPackages.some(p => p.id === 'safe_budget_2')
});
```

### 6. Espalhar Retorno do Hook
- [ ] Adicionar `...hookName` no return do useGameLogic
- [ ] Verificar se não há conflito de nomes de props

**Exemplo:**
```typescript
return {
    ...gameState,
    ...febreDoce,
    ...spinLogic,  // ← Espalha leafState, handleCellReroll, etc
    // ... outros hooks
};
```

---

## 🖼️ IMPLEMENTAÇÃO DA UI

### 7. Atualizar Interface do Componente
- [ ] Adicionar novas props na interface `XXXProps`
- [ ] Documentar prop com comentário se necessário
- [ ] Marcar como opcional (`?`) apenas se realmente opcional

**Exemplo (SlotMachine.tsx):**
```typescript
interface SlotMachineProps {
    // ... props existentes
    leafState: LeafState;
    handleCellReroll: (index: number) => void;
    handleGlobalReroll: () => void;
}
```

### 8. Implementar Renderização Condicional
- [ ] Usar props recebidas para controlar visibilidade
- [ ] Adicionar estados de loading/disabled quando necessário
- [ ] Testar casos extremos (valores zerados, máximos, etc)

**Exemplo:**
```typescript
{leafState.isActive && (
    <div className="leaf-counter">
        <span>{leafState.count}</span>
        <span>🍁</span>
    </div>
)}
```

### 9. Conectar Event Handlers
- [ ] Chamar funções passadas via props
- [ ] Adicionar validações de estado antes de chamar (disabled, isSpinning, etc)
- [ ] Adicionar feedback visual (hover, active, disabled)

**Exemplo:**
```typescript
<button
    onClick={handleGlobalReroll}
    disabled={isSpinning || leafState.count < 3}
    className={isSpinning || leafState.count < 3 ? 'opacity-50' : 'hover:scale-110'}
>
    🎰
</button>
```

---

## ✅ VALIDAÇÃO FINAL

### 10. Checklist de TypeScript
- [ ] Nenhum erro de tipo no VSCode
- [ ] `npm run build` passa sem erros
- [ ] Nenhum `any` ou `//@ts-ignore` desnecessário

### 11. Checklist de Runtime
- [ ] Abrir o jogo no navegador
- [ ] Verificar se componente renderiza corretamente
- [ ] Testar ações do usuário (cliques, hover, etc)
- [ ] Verificar console do navegador (sem erros)
- [ ] Testar casos extremos:
  - [ ] Valores zerados
  - [ ] Valores máximos
  - [ ] Feature desativada
  - [ ] Feature ativada
  - [ ] Transições de estado

### 12. Checklist de UX
- [ ] Animações estão suaves
- [ ] Feedback visual é claro
- [ ] Estados disabled/loading são visíveis
- [ ] Mensagens de erro são claras
- [ ] Layout não quebra em mobile
- [ ] Não há overlapping de elementos

---

## 📝 DOCUMENTAÇÃO

### 13. Atualizar Docs
- [ ] Adicionar feature no `UX_LOGIC_INTEGRATION_MAP.md`
- [ ] Documentar novos tipos se necessário
- [ ] Adicionar comentários no código complexo

### 14. Commit Message
- [ ] Usar formato: `feat: add [feature] with [hook] integration`
- [ ] Descrever o que foi adicionado
- [ ] Mencionar breaking changes se houver

**Exemplo:**
```
feat: add Leaf System (🍁) with clover package integration

- Adds leaf counter and reroll mechanics to useSpinLogic
- Integrates with Febre Doce package system
- UI shows leaf count and reroll button when active
- Cells become clickable for individual reroll (1 leaf)
- Global reroll button costs 3 leaves
```

---

## ⚠️ SINAIS DE ALERTA (NÃO FAÇA!)

### 🚫 Calcular Lógica no App.tsx
```typescript
// ❌ ERRADO
const game = useGameLogic();
const isCloverPackActive = game.selectedPackages.some(...);
```

### 🚫 Esquecer de Espalhar Hook
```typescript
// ❌ ERRADO - leafState não vai pro App
return {
    ...gameState,
    // ... spinLogic NÃO está aqui!
};
```

### 🚫 Props Opcionais Sem Default
```typescript
// ❌ ERRADO - pode quebrar se undefined
if (props.isCloverPackActive) { ... }

// ✅ CERTO
if (props.isCloverPackActive || false) { ... }
```

### 🚫 Não Declarar Tipo de Retorno
```typescript
// ❌ ERRADO
export const useSpinLogic = (props) => {
    return { ... }; // TypeScript não valida o retorno
}

// ✅ CERTO
export const useSpinLogic = (props): UseSpinLogicResult => {
    return { ... }; // TypeScript valida
}
```

---

## 🎁 TEMPLATE PARA NOVA FEATURE

```typescript
// 1. TIPO (types.ts)
export interface NewFeatureState {
    isActive: boolean;
    value: number;
}

// 2. HOOK (hooks/useNewFeature.ts)
export interface UseNewFeatureResult {
    featureState: NewFeatureState;
    handleAction: () => void;
}

export const useNewFeature = (props): UseNewFeatureResult => {
    const [value, setValue] = useState(0);
    
    const handleAction = useCallback(() => {
        // lógica
    }, []);
    
    return {
        featureState: { isActive: props.enabled, value },
        handleAction
    };
};

// 3. INTEGRAÇÃO (hooks/useGameLogic.ts)
const newFeature = useNewFeature({
    enabled: someCondition
});

return {
    ...gameState,
    ...newFeature, // ← ESPALHAR!
};

// 4. COMPONENTE (components/XXX.tsx)
interface XXXProps {
    featureState: NewFeatureState;
    handleAction: () => void;
}

const XXX: React.FC<XXXProps> = ({ featureState, handleAction }) => {
    if (!featureState.isActive) return null;
    
    return (
        <button onClick={handleAction}>
            {featureState.value}
        </button>
    );
};
```

---

## 🚀 AUTOMAÇÃO FUTURA

- [ ] Script que valida se todas as props de um hook estão no tipo de retorno
- [ ] ESLint rule para detectar props faltantes em interfaces
- [ ] Testes automatizados de integração
- [ ] GitHub Action que valida o checklist antes de merge
