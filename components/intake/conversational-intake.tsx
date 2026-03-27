'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, ArrowRight } from 'lucide-react'
import type { Site, ConversationTurn, IntakeResponse } from '@/types'
import { buildConversationOpeningMessage } from '@/lib/ai/conversation-prompt'
import type { ConversationAIResponse } from '@/types'

interface ConversationalIntakeProps {
  site: Site
  initialTurns: ConversationTurn[]
  mappedQuestionIds: Set<string>
  onResponsesUpdate: (responses: IntakeResponse[]) => void
  onTurnAdded: (turn: ConversationTurn) => void
  onComplete: () => void
}

export function ConversationalIntake({
  site,
  initialTurns,
  mappedQuestionIds,
  onResponsesUpdate,
  onTurnAdded,
  onComplete,
}: ConversationalIntakeProps) {
  const router = useRouter()
  const [turns, setTurns] = useState<ConversationTurn[]>(initialTurns)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [coverageComplete, setCoverageComplete] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Generate opening message if no turns yet
  const openingMessage =
    turns.length === 0 ? buildConversationOpeningMessage(site) : null

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns])

  async function handleSend() {
    const message = input.trim()
    if (!message || loading) return

    setInput('')
    setError('')
    setLoading(true)

    // Optimistically add user turn
    const userTurn: ConversationTurn = {
      id: `temp-${Date.now()}`,
      site_id: site.id,
      turn_number: turns.length * 2 + 1,
      role: 'user',
      content: message,
      extracted_question_ids: null,
      created_at: new Date().toISOString(),
    }
    setTurns((prev) => [...prev, userTurn])
    onTurnAdded(userTurn)

    try {
      const res = await fetch('/api/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: site.id, userMessage: message }),
      })

      if (!res.ok) {
        setError('Failed to send message. Please try again.')
        setLoading(false)
        return
      }

      const data = (await res.json()) as {
        response: ConversationAIResponse
        turnNumber: number
      }

      const assistantTurn: ConversationTurn = {
        id: `ai-${Date.now()}`,
        site_id: site.id,
        turn_number: data.turnNumber * 2,
        role: 'assistant',
        content: data.response.message,
        extracted_question_ids: data.response.extracted.map((e) => e.question_id),
        created_at: new Date().toISOString(),
      }

      setTurns((prev) => [...prev, assistantTurn])
      onTurnAdded(assistantTurn)

      if (data.response.coverage_complete) {
        setCoverageComplete(true)
      }

      // Refresh to get updated responses
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const allTurns: Array<{ role: 'assistant' | 'user'; content: string; id: string }> = []

  if (openingMessage) {
    allTurns.push({ role: 'assistant', content: openingMessage, id: 'opening' })
  }

  turns.forEach((t) => allTurns.push({ role: t.role, content: t.content, id: t.id }))

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-96 max-h-[60vh] pr-2">
        {allTurns.map((turn) => (
          <div
            key={turn.id}
            className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                turn.role === 'assistant'
                  ? 'bg-[#0D3B2E] text-white'
                  : 'bg-zinc-100 text-zinc-900'
              }`}
            >
              {turn.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#0D3B2E] rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-white/50 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Coverage complete state */}
      {coverageComplete && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-emerald-800 font-medium text-sm mb-3">
            All questions covered! You can now run your analysis.
          </p>
          <Button
            className="bg-[#0D3B2E] hover:bg-[#0D3B2E]/90 text-white w-full"
            onClick={onComplete}
          >
            View results & run analysis
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Input area */}
      {!coverageComplete && (
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your response..."
            className="resize-none min-h-[60px] max-h-32"
            disabled={loading}
            rows={2}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="bg-[#0D3B2E] hover:bg-[#0D3B2E]/90 text-white self-end h-10 w-10 p-0 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
