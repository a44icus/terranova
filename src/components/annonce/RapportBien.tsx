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
      <div className="px-6 py-5 border-b border-navy/06" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-lg">🎯</div>
          <div>
            <h2 className="font-medium text-white text-sm">Analyse du bien</h2>
            <p className="text-white/40 text-xs mt-0.5">À qui correspond ce bien ?</p>
          </div>
          {budget && (
            <span className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full text-white"
              style={{ background: budget.color + '30', border: `1px solid ${budget.color}50`, color: budget.color === '#16A34A' ? '#4ADE80' : budget.color === '#D97706' ? '#FCD34D' : '#C4B5FD' }}>
              {budget.label}
            </span>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* Profils matchés */}
        {profils.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-navy/35 mb-4">Profils correspondants</p>
            <div className="space-y-3">
              {profils.map((p, i) => (
                <div key={p.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{p.emoji}</span>
                      <span className="text-sm font-medium text-navy">{p.label}</span>
                      {i === 0 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          ★ Meilleur match
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold" style={{ color: SCORE_BG(p.score) }}>
                      {p.score}%
                    </span>
                  </div>
                  {/* Barre de progression */}
                  <div className="h-1.5 bg-navy/06 rounded-full overflow-hidden mb-1.5">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${p.score}%`, background: SCORE_BG(p.score) }} />
                  </div>
                  {/* Raisons */}
                  {p.raisons.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {p.raisons.map((r, ri) => (
                        <span key={ri} className="text-[10px] px-2 py-0.5 rounded-full bg-navy/05 text-navy/55">
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

        {/* Points forts */}
        {pointsForts.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-navy/35 mb-3">Points forts</p>
            <ul className="space-y-1.5">
              {pointsForts.map((pt, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-navy/70">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                  {pt}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Points d'attention */}
        {pointsAttention.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-navy/35 mb-3">Points d'attention</p>
            <ul className="space-y-1.5">
              {pointsAttention.map((pt, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-navy/60">
                  <span className="text-amber-500 mt-0.5 flex-shrink-0">⚠</span>
                  {pt}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Idéal pour */}
        {idealPour.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-400 mb-3">Ce bien est fait pour vous si…</p>
            <ul className="space-y-1.5">
              {idealPour.map((phrase, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-indigo-800">
                  <span className="flex-shrink-0 mt-0.5">→</span>
                  {phrase}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Rendement locatif */}
        {rendementLocatif && (
          <div className="flex items-center justify-between bg-navy/03 rounded-xl px-4 py-3 border border-navy/06">
            <div>
              <div className="text-xs text-navy/45 mb-0.5">Rendement locatif estimé</div>
              <div className="text-sm font-semibold text-navy">{rendementLocatif}</div>
            </div>
            <div className="text-2xl">💰</div>
          </div>
        )}

      </div>
    </div>
  )
}



