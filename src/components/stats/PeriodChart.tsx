'use client'

import { useState, useMemo } from 'react'
import LineChart from './LineChart'

interface Point { date: string; value: number }

interface Props {
  data30j: Point[]
  color?:  string
}

const PERIODS = [
  { label: '30 jours', days: 30 },
  { label: '14 jours', days: 14 },
  { label: '7 jours',  days: 7  },
]

export default function PeriodChart({ data30j, color = '#4F46E5' }: Props) {
  const [period, setPeriod] = useState(30)

  const slice = useMemo(() => data30j.slice(data30j.length - period), [data30j, period])

  const total   = slice.reduce((s, d) => s + d.value, 0)
  const hasData = slice.some(d => d.value > 0)

  // Calcule tendance vs période précédente
  const prevSlice = data30j.slice(Math.max(0, data30j.length - period * 2), data30j.length - period)
  const prevTotal = prevSlice.reduce((s, d) => s + d.value, 0)
  const trend     = prevTotal > 0 ? ((total - prevTotal) / prevTotal * 100).toFixed(0) : null

  return (
    <div className="flex gap-6 h-full">
      {/* Zone graphique */}
      <div className="flex-1 min-w-0">
        {/* Grand chiffre + trend */}
        <div className="flex items-baseline gap-3 mb-5">
          <span className="font-serif text-5xl text-[#0F172A] leading-none">{total.toLocaleString('fr-FR')}</span>
          {trend !== null && (
            <span className={`text-xs font-semibold ${Number(trend) >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
              {Number(trend) >= 0 ? '+' : ''}{trend}% vs période préc.
            </span>
          )}
        </div>

        {hasData ? (
          <LineChart data={slice} color={color} height={180} showLabels filled showYAxis />
        ) : (
          <div className="h-44 flex flex-col items-center justify-center text-[#0F172A]/20 gap-2">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
            </svg>
            <p className="text-sm">Les données se rempliront au fil du temps</p>
          </div>
        )}
      </div>

      {/* Sélecteur de période — colonne droite verticale */}
      <div className="flex flex-col justify-start gap-1 pt-1 flex-shrink-0">
        {PERIODS.map(p => (
          <button
            key={p.days}
            onClick={() => setPeriod(p.days)}
            className={`text-xs px-3 py-2 rounded-lg text-left transition-all whitespace-nowrap ${
              period === p.days
                ? 'bg-[#4F46E5] text-white font-semibold shadow-sm'
                : 'text-[#0F172A]/40 hover:text-[#0F172A] hover:bg-[#0F172A]/05'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
