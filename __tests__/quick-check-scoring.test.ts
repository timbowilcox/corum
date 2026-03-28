import { describe, it, expect } from 'vitest'
import { scoreQuickCheck } from '@/lib/smeta/quick-check-scoring'
import type { QuickCheckResponses } from '@/types'

const lowestMaturity: QuickCheckResponses = {
  workforce_size: '200+',
  worker_documentation: 'not_started',
  health_safety_management: 'no_formal',
  fire_safety: 'not_assessed',
  audit_history: 'never',
}

const highestMaturity: QuickCheckResponses = {
  workforce_size: '1-10',
  worker_documentation: 'fully_documented',
  health_safety_management: 'active',
  fire_safety: 'full_programme',
  audit_history: 'passed_recent',
}

const mixedMaturity: QuickCheckResponses = {
  workforce_size: '51-200',
  worker_documentation: 'partial',
  health_safety_management: 'informal',
  fire_safety: 'regular',
  audit_history: 'passed_old',
}

describe('scoreQuickCheck', () => {
  it('all lowest maturity answers → "getting_started" across assessed pillars', () => {
    const result = scoreQuickCheck(lowestMaturity)

    const labour = result.pillars.find((p) => p.pillar === 'labour')
    expect(labour?.level).toBe('getting_started')
    expect(labour?.score).toBe(0)

    const hs = result.pillars.find((p) => p.pillar === 'health_safety')
    expect(hs?.level).toBe('getting_started')
    expect(hs?.score).toBe(0)

    expect(result.overall_level).toBe('getting_started')
  })

  it('all highest maturity answers → "looking_good" across assessed pillars', () => {
    const result = scoreQuickCheck(highestMaturity)

    const labour = result.pillars.find((p) => p.pillar === 'labour')
    expect(labour?.level).toBe('looking_good')
    expect(labour?.score).toBe(1.5)

    const hs = result.pillars.find((p) => p.pillar === 'health_safety')
    expect(hs?.level).toBe('looking_good')
    expect(hs?.score).toBe(1.5)

    expect(result.overall_level).toBe('looking_good')
  })

  it('mixed answers → "making_progress" for pillars with mid-range scores', () => {
    const result = scoreQuickCheck(mixedMaturity)

    const labour = result.pillars.find((p) => p.pillar === 'labour')
    expect(labour?.level).toBe('making_progress')
    expect(labour?.score).toBe(0.5)

    const hs = result.pillars.find((p) => p.pillar === 'health_safety')
    // H&S: informal (0.5) + regular (1.0) = avg 0.75 → making_progress
    expect(hs?.level).toBe('making_progress')
    expect(hs?.score).toBe(0.75)
  })

  it('environment and business_ethics are always "not_assessed"', () => {
    const result = scoreQuickCheck(highestMaturity)

    const env = result.pillars.find((p) => p.pillar === 'environment')
    expect(env?.level).toBe('not_assessed')
    expect(env?.label).toBe('Not yet assessed')

    const ethics = result.pillars.find((p) => p.pillar === 'business_ethics')
    expect(ethics?.level).toBe('not_assessed')
    expect(ethics?.label).toBe('Not yet assessed')
  })

  it('returns all four pillars', () => {
    const result = scoreQuickCheck(lowestMaturity)
    expect(result.pillars).toHaveLength(4)
    const pillarNames = result.pillars.map((p) => p.pillar)
    expect(pillarNames).toContain('labour')
    expect(pillarNames).toContain('health_safety')
    expect(pillarNames).toContain('environment')
    expect(pillarNames).toContain('business_ethics')
  })

  it('overall_level only considers assessed pillars', () => {
    // Labour: 1.5 (looking_good), H&S: 1.5 (looking_good)
    // Environment + Ethics are not_assessed → excluded from overall
    const result = scoreQuickCheck(highestMaturity)
    expect(result.overall_level).toBe('looking_good')
  })

  it('workforce_size and audit_history (context questions) do not affect pillar scores', () => {
    // Same pillar-scoring questions, different context answers
    const withSmallTeam: QuickCheckResponses = {
      ...mixedMaturity,
      workforce_size: '1-10',
      audit_history: 'never',
    }
    const withLargeTeam: QuickCheckResponses = {
      ...mixedMaturity,
      workforce_size: '200+',
      audit_history: 'passed_recent',
    }
    const r1 = scoreQuickCheck(withSmallTeam)
    const r2 = scoreQuickCheck(withLargeTeam)

    // Pillar scores should be identical
    expect(r1.pillars.find((p) => p.pillar === 'labour')?.score)
      .toBe(r2.pillars.find((p) => p.pillar === 'labour')?.score)
    expect(r1.pillars.find((p) => p.pillar === 'health_safety')?.score)
      .toBe(r2.pillars.find((p) => p.pillar === 'health_safety')?.score)
  })

  it('each pillar has a human-readable label', () => {
    const result = scoreQuickCheck(mixedMaturity)
    for (const pillar of result.pillars) {
      expect(pillar.label).toBeTruthy()
      expect(typeof pillar.label).toBe('string')
    }
  })
})
