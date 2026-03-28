import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { scoreQuickCheck } from '@/lib/smeta/quick-check-scoring'
import { QuickCheckAIResponseSchema } from '@/lib/ai/schemas'
import type { ApiError } from '@/types'
import { createHash } from 'crypto'

function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set')
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

// ─── Input validation schema ─────────────────────────────────────────────────

const VALID_SITE_TYPES = ['farm', 'packhouse', 'factory', 'warehouse', 'office'] as const
const VALID_COUNTRIES = ['AU', 'NZ', 'GB', 'TH', 'PH', 'IN', 'OTHER'] as const

const QuickCheckRequestSchema = z.object({
  site_type: z.enum(VALID_SITE_TYPES),
  country: z.enum(VALID_COUNTRIES),
  responses: z.object({
    workforce_size: z.enum(['1-10', '11-50', '51-200', '200+']),
    worker_documentation: z.enum(['not_started', 'partial', 'mostly_complete', 'fully_documented']),
    health_safety_management: z.enum(['no_formal', 'informal', 'documented_stale', 'active']),
    fire_safety: z.enum(['not_assessed', 'some_measures', 'regular', 'full_programme']),
    audit_history: z.enum(['never', 'attempted', 'passed_old', 'passed_recent']),
  }),
})

// ─── Rate limiting ───────────────────────────────────────────────────────────

const RATE_LIMIT = 10
const RATE_WINDOW_MS = 60 * 60 * 1000
const rateMap = new Map<string, { count: number; windowStart: number }>()

function checkRateLimit(ipHash: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(ipHash)

  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateMap.set(ipHash, { count: 1, windowStart: now })
    return true
  }

  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

function getIpHash(request: NextRequest): string {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  return createHash('sha256').update(ip).digest('hex')
}

// ─── Readable labels for prompt (prevents prompt injection) ──────────────────

const WORKFORCE_LABELS: Record<string, string> = {
  '1-10': '1–10 workers',
  '11-50': '11–50 workers',
  '51-200': '51–200 workers',
  '200+': '200+ workers',
}

const DOCUMENTATION_LABELS: Record<string, string> = {
  not_started: 'Not started',
  partial: 'Partially in place',
  mostly_complete: 'Mostly complete',
  fully_documented: 'Fully documented',
}

const HS_LABELS: Record<string, string> = {
  no_formal: 'No formal system',
  informal: 'Some informal practices',
  documented_stale: 'Documented but not reviewed recently',
  active: 'Active and up to date',
}

const FIRE_LABELS: Record<string, string> = {
  not_assessed: 'Not assessed yet',
  some_measures: 'Some measures but no regular drills',
  regular: 'Regular drills and marked exits',
  full_programme: 'Full fire safety programme',
}

const AUDIT_LABELS: Record<string, string> = {
  never: 'Never audited',
  attempted: 'Attempted but did not pass',
  passed_old: 'Passed but over 2 years ago',
  passed_recent: 'Passed within the last 2 years',
}

// ─── Fallback response ──────────────────────────────────────────────────────

const FALLBACK_AI_RESPONSE = {
  labour_insight:
    'Your worker documentation is a great area to build on — having solid records makes every part of the audit smoother.',
  health_safety_insight:
    'Health and safety management is one of the most impactful areas to strengthen. Even small improvements here make a big difference.',
  overall_summary:
    'Based on what you have shared, there are clear areas where a full assessment can help you build a stronger compliance position. Every site starts somewhere, and understanding your current state is the most important first step.',
  cta_message:
    'A full readiness assessment will give you a clear picture of where you stand across all SMETA criteria.',
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ result: unknown } | ApiError>> {
  const ipHash = getIpHash(request)

  if (!checkRateLimit(ipHash)) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again in an hour.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Validate input strictly — prevents prompt injection and ensures type safety
  const parsed = QuickCheckRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join(', ')}` },
      { status: 400 }
    )
  }

  const { responses, site_type, country } = parsed.data

  // Score into pillar-based readiness
  const scoringResult = scoreQuickCheck(responses)

  try {
    // Build prompt using safe label lookups (never raw user input)
    const prompt = `You are a supportive SMETA compliance advisor. A ${site_type} in ${country} has shared some information about their current readiness:

Workforce size: ${WORKFORCE_LABELS[responses.workforce_size] ?? responses.workforce_size}
Worker documentation (contracts, age verification, right-to-work): ${DOCUMENTATION_LABELS[responses.worker_documentation] ?? responses.worker_documentation}
Health & Safety management (policies, risk assessments, records): ${HS_LABELS[responses.health_safety_management] ?? responses.health_safety_management}
Fire safety (exits, drills, signage): ${FIRE_LABELS[responses.fire_safety] ?? responses.fire_safety}
Ethical trade audit history: ${AUDIT_LABELS[responses.audit_history] ?? responses.audit_history}

Their readiness snapshot:
${scoringResult.pillars.map((p) => `- ${p.pillar}: ${p.label} (score: ${p.score})`).join('\n')}

TONE INSTRUCTIONS:
- Be warm, supportive, and encouraging. Never alarming or judgmental.
- Frame gaps as opportunities to strengthen, not failures.
- Acknowledge what they're already doing well.
- Your goal is to make them feel understood and motivated to take the next step.
- Keep each insight to 1-2 sentences.

Return ONLY a JSON object with this exact structure (no markdown, no prose):
{
  "labour_insight": "1-2 sentences about their labour readiness based on worker documentation status",
  "health_safety_insight": "1-2 sentences about their H&S readiness based on their safety management and fire safety answers",
  "overall_summary": "2-3 sentences summarizing where they stand overall and what a full assessment would help with",
  "cta_message": "A warm, encouraging 1-sentence call to action"
}`

    const anthropic = getAnthropicClient()
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })

    // Safe access with bounds check
    const firstContent = response.content.length > 0 ? response.content[0] : null
    const rawText = firstContent?.type === 'text' ? firstContent.text : ''

    let aiResult: typeof FALLBACK_AI_RESPONSE
    try {
      const aiParsed = JSON.parse(rawText)
      const validated = QuickCheckAIResponseSchema.safeParse(aiParsed)
      // Always use validated data or fallback — never raw unvalidated AI output
      aiResult = validated.success ? validated.data : FALLBACK_AI_RESPONSE
    } catch {
      aiResult = FALLBACK_AI_RESPONSE
    }

    const result = {
      pillars: scoringResult.pillars,
      overall_level: scoringResult.overall_level,
      ai: aiResult,
    }

    // Store submission (fire-and-forget)
    try {
      const supabase = createServiceClient()
      await supabase.from('quick_check_submissions').insert({
        ip_hash: ipHash,
        site_type,
        country,
        responses: responses as Record<string, string>,
        risk_grade: scoringResult.overall_level,
        risk_summary: aiResult.overall_summary,
      })
    } catch {
      // Non-fatal — don't fail the request if storage fails
    }

    return NextResponse.json({ result })
  } catch (err) {
    console.error('Quick check AI error:', err)
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 })
  }
}
