'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAdDailyStats } from './actions'

type DayStat = { date: string; impressions: number; clicks: number }

function MiniChart({ data, field, color }: {
  data: DayStat[]
  field: 'impressions' | 'clicks'
  color: string
}) {
  const values = data.map(d => d[field])
  const max = Math.max(...values, 1)
  const w = 360
  const h = 80
  const pad = 4

  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2)
    const y = h - pad - (v / max) * (h - pad * 2)
    return `${x},${y}`
  }).join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 80 }}>
      {/* Aire sous la courbe */}
      <defs>
        <linearGradient id={`grad-${field}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon
        points={`${pad},${h} ${points} ${w - pad},${h}`}
        fill={`url(#grad-${field})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Points sur la courbe */}
      {values.map((v, i) => {
        const x = pad + (i / (values.length - 1)) * (w - pad * 2)
        const y = h - pad - (v / max) * (h - pad * 2)
        return v > 0 ? (
          <circle key={i} cx={x} cy={y} r="3" fill={color} />
        ) : null
      })}
    </svg>
  )
}

export default function StatsChart({ adId, adTitre }: { adId: string; adTitre: string }) {
  const [data, setData] = useState<DayStat[] | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const stats = await getAdDailyStats(adId)
      setData(stats)
    } finally {
      setLoading(false)
    }
  }, [adId])

  useEffect(() => { load() }, [load])

  const totalImp = data?.reduce((s, d) => s + d.impressions, 0) ?? 0
  const totalClk = data?.reduce((s, d) => s + d.clicks, 0) ?? 0
  const ctr = totalImp > 0 ? ((totalClk / totalImp) * 100).toFixed(1) : '0'

  // Derniers 7 jours pour les étiquettes d'axe
  const labels = data
    ? data.filter((_, i) => i % 5 === 0 || i === data.length - 1).map(d => {
        const [, m, day] = d.date.split('-')
        return `${day}/${m}`
      })
    : []

  return (
    <div className="mt-4 bg-[#F8FAFC] rounded-2xl p-5 border border-[#0F172A]/06">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-[#0F172A]">Stats — 30 derniers jours</p>
          <p className="text-xs text-[#0F172A]/40">{adTitre}</p>
        </div>
        <div className="flex items-center gap-5 text-center">
          <div>
            <div className="text-lg font-bold text-[#4F46E5]">{totalImp.toLocaleString('fr-FR')}</div>
            <div className="text-[10px] text-[#0F172A]/40 uppercase tracking-wide">Impressions</div>
          </div>
          <div>
            <div className="text-lg font-bold text-[#0891B2]">{totalClk.toLocaleString('fr-FR')}</div>
            <div className="text-[10px] text-[#0F172A]/40 uppercase tracking-wide">Clics</div>
          </div>
          <div>
            <div className="text-lg font-bold text-[#16A34A]">{ctr} %</div>
            <div className="text-[10px] text-[#0F172A]/40 uppercase tracking-wide">CTR</div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-20 text-[#0F172A]/30 text-sm">
          Chargement…
        </div>
      )}

      {!loading && data && (
        <div className="space-y-4">
          {/* Graphique impressions */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#4F46E5] inline-block" />
              <span className="text-[11px] font-medium text-[#0F172A]/50">Impressions</span>
            </div>
            <MiniChart data={data} field="impressions" color="#4F46E5" />
          </div>

          {/* Graphique clics */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#0891B2] inline-block" />
              <span className="text-[11px] font-medium text-[#0F172A]/50">Clics</span>
            </div>
            <MiniChart data={data} field="clicks" color="#0891B2" />
          </div>

          {/* Axe X — quelques dates */}
          <div className="flex justify-between text-[10px] text-[#0F172A]/30 px-1">
            {data.filter((_, i) => i % 5 === 0 || i === data.length - 1).map(d => {
              const [, m, day] = d.date.split('-')
              return <span key={d.date}>{day}/{m}</span>
            })}
          </div>
        </div>
      )}

      {!loading && data && totalImp === 0 && (
        <p className="text-center text-xs text-[#0F172A]/30 mt-2">
          Aucune donnée sur cette période
        </p>
      )}
    </div>
  )
}
