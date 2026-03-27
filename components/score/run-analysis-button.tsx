'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, Play, RefreshCw } from 'lucide-react'

interface RunAnalysisButtonProps {
  siteId: string
  hasPendingJob: boolean
  hasExistingAnalysis: boolean
}

export function RunAnalysisButton({ siteId, hasPendingJob, hasExistingAnalysis }: RunAnalysisButtonProps) {
  const router = useRouter()
  const [isRunning, setIsRunning] = useState(hasPendingJob)
  const [error, setError] = useState('')

  // Poll for completion if already running
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/analysis/${siteId}`)
        if (!res.ok) return
        const data = (await res.json()) as { job?: { status: string } }
        if (data.job?.status === 'complete') {
          setIsRunning(false)
          router.refresh()
          clearInterval(interval)
        } else if (data.job?.status === 'failed') {
          setIsRunning(false)
          setError('Analysis failed. Please try again.')
          clearInterval(interval)
        }
      } catch {
        // ignore polling errors
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [isRunning, siteId, router])

  async function handleRunAnalysis() {
    setError('')
    setIsRunning(true)

    try {
      const res = await fetch(`/api/analysis/${siteId}`, { method: 'POST' })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setError(data.error ?? 'Failed to start analysis')
        setIsRunning(false)
      }
    } catch {
      setError('Network error. Please try again.')
      setIsRunning(false)
    }
  }

  return (
    <div className="w-full space-y-2">
      {isRunning ? (
        <div className="w-full">
          <div className="flex items-center gap-2 text-sm text-zinc-600 justify-center mb-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analysing your responses...
          </div>
          <p className="text-xs text-zinc-400 text-center">This usually takes 30–60 seconds</p>
        </div>
      ) : (
        <Button
          className="w-full bg-[#0D3B2E] hover:bg-[#0D3B2E]/90 text-white"
          onClick={handleRunAnalysis}
          size="sm"
        >
          {hasExistingAnalysis ? (
            <><RefreshCw className="h-4 w-4 mr-2" /> Re-run analysis</>
          ) : (
            <><Play className="h-4 w-4 mr-2" /> Run analysis</>
          )}
        </Button>
      )}
      {error && <p className="text-xs text-red-600 text-center">{error}</p>}
    </div>
  )
}
