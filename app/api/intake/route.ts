import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiError } from '@/types'

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ success: true } | ApiError>> {
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

    const { siteId, responses } = body as {
      siteId: string
      responses: Array<{
        site_id: string
        question_id: string
        pillar: string
        response_value: string
        response_type: string
        source: string
      }>
    }

    if (!siteId || !responses?.length) {
      return NextResponse.json({ error: 'Missing siteId or responses' }, { status: 400 })
    }

    // Verify site belongs to user
    const { data: site } = await supabase
      .from('sites')
      .select('id')
      .eq('id', siteId)
      .single()

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('intake_responses')
      .upsert(responses, { onConflict: 'site_id,question_id' })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update intake status
    await supabase
      .from('sites')
      .update({ intake_status: 'in_progress', updated_at: new Date().toISOString() })
      .eq('id', siteId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('POST /api/intake error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
