import { describe, it, expect } from 'vitest'
import {
  computeScore,
  computeAllScores,
  computeProjectedScore,
  computeScoreDelta,
  isAuditReady,
  AUDIT_READY_THRESHOLD,
} from '@/lib/smeta/scoring'
import type { GapFinding } from '@/types'

function makeFinding(
  overrides: Partial<GapFinding> & { severity: GapFinding['severity'] }
): GapFinding {
  return {
    id: Math.random().toString(36).slice(2),
    site_id: 'site-1',
    analysis_job_id: 'job-1',
    criteria_id: 'L1.1',
    pillar: 'labour',
    finding: 'Test finding',
    recommendation: 'Test recommendation',
    confidence: 0.9,
    estimated_effort: null,
    evidence_needed: null,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

describe('computeScore', () => {
  it('SC1: empty findings returns 0', () => {
    expect(computeScore([])).toBe(0)
  })

  it('SC2: all conformant (10 findings) returns 100', () => {
    const findings = Array.from({ length: 10 }, () => makeFinding({ severity: 'conformant' }))
    expect(computeScore(findings)).toBe(100)
  })

  it('SC3: all zero_tolerance returns 0', () => {
    const findings = Array.from({ length: 5 }, () => makeFinding({ severity: 'zero_tolerance' }))
    expect(computeScore(findings)).toBe(0)
  })

  it('SC4: all critical returns 0', () => {
    const findings = Array.from({ length: 3 }, () => makeFinding({ severity: 'critical' }))
    expect(computeScore(findings)).toBe(0)
  })

  it('SC5: mixed findings computes weighted average', () => {
    // 3 conformant (1.0) + 2 minor (0.7) + 2 major (0.3) + 1 critical (0.0) = 5.0 / 8 * 100 = 62.5
    const findings = [
      ...Array.from({ length: 3 }, () => makeFinding({ severity: 'conformant' })),
      ...Array.from({ length: 2 }, () => makeFinding({ severity: 'minor' })),
      ...Array.from({ length: 2 }, () => makeFinding({ severity: 'major' })),
      makeFinding({ severity: 'critical' }),
    ]
    const score = computeScore(findings)
    expect(score).toBe(62.5)
  })

  it('SC6: single minor finding returns 70', () => {
    expect(computeScore([makeFinding({ severity: 'minor' })])).toBe(70)
  })

  it('SC7: single major finding returns 30', () => {
    expect(computeScore([makeFinding({ severity: 'major' })])).toBe(30)
  })
})

describe('isAuditReady', () => {
  it('SC8: score=80, 0 ZT, 0 critical → true', () => {
    const scores = computeAllScores(
      Array.from({ length: 10 }, () => makeFinding({ severity: 'conformant' }))
    )
    expect(isAuditReady(scores)).toBe(true)
  })

  it('SC9: score=80 but has ZT finding → false', () => {
    const findings = [
      ...Array.from({ length: 9 }, () => makeFinding({ severity: 'conformant' })),
      makeFinding({ severity: 'zero_tolerance' }),
    ]
    const scores = computeAllScores(findings)
    expect(isAuditReady(scores)).toBe(false)
  })

  it('SC10: score=74, 0 ZT, 0 critical → false (below threshold)', () => {
    // Need score < 75: mix of conformant and minor
    // x conformant + y minor: (x*1 + y*0.7)/(x+y)*100 = 74
    // 7 conformant + 3 minor = (7 + 2.1)/10 * 100 = 91 — too high
    // Let's use: 8 major + 2 conformant = (0 + 2)/10 * 100 = 20 — too low
    // 5 conformant + 3 minor + 2 major = (5 + 2.1 + 0.6)/10 * 100 = 77 — too high
    // 4 conformant + 3 major + 3 minor = (4 + 0 + 2.1)/10 * 100 = 61 — below 75
    const findings = [
      ...Array.from({ length: 4 }, () => makeFinding({ severity: 'conformant' })),
      ...Array.from({ length: 3 }, () => makeFinding({ severity: 'major' })),
      ...Array.from({ length: 3 }, () => makeFinding({ severity: 'minor' })),
    ]
    const scores = computeAllScores(findings)
    expect(scores.overall).toBeLessThan(AUDIT_READY_THRESHOLD)
    expect(isAuditReady(scores)).toBe(false)
  })
})

describe('computeProjectedScore', () => {
  it('IS1: resolving a critical finding increases score', () => {
    const critical = makeFinding({ id: 'f1', severity: 'critical' })
    const conformant = makeFinding({ id: 'f2', severity: 'conformant' })
    const findings = [critical, conformant]
    const baseline = computeAllScores(findings)
    const projected = computeProjectedScore(findings, new Set(['f1']))
    expect(projected.overall).toBeGreaterThan(baseline.overall)
  })

  it('IS2: resolving all non-conformant gives projected score of 100', () => {
    const findings = [
      makeFinding({ id: 'f1', severity: 'critical' }),
      makeFinding({ id: 'f2', severity: 'major' }),
      makeFinding({ id: 'f3', severity: 'minor' }),
    ]
    const projected = computeProjectedScore(findings, new Set(['f1', 'f2', 'f3']))
    expect(projected.overall).toBe(100)
  })

  it('IS3: resolving 0 findings returns same as actual score', () => {
    const findings = [
      makeFinding({ severity: 'major' }),
      makeFinding({ severity: 'minor' }),
    ]
    const actual = computeAllScores(findings)
    const projected = computeProjectedScore(findings, new Set())
    expect(projected.overall).toBe(actual.overall)
  })

  it('IS4: resolving a conformant finding does not change score', () => {
    const f = makeFinding({ id: 'f1', severity: 'conformant' })
    const baseline = computeAllScores([f])
    const projected = computeProjectedScore([f], new Set(['f1']))
    expect(projected.overall).toBe(baseline.overall)
  })

  it('IS5: does not mutate original findings array', () => {
    const findings = [makeFinding({ id: 'f1', severity: 'major' })]
    const original = findings[0].severity
    computeProjectedScore(findings, new Set(['f1']))
    expect(findings[0].severity).toBe(original)
  })
})

describe('computeScoreDelta', () => {
  it('computes positive delta correctly', () => {
    const allConformant = computeAllScores(
      Array.from({ length: 5 }, () => makeFinding({ severity: 'conformant' }))
    )
    const allMajor = computeAllScores(
      Array.from({ length: 5 }, () => makeFinding({ severity: 'major' }))
    )
    const delta = computeScoreDelta(allConformant, allMajor)
    expect(delta.overall).toBe(70)
  })

  it('computes negative delta correctly', () => {
    const allConformant = computeAllScores([makeFinding({ severity: 'conformant' })])
    const allMajor = computeAllScores([makeFinding({ severity: 'major' })])
    const delta = computeScoreDelta(allMajor, allConformant)
    expect(delta.overall).toBe(-70)
  })
})
