'use client'

import { useEffect, useState } from 'react'

interface ScoreArcProps {
  score: number
  size?: number
}

export function ScoreArc({ score, size = 180 }: ScoreArcProps) {
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    const start = performance.now()
    const duration = 1200

    function animate(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Cubic bezier approximation for overshoot: ease-out-back
      const eased =
        progress < 1
          ? 1 + 2.70158 * Math.pow(progress - 1, 3) + 1.70158 * Math.pow(progress - 1, 2)
          : 1
      setAnimatedScore(Math.min(score * Math.max(eased, 0), 100))
      if (progress < 1) requestAnimationFrame(animate)
      else setAnimatedScore(score)
    }

    requestAnimationFrame(animate)
  }, [score])

  const r = (size - 20) / 2
  const circumference = 2 * Math.PI * r
  const strokeDash = (animatedScore / 100) * circumference

  const color =
    score >= 75 ? '#059669' : score >= 50 ? '#D97706' : '#DC2626'

  const label =
    score >= 75 ? 'Audit Ready' : score >= 50 ? 'Needs Work' : 'High Risk'

  const labelColor =
    score >= 75 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-600'

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e4e4e7"
          strokeWidth={12}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: 'none' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-zinc-900">{Math.round(animatedScore)}</span>
        <span className={`text-xs font-semibold ${labelColor} mt-0.5`}>{label}</span>
      </div>
    </div>
  )
}
