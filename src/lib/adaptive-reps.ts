/**
 * Ajusta reps alvo para o próximo treino com base no desempenho (actual reps) e RPE.
 * - Fácil (atingiu meta e dificuldade ≤ 6) → aumenta 2 reps
 * - Difícil (não atingiu ou RPE ≥ 8) → reduz 2 reps (mínimo 5)
 * - Médio → mantém
 */
export const adjustReps = (params: {
  target: number;
  actual: number;
  difficulty: number;
  minReps?: number;
  step?: number;
}): number => {
  const { target, actual, difficulty, minReps = 5, step = 2 } = params;

  if (actual >= target && difficulty <= 6) {
    return target + step;
  }

  if (actual < target || difficulty >= 8) {
    return Math.max(target - step, minReps);
  }

  return target;
};
