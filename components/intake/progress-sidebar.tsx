'use client'

import { INTAKE_QUESTIONS, QUESTIONS_BY_PILLAR } from '@/lib/smeta/intake-questions'
import type { Pillar } from '@/types'

const PILLAR_LABELS: Record<Pillar, string> = {
  labour: 'Labour',
  health_safety: 'Health & Safety',
  environment: 'Environment',
  business_ethics: 'Business Ethics',
}

const PILLARS: Pillar[] = ['labour', 'health_safety', 'environment', 'business_ethics']

interface ProgressSidebarProps {
  mappedQuestionIds: Set<string>
  onTopicSelect?: (questionId: string) => void
}

export function ProgressSidebar({ mappedQuestionIds, onTopicSelect }: ProgressSidebarProps) {
  const total = INTAKE_QUESTIONS.length
  const mapped = mappedQuestionIds.size
  const overallPct = Math.round((mapped / total) * 100)

  return (
    <div className="sticky top-24">
      {/* Overall ring */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg width={64} height={64} className="-rotate-90">
              <circle cx={32} cy={32} r={26} fill="none" stroke="#e4e4e7" strokeWidth={6} />
              <circle
                cx={32} cy={32} r={26} fill="none"
                stroke="#0D3B2E" strokeWidth={6}
                strokeDasharray={`${(overallPct / 100) * 2 * Math.PI * 26} ${2 * Math.PI * 26}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-zinc-900">{overallPct}%</span>
            </div>
          </div>
          <div>
            <p className="font-semibold text-zinc-900">Overall progress</p>
            <p className="text-sm text-zinc-500">{mapped} of {total} criteria mapped</p>
          </div>
        </div>
      </div>

      {/* Per-pillar sections */}
      <div className="space-y-3">
        {PILLARS.map((pillar) => {
          const questions = QUESTIONS_BY_PILLAR[pillar] ?? []
          const pillarMapped = questions.filter((q) => mappedQuestionIds.has(q.id)).length
          const pillarPct = Math.round((pillarMapped / questions.length) * 100)

          return (
            <div key={pillar} className="bg-white rounded-xl border border-zinc-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-700">
                  {PILLAR_LABELS[pillar]}
                </span>
                <span className="text-xs text-zinc-500">{pillarMapped}/{questions.length}</span>
              </div>
              <div className="w-full bg-zinc-100 rounded-full h-1.5 mb-2">
                <div
                  className="bg-[#0D3B2E] h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${pillarPct}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-1">
                {questions.map((q) => {
                  const isMapped = mappedQuestionIds.has(q.id)
                  return (
                    <button
                      key={q.id}
                      onClick={() => onTopicSelect?.(q.id)}
                      title={q.question}
                      className={`text-xs px-1.5 py-0.5 rounded font-mono transition-colors ${
                        isMapped
                          ? 'bg-emerald-100 text-emerald-700 cursor-default'
                          : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 cursor-pointer'
                      }`}
                    >
                      {q.id}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
