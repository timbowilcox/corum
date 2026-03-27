import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { buildReasoningPrompt, buildExtractionPrompt } from '@/lib/ai/gap-analysis-prompt'
import { GapAnalysisResponseSchema } from '@/lib/ai/schemas'
import { computeAllScores } from '@/lib/smeta/scoring'
import type { ApiError, IntakeResponse, Site, GapFinding } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MAX_RETRIES = 2

async function runExtractionPass(narrative: string): Promise<unknown[] | null> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [{ role: 'user', content: buildExtractionPrompt(narrative) }],
      })

      const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
      // Strip markdown code fences if present
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

      const parsed = JSON.parse(cleaned) as unknown[]
      const validated = GapAnalysisResponseSchema.safeParse(parsed)
      if (validated.success) return validated.data
    } catch (e) {
      if (attempt === MAX_RETRIES) return null
    }
  }
  return null
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
): Promise<NextResponse<{ jobId: string } | ApiError>> {
  try {
    const { siteId } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify site belongs to user's org
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('*')
      .eq('id', siteId)
      .single()

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // Get intake responses
    const { data: responses } = await supabase
      .from('intake_responses')
      .select('*')
      .eq('site_id', siteId)

    const serviceClient = createServiceClient()

    // Create analysis job
    const { data: job, error: jobError } = await serviceClient
      .from('analysis_jobs')
      .insert({ site_id: siteId, status: 'running', started_at: new Date().toISOString() })
      .select('id')
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Failed to create analysis job' }, { status: 500 })
    }

    const jobId = job.id

    // Run analysis asynchronously (fire and forget — client polls for status)
    runAnalysis(site as Site, (responses ?? []) as IntakeResponse[], jobId, serviceClient).catch(
      console.error
    )

    return NextResponse.json({ jobId })
  } catch (err) {
    console.error('POST /api/analysis error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function runAnalysis(
  site: Site,
  responses: IntakeResponse[],
  jobId: string,
  serviceClient: ReturnType<typeof createServiceClient>
) {
  try {
    // ── Pass 1: Reasoning (extended thinking) ────────────────────────────────
    const reasoningPrompt = buildReasoningPrompt(site, responses)

    const reasoningResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      thinking: { type: 'enabled', budget_tokens: 10000 },
      messages: [{ role: 'user', content: reasoningPrompt }],
    })

    const narrative = reasoningResponse.content
      .filter((b) => b.type === 'text')
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('\n')

    // Store narrative
    await serviceClient
      .from('analysis_jobs')
      .update({ analysis_narrative: narrative })
      .eq('id', jobId)

    // ── Pass 2: Extraction ────────────────────────────────────────────────────
    const findings = await runExtractionPass(narrative)

    if (!findings) {
      await serviceClient
        .from('analysis_jobs')
        .update({
          status: 'failed',
          error_message: 'Failed to extract structured findings after retries',
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId)
      return
    }

    // Insert findings
    const findingRows = findings.map((f) => ({
      ...(f as object),
      site_id: site.id,
      analysis_job_id: jobId,
    }))

    const { data: insertedFindings, error: findingsError } = await serviceClient
      .from('gap_findings')
      .insert(findingRows)
      .select()

    if (findingsError) {
      throw new Error(`Failed to insert findings: ${findingsError.message}`)
    }

    // Compute and store scores
    const scores = computeAllScores((insertedFindings ?? []) as GapFinding[])
    const pillars = ['overall', 'labour', 'health_safety', 'environment', 'business_ethics'] as const

    const scoreRows = pillars.map((pillar) => ({
      site_id: site.id,
      analysis_job_id: jobId,
      pillar,
      score: pillar === 'overall' ? scores.overall : scores[pillar as keyof typeof scores],
      findings_count: (insertedFindings ?? []).filter(
        (f) => pillar === 'overall' || (f as GapFinding).pillar === pillar
      ).length,
      zero_tolerance_count: pillar === 'overall' ? scores.zero_tolerance_count : (insertedFindings ?? []).filter((f) => (f as GapFinding).pillar === pillar && (f as GapFinding).severity === 'zero_tolerance').length,
      critical_count: pillar === 'overall' ? scores.critical_count : (insertedFindings ?? []).filter((f) => (f as GapFinding).pillar === pillar && (f as GapFinding).severity === 'critical').length,
      major_count: pillar === 'overall' ? scores.major_count : (insertedFindings ?? []).filter((f) => (f as GapFinding).pillar === pillar && (f as GapFinding).severity === 'major').length,
      minor_count: pillar === 'overall' ? scores.minor_count : (insertedFindings ?? []).filter((f) => (f as GapFinding).pillar === pillar && (f as GapFinding).severity === 'minor').length,
      conformant_count: pillar === 'overall' ? scores.conformant_count : (insertedFindings ?? []).filter((f) => (f as GapFinding).pillar === pillar && (f as GapFinding).severity === 'conformant').length,
    }))

    await serviceClient.from('readiness_scores').insert(scoreRows)

    // Update job status to complete
    await serviceClient
      .from('analysis_jobs')
      .update({
        status: 'complete',
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    // Update site intake status
    await serviceClient
      .from('sites')
      .update({ intake_status: 'submitted', updated_at: new Date().toISOString() })
      .eq('id', site.id)
  } catch (err) {
    console.error('Analysis run error:', err)
    await serviceClient
      .from('analysis_jobs')
      .update({
        status: 'failed',
        error_message: err instanceof Error ? err.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)
  }
}

// GET: poll analysis job status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
): Promise<NextResponse> {
  try {
    const { siteId } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: job } = await supabase
      .from('analysis_jobs')
      .select('id, status, error_message, completed_at')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({ job })
  } catch (err) {
    console.error('GET /api/analysis error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
