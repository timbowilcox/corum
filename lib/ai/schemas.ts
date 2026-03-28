import { z } from 'zod'

// Conversation turn response
export const ConversationResponseSchema = z.object({
  message: z.string().min(1),
  extracted: z.array(
    z.object({
      question_id: z.string(),
      response_value: z.string(),
      confidence: z.number().min(0).max(1),
    })
  ),
  follow_up_reason: z.string().optional(),
  coverage_complete: z.boolean(),
})

export type ConversationResponseSchemaType = z.infer<typeof ConversationResponseSchema>

// Gap analysis finding (pass 2 output)
export const GapFindingSchema = z.object({
  criteria_id: z.string(),
  pillar: z.enum(['labour', 'health_safety', 'environment', 'business_ethics']),
  severity: z.enum(['zero_tolerance', 'critical', 'major', 'minor', 'conformant']),
  finding: z.string().min(10),
  recommendation: z.string().min(10),
  confidence: z.number().min(0).max(1),
  estimated_effort: z.enum(['low', 'medium', 'high']).nullable(),
  evidence_needed: z.string().nullable(),
})

export type GapFindingSchemaType = z.infer<typeof GapFindingSchema>

export const GapAnalysisResponseSchema = z.array(GapFindingSchema).min(1)

export type GapAnalysisResponseSchemaType = z.infer<typeof GapAnalysisResponseSchema>

// Quick check AI response — pillar-based insights, warm advisory tone
export const QuickCheckAIResponseSchema = z.object({
  labour_insight: z.string().min(10),
  health_safety_insight: z.string().min(10),
  overall_summary: z.string().min(20),
  cta_message: z.string().min(10),
})

export type QuickCheckAIResponseSchemaType = z.infer<typeof QuickCheckAIResponseSchema>
