import { describe, it, expect } from 'vitest'
import { gradeQuickCheck } from '@/lib/smeta/quick-check-scoring'
import type { QuickCheckResponses } from '@/types'

const allYes: QuickCheckResponses = { QC1: 'no', QC2: 'yes', QC3: 'yes', QC4: 'yes', QC5: 'yes' }

describe('gradeQuickCheck', () => {
  it('QS1: QC1=yes → high_risk zero_tolerance_detected', () => {
    const result = gradeQuickCheck({ ...allYes, QC1: 'yes' })
    expect(result.grade).toBe('high_risk')
    expect(result.reason).toBe('zero_tolerance_detected')
  })

  it('QS2: QC2=no → high_risk zero_tolerance_detected', () => {
    const result = gradeQuickCheck({ ...allYes, QC2: 'no' })
    expect(result.grade).toBe('high_risk')
    expect(result.reason).toBe('zero_tolerance_detected')
  })

  it('QS3: QC1=yes AND QC2=no → high_risk zero_tolerance_detected', () => {
    const result = gradeQuickCheck({ ...allYes, QC1: 'yes', QC2: 'no' })
    expect(result.grade).toBe('high_risk')
    expect(result.reason).toBe('zero_tolerance_detected')
  })

  it('QS4: QC3=no, QC4=no (2 critical gaps) → high_risk multiple_critical_gaps', () => {
    const result = gradeQuickCheck({ ...allYes, QC3: 'no', QC4: 'no' })
    expect(result.grade).toBe('high_risk')
    expect(result.reason).toBe('multiple_critical_gaps')
  })

  it('QS5: only QC5=no → moderate_risk single_critical_gap', () => {
    const result = gradeQuickCheck({ ...allYes, QC5: 'no' })
    expect(result.grade).toBe('moderate_risk')
    expect(result.reason).toBe('single_critical_gap')
  })

  it('QS6: all favourable → low_risk no_immediate_concerns', () => {
    const result = gradeQuickCheck(allYes)
    expect(result.grade).toBe('low_risk')
    expect(result.reason).toBe('no_immediate_concerns')
  })

  it('ZT check takes priority over critical gaps', () => {
    // QC1=yes (ZT) + QC3=no + QC4=no + QC5=no (3 critical) → should still be ZT
    const result = gradeQuickCheck({ QC1: 'yes', QC2: 'yes', QC3: 'no', QC4: 'no', QC5: 'no' })
    expect(result.grade).toBe('high_risk')
    expect(result.reason).toBe('zero_tolerance_detected')
  })

  it('3 critical gaps (QC3+QC4+QC5=no) → high_risk multiple_critical_gaps', () => {
    const result = gradeQuickCheck({ QC1: 'no', QC2: 'yes', QC3: 'no', QC4: 'no', QC5: 'no' })
    expect(result.grade).toBe('high_risk')
    expect(result.reason).toBe('multiple_critical_gaps')
  })
})
