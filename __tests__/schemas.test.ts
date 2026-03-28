import { describe, it, expect } from 'vitest'
import {
  GapFindingSchema,
  GapAnalysisResponseSchema,
  ConversationResponseSchema,
  QuickCheckAIResponseSchema,
} from '@/lib/ai/schemas'

const validFinding = {
  criteria_id: 'L1.1',
  pillar: 'labour' as const,
  severity: 'conformant' as const,
  finding: 'Workers are free to leave employment with reasonable notice.',
  recommendation: 'Maintain current practice and document in worker handbook.',
  confidence: 0.9,
  estimated_effort: 'low' as const,
  evidence_needed: 'Copy of standard employment contract showing notice period clause.',
}

describe('GapFindingSchema', () => {
  it('V1: valid finding passes', () => {
    const result = GapFindingSchema.safeParse(validFinding)
    expect(result.success).toBe(true)
  })

  it('V2: missing finding field fails', () => {
    const { finding, ...rest } = validFinding
    const result = GapFindingSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('V3: invalid severity fails', () => {
    const result = GapFindingSchema.safeParse({ ...validFinding, severity: 'invalid_value' })
    expect(result.success).toBe(false)
  })

  it('V4: confidence > 1 fails', () => {
    const result = GapFindingSchema.safeParse({ ...validFinding, confidence: 1.5 })
    expect(result.success).toBe(false)
  })

  it('V5: extra fields are stripped/ignored', () => {
    const result = GapFindingSchema.safeParse({ ...validFinding, extra_field: 'should be ignored' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect((result.data as Record<string, unknown>)['extra_field']).toBeUndefined()
    }
  })

  it('V6: finding too short (< 10 chars) fails', () => {
    const result = GapFindingSchema.safeParse({ ...validFinding, finding: 'short' })
    expect(result.success).toBe(false)
  })

  it('null estimated_effort is valid', () => {
    const result = GapFindingSchema.safeParse({ ...validFinding, estimated_effort: null })
    expect(result.success).toBe(true)
  })

  it('null evidence_needed is valid', () => {
    const result = GapFindingSchema.safeParse({ ...validFinding, evidence_needed: null })
    expect(result.success).toBe(true)
  })
})

describe('GapAnalysisResponseSchema', () => {
  it('valid array of findings passes', () => {
    const result = GapAnalysisResponseSchema.safeParse([validFinding])
    expect(result.success).toBe(true)
  })

  it('empty array fails (min 1)', () => {
    const result = GapAnalysisResponseSchema.safeParse([])
    expect(result.success).toBe(false)
  })
})

describe('ConversationResponseSchema', () => {
  const validConversation = {
    message: 'Great, let me continue with the next question.',
    extracted: [
      { question_id: 'L1', response_value: 'yes', confidence: 0.9 },
    ],
    coverage_complete: false,
  }

  it('V7: valid conversation response passes', () => {
    const result = ConversationResponseSchema.safeParse(validConversation)
    expect(result.success).toBe(true)
  })

  it('V8: empty extracted array is valid', () => {
    const result = ConversationResponseSchema.safeParse({ ...validConversation, extracted: [] })
    expect(result.success).toBe(true)
  })

  it('V9: missing coverage_complete fails', () => {
    const { coverage_complete, ...rest } = validConversation
    const result = ConversationResponseSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('optional follow_up_reason accepted when present', () => {
    const result = ConversationResponseSchema.safeParse({
      ...validConversation,
      follow_up_reason: 'Response was ambiguous',
    })
    expect(result.success).toBe(true)
  })
})

describe('QuickCheckAIResponseSchema', () => {
  const validQC = {
    labour_insight: 'Your worker documentation is a great area to build on.',
    health_safety_insight: 'Health and safety practices are developing well at your site.',
    overall_summary: 'Based on what you have shared, there are clear areas where a full assessment can help you strengthen your compliance position.',
    cta_message: 'A full readiness assessment will give you a clear picture across all SMETA criteria.',
  }

  it('valid quick check response passes', () => {
    const result = QuickCheckAIResponseSchema.safeParse(validQC)
    expect(result.success).toBe(true)
  })

  it('overall_summary too short fails', () => {
    const result = QuickCheckAIResponseSchema.safeParse({ ...validQC, overall_summary: 'Short.' })
    expect(result.success).toBe(false)
  })

  it('missing labour_insight fails', () => {
    const { labour_insight: _, ...withoutLabour } = validQC
    const result = QuickCheckAIResponseSchema.safeParse(withoutLabour)
    expect(result.success).toBe(false)
  })
})
