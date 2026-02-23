/**
 * Momentum Calculator
 */

/**
 * Calcula o threshold de progresso necessário para alcançar um nível de Momento.
 *
 * Fórmula: 100n + n²/2
 * Onde n é o nível a ser alcançado.
 *
 * @param n O nível de momentum
 * @returns Threshold de progresso necessário
 */
export function calculateMomentumThreshold(n: number): number {
  return Math.max(1, 100 * n + (n * n) / 2);
}

/**
 * Calcula o nível de momentum baseado no progresso acumulado
 * @param totalProgress Progresso acumulado desde o início
 * @returns { level: número do nível, remainingProgress: progresso até o próximo nível }
 */
export function calculateMomentumLevel(totalProgress: number): { level: number; remainingProgress: number } {
  let level = 0;
  let accumulatedProgress = 0;

  while (true) {
    const nextThreshold = calculateMomentumThreshold(level + 1);
    if (accumulatedProgress + nextThreshold > totalProgress) break;
    accumulatedProgress += nextThreshold;
    level++;
  }

  return { level, remainingProgress: totalProgress - accumulatedProgress };
}

/**
 * Calcula o total de progresso necessário para alcançar um nível específico
 */
export function calculateTotalProgressForLevel(targetLevel: number): number {
  let total = 0;
  for (let i = 1; i <= targetLevel; i++) {
    total += calculateMomentumThreshold(i);
  }
  return total;
}

/**
 * Simula a progressão de momentum para debug/visualização
 */
export function getMomentumProgression(maxLevels = 10): Array<{ level: number; threshold: number; cumulativeProgress: number }> {
  const progression = [];
  let cumulative = 0;
  for (let i = 0; i <= maxLevels; i++) {
    const threshold = calculateMomentumThreshold(i);
    cumulative += threshold;
    progression.push({ level: i, threshold, cumulativeProgress: cumulative });
  }
  return progression;
}

/**
 * Calcula o valor do Momento baseado no nível e nos stacks de doces no inventário.
 *
 * Fórmula: 100x + (x²)/2 + 10y
 *   x = momentoLevel  — nível atual
 *   y = candyStacks   — total de doces no inventário (🍭 + 🍦 + 🍧)
 *
 * @param momentoLevel Nível atual de Momento (x)
 * @param candyStacks  Total de doces no inventário (y)
 */
export function calcMomentoValue(momentoLevel: number, candyStacks: number): number {
  const x = Math.max(0, Math.floor(momentoLevel));
  const y = Math.max(0, Math.floor(candyStacks));
  return 100 * x + (x ** 2) / 2 + 10 * y;
}
