import type { QuickCheckResponses, QuickCheckResult, PillarReadiness, ReadinessLevel, Pillar } from '@/types'
import { QUICK_CHECK_QUESTIONS } from './quick-check-questions'

/**
 * Maps a raw score (0–1.5) to a human-friendly readiness level.
 */
function scoreToLevel(score: number): ReadinessLevel {
  if (score >= 1.0) return 'looking_good'
  if (score >= 0.5) return 'making_progress'
  return 'getting_started'
}

const LEVEL_LABELS: Record<ReadinessLevel, string> = {
  getting_started: 'Getting started',
  making_progress: 'Making progress',
  looking_good: 'Looking good',
  not_assessed: 'Not yet assessed',
}

/**
 * Scores quick check responses into per-pillar readiness levels.
 *
 * Questions are grouped by pillar. Each option carries a score (0–1.5).
 * Per-pillar score = average of all question scores mapping to that pillar.
 * Pillars with no questions are marked "not_assessed".
 */
export function scoreQuickCheck(responses: QuickCheckResponses): QuickCheckResult {
  const pillarScores: Partial<Record<Pillar, number[]>> = {}

  // Collect scores per pillar (skip 'context' questions — they don't score pillars)
  for (const question of QUICK_CHECK_QUESTIONS) {
    if (question.pillar === 'context') continue

    const answer = responses[question.id]
    if (!answer) continue

    const option = question.options.find((o) => o.value === answer)
    if (!option) continue

    const pillar = question.pillar
    if (!pillarScores[pillar]) pillarScores[pillar] = []
    pillarScores[pillar].push(option.score)
  }

  // All four SMETA pillars
  const allPillars: Pillar[] = ['labour', 'health_safety', 'environment', 'business_ethics']

  const pillars: PillarReadiness[] = allPillars.map((pillar) => {
    const scores = pillarScores[pillar]
    if (!scores || scores.length === 0) {
      return {
        pillar,
        level: 'not_assessed' as ReadinessLevel,
        score: 0,
        label: LEVEL_LABELS.not_assessed,
      }
    }

    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length
    const level = scoreToLevel(avg)

    return {
      pillar,
      level,
      score: avg,
      label: LEVEL_LABELS[level],
    }
  })

  // Overall level: average of assessed pillars only
  const assessedPillars = pillars.filter((p) => p.level !== 'not_assessed')
  const overallScore =
    assessedPillars.length > 0
      ? assessedPillars.reduce((sum, p) => sum + p.score, 0) / assessedPillars.length
      : 0
  const overall_level = assessedPillars.length > 0 ? scoreToLevel(overallScore) : 'not_assessed'

  return { pillars, overall_level }
}
