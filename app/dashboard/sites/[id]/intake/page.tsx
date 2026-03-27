import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { IntakeShell } from '@/components/intake/intake-shell'
import type { Site, IntakeResponse, ConversationTurn } from '@/types'

export default async function IntakePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: site, error } = await supabase
    .from('sites')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !site) notFound()

  const { data: responses } = await supabase
    .from('intake_responses')
    .select('*')
    .eq('site_id', id)

  const { data: turns } = await supabase
    .from('conversation_turns')
    .select('*')
    .eq('site_id', id)
    .order('turn_number', { ascending: true })

  return (
    <IntakeShell
      site={site as Site}
      initialResponses={(responses ?? []) as IntakeResponse[]}
      initialTurns={(turns ?? []) as ConversationTurn[]}
    />
  )
}
