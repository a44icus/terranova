'use client'

import { useState } from 'react'
import VisiteActions from './VisiteActions'
import VisiteCalendar from './VisiteCalendar'

interface Visite {
  id:              string
  bien_id:         string
  vendeur_id:      string
  demandeur_nom:   string
  demandeur_email: string
  demandeur_tel:   string | null
  date_souhaitee:  string
  creneau:         string | null
  message:         string | null
  statut:          string
  created_at:      string
  biens:           { id: string; titre: string; ville: string } | null
}

interface Props {
  visites: Visite[]
  counts:  { total: number; en_attente: number; confirme: number }
}

const STATUT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  en_attente: { label: 'En attente', color: '#92400E', bg: '#FEF3C7' },
  confirme:   { label: 'Confirmée',  color: '#065F46', bg: '#D1FAE5' },
  annule:     { label: 'Annulée',    color: '#991B1B', bg: '#FEE2E2' },
}

type View = 'calendrier' | 'liste'

export default function VisitesClient({ visites, counts }: Props) {
  const [view, setView] = useState<View>('calendrier')

  return (
    <>
      {/* Stats + toggle de vue */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex gap-3">
          {[
            { label: 'Total',      value: counts.total,      color: '#4F46E5' },
            { label: 'En attente', value: counts.en_attente, color: '#D97706' },
            { label: 'Confirmées', value: counts.confirme,   color: '#059669' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-[#0F172A]/08 px-5 py-3 text-center min-w-[80px]">
              <div className="font-serif text-2xl leading-tight" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[11px] text-[#0F172A]/40 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Toggle */}
        <div className="flex bg-[#0F172A]/06 rounded-xl p-1 gap-1">
          {(['calendrier', 'liste'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                view === v
                  ? 'bg-white text-[#0F172A] shadow-sm'
                  : 'text-[#0F172A]/50 hover:text-[#0F172A]'
              }`}
            >
              {v === 'calendrier' ? '📅 Calendrier' : '☰ Liste'}
            </button>
          ))}
        </div>
      </div>

      {/* Vide */}
      {!visites.length ? (
        <div className="bg-white rounded-2xl border border-[#0F172A]/08 py-16 text-center">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-[#0F172A]/40 text-sm">Aucune demande de visite pour l&apos;instant</p>
          <p className="text-xs text-[#0F172A]/30 mt-1">
            Les demandes apparaîtront ici lorsque des visiteurs s&apos;intéresseront à vos biens
          </p>
        </div>
      ) : view === 'calendrier' ? (
        <VisiteCalendar visites={visites} />
      ) : (
        <ListView visites={visites} />
      )}
    </>
  )
}

function ListView({ visites }: { visites: Visite[] }) {
  return (
    <div className="space-y-3">
      {visites.map(v => {
        const st = STATUT_LABELS[v.statut] ?? STATUT_LABELS.en_attente
        const dateVisite   = new Date(v.date_souhaitee).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        const dateCreation = new Date(v.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

        return (
          <div key={v.id} className="bg-white rounded-2xl border border-[#0F172A]/08 p-5">
            <div className="flex items-start gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium text-[#0F172A] text-sm">{v.demandeur_nom}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: st.bg, color: st.color }}>
                    {st.label}
                  </span>
                </div>
                {v.biens && (
                  <a href={`/annonce/${v.biens.id}`} className="text-xs text-primary hover:underline mb-2 block">
                    🏠 {v.biens.titre} — {v.biens.ville}
                  </a>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#0F172A]/50 mb-2">
                  <span>📅 {dateVisite}</span>
                  {v.creneau    && <span>🕐 {v.creneau}</span>}
                  <span>✉️ <a href={`mailto:${v.demandeur_email}`} className="hover:text-primary">{v.demandeur_email}</a></span>
                  {v.demandeur_tel && <span>📞 {v.demandeur_tel}</span>}
                  <span className="text-[#0F172A]/30">Reçue le {dateCreation}</span>
                </div>
                {v.message && (
                  <p className="text-xs text-[#0F172A]/60 bg-[#0F172A]/03 rounded-lg px-3 py-2 italic">
                    « {v.message} »
                  </p>
                )}
              </div>
              <VisiteActions
                visiteId={v.id}
                statut={v.statut}
                demandeurEmail={v.demandeur_email}
                demandeurNom={v.demandeur_nom}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
