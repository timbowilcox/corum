'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle, AlertCircle, ArrowRight, Leaf } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { QUICK_CHECK_QUESTIONS } from '@/lib/smeta/quick-check-questions'
import type { QuickCheckAIResponseSchemaType } from '@/lib/ai/schemas'
import type { RiskGrade, SiteType } from '@/types'

const SITE_TYPES: { value: SiteType; label: string }[] = [
  { value: 'farm', label: 'Farm' },
  { value: 'packhouse', label: 'Packhouse' },
  { value: 'factory', label: 'Factory' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'office', label: 'Office' },
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

type Responses = Record<string, 'yes' | 'no'>

const GRADE_CONFIG: Record<
  RiskGrade,
  { label: string; color: string; bg: string; border: string; icon: typeof AlertTriangle; description: string }
> = {
  high_risk: {
    label: 'High Risk',
    color: 'text-white',
    bg: 'bg-red-700',
    border: 'border-red-700',
    icon: AlertTriangle,
    description: 'Significant compliance issues detected',
  },
  moderate_risk: {
    label: 'Moderate Risk',
    color: 'text-amber-900',
    bg: 'bg-amber-100',
    border: 'border-amber-400',
    icon: AlertCircle,
    description: 'Some areas need attention',
  },
  low_risk: {
    label: 'Low Risk',
    color: 'text-emerald-900',
    bg: 'bg-emerald-50',
    border: 'border-emerald-400',
    icon: CheckCircle,
    description: 'No immediate concerns identified',
  },
}

export default function QuickCheckPage() {
  const router = useRouter()
  const [siteType, setSiteType] = useState<SiteType | ''>('')
  const [country, setCountry] = useState('')
  const [responses, setResponses] = useState<Responses>({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QuickCheckAIResponseSchemaType | null>(null)
  const [error, setError] = useState('')

  const allAnswered =
    siteType !== '' &&
    country !== '' &&
    QUICK_CHECK_QUESTIONS.every((q) => responses[q.id] !== undefined)

  async function handleSubmit() {
    if (!allAnswered) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/quick-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses, site_type: siteType, country }),
      })

      if (res.status === 429) {
        setError('Too many assessments from this IP. Please try again in an hour.')
        return
      }

      if (!res.ok) {
        setError('Something went wrong. Please try again.')
        return
      }

      const data = (await res.json()) as { result: QuickCheckAIResponseSchemaType }

      // Store in localStorage for import after registration
      localStorage.setItem(
        'corum_quick_check',
        JSON.stringify({ responses, site_type: siteType, country, result: data.result })
      )

      setResult(data.result)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    const grade = result.risk_grade as RiskGrade
    const config = GRADE_CONFIG[grade]
    const Icon = config.icon

    return (
      <div className="min-h-screen bg-zinc-50">
        {/* Header */}
        <header className="bg-[#0D3B2E] text-white px-6 py-4">
          <div className="max-w-2xl mx-auto flex items-center gap-2">
            <Leaf className="h-6 w-6 text-[#E8B84B]" />
            <span className="text-xl font-semibold">Corum</span>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-12">
          {/* Grade card */}
          <div className={`rounded-xl border-2 ${config.border} ${config.bg} p-8 mb-8`}>
            <div className="flex items-start gap-4">
              <Icon className={`h-10 w-10 flex-shrink-0 mt-1 ${grade === 'high_risk' ? 'text-white' : grade === 'moderate_risk' ? 'text-amber-700' : 'text-emerald-700'}`} />
              <div>
                <div className={`text-2xl font-bold mb-1 ${config.color}`}>{config.label}</div>
                <p className={`text-lg mb-4 ${config.color} opacity-90`}>{result.risk_summary}</p>

                {result.top_concerns.length > 0 && (
                  <div className="mt-4">
                    <p className={`font-semibold mb-2 ${config.color}`}>Key concerns:</p>
                    <ul className="space-y-1">
                      {result.top_concerns.map((concern, i) => (
                        <li key={i} className={`flex items-start gap-2 ${config.color} opacity-90`}>
                          <span className="mt-1">•</span>
                          <span>{concern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CTA */}
          <Card className="border-[#0D3B2E]/20">
            <CardContent className="pt-6 pb-6">
              <h2 className="text-xl font-semibold text-[#0D3B2E] mb-2">
                Get your complete SMETA readiness analysis
              </h2>
              <p className="text-zinc-600 mb-6">
                {result.cta_message} A full analysis covers all 32 SMETA criteria across Labour, Health & Safety, Environment, and Business Ethics — with a scored dashboard and prioritised remediation roadmap.
              </p>
              <Button
                className="w-full bg-[#0D3B2E] hover:bg-[#0D3B2E]/90 text-white h-12 text-base"
                onClick={() => router.push('/register')}
              >
                Create a free account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-center text-sm text-zinc-500 mt-3">
                Your quick assessment results will be imported automatically.
              </p>
            </CardContent>
          </Card>

          <button
            className="mt-6 text-sm text-zinc-500 underline mx-auto block"
            onClick={() => setResult(null)}
          >
            Start over
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-[#0D3B2E] text-white px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <Leaf className="h-6 w-6 text-[#E8B84B]" />
          <span className="text-xl font-semibold">Corum</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[#0D3B2E] mb-3">
            How ready is your site for a SMETA audit?
          </h1>
          <p className="text-zinc-600 text-lg">
            Answer 5 questions. Get an instant risk assessment. No sign-up required.
          </p>
        </div>

        {/* Site type and country */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h2 className="font-semibold text-zinc-900 mb-4">Tell us about your site</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-2 block">Site type</label>
                <div className="grid grid-cols-1 gap-2">
                  {SITE_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setSiteType(t.value)}
                      className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-colors text-left ${
                        siteType === t.value
                          ? 'border-[#0D3B2E] bg-[#0D3B2E] text-white'
                          : 'border-zinc-200 text-zinc-700 hover:border-[#0D3B2E]/40'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-2 block">Country</label>
                <div className="grid grid-cols-1 gap-2">
                  {COUNTRIES.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setCountry(c.value)}
                      className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-colors text-left ${
                        country === c.value
                          ? 'border-[#0D3B2E] bg-[#0D3B2E] text-white'
                          : 'border-zinc-200 text-zinc-700 hover:border-[#0D3B2E]/40'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <div className="space-y-4 mb-8">
          {QUICK_CHECK_QUESTIONS.map((q, i) => (
            <Card key={q.id} className={`transition-all ${responses[q.id] ? 'border-[#0D3B2E]/30' : ''}`}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start gap-3 mb-4">
                  <Badge variant="outline" className="text-xs font-mono mt-0.5 flex-shrink-0">
                    {i + 1}
                  </Badge>
                  <p className="text-zinc-900 font-medium leading-snug">{q.question}</p>
                </div>
                <div className="flex gap-3 ml-8">
                  {(['yes', 'no'] as const).map((val) => (
                    <button
                      key={val}
                      onClick={() => setResponses((r) => ({ ...r, [q.id]: val }))}
                      className={`flex-1 py-2.5 rounded-lg border-2 font-semibold text-sm uppercase tracking-wide transition-colors ${
                        responses[q.id] === val
                          ? val === 'yes'
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-red-600 bg-red-600 text-white'
                          : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'
                      }`}
                    >
                      {val === 'yes' ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <Button
          className="w-full bg-[#0D3B2E] hover:bg-[#0D3B2E]/90 text-white h-12 text-base"
          onClick={handleSubmit}
          disabled={!allAnswered || loading}
        >
          {loading ? 'Checking your readiness...' : 'Check my readiness'}
        </Button>

        {!allAnswered && (
          <p className="text-center text-sm text-zinc-400 mt-3">
            Select your site type, country, and answer all 5 questions to continue
          </p>
        )}
      </div>
    </div>
  )
}
