import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiError, SiteType } from '@/types'

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organisation_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const { data: sites, error } = await supabase
      .from('sites')
      .select('*')
      .eq('organisation_id', profile.organisation_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ sites })
  } catch (err) {
    console.error('GET /api/sites error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ site: unknown } | ApiError>> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organisation_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { name, site_type, address, country, employee_count } = body as {
      name: string
      site_type: SiteType
      address?: string
      country: string
      employee_count?: number | null
    }

    if (!name || !site_type || !country) {
      return NextResponse.json({ error: 'Missing required fields: name, site_type, country' }, { status: 400 })
    }

    const VALID_TYPES: SiteType[] = ['farm', 'packhouse', 'factory', 'warehouse', 'office']
    if (!VALID_TYPES.includes(site_type)) {
      return NextResponse.json({ error: 'Invalid site_type' }, { status: 400 })
    }

    const { data: site, error } = await supabase
      .from('sites')
      .insert({
        organisation_id: profile.organisation_id,
        name,
        site_type,
        address: address ?? null,
        country,
        employee_count: employee_count ?? null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ site })
  } catch (err) {
    console.error('POST /api/sites error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
