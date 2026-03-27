'use client'

import { useState } from 'react'
import type { ReadinessScore } from '@/types'

interface ScoreHistoryProps {
  scores: ReadinessScore[]
}

export function ScoreHistory({ scores }: ScoreHistoryProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (scores.length <= 1) return null

  const width = 200
  const height = 50
  const padding = 8

  const min = 0
  const max = 100

  const points = scores.map((s, i) => {
    const x = padding + (i / (scores.length - 1)) * (width - padding * 2)
    const y = padding + (1 - (s.score - min) / (max - min)) * (height - padding * 2)
    return { x, y, score: s.score, date: s.created_at }
  })

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')

  const latestDelta = scores.length >= 2
    ? Math.round((scores[scores.length - 1].score - scores[scores.length - 2].score) * 10) / 10
    : null

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-zinc-400">Score history</span>
        {latestDelta !== null && (
          <span className={`text-xs font-semibold ${latestDelta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {latestDelta >= 0 ? `+${latestDelta}` : latestDelta} since last
          </span>
        )}
      </div>
      <div className="relative">
        <svg width={width} height={height} className="w-full">
          <path d={pathD} fill="none" stroke="#0D3B2E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={hoveredIndex === i ? 5 : 3}
              fill={hoveredIndex === i ? '#0D3B2E' : '#E8B84B'}
              stroke="white"
              strokeWidth={1}
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </svg>
        {hoveredIndex !== null && (
          <div className="absolute bottom-full left-0 mb-1 bg-zinc-900 text-white text-xs rounded px-2 py-1 pointer-events-none whitespace-nowrap">
            {Math.round(points[hoveredIndex].score)} — {new Date(points[hoveredIndex].date).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  )
}
