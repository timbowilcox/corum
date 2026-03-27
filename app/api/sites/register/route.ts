import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { ApiError } from '@/types'

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ success: true } | ApiError>> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { userId, fullName, orgName } = body as {
    userId: string
    fullName: string
    orgName: string
  }

  if (!userId || !orgName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    // Create organisation
    const { data: org, error: orgError } = await supabase
      .from('organisations')
      .insert({ name: orgName })
      .select('id')
      .single()

    if (orgError || !org) {
      console.error('Org creation error:', orgError)
      return NextResponse.json({ error: 'Failed to create organisation' }, { status: 500 })
    }

    // Create user profile
    const { error: profileError } = await supabase.from('user_profiles').insert({
      id: userId,
      organisation_id: org.id,
      full_name: fullName ?? null,
    })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Registration error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
