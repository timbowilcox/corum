import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiError } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ findingId: string }> }
): Promise<NextResponse> {
  try {
    const { findingId } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: notes, error } = await supabase
      .from('finding_notes')
      .select('*')
      .eq('finding_id', findingId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ notes })
  } catch (err) {
    console.error('GET notes error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ findingId: string }> }
): Promise<NextResponse<{ note: unknown } | ApiError>> {
  try {
    const { findingId } = await params
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

    const { note } = body as { note: string }
    if (!note?.trim()) {
      return NextResponse.json({ error: 'Note cannot be empty' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('finding_notes')
      .insert({ finding_id: findingId, note: note.trim(), created_by: user.id })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ note: data })
  } catch (err) {
    console.error('POST notes error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
