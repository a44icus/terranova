import type { BienRapport } from '@/lib/profils'

interface Props {
  rapport: BienRapport
}

const SCORE_BG = (s: number) =>
  s >= 75 ? '#16A34A' : s >= 50 ? '#D97706' : s >= 30 ? '#6366F1' : '#94A3B8'

export default function RapportBien({ rapport }: Props) {
  const { profils, pointsForts, pointsAttention, idealPour, budget, rendementLocatif } = rapport

  if (!profils.length && !pointsForts.length) return null

  return (
    <div className="bg-white rounded-2xl border border-navy/08 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-navy/06" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>
        <div className="flex items-center gap-2.5">
          <span className="text-base">🎯</span>
          <h2 className="font-medium text-white text-sm">Analyse du bien</h2>
          <span className="text-white/35 text-xs">· À qui correspond ce bien ?</span>
          {budget && (
            <span className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: budget.color + '30', border: `1px solid ${budget.color}50`, color: budget.color === '#16A34A' ? '#4ADE80' : budget.color === '#D97706' ? '#FCD34D' : '#C4B5FD' }}>
              {budget.label}
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">

        {/* Profils matchés */}
        {profils.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-navy/30 mb-2.5">Profils correspondants</p>
            <div className="space-y-2.5">
              {profils.map((p, i) => (
                <div key={p.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{p.emoji}</span>
                      <span className="text-xs font-medium text-navy">{p.label}</span>
                      {i === 0 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          ★ Top
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold" style={{ color: SCORE_BG(p.score) }}>
                      {p.score}%
                    </span>
                  </div>
                  <div className="h-1 bg-navy/06 rounded-full overflow-hidden mb-1">
                    <div className="h-full rounded-full" style={{ width: `${p.score}%`, background: SCORE_BG(p.score) }} />
                  </div>
                  {p.raisons.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.raisons.map((r, ri) => (
                        <span key={ri} className="text-[10px] px-1.5 py-0.5 rounded-full bg-navy/05 text-navy/50">
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Points forts + attention côte à côte */}
        {(pointsForts.length > 0 || pointsAttention.length > 0) && (
          <div className={`grid gap-3 ${pointsForts.length > 0 && pointsAttention.length > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {pointsForts.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-navy/30 mb-1.5">Points forts</p>
                <ul className="space-y-1">
                  {pointsForts.map((pt, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-navy/70">
                      <span className="text-green-500 flex-shrink-0 mt-px">✓</span>
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {pointsAttention.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-navy/30 mb-1.5">Attention</p>
                <ul className="space-y-1">
                  {pointsAttention.map((pt, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-navy/60">
                      <span className="text-amber-500 flex-shrink-0 mt-px">⚠</span>
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Idéal pour */}
        {idealPour.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400 mb-1.5">Ce bien pourrait vous correspondre si…</p>
            <ul className="space-y-1">
              {idealPour.map((phrase, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-indigo-800">
                  <span className="flex-shrink-0 mt-px">→</span>
                  {phrase}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Rendement locatif */}
        {rendementLocatif && (
          <div className="flex items-center justify-between bg-navy/03 rounded-xl px-3.5 py-2.5 border border-navy/06">
            <div>
              <div className="text-[10px] text-navy/40 mb-0.5">Rendement locatif brut indicatif <span className="italic">(loyer moyen départemental)</span></div>
              <div className="text-sm font-semibold text-navy">≈ {rendementLocatif}</div>
            </div>
            <span className="text-xl">💰</span>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-[10px] text-navy/35 italic leading-relaxed border-l-2 border-navy/10 pl-2.5">
          Analyse indicative générée automatiquement — un point de départ pour réfléchir, pas une vérité absolue. Votre situation personnelle peut différer et ces résultats ne sauraient engager la responsabilité de la plateforme.
        </p>

      </div>
    </div>
  )
}



