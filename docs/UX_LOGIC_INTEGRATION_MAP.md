# Mapa de Integração UX ↔ Lógica

> **Objetivo**: Documentar TODAS as conexões entre hooks de lógica e componentes visuais para evitar quebras de UX.

---

## 🎯 Fluxo Principal: App.tsx → useGameLogic → Componentes

```typescript
App.tsx
  ↓ chama
useGameLogic()
  ↓ retorna objeto `game` com spread de:
    - useGameState
    - useFebreDoce  
    - useSpinLogic ⚠️ CRÍTICO
    - useShopLogic
    - usePrestigeSkills
    - useSecondaryPrestigeSkills
    - useScratchCardLogic
    - useSnakeUpgrades
    - useFurnaceLogic
    - useBakeryLogic
  ↓ passa via
<SlotMachine {...game} />
```

---

## ⚠️ HOOKS CRÍTICOS PARA UX

### 1. **useSpinLogic** (hooks/useSpinLogic.ts)

**Props de Entrada Necessárias:**
```typescript
- bal, betVal, inv, setInv
- mult, bonusMult, multUpgradeBonus
- panificadoraLevel
- febreDocesAtivo, endFever, febreDocesGiros, setFebreDocesGiros, betValFebre
- applyFinalGain
- skillLevels
- showMsg, setWinMsg
- unluckyPot, setUnluckyPot
- cashbackMultiplier, creditLimit
- momentoLevel, setMomentoLevel, momentoProgress, setMomentoProgress
- setRoiSaldo
- handleSpend, handleGain
- activeCookies, setActiveCookies, setSugar
- sweetLadder
- paraisoDetector
- isCloverPackActive ⚠️ NOVA PROP - Define se Leaf System está ativo
```

**Props de Saída (Return):**
```typescript
- isSpinning: boolean
- grid: SymbolKey[]
- spinningColumns: boolean[]
- stoppingColumns: boolean[]
- pool: SymbolKey[]
- midMultiplierValue: (sym: SymbolKey) => number
- handleSpin: () => void
- quickSpinQueue: number
- handleQuickSpin: () => boolean
- cancelQuickSpins: () => void
- quickSpinStatus: QuickSpinStatus
- starBonusState: StarBonusState
- closeStarBonus: () => void
- coinFlipState: CoinFlipState
- handleCoinGuess: (guess: 'heads' | 'tails') => void
- closeCoinFlip: () => void
- triggerStarBonus: (validKeys: SymbolKey[], bet: number, lines: number) => void
- startCoinFlip: (flips: number, bet: number) => void
- leafState: LeafState ⚠️ NOVO
- handleCellReroll: (index: number) => void ⚠️ NOVO
- handleGlobalReroll: () => void ⚠️ NOVO
```

**Componentes que DEPENDEM dessas Props:**
- `SlotMachine.tsx` (CRÍTICO)
- `Reel.tsx` (via grid)
- `SlotMachineControls.tsx` (via handleSpin, isSpinning)

---

### 2. **useFebreDoce** (hooks/useFebreDoce.ts)

**Props de Entrada:**
```typescript
- roiSaldo, setRoiSaldo
- inv, setInv
- mult, setMult
- bal, setBal
- showMsg
- feverSnapshot, setFeverSnapshot
- paraisoDetector
```

**Props de Saída:**
```typescript
- feverPhase: 'IDLE' | 'SETUP' | 'ACTIVE'
- febreDocesGiros: number
- setFebreDocesGiros
- betValFebre: number
- selectedPackages: FeverPackage[]
- buyPackage: (pkg: FeverPackage) => void
- startFever: () => void
- endFever: () => void
- openFeverSetup: () => void
- closeFeverSetup: () => void
- feverReport: FeverReport | null
- closeFeverReport: () => void
- sweetLadder: UseSweetLadderResult
- cooldownEnd: number
```

**Componentes Dependentes:**
- `FeverSetupModal.tsx`
- `FeverReportModal.tsx`
- `Header.tsx` (cooldown, openFeverSetup)
- `SlotMachine.tsx` (febreDocesAtivo, febreDocesGiros)

---

### 3. **useGameState** (hooks/useGameState.ts)

**Responsabilidade:** Estado central do jogo (saldo, inventário, multiplicadores)

**Props de Saída:**
```typescript
- bal, setBal
- betVal, setBetVal
- inv, setInv
- mult, setMult, bonusMult, setBonusMult
- skillLevels, setSkillLevels
- prestigePoints, setPrestigePoints
- prestigeLevel
- momentoLevel, setMomentoLevel
- momentoProgress, setMomentoProgress
- unluckyPot, setUnluckyPot
- sugar, setSugar
- activeCookies, setActiveCookies
- creditCardDebt, setCreditCardDebt
- renegotiationTier, setRenegotiationTier
- isBettingLocked, setIsBettingLocked
- itemPenaltyDue, setItemPenaltyDue
- missedPayments, setMissedPayments
- roiSaldo, setRoiSaldo
- feverSnapshot, setFeverSnapshot
- secondarySkillLevels, setSecondarySkillLevels
- panificadoraLevel
- snakeUpgrades, setSnakeUpgrades
- snakeGameSettings
- totalTokenPurchases
- mortgageUsages
- bakery, setBakeryState
- softReset: (config) => void
```

**Usado Por:** Praticamente TODOS os componentes via `useGameLogic`

---

## 🔄 FLUXO DE PROPS: useGameLogic.ts

### Conexão com useSpinLogic:

```typescript
const spinLogic = useSpinLogic({
    ...gameState,
    febreDocesAtivo: febreDoce.feverPhase === 'ACTIVE',
    endFever: febreDoce.endFever,
    febreDocesGiros: febreDoce.febreDocesGiros,
    setFebreDocesGiros: febreDoce.setFebreDocesGiros,
    betValFebre: febreDoce.betValFebre,
    applyFinalGain: finalGainCalculation,
    showMsg, setWinMsg,
    cashbackMultiplier: secondarySkills.cashbackMultiplier,
    creditLimit: secondarySkills.creditLimit,
    multUpgradeBonus: secondarySkills.multUpgradeBonus,
    handleSpend, handleGain,
    sweetLadder: febreDoce.sweetLadder,
    paraisoDetector,
    isCloverPackActive: febreDoce.selectedPackages.some(p => p.id === 'safe_budget_2') ⚠️ CRÍTICO
});
```

### Export Final:

```typescript
return {
    ...gameState,
    ...febreDoce,
    ...spinLogic,      ⚠️ Inclui leafState, handleCellReroll, handleGlobalReroll
    ...shopLogic,
    ...prestigeSkills,
    ...secondarySkills,
    ...scratchCardLogic,
    ...snakeUpgrades,
    ...furnaceLogic,
    ...bakeryLogic,
    // ... outros métodos custom
};
```

---

## 🖼️ COMPONENTES DE UI E SUAS DEPENDÊNCIAS

### **SlotMachine.tsx** (COMPONENTE MAIS CRÍTICO)

**Props Esperadas:**
```typescript
interface SlotMachineProps {
    // Febre
    febreDocesAtivo: boolean;
    febreDocesGiros: number;
    
    // Grid e Animação
    grid: string[];
    isSpinning: boolean;
    spinningColumns: boolean[];
    stoppingColumns: boolean[];
    
    // Mensagens
    winMsg: string;
    extraMsg: string;
    
    // Estado Geral
    bal: number;
    betVal: number;
    handleSpin: () => void;
    setBetVal: React.Dispatch<React.SetStateAction<number>>;
    criarEmbaixadorDoce: () => void;
    roiSaldo: RoiSaldo;
    inv: Inventory;
    isPoolInvalid: boolean;
    quickSpinQueue: number;
    handleQuickSpin: () => boolean;
    showMsg: (msg: string, duration?: number, isExtra?: boolean) => void;
    isBankrupt: boolean;
    isBettingLocked: boolean;
    
    // Overlays
    starBonusState: StarBonusState;
    closeStarBonus: () => void;
    coinFlipState: CoinFlipState;
    handleCoinGuess: (guess: 'heads' | 'tails') => void;
    closeCoinFlip: () => void;
    
    // 🍁 Leaf System (NOVO)
    leafState: LeafState;
    handleCellReroll: (index: number) => void;
    handleGlobalReroll: () => void;
}
```

**Origem das Props:**
- `grid`, `isSpinning`, `spinningColumns`, `stoppingColumns` → `useSpinLogic`
- `febreDocesAtivo`, `febreDocesGiros` → `useFebreDoce`
- `bal`, `betVal`, `inv` → `useGameState`
- `leafState`, `handleCellReroll`, `handleGlobalReroll` → `useSpinLogic`

---

### **Header.tsx**

**Props:**
```typescript
- bal: number
- betVal: number
- betValFebre: number
- febreDocesAtivo: boolean
- momentoLevel: number
- momentoProgress: number
- openFeverSetup: () => void
- cooldownEnd: number
```

**Origem:**
- `bal`, `betVal`, `momentoLevel`, `momentoProgress` → `useGameState`
- `febreDocesAtivo`, `betValFebre`, `openFeverSetup`, `cooldownEnd` → `useFebreDoce`

---

### **ShopsTab.tsx**

**Depende de:**
- `useShopLogic` (compras, upgrades)
- `useGameState` (saldo, inventário)
- `useSecondaryPrestigeSkills` (modificadores de preço)

---

### **InventoryTab.tsx**

**Props:**
```typescript
- inv: Inventory
- roiSaldo: RoiSaldo
- momentoLevel: number
- momentoProgress: number
- sugar: number
- activeCookies: ActiveCookie[]
```

**Origem:**
- Todas de `useGameState`

---

## ⚠️ REGRAS PARA NÃO QUEBRAR A UX

### ✅ **DO's (Faça)**

1. **Sempre passe props via spread no useGameLogic:**
   ```typescript
   return {
       ...gameState,
       ...febreDoce,
       ...spinLogic,  // ← Garante que TODAS as props de useSpinLogic vão pro App
       // ...
   };
   ```

2. **Declare TODAS as novas props no tipo de retorno do hook:**
   ```typescript
   export interface UseSpinLogicResult {
       // ... props existentes
       leafState: LeafState;  // ← ADICIONE AQUI
   }
   ```

3. **Atualize a interface do componente visual:**
   ```typescript
   interface SlotMachineProps {
       // ... props existentes
       leafState: LeafState;  // ← E AQUI
   }
   ```

4. **Teste o fluxo completo:**
   - Hook exporta? ✓
   - useGameLogic retorna? ✓
   - SlotMachine recebe? ✓

---

### ❌ **DON'Ts (Não Faça)**

1. **NÃO calcule props derivadas no App.tsx:**
   ```typescript
   // ❌ ERRADO - quebra o fluxo
   const isCloverPackActive = useMemo(() => 
       game.selectedPackages.some(p => p.id === 'safe_budget_2'),
   [game.selectedPackages]);
   ```
   
   **Solução:** Calcule DENTRO do `useGameLogic.ts` e passe pro hook filho.

2. **NÃO esqueça de adicionar novas props nas interfaces:**
   - Se adiciona `leafState` no `useSpinLogic`, PRECISA adicionar em:
     - `UseSpinLogicResult`
     - `SlotMachineProps`

3. **NÃO use props opcionais em lógica crítica sem validação:**
   ```typescript
   // ❌ ERRADO
   if (props.isCloverPackActive) { ... }
   
   // ✅ CERTO
   if (props.isCloverPackActive || false) { ... }
   ```

---

## 🧪 CHECKLIST DE TESTE APÓS ADICIONAR NOVA FEATURE

- [ ] Hook exporta a prop? (`UseXXXResult` tem a prop?)
- [ ] useGameLogic espalha o hook? (`...spinLogic`)
- [ ] Componente declara a prop? (`interface XXXProps`)
- [ ] TypeScript não reclama?
- [ ] Build passa? (`npm run build`)
- [ ] UX funciona? (testar no navegador)

---

## 📝 HISTÓRICO DE BUGS DE UX

### Bug #1: Leaf System quebrou toda a UI (06/01/2026)

**Causa:** 
- Adicionei `isCloverPackActive` como cálculo no `App.tsx`
- Não passei para o `useSpinLogic` via `useGameLogic`
- `leafState` ficou sempre inativo

**Solução:**
- Movi o cálculo para dentro do `useGameLogic.ts`
- Passei `isCloverPackActive` diretamente pro `useSpinLogic`
- Removi o `useMemo` desnecessário do `App.tsx`

**Lição:** **NUNCA calcule lógica de feature no App.tsx**. Sempre coloque nos hooks de lógica.

---

## 🔮 PRÓXIMOS PASSOS

- [ ] Criar testes automatizados para validar o fluxo de props
- [ ] Adicionar ESLint rules para detectar props faltantes
- [ ] Criar script que valida interfaces de componentes vs hooks
