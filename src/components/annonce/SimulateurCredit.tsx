'use client'

import { useState, useMemo } from 'react'

interface Props {
  prixBien: number
}

export default function SimulateurCredit({ prixBien }: Props) {
  const [apport, setApport]       = useState(Math.round(prixBien * 0.1))
  const [duree, setDuree]         = useState(20)
  const [taux, setTaux]           = useState(3.5)
  const [assurance, setAssurance] = useState(0.36)
  const [open, setOpen]           = useState(false)

  const { mensualite, coutTotal, coutInterets, mensualiteAssurance } = useMemo(() => {
    const capital = Math.max(0, prixBien - apport)
    const tauxM   = taux / 100 / 12
    const n       = duree * 12
    let mensualite = 0
    if (tauxM === 0) {
      mensualite = capital / n
    } else {
      mensualite = (capital * tauxM) / (1 - Math.pow(1 + tauxM, -n))
    }
    const mensualiteAssurance = (capital * assurance / 100) / 12
    const coutTotal    = (mensualite + mensualiteAssurance) * n
    const coutInterets = coutTotal - capital
    return {
      mensualite: isFinite(mensualite) ? mensualite : 0,
      coutTotal:  isFinite(coutTotal)  ? coutTotal  : 0,
      coutInterets: isFinite(coutInterets) ? coutInterets : 0,
      mensualiteAssurance,
    }
  }, [prixBien, apport, duree, taux, assurance])

  const fmt = (n: number) =>
    Math.round(n).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

  const apportPct = prixBien > 0 ? Math.round((apport / prixBien) * 100) : 0

  return (
    <div className="bg-white rounded-2xl border border-navy/08 overflow-hidden">
      {/* Header cliquable */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-navy/02 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🏦</span>
          <div>
            <div className="font-medium text-navy text-sm">Simulateur de crédit</div>
            {!open && (
              <div className="text-xs text-navy/40 mt-0.5">
                ~{fmt(mensualite)}/mois sur {duree} ans
              </div>
            )}
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-navy/40 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-navy/06">
          {/* Résultat principal */}
          <div className="bg-gradient-to-br from-[#4F46E5]/08 to-[#4F46E5]/04 rounded-xl p-4 my-4 text-center">
            <div className="text-xs text-navy/50 mb-1">Mensualité estimée</div>
            <div className="font-serif text-3xl text-[#4F46E5]">
              {fmt(mensualite + mensualiteAssurance)}
            </div>
            <div className="text-[11px] text-navy/40 mt-1">
              dont {fmt(mensualiteAssurance)}/mois d'assurance
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-4">
            {/* Apport */}
            <div>
              <div className="flex justify-between text-xs text-navy/60 mb-1.5">
                <span>Apport personnel</span>
                <span className="font-medium text-navy">{fmt(apport)} <span className="text-navy/40">({apportPct}%)</span></span>
              </div>
              <input
                type="range" min={0} max={prixBien} step={1000}
                value={apport}
                onChange={e => setApport(Number(e.target.value))}
                className="w-full accent-[#4F46E5] h-1.5 rounded-full cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-navy/30 mt-0.5">
                <span>0 €</span><span>{fmt(prixBien)}</span>
              </div>
            </div>

            {/* Durée */}
            <div>
              <div className="flex justify-between text-xs text-navy/60 mb-1.5">
                <span>Durée du prêt</span>
                <span className="font-medium text-navy">{duree} ans</span>
              </div>
              <div className="flex gap-2">
                {[10, 15, 20, 25, 30].map(d => (
                  <button
                    key={d}
                    onClick={() => setDuree(d)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      duree === d
                        ? 'bg-[#4F46E5] text-white'
                        : 'bg-navy/06 text-navy/60 hover:bg-navy/10'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Taux */}
            <div>
              <div className="flex justify-between text-xs text-navy/60 mb-1.5">
                <span>Taux d'intérêt</span>
                <span className="font-medium text-navy">{taux.toFixed(2)}%</span>
              </div>
              <input
                type="range" min={0.5} max={7} step={0.05}
                value={taux}
                onChange={e => setTaux(Number(e.target.value))}
                className="w-full accent-[#4F46E5] h-1.5 rounded-full cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-navy/30 mt-0.5">
                <span>0,5%</span><span>7%</span>
              </div>
            </div>

            {/* Assurance */}
            <div>
              <div className="flex justify-between text-xs text-navy/60 mb-1.5">
                <span>Assurance emprunteur</span>
                <span className="font-medium text-navy">{assurance.toFixed(2)}%/an</span>
              </div>
              <input
                type="range" min={0.1} max={1} step={0.01}
                value={assurance}
                onChange={e => setAssurance(Number(e.target.value))}
                className="w-full accent-[#4F46E5] h-1.5 rounded-full cursor-pointer"
              />
            </div>
          </div>

          {/* Récapitulatif */}
          <div className="mt-5 pt-4 border-t border-navy/06 space-y-2">
            <Row label="Capital emprunté"     value={fmt(Math.max(0, prixBien - apport))} />
            <Row label="Coût des intérêts"    value={fmt(coutInterets)} />
            <Row label="Coût assurance total" value={fmt(mensualiteAssurance * duree * 12)} />
            <Row label="Coût total du crédit" value={fmt(coutTotal)} bold />
          </div>

          <p className="text-[10px] text-navy/30 mt-4 leading-relaxed">
            * Simulation indicative. Taux moyen constaté au {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}.
            Consultez un courtier pour une offre personnalisée.
          </p>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between text-xs ${bold ? 'font-semibold text-navy pt-1' : 'text-navy/60'}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
