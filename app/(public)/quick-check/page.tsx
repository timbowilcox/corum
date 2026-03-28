'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowLeft, Leaf, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QUICK_CHECK_QUESTIONS } from '@/lib/smeta/quick-check-questions'
import type { QuickCheckAIResponseSchemaType } from '@/lib/ai/schemas'
import type { SiteType, PillarReadiness } from '@/types'

// ─── Constants ───────────────────────────────────────────────────────────────

const SITE_TYPES: { value: SiteType; label: string; emoji: string }[] = [
  { value: 'farm', label: 'Farm', emoji: '🌾' },
  { value: 'packhouse', label: 'Packhouse', emoji: '📦' },
  { value: 'factory', label: 'Factory', emoji: '🏭' },
  { value: 'warehouse', label: 'Warehouse', emoji: '🏗' },
  { value: 'office', label: 'Office', emoji: '🏢' },
]

const COUNTRIES = [
  { value: 'AU', label: 'Australia' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'TH', label: 'Thailand' },
  { value: 'PH', label: 'Philippines' },
  { value: 'IN', label: 'India' },
  { value: 'OTHER', label: 'Other' },
]

// Derived from data: site type(1) + country(1) + questions
const TOTAL_STEPS = 2 + QUICK_CHECK_QUESTIONS.length

const PILLAR_LABELS: Record<string, string> = {
  labour: 'Labour Standards',
  health_safety: 'Health & Safety',
  environment: 'Environment',
  business_ethics: 'Business Ethics',
}

const LEVEL_CONFIG: Record<string, { color: string; bgBar: string; width: string }> = {
  getting_started: { color: 'text-[#0D3B2E]', bgBar: 'bg-[#0D3B2E]/30', width: 'w-1/4' },
  making_progress: { color: 'text-[#0D3B2E]', bgBar: 'bg-[#0D3B2E]/60', width: 'w-1/2' },
  looking_good: { color: 'text-[#0D3B2E]', bgBar: 'bg-[#0D3B2E]', width: 'w-3/4' },
  not_assessed: { color: 'text-zinc-400', bgBar: 'bg-zinc-200', width: 'w-0' },
}

// ─── Shared result type ──────────────────────────────────────────────────────

export interface QuickCheckResultData {
  pillars: PillarReadiness[]
  overall_level: string
  ai: QuickCheckAIResponseSchemaType
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function QuickCheckPage() {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [animating, setAnimating] = useState(false)
  const [siteType, setSiteType] = useState<SiteType | ''>('')
  const [country, setCountry] = useState('')
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QuickCheckResultData | null>(null)
  const [error, setError] = useState('')

  // Guards against double-submit
  const submittedRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)

  const progress = Math.min(((step + 1) / TOTAL_STEPS) * 100, 100)

  const goForward = useCallback(() => {
    if (animating) return
    setDirection('forward')
    setAnimating(true)
    setTimeout(() => {
      setStep((s) => s + 1)
      setAnimating(false)
    }, 300)
  }, [animating])

  const goBack = useCallback(() => {
    if (animating || step <= 0) return
    setDirection('backward')
    setAnimating(true)
    setError('')
    setTimeout(() => {
      setStep((s) => s - 1)
      setAnimating(false)
    }, 300)
  }, [animating, step])

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft' && step > 0 && !loading && !result) {
        goBack()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [step, loading, result, goBack])

  // Cleanup fetch on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  function selectSiteType(value: SiteType) {
    setSiteType(value)
    setTimeout(goForward, 400)
  }

  function selectCountry(value: string) {
    setCountry(value)
    setTimeout(goForward, 400)
  }

  function selectAnswer(questionId: string, value: string) {
    setResponses((r) => ({ ...r, [questionId]: value }))

    const currentQuestionIndex = step - 2
    if (currentQuestionIndex >= QUICK_CHECK_QUESTIONS.length - 1) {
      // Last question — submit after brief delay (with double-submit guard)
      if (!submittedRef.current) {
        submittedRef.current = true
        setTimeout(() => handleSubmit({ ...responses, [questionId]: value }), 600)
      }
    } else {
      setTimeout(goForward, 400)
    }
  }

  async function handleSubmit(finalResponses: Record<string, string>) {
    setLoading(true)
    setError('')

    // Abort any in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/quick-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses: finalResponses,
          site_type: siteType,
          country,
        }),
        signal: controller.signal,
      })

      if (res.status === 429) {
        setError('Too many assessments. Please try again in an hour.')
        setLoading(false)
        submittedRef.current = false
        return
      }

      if (!res.ok) {
        setError('Something went wrong. Please try again.')
        setLoading(false)
        submittedRef.current = false
        return
      }

      const data = (await res.json()) as { result: QuickCheckResultData }

      // Store in localStorage for import after registration
      localStorage.setItem(
        'corum_quick_check',
        JSON.stringify({
          responses: finalResponses,
          site_type: siteType,
          country,
          result: data.result,
        })
      )

      setResult(data.result)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError('Network error. Please check your connection and try again.')
      submittedRef.current = false
    } finally {
      setLoading(false)
    }
  }

  function handleStartOver() {
    abortRef.current?.abort()
    setResult(null)
    setStep(0)
    setResponses({})
    setSiteType('')
    setCountry('')
    setError('')
    setLoading(false)
    submittedRef.current = false
  }

  // Animation classes
  const slideClass = animating
    ? direction === 'forward'
      ? 'translate-x-[-100%] opacity-0'
      : 'translate-x-[100%] opacity-0'
    : 'translate-x-0 opacity-100'

  // ─── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center" role="status" aria-label="Building your readiness snapshot">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-zinc-200" />
              <div className="absolute inset-0 rounded-full border-4 border-[#0D3B2E] border-t-transparent animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-[#0D3B2E] mb-2">
              Building your readiness snapshot
            </h2>
            <p className="text-zinc-500">This takes just a moment...</p>
          </div>
        </div>
      </div>
    )
  }

  // ─── Results ──────────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <Header />
        <div className="max-w-xl mx-auto px-4 py-12">
          <div className="text-center mb-10 animate-fade-in">
            <h1 className="text-3xl font-bold text-[#0D3B2E] mb-3">
              Your SMETA Readiness Snapshot
            </h1>
            <p className="text-zinc-600 text-lg">
              Here&apos;s where your site stands based on what you&apos;ve shared
            </p>
          </div>

          {/* Pillar cards */}
          <div className="space-y-4 mb-8">
            {result.pillars.map((pillar, i) => {
              const config = LEVEL_CONFIG[pillar.level] ?? LEVEL_CONFIG.not_assessed
              const insight =
                pillar.pillar === 'labour'
                  ? result.ai.labour_insight
                  : pillar.pillar === 'health_safety'
                    ? result.ai.health_safety_insight
                    : null

              return (
                <div
                  key={pillar.pillar}
                  className="bg-white rounded-xl border border-zinc-200 p-5 animate-slide-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-zinc-900">
                      {PILLAR_LABELS[pillar.pillar] ?? pillar.pillar}
                    </h3>
                    <span className={`text-sm font-medium ${config.color}`}>{pillar.label}</span>
                  </div>

                  {/* Progress bar */}
                  <div
                    className="h-2 bg-zinc-100 rounded-full overflow-hidden mb-3"
                    role="progressbar"
                    aria-valuenow={Math.round((pillar.score / 1.5) * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${PILLAR_LABELS[pillar.pillar] ?? pillar.pillar}: ${pillar.label}`}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${config.bgBar} ${config.width}`}
                    />
                  </div>

                  {/* AI insight for assessed pillars */}
                  {insight && (
                    <p className="text-sm text-zinc-600 leading-relaxed">{insight}</p>
                  )}

                  {pillar.level === 'not_assessed' && (
                    <p className="text-sm text-zinc-400 italic">
                      A full assessment will evaluate this area in detail
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Overall summary */}
          <div
            className="bg-[#0D3B2E]/5 rounded-xl border border-[#0D3B2E]/10 p-6 mb-8 animate-slide-up"
            style={{ animationDelay: '400ms' }}
          >
            <p className="text-zinc-700 leading-relaxed">{result.ai.overall_summary}</p>
          </div>

          {/* CTA */}
          <div
            className="bg-white rounded-xl border border-zinc-200 p-6 text-center animate-slide-up"
            style={{ animationDelay: '500ms' }}
          >
            <h2 className="text-xl font-semibold text-[#0D3B2E] mb-2">
              Get your complete readiness picture
            </h2>
            <p className="text-zinc-600 mb-6">
              {result.ai.cta_message} A full analysis covers all 32 SMETA criteria with a scored
              dashboard and prioritised action plan.
            </p>
            <Link href="/register">
              <Button className="w-full bg-[#0D3B2E] hover:bg-[#0D3B2E]/90 text-white h-12 text-base">
                Create a free account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-sm text-zinc-500 mt-3">
              Your snapshot results will be imported automatically.
            </p>
          </div>

          <button
            className="mt-6 text-sm text-zinc-500 underline mx-auto block"
            onClick={handleStartOver}
          >
            Start over
          </button>
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.5s ease-out forwards;
          }
          .animate-slide-up {
            opacity: 0;
            animation: slideUp 0.5s ease-out forwards;
          }
        `}</style>
      </div>
    )
  }

  // ─── Stepped question flow ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Header />

      {/* Progress bar */}
      <div
        className="h-1 bg-zinc-200"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Step ${step + 1} of ${TOTAL_STEPS}`}
      >
        <div
          className="h-full bg-[#0D3B2E] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Back button */}
      {step > 0 && (
        <div className="max-w-xl mx-auto w-full px-4 pt-4">
          <button
            onClick={goBack}
            className="flex items-center gap-1 text-zinc-500 hover:text-zinc-700 text-sm transition-colors"
            aria-label="Go to previous question"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div
          className={`w-full max-w-xl transition-all duration-300 ease-out ${slideClass}`}
        >
          {/* Step 0: Site type */}
          {step === 0 && (
            <StepScreen
              title="Let's see where your site stands"
              subtitle="First, what type of site are you assessing?"
            >
              <div className="space-y-3" role="radiogroup" aria-label="Site type">
                {SITE_TYPES.map((t) => (
                  <OptionCard
                    key={t.value}
                    selected={siteType === t.value}
                    onClick={() => selectSiteType(t.value)}
                    label={t.label}
                  >
                    <span className="text-xl mr-3" aria-hidden="true">{t.emoji}</span>
                    <span>{t.label}</span>
                  </OptionCard>
                ))}
              </div>
            </StepScreen>
          )}

          {/* Step 1: Country */}
          {step === 1 && (
            <StepScreen
              title="Where is your site located?"
              subtitle="This helps us apply the right regulatory context"
            >
              <div className="space-y-3" role="radiogroup" aria-label="Country">
                {COUNTRIES.map((c) => (
                  <OptionCard
                    key={c.value}
                    selected={country === c.value}
                    onClick={() => selectCountry(c.value)}
                    label={c.label}
                  >
                    <span>{c.label}</span>
                  </OptionCard>
                ))}
              </div>
            </StepScreen>
          )}

          {/* Steps 2+: Questions */}
          {step >= 2 && step < TOTAL_STEPS && (() => {
            const qIndex = step - 2
            const question = QUICK_CHECK_QUESTIONS[qIndex]
            if (!question) return null
            return (
              <StepScreen title={question.question} subtitle={question.subtitle}>
                <div className="space-y-3" role="radiogroup" aria-label={question.question}>
                  {question.options.map((opt) => (
                    <OptionCard
                      key={opt.value}
                      selected={responses[question.id] === opt.value}
                      onClick={() => selectAnswer(question.id, opt.value)}
                      label={opt.label}
                    >
                      <span>{opt.label}</span>
                    </OptionCard>
                  ))}
                </div>
              </StepScreen>
            )
          })()}
        </div>
      </div>

      {/* Error (outside animated container) */}
      {error && (
        <div className="max-w-xl mx-auto w-full px-4 pb-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" role="alert">
            {error}
          </div>
        </div>
      )}

      {/* Step indicator */}
      <div className="pb-6 text-center">
        <p className="text-xs text-zinc-400" aria-hidden="true">
          {step < TOTAL_STEPS ? `${step + 1} of ${TOTAL_STEPS}` : ''}
        </p>
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Header() {
  return (
    <header className="bg-[#0D3B2E] text-white px-6 py-4">
      <div className="max-w-xl mx-auto flex items-center gap-2">
        <Leaf className="h-6 w-6 text-[#E8B84B]" aria-hidden="true" />
        <span className="text-xl font-semibold">Corum</span>
      </div>
    </header>
  )
}

function StepScreen({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-[#0D3B2E] mb-2">{title}</h2>
      <p className="text-zinc-500 mb-8">{subtitle}</p>
      {children}
    </div>
  )
}

function OptionCard({
  selected,
  onClick,
  label,
  children,
}: {
  selected: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      role="radio"
      aria-checked={selected}
      aria-label={label}
      className={`w-full flex items-center px-5 py-4 rounded-xl border-2 text-left font-medium transition-all duration-200 ${
        selected
          ? 'border-[#0D3B2E] bg-[#0D3B2E] text-white shadow-md'
          : 'border-zinc-200 text-zinc-700 hover:border-[#0D3B2E]/40 hover:bg-zinc-50'
      }`}
    >
      <div className="flex-1 flex items-center">{children}</div>
      <ChevronRight
        className={`h-5 w-5 flex-shrink-0 transition-colors ${
          selected ? 'text-white/60' : 'text-zinc-300'
        }`}
        aria-hidden="true"
      />
    </button>
  )
}
