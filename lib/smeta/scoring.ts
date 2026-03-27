import type { GapFinding, Pillar, ScoreDelta, ScoreSet, Severity } from '@/types'

export const SEVERITY_WEIGHTS: Record<Severity, number> = {
  conformant: 1.0,
  minor: 0.7,
  major: 0.3,
  critical: 0.0,
  zero_tolerance: 0.0,
}

export const AUDIT_READY_THRESHOLD = 75

export function computeScore(findings: GapFinding[]): number {
  if (findings.length === 0) return 0
  const weighted = findings.reduce((sum, f) => sum + SEVERITY_WEIGHTS[f.severity], 0)
  return Math.round((weighted / findings.length) * 100 * 100) / 100
}

export function computePillarScore(findings: GapFinding[], pillar: Pillar): number {
  const pillarFindings = findings.filter((f) => f.pillar === pillar)
  return computeScore(pillarFindings)
}

export function computeAllScores(findings: GapFinding[]): ScoreSet {
  const pillars: Pillar[] = ['labour', 'health_safety', 'environment', 'business_ethics']

  const pillarScores = Object.fromEntries(
    pillars.map((p) => [p, computePillarScore(findings, p)])
  ) as Record<Pillar, number>

  return {
    overall: computeScore(findings),
    labour: pillarScores.labour,
    health_safety: pillarScores.health_safety,
    environment: pillarScores.environment,
    business_ethics: pillarScores.business_ethics,
    zero_tolerance_count: findings.filter((f) => f.severity === 'zero_tolerance').length,
    critical_count: findings.filter((f) => f.severity === 'critical').length,
    major_count: findings.filter((f) => f.severity === 'major').length,
    minor_count: findings.filter((f) => f.severity === 'minor').length,
    conformant_count: findings.filter((f) => f.severity === 'conformant').length,
    total_count: findings.length,
  }
}

export function isAuditReady(scores: ScoreSet): boolean {
  return (
    scores.overall >= AUDIT_READY_THRESHOLD &&
    scores.zero_tolerance_count === 0 &&
    scores.critical_count === 0
  )
}

export function getAuditReadyStatus(scores: ScoreSet): 'audit_ready' | 'needs_work' | 'high_risk' {
  if (scores.zero_tolerance_count > 0 || scores.overall < 50) return 'high_risk'
  if (scores.overall < AUDIT_READY_THRESHOLD || scores.critical_count > 0) return 'needs_work'
  return 'audit_ready'
}

/**
 * Compute projected score if selected findings are treated as resolved (conformant).
 * Does NOT mutate the original findings array.
 */
export function computeProjectedScore(
  allFindings: GapFinding[],
  resolvedFindingIds: Set<string>
): ScoreSet {
  const projected = allFindings.map((f) =>
    resolvedFindingIds.has(f.id) ? { ...f, severity: 'conformant' as const } : f
  )
  return computeAllScores(projected)
}

export function computeScoreDelta(current: ScoreSet, previous: ScoreSet): ScoreDelta {
  return {
    overall: Math.round((current.overall - previous.overall) * 100) / 100,
    labour: Math.round((current.labour - previous.labour) * 100) / 100,
    health_safety: Math.round((current.health_safety - previous.health_safety) * 100) / 100,
    environment: Math.round((current.environment - previous.environment) * 100) / 100,
    business_ethics: Math.round((current.business_ethics - previous.business_ethics) * 100) / 100,
  }
}

/**
 * Sort findings by severity for display: ZT first, then critical, major, minor, conformant
 */
const SEVERITY_ORDER: Record<Severity, number> = {
  zero_tolerance: 0,
  critical: 1,
  major: 2,
  minor: 3,
  conformant: 4,
}

export function sortFindingsBySeverity(findings: GapFinding[]): GapFinding[] {
  return [...findings].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  )
}
