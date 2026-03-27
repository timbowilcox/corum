import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Site, GapFinding, AnalysisJob } from '@/types'
import { RemediationClient } from '@/components/remediation/remediation-client'

export default async function RemediationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: site, error: siteError } = await supabase
    .from('sites')
    .select('*')
    .eq('id', id)
    .single()

  if (siteError || !site) notFound()

  // Get latest complete analysis job
  const { data: latestJob } = await supabase
    .from('analysis_jobs')
    .select('*')
    .eq('site_id', id)
    .eq('status', 'complete')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let findings: GapFinding[] = []
  if (latestJob) {
    const { data } = await supabase
      .from('gap_findings')
      .select('*')
      .eq('analysis_job_id', (latestJob as AnalysisJob).id)
    findings = (data ?? []) as GapFinding[]
  }

  // Get latest overall score
  const { data: latestScore } = await supabase
    .from('readiness_scores')
    .select('score')
    .eq('site_id', id)
    .eq('pillar', 'overall')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nonConformantFindings = findings.filter((f) => f.severity !== 'conformant')

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/dashboard/sites/${id}`} className="text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Remediation Roadmap</h1>
          <p className="text-sm text-zinc-500">{(site as Site).name}</p>
        </div>
      </div>

      {nonConformantFindings.length === 0 ? (
        <div className="text-center py-20">
          <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-zinc-900 mb-2">
            {findings.length === 0
              ? 'No analysis yet'
              : 'All criteria conformant — you\'re audit ready!'}
          </h2>
          <p className="text-zinc-500 mb-6 max-w-sm mx-auto">
            {findings.length === 0
              ? 'Run your first analysis to generate a remediation roadmap.'
              : 'Your site meets all assessed SMETA criteria. Run a re-analysis periodically to confirm ongoing compliance.'}
          </p>
          <Button asChild className="bg-[#0D3B2E] hover:bg-[#0D3B2E]/90 text-white">
            <Link href={`/dashboard/sites/${id}`}>Back to dashboard</Link>
          </Button>
        </div>
      ) : (
        <RemediationClient
          siteId={id}
          findings={nonConformantFindings}
          allFindings={findings}
          currentScore={latestScore?.score ?? 0}
        />
      )}
    </div>
  )
}
