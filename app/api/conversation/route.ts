import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { buildConversationSystemPrompt } from '@/lib/ai/conversation-prompt'
import { ConversationResponseSchema } from '@/lib/ai/schemas'
import { QUESTION_BY_ID } from '@/lib/smeta/intake-questions'
import type { ApiError, ConversationTurn, Site } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ response: unknown; turnNumber: number } | ApiError>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { siteId, userMessage } = body as { siteId: string; userMessage: string }

    if (!siteId || !userMessage?.trim()) {
      return NextResponse.json({ error: 'Missing siteId or userMessage' }, { status: 400 })
    }

    // Get site
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('*')
      .eq('id', siteId)
      .single()

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // Get existing conversation turns
    const { data: existingTurns } = await supabase
      .from('conversation_turns')
      .select('*')
      .eq('site_id', siteId)
      .order('turn_number', { ascending: true })

    // Get already-mapped question IDs
    const { data: existingResponses } = await supabase
      .from('intake_responses')
      .select('question_id')
      .eq('site_id', siteId)

    const mappedQuestionIds = (existingResponses ?? []).map(
      (r: { question_id: string }) => r.question_id
    )

    const systemPrompt = buildConversationSystemPrompt(site as Site, mappedQuestionIds)

    // Build message history for Claude
    const turns = (existingTurns ?? []) as ConversationTurn[]
    const messages: Anthropic.MessageParam[] = turns.map((t) => ({
      role: t.role as 'user' | 'assistant',
      content: t.content,
    }))
    messages.push({ role: 'user', content: userMessage })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '{}'
    let parsed: unknown
    try {
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      // Graceful fallback
      parsed = {
        message: "I'm sorry, I had trouble processing that. Could you rephrase your response?",
        extracted: [],
        coverage_complete: false,
      }
    }

    const validated = ConversationResponseSchema.safeParse(parsed)
    const aiResponse = validated.success ? validated.data : {
      message: "I'm sorry, I had trouble understanding that response. Could you try again?",
      extracted: [],
      coverage_complete: false,
    }

    const serviceClient = createServiceClient()
    const nextTurnNumber = turns.length + 1

    // Save user turn
    await serviceClient.from('conversation_turns').insert({
      site_id: siteId,
      turn_number: nextTurnNumber * 2 - 1,
      role: 'user',
      content: userMessage,
      extracted_question_ids: null,
    })

    // Save assistant turn with extracted question IDs
    const extractedIds = aiResponse.extracted.map((e) => e.question_id)
    await serviceClient.from('conversation_turns').insert({
      site_id: siteId,
      turn_number: nextTurnNumber * 2,
      role: 'assistant',
      content: aiResponse.message,
      extracted_question_ids: extractedIds.length > 0 ? extractedIds : null,
    })

    // Upsert intake responses for extracted items
    if (aiResponse.extracted.length > 0) {
      const responseRows = aiResponse.extracted
        .filter((e) => QUESTION_BY_ID[e.question_id]) // Only valid question IDs
        .map((e) => {
          const question = QUESTION_BY_ID[e.question_id]
          return {
            site_id: siteId,
            question_id: e.question_id,
            pillar: question.pillar,
            response_value: e.response_value,
            response_type: question.type,
            source: 'conversation' as const,
          }
        })

      if (responseRows.length > 0) {
        await serviceClient
          .from('intake_responses')
          .upsert(responseRows, { onConflict: 'site_id,question_id' })
      }
    }

    // Update site intake status
    if (aiResponse.coverage_complete) {
      await serviceClient
        .from('sites')
        .update({ intake_status: 'submitted', updated_at: new Date().toISOString() })
        .eq('id', siteId)
    } else {
      await serviceClient
        .from('sites')
        .update({ intake_status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('id', siteId)
    }

    return NextResponse.json({ response: aiResponse, turnNumber: nextTurnNumber })
  } catch (err) {
    console.error('POST /api/conversation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: load conversation history
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')

    if (!siteId) {
      return NextResponse.json({ error: 'Missing siteId' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: turns } = await supabase
      .from('conversation_turns')
      .select('*')
      .eq('site_id', siteId)
      .order('turn_number', { ascending: true })

    const { data: responses } = await supabase
      .from('intake_responses')
      .select('question_id')
      .eq('site_id', siteId)

    return NextResponse.json({
      turns: turns ?? [],
      mappedQuestionIds: (responses ?? []).map((r: { question_id: string }) => r.question_id),
    })
  } catch (err) {
    console.error('GET /api/conversation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
