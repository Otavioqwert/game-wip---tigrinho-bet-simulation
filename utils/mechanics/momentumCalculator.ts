/**
 * Momentum Calculator
 * Uses tetrahedral and triangular numbers for exponential progression
 */

/**
 * Calcula momentum usando a fórmula de números tetraédricos e triangulares
 * f(1): Soma de n números triangulares (Número Tetraédrico) × 10
 * f(2): O n-ésimo número triangular multiplicado por 100
 * f(final): Soma dos dois resultados
 * 
 * Fórmula:
 * f(1) = (n × (n+1) × (n+2)) / 6 × 10
 * f(2) = (n × (n+1)) / 2 × 100
 * f(final) = f(1) + f(2)
 * 
 * @param n O nível de momentum
 * @returns Threshold de progresso necessário para o próximo nível
 */
export function calculateMomentumThreshold(n: number): number {
  // f(1): Número Tetraédrico = (n × (n+1) × (n+2)) / 6 × 10
  const f1 = ((n * (n + 1) * (n + 2)) / 6) * 10;
  
  // f(2): Número Triangular = (n × (n+1)) / 2 × 100
  const f2 = ((n * (n + 1)) / 2) * 100;
  
  // f(final): Soma dos resultados
  const fFinal = f1 + f2;
  
  return Math.max(1, Math.round(fFinal)); // Garante mínimo de 1
}

/**
 * Calcula o nível de momentum baseado no progresso acumulado
 * @param totalProgress Progresso acumulado desde o início
 * @returns { level: número do nível, remainingProgress: progresso até o próximo nível }
 */
export function calculateMomentumLevel(totalProgress: number): { level: number; remainingProgress: number } {
  let level = 0;
  let accumulatedProgress = 0;
  
  // Encontra o nível correto iterando até o progress ser insuficiente
  while (true) {
    const nextThreshold = calculateMomentumThreshold(level + 1);
    if (accumulatedProgress + nextThreshold > totalProgress) {
      break;
    }
    accumulatedProgress += nextThreshold;
    level++;
  }
  
  const remainingProgress = totalProgress - accumulatedProgress;
  return { level, remainingProgress };
}

/**
 * Calcula a quantidade total de progresso necessário para alcançar um nível específico
 * @param targetLevel Nível desejado
 * @returns Total de progresso necessário desde o início do jogo
 */
export function calculateTotalProgressForLevel(targetLevel: number): number {
  let total = 0;
  for (let i = 1; i <= targetLevel; i++) {
    total += calculateMomentumThreshold(i);
  }
  return total;
}

/**
 * Simula exemplos de progressão de momentum para debug/visualização
 */
export function getMomentumProgression(maxLevels: number = 10): Array<{ level: number; threshold: number; cumulativeProgress: number }> {
  const progression = [];
  let cumulative = 0;
  
  for (let i = 0; i <= maxLevels; i++) {
    const threshold = calculateMomentumThreshold(i);
    cumulative += threshold;
    progression.push({
      level: i,
      threshold,
      cumulativeProgress: cumulative
    });
  }
  
  return progression;
}
