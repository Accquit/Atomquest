export function computeScore(uomType: string, targetValue: number | null, actualValue: number | null, isCompleted: boolean = false): number {
  if (targetValue === null || targetValue === undefined) return 0
  if (actualValue === null || actualValue === undefined) return 0

  let score = 0

  switch (uomType) {
    case 'numeric_min':
      // score = actual / target (capped at 1.0)
      if (targetValue === 0) return actualValue >= 0 ? 1 : 0
      score = actualValue / targetValue
      return Math.min(Math.max(score, 0), 1.0)

    case 'numeric_max':
      // score = target / actual (capped at 1.0)
      // Special case: if actual is 0 and target is > 0, it means perfect score (they kept it below max).
      if (actualValue === 0) return 1.0
      if (targetValue === 0) return actualValue <= 0 ? 1 : 0
      score = targetValue / actualValue
      return Math.min(Math.max(score, 0), 1.0)

    case 'timeline':
      // score = 1.0 if completed on or before deadline, else 0
      // In our UI, if they mark progress_status = 'completed', we will pass isCompleted = true
      return isCompleted ? 1.0 : 0.0

    case 'zero':
      // score = 1.0 if actual === 0, else 0.0
      return actualValue === 0 ? 1.0 : 0.0

    default:
      return 0.0
  }
}
