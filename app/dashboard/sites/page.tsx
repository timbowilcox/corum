import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Factory, Warehouse, Building2, Leaf, Package } from 'lucide-react'
import type { Site, ReadinessScore, SiteType } from '@/types'

const SITE_TYPE_ICONS: Record<SiteType, typeof Leaf> = {
  farm: Leaf,
  packhouse: Package,
  factory: Factory,
  warehouse: Warehouse,
  office: Building2,
}

const COUNTRY_FLAGS: Record<string, string> = {
  AU: '🇦🇺', NZ: '🇳🇿', GB: '🇬🇧', TH: '🇹🇭', PH: '🇵🇭', IN: '🇮🇳',
}

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const r = (size - 8) / 2
  const circumference = 2 * Math.PI * r
  const strokeDash = (score / 100) * circumference
  const color = score >= 75 ? '#059669' : score >= 50 ? '#D97706' : '#DC2626'

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e4e4e7" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={6}
        strokeDasharray={`${strokeDash} ${circumference}`}
        strokeLinecap="round"
      />
    </svg>
  )
}

export default async function SitesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organisation_id')
    .eq('id', user.id)
    .single()

  const { data: sites } = await supabase
    .from('sites')
    .select('*')
    .eq('organisation_id', profile?.organisation_id ?? '')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const siteIds = (sites ?? []).map((s: Site) => s.id)

  // Get latest score for each site
  let scoreMap: Record<string, ReadinessScore> = {}
  if (siteIds.length > 0) {
    const { data: scores } = await supabase
      .from('readiness_scores')
      .select('*')
      .in('site_id', siteIds)
      .eq('pillar', 'overall')
      .order('created_at', { ascending: false })

    // Keep only the latest score per site
    for (const score of (scores ?? []) as ReadinessScore[]) {
      if (!scoreMap[score.site_id]) {
        scoreMap[score.site_id] = score
      }
    }
  }

  const sitesWithScores = (sites ?? []) as Site[]
  const analysedSites = sitesWithScores.filter((s) => scoreMap[s.id])

  // Sort by score ascending (worst first)
  const sorted = [...sitesWithScores].sort((a, b) => {
    const sa = scoreMap[a.id]?.score ?? 101
    const sb = scoreMap[b.id]?.score ?? 101
    return sa - sb
  })

  const avgScore = analysedSites.length > 0
    ? Math.round(analysedSites.reduce((sum, s) => sum + (scoreMap[s.id]?.score ?? 0), 0) / analysedSites.length)
    : null

  const totalZT = analysedSites.reduce((sum, s) => sum + (scoreMap[s.id]?.zero_tolerance_count ?? 0), 0)
  const totalCritical = analysedSites.reduce((sum, s) => sum + (scoreMap[s.id]?.critical_count ?? 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Your Sites</h1>
          <p className="text-zinc-500 mt-1">Manage your SMETA compliance across all locations</p>
        </div>
        <Button asChild className="bg-[#0D3B2E] hover:bg-[#0D3B2E]/90 text-white">
          <Link href="/dashboard/sites/new">
            <Plus className="h-4 w-4 mr-2" />
            Add site
          </Link>
        </Button>
      </div>

      {/* Portfolio summary — only show for 2+ sites */}
      {sitesWithScores.length >= 2 && (
        <Card className="mb-8 border-[#0D3B2E]/20 bg-[#0D3B2E]/5">
          <CardContent className="pt-5 pb-5">
            <h2 className="font-semibold text-[#0D3B2E] mb-4">Portfolio Overview</h2>
            <div className="flex items-center gap-8 flex-wrap">
              <div>
                <div className="text-2xl font-bold text-zinc-900">{sitesWithScores.length}</div>
                <div className="text-sm text-zinc-500">Sites</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-zinc-900">
                  {avgScore !== null ? avgScore : '—'}
                </div>
                <div className="text-sm text-zinc-500">Average readiness</div>
              </div>
              {totalZT > 0 && (
                <div>
                  <div className="text-2xl font-bold text-red-700">{totalZT}</div>
                  <div className="text-sm text-zinc-500">Zero-tolerance</div>
                </div>
              )}
              {totalCritical > 0 && (
                <div>
                  <div className="text-2xl font-bold text-red-600">{totalCritical}</div>
                  <div className="text-sm text-zinc-500">Critical findings</div>
                </div>
              )}
            </div>

            {/* Score bars */}
            <div className="mt-4 space-y-2">
              {sorted.filter((s) => scoreMap[s.id]).map((site) => {
                const score = scoreMap[site.id].score
                const color = score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-600'
                return (
                  <Link key={site.id} href={`/dashboard/sites/${site.id}`} className="flex items-center gap-3 group">
                    <span className="text-sm text-zinc-700 w-40 truncate group-hover:text-[#0D3B2E]">
                      {site.name}
                    </span>
                    <div className="flex-1 bg-zinc-200 rounded-full h-2">
                      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${score}%` }} />
                    </div>
                    <span className="text-sm font-medium text-zinc-700 w-8 text-right">{Math.round(score)}</span>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Site cards */}
      {sorted.length === 0 ? (
        <div className="text-center py-20">
          <Leaf className="h-16 w-16 text-zinc-200 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-zinc-700 mb-2">No sites yet</h2>
          <p className="text-zinc-500 mb-6 max-w-sm mx-auto">
            Add your first site to start your SMETA readiness assessment. It takes less than 20 minutes.
          </p>
          <Button asChild className="bg-[#0D3B2E] hover:bg-[#0D3B2E]/90 text-white">
            <Link href="/dashboard/sites/new">
              <Plus className="h-4 w-4 mr-2" />
              Add your first site
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((site) => {
            const score = scoreMap[site.id]
            const Icon = SITE_TYPE_ICONS[site.site_type] ?? Building2
            const flag = COUNTRY_FLAGS[site.country] ?? ''

            return (
              <Link key={site.id} href={`/dashboard/sites/${site.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border hover:border-[#0D3B2E]/30">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-[#0D3B2E]/10 rounded-lg">
                          <Icon className="h-4 w-4 text-[#0D3B2E]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-zinc-900 leading-tight">{site.name}</h3>
                          <p className="text-xs text-zinc-500 capitalize">
                            {site.site_type} {flag}
                          </p>
                        </div>
                      </div>
                      {score ? (
                        <div className="relative flex-shrink-0">
                          <ScoreRing score={score.score} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-zinc-900">
                              {Math.round(score.score)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs text-zinc-400">
                          Not analysed
                        </Badge>
                      )}
                    </div>

                    {score && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {score.zero_tolerance_count > 0 && (
                          <Badge className="bg-red-700 text-white text-xs">
                            {score.zero_tolerance_count} ZT
                          </Badge>
                        )}
                        {score.critical_count > 0 && (
                          <Badge className="bg-red-100 text-red-700 text-xs">
                            {score.critical_count} critical
                          </Badge>
                        )}
                        {score.major_count > 0 && (
                          <Badge className="bg-amber-100 text-amber-800 text-xs">
                            {score.major_count} major
                          </Badge>
                        )}
                        {score.zero_tolerance_count === 0 && score.critical_count === 0 && score.major_count === 0 && (
                          <Badge className="bg-emerald-50 text-emerald-700 text-xs">
                            All good
                          </Badge>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-zinc-400 mt-3">
                      {score
                        ? `Analysed ${new Date(score.created_at).toLocaleDateString()}`
                        : `Created ${new Date(site.created_at).toLocaleDateString()}`}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
