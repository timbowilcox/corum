import type { QuickCheckResponses, QuickCheckResult } from '@/types'

export function gradeQuickCheck(responses: QuickCheckResponses): QuickCheckResult {
  // QC1 "yes" (children present) or QC2 "no" (not free to leave) = instant high_risk
  if (responses.QC1 === 'yes' || responses.QC2 === 'no') {
    return { grade: 'high_risk', reason: 'zero_tolerance_detected' }
  }

  // Count "no" responses for QC3-QC5 (these indicate critical gaps)
  const criticalGaps = [responses.QC3, responses.QC4, responses.QC5].filter(
    (r) => r === 'no'
  ).length

  if (criticalGaps >= 2) return { grade: 'high_risk', reason: 'multiple_critical_gaps' }
  if (criticalGaps === 1) return { grade: 'moderate_risk', reason: 'single_critical_gap' }
  return { grade: 'low_risk', reason: 'no_immediate_concerns' }
}
