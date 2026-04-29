'use client'

import { useState } from 'react'
import VisiteActions from './VisiteActions'

interface Visite {
  id:              string
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
}

const STATUT_CONFIG = {
  en_attente: { label: 'En attente', dot: '#F59E0B', bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  confirme:   { label: 'Confirmée',  dot: '#10B981', bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
  annule:     { label: 'Annulée',    dot: '#9CA3AF', bg: '#F3F4F6', text: '#6B7280', border: '#D1D5DB' },
}

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MOIS  = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = []
  const date = new Date(year, month, 1)
  while (date.getMonth() === month) {
    days.push(new Date(date))
    date.setDate(date.getDate() + 1)
  }
  return days
}

// Retourne le lundi de la semaine contenant cette date
function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0=dim, 1=lun...
  const diff = (day === 0 ? -6 : 1 - day)
  d.setDate(d.getDate() + diff)
  return d
}

function buildCalendarGrid(year: number, month: number): (Date | null)[] {
  const firstDay   = new Date(year, month, 1)
  const lastDay    = new Date(year, month + 1, 0)
  const gridStart  = startOfWeek(firstDay)
  const gridEnd    = new Date(startOfWeek(lastDay))
  gridEnd.setDate(gridEnd.getDate() + 6)

  const grid: (Date | null)[] = []
  const cursor = new Date(gridStart)
  while (cursor <= gridEnd) {
    grid.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  // Pad à multiple de 7
  while (grid.length % 7 !== 0) grid.push(null)
  return grid
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate()
}

export default function VisiteCalendar({ visites }: Props) {
  const today       = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<string | null>(null) // 'YYYY-MM-DD'

  const grid = buildCalendarGrid(year, month)

  // Index visites par jour
  const byDay: Record<string, Visite[]> = {}
  visites.forEach(v => {
    const key = v.date_souhaitee.slice(0, 10) // 'YYYY-MM-DD'
    if (!byDay[key]) byDay[key] = []
    byDay[key].push(v)
  })

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelectedDay(null)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelectedDay(null)
  }
  function goToday() {
    setYear(today.getFullYear())
    setMonth(today.getMonth())
    setSelectedDay(null)
  }

  const selectedVisites = selectedDay ? (byDay[selectedDay] ?? []) : []
  const selectedDateLabel = selectedDay
    ? new Date(selectedDay + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div>
      {/* Navigation mois */}
      <div className="bg-white rounded-2xl border border-[#0F172A]/08 mb-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#0F172A]/06">
          <button onClick={prevMonth}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#0F172A]/06 transition-colors text-[#0F172A]/50 hover:text-[#0F172A]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-3">
            <span className="font-serif text-xl text-[#0F172A]">{MOIS[month]} {year}</span>
            {(year !== today.getFullYear() || month !== today.getMonth()) && (
              <button onClick={goToday}
                className="text-xs font-medium px-3 py-1 rounded-full bg-[#4F46E5]/10 text-[#4F46E5] hover:bg-[#4F46E5]/20 transition-colors">
                Aujourd&apos;hui
              </button>
            )}
          </div>

          <button onClick={nextMonth}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#0F172A]/06 transition-colors text-[#0F172A]/50 hover:text-[#0F172A]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* En-têtes jours */}
        <div className="grid grid-cols-7 border-b border-[#0F172A]/05">
          {JOURS.map(j => (
            <div key={j} className="py-2.5 text-center text-[11px] font-semibold text-[#0F172A]/35 uppercase tracking-wider">
              {j}
            </div>
          ))}
        </div>

        {/* Grille */}
        <div className="grid grid-cols-7">
          {grid.map((day, i) => {
            if (!day) return <div key={`null-${i}`} className="min-h-[80px] border-b border-r border-[#0F172A]/04 bg-[#0F172A]/01" />

            const isCurrentMonth = day.getMonth() === month
            const isToday        = isSameDay(day, today)
            const dayKey         = `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`
            const dayVisites     = byDay[dayKey] ?? []
            const isSelected     = selectedDay === dayKey
            const isLastRow      = i >= grid.length - 7
            const isLastCol      = (i + 1) % 7 === 0

            return (
              <button
                key={dayKey}
                onClick={() => setSelectedDay(isSelected ? null : dayKey)}
                className={`min-h-[80px] p-2 text-left transition-all relative flex flex-col
                  ${!isLastRow  ? 'border-b' : ''} ${!isLastCol ? 'border-r' : ''}
                  border-[#0F172A]/05
                  ${isSelected  ? 'bg-[#4F46E5]/06 ring-1 ring-inset ring-[#4F46E5]/20' : 'hover:bg-[#0F172A]/02'}
                  ${!isCurrentMonth ? 'opacity-40' : ''}
                `}
              >
                {/* Numéro du jour */}
                <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1 flex-shrink-0
                  ${isToday ? 'bg-[#4F46E5] text-white' : 'text-[#0F172A]/70'}
                `}>
                  {day.getDate()}
                </span>

                {/* Visites du jour */}
                <div className="flex flex-col gap-0.5 w-full">
                  {dayVisites.slice(0, 3).map(v => {
                    const cfg = STATUT_CONFIG[v.statut as keyof typeof STATUT_CONFIG] ?? STATUT_CONFIG.en_attente
                    return (
                      <div
                        key={v.id}
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded truncate leading-tight"
                        style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
                        title={`${v.demandeur_nom}${v.creneau ? ` · ${v.creneau}` : ''}`}
                      >
                        <span className="mr-1" style={{ color: cfg.dot }}>●</span>
                        {v.demandeur_nom.split(' ')[0]}
                      </div>
                    )
                  })}
                  {dayVisites.length > 3 && (
                    <div className="text-[10px] text-[#0F172A]/40 px-1">
                      +{dayVisites.length - 3} de plus
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-5 mb-6 px-1">
        {Object.entries(STATUT_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-[#0F172A]/50">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
            {cfg.label}
          </div>
        ))}
      </div>

      {/* Panneau détail du jour sélectionné */}
      {selectedDay && (
        <div className="bg-white rounded-2xl border border-[#4F46E5]/20 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-[#4F46E5]/04 border-b border-[#4F46E5]/10">
            <div>
              <div className="font-medium text-[#0F172A] capitalize">{selectedDateLabel}</div>
              <div className="text-xs text-[#0F172A]/45 mt-0.5">
                {selectedVisites.length} visite{selectedVisites.length > 1 ? 's' : ''} ce jour
              </div>
            </div>
            <button onClick={() => setSelectedDay(null)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#0F172A]/08 text-[#0F172A]/40 hover:text-[#0F172A] transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Liste des visites du jour */}
          <div className="divide-y divide-[#0F172A]/05">
            {selectedVisites.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-[#0F172A]/40">
                Aucune visite ce jour.
              </div>
            ) : selectedVisites.map(v => {
              const cfg = STATUT_CONFIG[v.statut as keyof typeof STATUT_CONFIG] ?? STATUT_CONFIG.en_attente
              return (
                <div key={v.id} className="px-5 py-4 flex items-start gap-4 flex-wrap">
                  {/* Indicateur statut */}
                  <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: cfg.dot }} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-[#0F172A] text-sm">{v.demandeur_nom}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: cfg.bg, color: cfg.text }}>
                        {cfg.label}
                      </span>
                      {v.creneau && (
                        <span className="text-[11px] text-[#0F172A]/45 bg-[#0F172A]/05 px-2 py-0.5 rounded-full">
                          🕐 {v.creneau}
                        </span>
                      )}
                    </div>

                    {v.biens && (
                      <a href={`/annonce/${v.biens.id}`}
                        className="text-xs text-[#4F46E5] hover:underline mb-1.5 block">
                        🏠 {v.biens.titre} — {v.biens.ville}
                      </a>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#0F172A]/50">
                      <a href={`mailto:${v.demandeur_email}`} className="hover:text-[#4F46E5]">
                        ✉️ {v.demandeur_email}
                      </a>
                      {v.demandeur_tel && (
                        <a href={`tel:${v.demandeur_tel}`} className="hover:text-[#4F46E5]">
                          📞 {v.demandeur_tel}
                        </a>
                      )}
                    </div>

                    {v.message && (
                      <p className="mt-2 text-xs text-[#0F172A]/55 bg-[#0F172A]/03 rounded-lg px-3 py-2 italic">
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
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
