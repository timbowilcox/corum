'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { ArrowRight, ArrowLeft, Check } from 'lucide-react'
import type { Site, IntakeResponse, Pillar } from '@/types'
import { QUESTIONS_BY_PILLAR } from '@/lib/smeta/intake-questions'

const PILLARS: Pillar[] = ['labour', 'health_safety', 'environment', 'business_ethics']
const PILLAR_LABELS: Record<Pillar, string> = {
  labour: 'Labour',
  health_safety: 'Health & Safety',
  environment: 'Environment',
  business_ethics: 'Business Ethics',
}

interface FormIntakeProps {
  site: Site
  initialResponses: IntakeResponse[]
  onResponsesUpdate: (responses: IntakeResponse[]) => void
  onComplete: () => void
}

type FormValues = Record<string, string>

export function FormIntake({ site, initialResponses, onResponsesUpdate, onComplete }: FormIntakeProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [savedSteps, setSavedSteps] = useState<Set<number>>(new Set())
  const [error, setError] = useState('')

  const pillar = PILLARS[currentStep]
  const questions = QUESTIONS_BY_PILLAR[pillar] ?? []

  const defaultValues: FormValues = {}
  for (const r of initialResponses) {
    defaultValues[r.question_id] = r.response_value ?? ''
  }

  const { register, handleSubmit, getValues } = useForm<FormValues>({
    defaultValues,
  })

  async function saveStep(values: FormValues) {
    setSaving(true)
    setError('')

    const pillarQuestions = QUESTIONS_BY_PILLAR[pillar] ?? []
    const rows = pillarQuestions
      .filter((q) => values[q.id] !== undefined && values[q.id] !== '')
      .map((q) => ({
        site_id: site.id,
        question_id: q.id,
        pillar: q.pillar,
        response_value: values[q.id],
        response_type: q.type,
        source: 'form' as const,
      }))

    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: site.id, responses: rows }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setError(data.error ?? 'Failed to save responses')
        setSaving(false)
        return false
      }

      setSavedSteps((prev) => new Set([...prev, currentStep]))
      return true
    } catch {
      setError('Network error. Please try again.')
      setSaving(false)
      return false
    } finally {
      setSaving(false)
    }
  }

  async function handleNext(values: FormValues) {
    const saved = await saveStep(values)
    if (!saved) return

    if (currentStep < PILLARS.length - 1) {
      setCurrentStep((s) => s + 1)
    }
  }

  async function handleFinish(values: FormValues) {
    const saved = await saveStep(values)
    if (saved) onComplete()
  }

  const progressPct = ((currentStep + 1) / PILLARS.length) * 100

  return (
    <div>
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-zinc-700">
            Step {currentStep + 1} of {PILLARS.length} — {PILLAR_LABELS[pillar]}
          </span>
          <span className="text-sm text-zinc-500">{Math.round(progressPct)}%</span>
        </div>
        <Progress value={progressPct} className="h-2" />
      </div>

      <form onSubmit={handleSubmit(currentStep < PILLARS.length - 1 ? handleNext : handleFinish)}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{PILLAR_LABELS[pillar]}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {questions.map((q) => (
              <div key={q.id}>
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-xs font-mono text-zinc-400 mt-1 flex-shrink-0">{q.id}</span>
                  <p className="text-sm text-zinc-900 leading-snug">{q.question}</p>
                </div>

                {q.type === 'yes_no' ? (
                  <div className="flex gap-3 ml-6">
                    {(['yes', 'no'] as const).map((val) => {
                      const currentVal = getValues(q.id)
                      return (
                        <label
                          key={val}
                          className="flex-1 cursor-pointer"
                        >
                          <input
                            type="radio"
                            value={val}
                            {...register(q.id)}
                            className="sr-only peer"
                          />
                          <div className={`text-center py-2.5 rounded-lg border-2 font-semibold text-sm uppercase tracking-wide transition-colors cursor-pointer peer-checked:${val === 'yes' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-red-600 bg-red-600 text-white'} border-zinc-200 text-zinc-600 hover:border-zinc-400 peer-checked:border-[#0D3B2E] peer-checked:bg-[#0D3B2E] peer-checked:text-white`}>
                            {val === 'yes' ? 'Yes' : 'No'}
                          </div>
                        </label>
                      )
                    })}
                  </div>
                ) : (
                  <div className="ml-6">
                    <Input
                      type={q.type === 'number' ? 'number' : 'text'}
                      placeholder={q.placeholder ?? ''}
                      min={q.type === 'number' ? 0 : undefined}
                      {...register(q.id)}
                      className="max-w-xs"
                    />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {currentStep > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep((s) => s - 1)}
              disabled={saving}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <Button
            type="submit"
            className="flex-1 bg-[#0D3B2E] hover:bg-[#0D3B2E]/90 text-white"
            disabled={saving}
          >
            {saving ? (
              'Saving...'
            ) : currentStep < PILLARS.length - 1 ? (
              <>Save & continue <ArrowRight className="ml-2 h-4 w-4" /></>
            ) : (
              <>Finish & view results <Check className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
