'use client'

import { useEffect, useState } from 'react'

interface DataPoint {
  label: string   // "Jan 24", "Fév 24"…
  prixM2: number
  source: 'interne' | 'dvf'
  count: number
}

interface Props {
  ville: string
  codePostal: string
  categorie: string
  currentPrixM2?: number  // prix/surface du bien actuel, pour comparaison
}

export default function PrixEvolutionChart({ ville, codePostal, categorie, currentPrixM2 }: Props) {
  const [data, setData]       = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/prix-evolution?ville=${encodeURIComponent(ville)}&cp=${codePostal}&cat=${categorie}`)
      .then(r => r.json())
      .then(d => { setData(d.points ?? []); setLoading(false) })
      .catch(() => { setError('Données indisponibles'); setLoading(false) })
  }, [ville, codePostal, categorie])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-navy/08 p-6 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-48 mb-4" />
        <div className="h-32 bg-slate-100 rounded-xl" />
      </div>
    )
  }

  if (error || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-navy/08 p-6 text-center">
        <p className="text-sm text-navy/40">Données de prix indisponibles pour cette zone</p>
      </div>
    )
  }

  const max     = Math.max(...data.map(d => d.prixM2))
  const min     = Math.min(...data.map(d => d.prixM2))
  const range   = max - min || 1
  const last    = data[data.length - 1]
  const first   = data[0]
  const evol    = (((last.prixM2 - first.prixM2) / first.prixM2) * 100)
  const evolStr = (evol >= 0 ? '+' : '') + evol.toFixed(1) + ' %'
  const evolPos = evol >= 0

  // SVG dimensions
  const W = 520
  const H = 120
  const PAD_X = 8
  const PAD_Y = 12
  const pts = data.map((d, i) => ({
    x: PAD_X + (i / (data.length - 1)) * (W - PAD_X * 2),
    y: PAD_Y + (1 - (d.prixM2 - min) / range) * (H - PAD_Y * 2),
    d,
  }))

  // Ligne SVG
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  // Zone de remplissage
  const areaD = `${pathD} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`

  return (
    <div className="bg-white rounded-2xl border border-navy/08 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="font-semibold text-[#0F172A] text-sm mb-0.5">
            Évolution des prix au m² · {ville}
          </h3>
          <p className="text-xs text-[#0F172A]/45">
            {categorie === 'appartement' ? 'Appartements' : categorie === 'maison' ? 'Maisons' : 'Biens'} · 12 derniers mois
          </p>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${evolPos ? 'text-green-600' : 'text-red-500'}`}>
            {evolStr}
          </div>
          <div className="text-xs text-[#0F172A]/40">sur 12 mois</div>
        </div>
      </div>

      {/* Graphique SVG */}
      <div className="relative w-full overflow-hidden" style={{ paddingBottom: '26%' }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Zone */}
          <path d={areaD} fill="url(#priceGrad)" />
          {/* Ligne */}
          <path d={pathD} fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {/* Prix actuel (ligne horizontale) */}
          {currentPrixM2 && currentPrixM2 >= min && currentPrixM2 <= max && (
            <line
              x1={0} y1={PAD_Y + (1 - (currentPrixM2 - min) / range) * (H - PAD_Y * 2)}
              x2={W} y2={PAD_Y + (1 - (currentPrixM2 - min) / range) * (H - PAD_Y * 2)}
              stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.8"
            />
          )}
          {/* Points */}
          {pts.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3" fill="white" stroke="#4F46E5" strokeWidth="1.5" />
          ))}
        </svg>
      </div>

      {/* Légende X */}
      <div className="flex justify-between mt-2 px-1">
        {data.filter((_, i) => i === 0 || i === Math.floor(data.length / 2) || i === data.length - 1).map((d, i) => (
          <span key={i} className="text-[10px] text-[#0F172A]/35">{d.label}</span>
        ))}
      </div>

      {/* Prix courant vs marché */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#0F172A]/08">
        <div className="flex items-center gap-4 text-xs text-[#0F172A]/50">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#4F46E5] rounded inline-block" />
            Marché ({last.count} ventes)
          </span>
          {currentPrixM2 && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#F59E0B] rounded inline-block" style={{ borderStyle: 'dashed' }} />
              Ce bien
            </span>
          )}
        </div>
        <div className="text-right">
          <span className="text-sm font-bold text-[#0F172A]">
            {last.prixM2.toLocaleString('fr-FR')} € /m²
          </span>
          <span className="text-xs text-[#0F172A]/40 ml-1">actuellement</span>
        </div>
      </div>

      <p className="text-[10px] text-[#0F172A]/25 mt-2">
        Sources : annonces Terranova + DVF (data.gouv.fr) · Moyenne mobile 30 jours
      </p>
    </div>
  )
}
