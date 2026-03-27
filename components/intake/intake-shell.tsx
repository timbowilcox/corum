'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, List, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ConversationalIntake } from './conversational-intake'
import { FormIntake } from './form-intake'
import { ProgressSidebar } from './progress-sidebar'
import type { Site, IntakeResponse, ConversationTurn } from '@/types'
import { INTAKE_QUESTIONS } from '@/lib/smeta/intake-questions'

interface IntakeShellProps {
  site: Site
  initialResponses: IntakeResponse[]
  initialTurns: ConversationTurn[]
}

export function IntakeShell({ site, initialResponses, initialTurns }: IntakeShellProps) {
  const router = useRouter()
  const [mode, setMode] = useState<'conversation' | 'form'>(site.intake_mode ?? 'conversation')
  const [responses, setResponses] = useState<IntakeResponse[]>(initialResponses)
  const [turns, setTurns] = useState<ConversationTurn[]>(initialTurns)

  const mappedIds = new Set(responses.map((r) => r.question_id))
  const totalQuestions = INTAKE_QUESTIONS.length
  const completionPct = Math.round((mappedIds.size / totalQuestions) * 100)

  function handleResponsesUpdate(newResponses: IntakeResponse[]) {
    setResponses(newResponses)
  }

  function handleTurnAdded(turn: ConversationTurn) {
    setTurns((prev) => [...prev, turn])
  }

  function handleComplete() {
    router.push(`/dashboard/sites/${site.id}`)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/dashboard/sites/${site.id}`} className="text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-zinc-900">{site.name}</h1>
          <p className="text-sm text-zinc-500">SMETA Readiness Assessment</p>
        </div>
        <Badge
          variant="outline"
          className={completionPct === 100 ? 'border-emerald-500 text-emerald-700' : ''}
        >
          {completionPct}% complete
        </Badge>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-6 border-b border-zinc-200 pb-4">
        <button
          onClick={() => setMode('conversation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'conversation'
              ? 'bg-[#0D3B2E] text-white'
              : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Guided conversation
        </button>
        <button
          onClick={() => setMode('form')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'form'
              ? 'bg-[#0D3B2E] text-white'
              : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          <List className="h-4 w-4" />
          Standard form
        </button>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          {mode === 'conversation' ? (
            <ConversationalIntake
              site={site}
              initialTurns={turns}
              mappedQuestionIds={mappedIds}
              onResponsesUpdate={handleResponsesUpdate}
              onTurnAdded={handleTurnAdded}
              onComplete={handleComplete}
            />
          ) : (
            <FormIntake
              site={site}
              initialResponses={responses}
              onResponsesUpdate={handleResponsesUpdate}
              onComplete={handleComplete}
            />
          )}
        </div>
        <div className="lg:col-span-2">
          <ProgressSidebar
            mappedQuestionIds={mappedIds}
            onTopicSelect={(questionId) => {
              if (mode === 'form') return
              // The conversational intake handles this via event
            }}
          />
        </div>
      </div>
    </div>
  )
}
