'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertTriangle, CircleAlert, RefreshCw, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import type { GapFinding, Severity, Pillar, FindingNote } from '@/types'
import { computeProjectedScore } from '@/lib/smeta/scoring'
import { ScoreArc } from '@/components/score/score-arc'

const SEVERITY_LABELS: Record<Severity, string> = {
  zero_tolerance: 'Zero Tolerance',
  critical: 'Critical',
  major: 'Major',
  minor: 'Minor',
  conformant: 'Conformant',
}

const EFFORT_COLORS: Record<string, string> = {
  low: 'bg-emerald-50 text-emerald-700',
  medium: 'bg-amber-50 text-amber-800',
  high: 'bg-red-50 text-red-700',
}

const PILLAR_LABELS: Record<Pillar, string> = {
  labour: 'Labour',
  health_safety: 'H&S',
  environment: 'Env',
  business_ethics: 'Ethics',
}

interface RemediationClientProps {
  siteId: string
  findings: GapFinding[]
  allFindings: GapFinding[]
  currentScore: number
}

// Sort by potential impact: ZT and critical first, then by estimated_effort
const SEVERITY_IMPACT: Record<Severity, number> = {
  zero_tolerance: 0,
  critical: 1,
  major: 2,
  minor: 3,
  conformant: 4,
}

export function RemediationClient({
  siteId,
  findings,
  allFindings,
  currentScore,
}: RemediationClientProps) {
  const router = useRouter()
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set())
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({})
  const [savedNotes, setSavedNotes] = useState<Record<string, FindingNote[]>>({})
  const [savingNote, setSavingNote] = useState<string | null>(null)

  const sortedFindings = [...findings].sort(
    (a, b) => SEVERITY_IMPACT[a.severity] - SEVERITY_IMPACT[b.severity]
  )

  const projectedScores = computeProjectedScore(allFindings, resolvedIds)
  const projectedOverall = projectedScores.overall
  const scoreDelta = Math.round((projectedOverall - currentScore) * 10) / 10

  function toggleResolved(id: string) {
    setResolvedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleNotes(id: string) {
    setExpandedNotes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function saveNote(findingId: string) {
    const note = noteInputs[findingId]?.trim()
    if (!note) return

    setSavingNote(findingId)
    try {
      const res = await fetch(`/api/findings/${findingId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      })

      if (res.ok) {
        const data = (await res.json()) as { note: FindingNote }
        setSavedNotes((prev) => ({
          ...prev,
          [findingId]: [...(prev[findingId] ?? []), data.note],
        }))
        setNoteInputs((prev) => ({ ...prev, [findingId]: '' }))
      }
    } finally {
      setSavingNote(null)
    }
  }

  return (
    <div>
      {/* Impact simulator sticky panel */}
      <div className="sticky top-20 z-10 mb-6">
        <Card className="border-[#0D3B2E]/20 bg-white shadow-md">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-xs text-zinc-500 mb-1">Current</div>
                  <ScoreArc score={currentScore} size={80} />
                </div>
                <div className="text-center">
                  <div className="text-xs text-zinc-500 mb-1">Projected</div>
                  <ScoreArc score={projectedOverall} size={80} />
                </div>
              </div>
              <div className="flex-1">
                {resolvedIds.size > 0 ? (
                  <div>
                    <p className="font-semibold text-zinc-900">
                      {scoreDelta > 0
                        ? `+${scoreDelta} points if you resolve ${resolvedIds.size} item${resolvedIds.size > 1 ? 's' : ''}`
                        : `No score change for selected items`}
                    </p>
                    <p className="text-sm text-zinc-500 mt-0.5">
                      Score improves from {Math.round(currentScore)} → {Math.round(projectedOverall)}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Projected only — actual score updates on re-analysis
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-zinc-900">Impact simulator</p>
                    <p className="text-sm text-zinc-500">
                      Check items below to see how your score would improve
                    </p>
                  </div>
                )}
              </div>
              {resolvedIds.size > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#0D3B2E] text-[#0D3B2E]"
                  onClick={() => router.push(`/dashboard/sites/${siteId}`)}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Re-run analysis
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Finding cards */}
      <div className="space-y-3">
        {sortedFindings.map((finding) => {
          const isResolved = resolvedIds.has(finding.id)
          const notesOpen = expandedNotes.has(finding.id)
          const notes = savedNotes[finding.id] ?? []

          return (
            <Card
              key={finding.id}
              className={`border-l-4 transition-all ${
                finding.severity === 'zero_tolerance'
                  ? 'border-l-red-700'
                  : finding.severity === 'critical'
                  ? 'border-l-red-500'
                  : finding.severity === 'major'
                  ? 'border-l-amber-500'
                  : 'border-l-zinc-400'
              } ${isResolved ? 'opacity-60' : ''}`}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isResolved}
                    onCheckedChange={() => toggleResolved(finding.id)}
                    className="mt-1 flex-shrink-0"
                    aria-label={`Mark ${finding.criteria_id} as resolved`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {finding.severity === 'zero_tolerance' && (
                        <AlertTriangle className="h-4 w-4 text-red-700 flex-shrink-0" />
                      )}
                      {finding.severity === 'critical' && (
                        <CircleAlert className="h-4 w-4 text-red-600 flex-shrink-0" />
                      )}
                      <Badge
                        className={`text-xs ${
                          finding.severity === 'zero_tolerance'
                            ? 'bg-red-700 text-white'
                            : finding.severity === 'critical'
                            ? 'bg-red-100 text-red-700'
                            : finding.severity === 'major'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {SEVERITY_LABELS[finding.severity]}
                      </Badge>
                      <span className="text-xs font-mono text-zinc-400">{finding.criteria_id}</span>
                      <Badge variant="outline" className="text-xs">
                        {PILLAR_LABELS[finding.pillar as Pillar]}
                      </Badge>
                      {finding.estimated_effort && (
                        <Badge className={`text-xs ${EFFORT_COLORS[finding.estimated_effort] ?? ''}`}>
                          {finding.estimated_effort.charAt(0).toUpperCase() + finding.estimated_effort.slice(1)} effort
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-zinc-900 mb-1">{finding.finding}</p>
                    <p className="text-sm text-zinc-600">{finding.recommendation}</p>

                    {finding.evidence_needed && (
                      <p className="text-xs text-zinc-400 mt-2 italic">
                        Evidence needed: {finding.evidence_needed}
                      </p>
                    )}

                    {/* Notes section */}
                    <div className="mt-3 border-t border-zinc-100 pt-3">
                      <button
                        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
                        onClick={() => toggleNotes(finding.id)}
                      >
                        <Plus className="h-3 w-3" />
                        {notes.length > 0 ? `${notes.length} note${notes.length > 1 ? 's' : ''}` : 'Add note'}
                        {notesOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>

                      {notesOpen && (
                        <div className="mt-3 space-y-2">
                          {notes.map((note) => (
                            <div key={note.id} className="bg-zinc-50 rounded p-2">
                              <p className="text-sm text-zinc-800">{note.note}</p>
                              <p className="text-xs text-zinc-400 mt-1">
                                {new Date(note.created_at).toLocaleString()}
                              </p>
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <Textarea
                              value={noteInputs[finding.id] ?? ''}
                              onChange={(e) =>
                                setNoteInputs((prev) => ({ ...prev, [finding.id]: e.target.value }))
                              }
                              placeholder="e.g. Updated policy document — see shared drive"
                              className="text-sm resize-none min-h-[60px]"
                              rows={2}
                            />
                            <Button
                              size="sm"
                              className="self-end flex-shrink-0 bg-[#0D3B2E] hover:bg-[#0D3B2E]/90 text-white"
                              onClick={() => saveNote(finding.id)}
                              disabled={!noteInputs[finding.id]?.trim() || savingNote === finding.id}
                            >
                              {savingNote === finding.id ? 'Saving...' : 'Save'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {resolvedIds.size > 0 && (
        <div className="mt-8 text-center">
          <p className="text-zinc-500 text-sm mb-3">
            Ready to confirm these improvements?
          </p>
          <Button
            className="bg-[#0D3B2E] hover:bg-[#0D3B2E]/90 text-white"
            onClick={() => router.push(`/dashboard/sites/${siteId}`)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Re-run analysis to confirm your improvements
          </Button>
        </div>
      )}
    </div>
  )
}
