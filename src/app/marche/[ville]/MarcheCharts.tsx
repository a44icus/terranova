'use client'

import LineChart from '@/components/stats/LineChart'

interface Props {
  prixParMois: { date: string; value: number }[]
  byCategorie: { label: string; value: number; icon: string }[]
  byDpe: { label: string; value: number; color: string }[]
}

export default function MarcheCharts({ prixParMois, byCategorie, byDpe }: Props) {
  const hasEvolution = prixParMois.some(d => d.value > 0)
  const totalCat = byCategorie.reduce((s, c) => s + c.value, 0)

  // Variation prix : premier mois → dernier mois non nul
  const nonNull = prixParMois.filter(d => d.value > 0)
  const variation = nonNull.length >= 2
    ? ((nonNull[nonNull.length - 1].value - nonNull[0].value) / nonNull[0].value) * 100
    : null

  return (
    <>
      {/* ── Évolution du prix au m² ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-navy/08">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-medium text-navy">Évolution du prix au m²</h2>
            <p className="text-xs text-navy/40 mt-0.5">6 derniers mois — biens en vente</p>
          </div>
          {variation !== null && (
            <div className={`text-right`}>
              <span className={`text-sm font-semibold ${variation >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {variation >= 0 ? '+' : ''}{variation.toFixed(1)}%
              </span>
              <div className="text-[10px] text-navy/35 mt-0.5">sur 6 mois</div>
            </div>
          )}
        </div>

        {hasEvolution ? (
          <LineChart
            data={prixParMois}
            color="#4F46E5"
            height={160}
            showLabels={true}
            filled={true}
          />
        ) : (
          <div className="h-36 flex flex-col items-center justify-center text-navy/30 text-sm gap-2">
            <span className="text-3xl">📈</span>
            <span>Pas assez de données pour afficher une tendance</span>
            <span className="text-xs text-navy/25">Les données s'afficheront au fil des annonces</span>
          </div>
        )}

        {/* Légende des mois */}
        {hasEvolution && (
          <div className="flex justify-between mt-2 px-1">
            {prixParMois.map((d, i) => (
              <div key={i} className="text-center flex-1">
                <div className="text-[9px] text-navy/30">{d.date}</div>
                {d.value > 0 && (
                  <div className="text-[9px] font-medium text-navy/50">
                    {d.value.toLocaleString('fr-FR')} €
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Deux colonnes : catégories + DPE ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition catégories */}
        {byCategorie.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-navy/08">
            <h2 className="font-medium text-navy mb-4">Répartition par type</h2>
            <div className="space-y-3">
              {[...byCategorie].sort((a, b) => b.value - a.value).map(cat => (
                <div key={cat.label} className="flex items-center gap-3">
                  <span className="text-lg w-6 flex-shrink-0 text-center">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-navy truncate">{cat.label}</span>
                      <span className="text-navy/45 ml-2 flex-shrink-0">
                        {cat.value} · {totalCat > 0 ? Math.round((cat.value / totalCat) * 100) : 0}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-navy/06 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${totalCat > 0 ? (cat.value / totalCat) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DPE donut simplifié */}
        {byDpe.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-navy/08">
            <h2 className="font-medium text-navy mb-4">Performance énergétique</h2>
            <div className="space-y-2">
              {byDpe.map(d => {
                const totalDpe = byDpe.reduce((s, x) => s + x.value, 0)
                const pct = totalDpe > 0 ? Math.round((d.value / totalDpe) * 100) : 0
                return (
                  <div key={d.label} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: d.color }}>
                      {d.label}
                    </span>
                    <div className="flex-1">
                      <div className="h-2 bg-navy/06 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: d.color }} />
                      </div>
                    </div>
                    <span className="text-xs text-navy/50 w-10 text-right flex-shrink-0">
                      {d.value} bien{d.value > 1 ? 's' : ''}
                    </span>
                  </div>
                )
              })}
            </div>
            {(() => {
              const totalDpe = byDpe.reduce((s, x) => s + x.value, 0)
              const bons = byDpe.filter(d => ['A','B','C'].includes(d.label)).reduce((s, d) => s + d.value, 0)
              const pct = totalDpe > 0 ? Math.round((bons / totalDpe) * 100) : 0
              return pct > 0 ? (
                <p className="text-xs text-navy/40 mt-4 pt-3 border-t border-navy/06">
                  {pct}% des biens classés A, B ou C
                </p>
              ) : null
            })()}
          </div>
        )}
      </div>
    </>
  )
}
