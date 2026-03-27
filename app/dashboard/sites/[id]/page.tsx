import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, CircleAlert, Check, ArrowRight, ClipboardList } from 'lucide-react'
import type { Site, GapFinding, ReadinessScore, AnalysisJob, Pillar, Severity } from '@/types'
import { ScoreArc } from '@/components/score/score-arc'
import { ScoreHistory } from '@/components/score/score-history'
import { RunAnalysisButton } from '@/components/score/run-analysis-button'
import { computeScoreDelta } from '@/lib/smeta/scoring'

const SEVERITY_STYLES: Record<Severity, { badge: string; border: string; label: string }> = {
  zero_tolerance: { badge: 'bg-red-700 text-white', border: 'border-l-red-700', label: 'Zero Tolerance' },
  critical: { badge: 'bg-red-100 text-red-700', border: 'border-l-red-500', label: 'Critical' },
  major: { badge: 'bg-amber-100 text-amber-800', border: 'border-l-amber-500', label: 'Major' },
  minor: { badge: 'bg-zinc-100 text-zinc-600', border: 'border-l-zinc-400', label: 'Minor' },
  conformant: { badge: 'bg-emerald-50 text-emerald-700', border: 'border-l-emerald-500', label: 'Conformant' },
}

const PILLAR_LABELS: Record<Pillar, string> = {
  labour: 'Labour',
  health_safety: 'Health & Safety',
  environment: 'Environment',
  business_ethics: 'Business Ethics',
}

export default async function SiteDetailPage({
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

  // Get all analyses for this site
  const { data: allJobs } = await supabase
    .from('analysis_jobs')
    .select('*')
    .eq('site_id', id)
    .eq('status', 'complete')
    .order('created_at', { ascending: true })

  const latestJob = (allJobs ?? []).slice(-1)[0] as AnalysisJob | undefined

  // Get latest findings
  let findings: GapFinding[] = []
  if (latestJob) {
    const { data } = await supabase
      .from('gap_findings')
      .select('*')
      .eq('analysis_job_id', latestJob.id)
      .order('created_at', { ascending: true })
    findings = (data ?? []) as GapFinding[]
  }

  // Get all overall scores for history
  const { data: allScores } = await supabase
    .from('readiness_scores')
    .select('*')
    .eq('site_id', id)
    .eq('pillar', 'overall')
    .order('created_at', { ascending: true })

  const scoreHistory = (allScores ?? []) as ReadinessScore[]
  const latestScore = scoreHistory[scoreHistory.length - 1]
  const previousScore = scoreHistory[scoreHistory.length - 2]

  // Per-pillar scores for latest job
  let pillarScores: Partial<Record<Pillar | 'overall', ReadinessScore>> = {}
  if (latestJob) {
    const { data: ps } = await supabase
      .from('readiness_scores')
      .select('*')
      .eq('analysis_job_id', latestJob.id)
    for (const s of (ps ?? []) as ReadinessScore[]) {
      pillarScores[s.pillar as Pillar | 'overall'] = s
    }
  }

  const pendingJob = (await supabase
    .from('analysis_jobs')
    .select('id, status')
    .eq('site_id', id)
    .in('status', ['pending', 'running'])
    .limit(1)
    .maybeSingle()).data

  // Sort findings by severity
  const SEVERITY_ORDER: Record<Severity, number> = {
    zero_tolerance: 0, critical: 1, major: 2, minor: 3, conformant: 4,
  }
  const sortedFindings = [...findings].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  )

  const ztFindings = sortedFindings.filter((f) => f.severity === 'zero_tolerance')
  const nonZtFindings = sortedFindings.filter((f) => f.severity !== 'zero_tolerance')
  const pillars: Pillar[] = ['labour', 'health_safety', 'environment', 'business_ethics']

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
        <Link href="/dashboard/sites" className="hover:text-zinc-900">Sites</Link>
        <span>/</span>
        <span className="text-zinc-900">{(site as Site).name}</span>
      </div>

      {/* Hero: score arc + status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6 pb-6 flex flex-col items-center">
              {latestScore ? (
                <>
                  <ScoreArc score={latestScore.score} />
                  <div className="mt-4 text-center">
                    <p className="text-sm text-zinc-500">
                      Last analysed {new Date(latestJob!.completed_at ?? latestJob!.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="w-full mt-4">
                    <ScoreHistory scores={scoreHistory} />
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-24 h-24 rounded-full border-4 border-dashed border-zinc-200 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-zinc-300">?</span>
                  </div>
                  <p className="text-zinc-500 text-sm mb-4">No analysis yet</p>
                </div>
              )}

              <RunAnalysisButton
                siteId={id}
                hasPendingJob={!!pendingJob}
                hasExistingAnalysis={!!latestJob}
              />

              <Button asChild variant="outline" size="sm" className="w-full mt-2">
                <Link href={`/dashboard/sites/${id}/intake`}>
                  <ClipboardList className="h-4 w-4 mr-2" />
                  {(site as Site).intake_status === 'not_started' ? 'Start intake' : 'Continue intake'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Pillar breakdown */}
        <div className="lg:col-span-2">
          {latestScore ? (
            <div className="grid grid-cols-2 gap-4 h-full">
              {pillars.map((pillar) => {
                const ps = pillarScores[pillar]
                const prevPillarScore = previousScore
                  ? (pillarScores[pillar]?.score ?? 0) - 0 // simplified
                  : null
                const score = ps?.score ?? 0
                const color = score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-600'

                let delta: number | null = null
                if (previousScore && latestScore) {
                  // We'd need per-pillar history for exact deltas; approximate from overall delta
                  delta = null // Simplified — full implementation needs pillar history join
                }

                return (
                  <Card key={pillar}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                          {PILLAR_LABELS[pillar]}
                        </span>
                        <span className="text-xl font-bold text-zinc-900">{Math.round(score)}</span>
                      </div>
                      <div className="w-full bg-zinc-100 rounded-full h-2 mb-3">
                        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${score}%` }} />
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {(ps?.zero_tolerance_count ?? 0) > 0 && (
                          <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                            {ps!.zero_tolerance_count} ZT
                          </span>
                        )}
                        {(ps?.critical_count ?? 0) > 0 && (
                          <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded">
                            {ps!.critical_count} crit
                          </span>
                        )}
                        {(ps?.major_count ?? 0) > 0 && (
                          <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                            {ps!.major_count} major
                          </span>
                        )}
                        {(ps?.conformant_count ?? 0) > 0 && (
                          <span className="text-xs bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                            {ps!.conformant_count} ✓
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="h-full">
              <CardContent className="pt-6 pb-6 flex items-center justify-center h-full min-h-48">
                <div className="text-center text-zinc-400">
                  <p className="font-medium">Run your first analysis to see pillar scores</p>
                  <p className="text-sm mt-1">Complete the intake, then click &quot;Run analysis&quot;</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Findings */}
      {findings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            {latestJob ? (
              <>
                <Check className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="font-semibold text-zinc-900 mb-1">All criteria conformant</h3>
                <p className="text-zinc-500 text-sm">Your site meets all assessed SMETA criteria. Well done!</p>
              </>
            ) : (
              <>
                <ClipboardList className="h-12 w-12 text-zinc-200 mx-auto mb-3" />
                <h3 className="font-semibold text-zinc-700 mb-1">No findings yet</h3>
                <p className="text-zinc-500 text-sm mb-4">Complete the intake questionnaire and run an analysis to see your findings.</p>
                <Button asChild className="bg-[#0D3B2E] hover:bg-[#0D3B2E]/90 text-white">
                  <Link href={`/dashboard/sites/${id}/intake`}>Start intake</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">Findings</h2>
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/sites/${id}/remediation`}>
                View remediation roadmap
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Zero tolerance banners */}
          {ztFindings.map((finding) => (
            <div key={finding.id} className="w-full bg-red-700 text-white rounded-lg p-4 mb-3 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-sm uppercase tracking-wide mb-1">
                  Zero Tolerance — {finding.criteria_id}
                </div>
                <p className="text-sm opacity-95">{finding.finding}</p>
                <p className="text-sm opacity-80 mt-1">{finding.recommendation}</p>
              </div>
            </div>
          ))}

          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All ({nonZtFindings.length})</TabsTrigger>
              {pillars.map((p) => {
                const count = nonZtFindings.filter((f) => f.pillar === p).length
                if (count === 0) return null
                return (
                  <TabsTrigger key={p} value={p}>
                    {PILLAR_LABELS[p]} ({count})
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {(['all', ...pillars] as const).map((tab) => {
              const tabFindings =
                tab === 'all' ? nonZtFindings : nonZtFindings.filter((f) => f.pillar === tab)

              return (
                <TabsContent key={tab} value={tab} className="space-y-3">
                  {tabFindings.length === 0 ? (
                    <div className="text-center py-8 text-zinc-400 text-sm">
                      No findings for this pillar
                    </div>
                  ) : (
                    tabFindings.map((finding) => {
                      const styles = SEVERITY_STYLES[finding.severity]
                      const isLowConfidence = finding.confidence < 0.5
                      return (
                        <div
                          key={finding.id}
                          className={`border-l-4 ${styles.border} ${isLowConfidence ? 'border-dashed' : ''} bg-white rounded-lg p-4 border border-zinc-100 shadow-sm`}
                        >
                          <div className="flex items-start gap-3 mb-2">
                            <div className="flex items-center gap-2 flex-wrap flex-1">
                              {finding.severity === 'critical' && (
                                <CircleAlert className="h-4 w-4 text-red-600 flex-shrink-0" />
                              )}
                              {finding.severity === 'conformant' && (
                                <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                              )}
                              <Badge className={`text-xs ${styles.badge}`}>
                                {styles.label}
                              </Badge>
                              <span className="text-xs font-mono text-zinc-400">{finding.criteria_id}</span>
                              <Badge variant="outline" className="text-xs capitalize">
                                {PILLAR_LABELS[finding.pillar as Pillar]}
                              </Badge>
                              {isLowConfidence && (
                                <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                                  Needs evidence
                                </Badge>
                              )}
                            </div>
                            {finding.estimated_effort && finding.severity !== 'conformant' && (
                              <Badge variant="outline" className="text-xs flex-shrink-0 capitalize">
                                {finding.estimated_effort} effort
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-zinc-900 mb-1">{finding.finding}</p>
                          <p className="text-sm text-zinc-500">{finding.recommendation}</p>
                          {finding.evidence_needed && finding.severity !== 'conformant' && (
                            <p className="text-xs text-zinc-400 mt-2 italic">
                              Evidence needed: {finding.evidence_needed}
                            </p>
                          )}
                          <div className="flex items-center gap-1 mt-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${
                                  i < Math.round(finding.confidence * 3)
                                    ? 'bg-zinc-600'
                                    : 'bg-zinc-200'
                                }`}
                              />
                            ))}
                            <span className="text-xs text-zinc-400 ml-1">
                              {finding.confidence >= 0.8 ? 'High confidence' : finding.confidence >= 0.5 ? 'Medium confidence' : 'Low confidence'}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </TabsContent>
              )
            })}
          </Tabs>
        </div>
      )}
    </div>
  )
}
