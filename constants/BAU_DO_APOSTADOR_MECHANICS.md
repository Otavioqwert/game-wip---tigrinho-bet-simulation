# Baú do Apostador - Mecánica Atualizada v1.1

## Resumo da Alteração
Este arquivo documenta a atualização do pacote "Baú do Apostador" para melhorar o balanço e a sustentabilidade do jogo.

## Mudanças Realizadas

### 1. Custo Ajustado
- **Anterior**: $4.500
- **Novo**: $7.500 (+66.7%)
- **Motivo**: Compensar ganho potencial com a nova mecânica de multiplicadores por nível

### 2. Mecánica de Multiplicadores

#### ANTES (Obsoleto)
- Gera 1-20 itens aleatórios
- Cada item recebe um multiplicador aleatório de 1x a 80x
- **Problema**: Altamente lucrativo com ROI de +556% médio

#### DEPOIS (Novo)
- Gera 1-20 itens aleatórios
- **SOMÉNTE ESTES ITENS recebem +25% por NÍVEL**:
  - 🐯 Tigres
  - 🍀 Trevos
  - 💵 Dinheiro
  - 💎 Diamantes
- **DOCES NÃO AFETADOS** (sem multiplicadores):
  - 🍭 Pirulito
  - 🍦 Sorvete
  - 🍧 Pia Gelada
- Outros itens (☄️ Meteoro, ⭐ Estrela) seguem suas regras próprias

### 3. Sistema de NÍveis (+25% por NÍvel)

**Interpretação**: Cada nível de multiplicador agora = +25% de bônus em 🐯🍀💵💎

Exemplos de cálculo:
- 1 nível = 1.25x de ganho
- 2 níveis = 1.50x de ganho
- 5 níveis = 2.25x de ganho
- 10 níveis = 3.5x de ganho

**Fórmula**: `ganhoBase * (1 + (nívies * 0.25))`

## Impacto de Balanço

### Auto-Sustentabilidade
- O novo custo de $7.500 garante que o jogo não fica apelado
- Reduz volatilidade extrema do sistema anterior
- Mantém risco alto para quem escolhe este pacote

### Preservação de Mecânicas
- Sistema de doces (🍭🍦🍧) permanece intacto
- Combos e mécânicas de corrente continuam funcionando normalmente
- Outros pacotes não são afetados

## Implementação

### Arquivos a Atualizar

1. **hooks/useSpinLogic.ts** - Lógica principal de spin
   - Adicionar condicional para 'TOTALLY_RANDOM_CHEST'
   - Verificar se item é de tier (🐯🍀💵💎)
   - Aplicar bônus de +25% por nível APENAS se condicionais atendidos

2. **feverPackages.ts** (JÁ ATUALIZADO)
   - ✅ Custo: $7.500
   - ✅ Descrição atualizada
   - ✅ Comentário técnico adicionado

### Pseudocódigo (para implementação em useSpinLogic.ts)

```typescript
if (feverPackage.id === 'risk_mid_1') { // Baú do Apostador
  const tierSymbols = ['🐯', '🍀', '💵', '💎'];
  
  for (let i = 0; i < randomCount; i++) {
    const item = generateRandomItem();
    const levels = randomLevels(1, 20); // Em vez de 1-80
    
    if (tierSymbols.includes(item)) {
      // Aplicar +25% por nível
      const multiplier = 1 + (levels * 0.25);
      applyMultiplier(item, multiplier);
    } else if (!isSweetItem(item)) { // Não é doce
      // Aplicar lógica normal do item
      applyItemLogic(item, levels);
    }
    // Doces (🍭🍦🍧) só são adicionados, sem multiplicadores
  }
}
```

## Notas Importantes

- Este arquivo é de **DOCUMENTAÇÃO** apenas
- A implementação real deve ser feita em **useSpinLogic.ts**
- A constante já foi atualizada em **feverPackages.ts**
- Preserva todos os conteúdos/mecânicas existentes

---
**Data**: Dec 23, 2025
**Status**: Em implementação
**Versão**: 1.1
