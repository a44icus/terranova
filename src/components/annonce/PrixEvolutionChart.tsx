'use client'

import { useEffect, useState } from 'react'

interface DataPoint {
  label: string
  prixM2: number
  count: number
}

interface Props {
  ville: string
  codePostal: string
  categorie: string
  currentPrixM2: number
}

export default function PrixEvolutionChart({ ville, codePostal, categorie, currentPrixM2 }: Props) {
  const [points, setPoints] = useState<DataPoint[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams({ ville, cp: codePostal, cat: categorie })
    fetch(`/api/prix-evolution?${params}`)
      .then(r => r.json())
      .then(d => setPoints(d.points ?? []))
      .catch(() => setPoints([]))
      .finally(() => setLoading(false))
  }, [ville, codePostal, categorie])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-navy/08">
        <div className="h-4 w-48 bg-navy/08 rounded animate-pulse mb-4" />
        <div className="h-32 bg-navy/04 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!points || points.length < 2) return null

  const prices = points.map(p => p.prixM2)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1

  const W = 600
  const H = 120
  const PAD = { top: 12, bottom: 20, left: 8, right: 8 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const x = (i: number) => PAD.left + (i / (points.length - 1)) * chartW
  const y = (v: number) => PAD.top + chartH - ((v - min) / range) * chartH

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p.prixM2).toFixed(1)}`)
    .join(' ')

  const areaD = `${pathD} L ${x(points.length - 1).toFixed(1)} ${(PAD.top + chartH).toFixed(1)} L ${PAD.left.toFixed(1)} ${(PAD.top + chartH).toFixed(1)} Z`

  const first = points[0].prixM2
  const last = points[points.length - 1].prixM2
  const evolution = ((last - first) / first) * 100
  const evolutionLabel = `${evolution >= 0 ? '+' : ''}${evolution.toFixed(1)}%`
  const isUp = evolution >= 0

  const catLabel = categorie === 'appartement' ? 'appartements' : categorie === 'maison' ? 'maisons' : 'biens'

  return (
    <div className="bg-white rounded-2xl p-6 border border-navy/08">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-medium text-navy">Évolution des prix</h2>
          <p className="text-xs text-navy/40 mt-0.5">
            {catLabel.charAt(0).toUpperCase() + catLabel.slice(1)} à {ville} · 12 derniers mois
          </p>
        </div>
        <div className="text-right">
          <span
            className={`text-sm font-semibold px-2.5 py-1 rounded-full ${
              isUp
                ? 'bg-red-50 text-red-500 border border-red-100'
                : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
            }`}
          >
            {evolutionLabel}
          </span>
          <p className="text-[10px] text-navy/30 mt-1">vs il y a 12 mois</p>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 100 }}>
        <defs>
          <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#1e3a5f" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path d={areaD} fill="url(#priceGrad)" />

        {/* Line */}
        <path d={pathD} fill="none" stroke="#1e3a5f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

        {/* Current price reference line */}
        {currentPrixM2 >= min && currentPrixM2 <= max && (
          <line
            x1={PAD.left}
            y1={y(currentPrixM2)}
            x2={PAD.left + chartW}
            y2={y(currentPrixM2)}
            stroke="#e67e22"
            strokeWidth="1"
            strokeDasharray="4 3"
            opacity="0.6"
          />
        )}

        {/* Dots on first and last */}
        <circle cx={x(0)} cy={y(first)} r="3" fill="#1e3a5f" />
        <circle cx={x(points.length - 1)} cy={y(last)} r="3" fill="#1e3a5f" />

        {/* Month labels: first, middle, last */}
        {[0, Math.floor((points.length - 1) / 2), points.length - 1].map(i => (
          <text
            key={i}
            x={x(i)}
            y={H - 2}
            textAnchor="middle"
            fontSize="9"
            fill="#1e3a5f"
            opacity="0.35"
          >
            {points[i].label}
          </text>
        ))}
      </svg>

      {/* Price range row */}
      <div className="flex items-center justify-between mt-3 text-xs text-navy/50">
        <span>{min.toLocaleString('fr-FR')} €/m²</span>
        <span className="text-navy/30 text-[10px]">Marché local</span>
        <span>{max.toLocaleString('fr-FR')} €/m²</span>
      </div>

      {currentPrixM2 > 0 && (
        <div className="mt-3 pt-3 border-t border-navy/06 flex items-center gap-2 text-xs text-navy/50">
          <span className="inline-block w-4 border-t border-dashed border-orange-400" />
          <span>
            Ce bien : <span className="font-medium text-navy/70">{currentPrixM2.toLocaleString('fr-FR')} €/m²</span>
            {last > 0 && (
              <span className="ml-1">
                ({currentPrixM2 > last ? '+' : ''}{Math.round(((currentPrixM2 - last) / last) * 100)}% vs marché actuel)
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  )
}
