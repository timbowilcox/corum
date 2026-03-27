import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/service'
import { gradeQuickCheck } from '@/lib/smeta/quick-check-scoring'
import { QuickCheckAIResponseSchema } from '@/lib/ai/schemas'
import type { QuickCheckResponses, ApiError } from '@/types'
import { createHash } from 'crypto'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Rate limit: max 10 per IP per hour
const RATE_LIMIT = 10
const RATE_WINDOW_MS = 60 * 60 * 1000

// In-memory rate limiting (sufficient for MVP; use Redis in production)
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

  const { responses, site_type, country } = body as {
    responses: QuickCheckResponses
    site_type: string
    country: string
  }

  if (!responses || !site_type || !country) {
    return NextResponse.json({ error: 'Missing required fields: responses, site_type, country' }, { status: 400 })
  }

  // First compute the deterministic grade (no AI needed for grading)
  const deterministicResult = gradeQuickCheck(responses)

  try {
    // Use AI to generate a richer, contextual response
    const prompt = `You are a SMETA compliance expert. A ${site_type} in ${country} has answered these 5 quick screening questions:

QC1 - Are there any workers under age 15?: ${responses.QC1}
QC2 - Are all workers free to leave without penalty?: ${responses.QC2}
QC3 - Are fire exits marked, clear and drilled twice yearly?: ${responses.QC3}
QC4 - Do all workers receive at least minimum wage?: ${responses.QC4}
QC5 - Is there a written H&S policy signed by management?: ${responses.QC5}

The preliminary risk grade is: ${deterministicResult.grade}
Reason: ${deterministicResult.reason}

Return ONLY a JSON object with this exact structure (no markdown, no prose):
{
  "risk_grade": "${deterministicResult.grade}",
  "risk_summary": "2-3 sentences explaining what this grade means for their specific situation",
  "top_concerns": ["concern 1", "concern 2"],
  "cta_message": "A compelling 1-sentence CTA encouraging them to get the full analysis"
}

top_concerns should be empty array for low_risk. Max 3 items.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    let parsed: unknown
    try {
      parsed = JSON.parse(rawText)
    } catch {
      // Fallback to deterministic result if AI response is malformed
      parsed = {
        risk_grade: deterministicResult.grade,
        risk_summary: `Based on your answers, your site has been classified as ${deterministicResult.grade.replace('_', ' ')}. ${deterministicResult.reason === 'zero_tolerance_detected' ? 'One or more responses indicate a potential zero-tolerance issue that requires immediate attention.' : deterministicResult.reason === 'multiple_critical_gaps' ? 'Multiple critical compliance gaps were identified that need urgent attention.' : 'A compliance gap was identified that should be addressed.'}`,
        top_concerns: [],
        cta_message: 'Get your complete SMETA readiness analysis to understand the full picture.',
      }
    }

    const validated = QuickCheckAIResponseSchema.safeParse(parsed)
    const result = validated.success ? validated.data : parsed

    // Store submission (fire-and-forget)
    try {
      const supabase = createServiceClient()
      await supabase.from('quick_check_submissions').insert({
        ip_hash: ipHash,
        site_type,
        country,
        responses: responses as Record<string, string>,
        risk_grade: deterministicResult.grade,
        risk_summary: (result as { risk_summary?: string })?.risk_summary ?? '',
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
