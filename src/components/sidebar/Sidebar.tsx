'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useMapStore } from '@/store/mapStore'
import { useFiltersUrlSync } from '@/hooks/useFiltersUrlSync'
import { useBiensFiltres } from '@/hooks/useBiens'
import Filters from './Filters'
import BienList from './BienList'
import SaveSearchButton from './SaveSearchButton'

// ─── Snap points ──────────────────────────────────────────────
// 0 = fermé   (60px  — juste le handle)
// 1 = aperçu  (40vh  — ~3 cartes visibles)
// 2 = plein   (74vh  — quasi plein écran)
type SnapIdx = 0 | 1 | 2
const SNAP_CSS: Record<SnapIdx, string> = { 0: '60px', 1: '40vh', 2: '74vh' }
const SNAP_FRACTION = [0, 0.40, 0.74] as const

function snapPx(idx: SnapIdx): number {
  return SNAP_FRACTION[idx] > 0
    ? window.innerHeight * SNAP_FRACTION[idx]
    : 60
}

// ─── Contenu partagé desktop / mobile ─────────────────────────
interface SidebarContentProps {
  filtersOpen: boolean
  setFiltersOpen: React.Dispatch<React.SetStateAction<boolean>>
}

function SidebarContent({ filtersOpen, setFiltersOpen }: SidebarContentProps) {
  const { filtres, setFiltreType, resetFiltres } = useMapStore()

  const activeCount = [
    !!filtres.categorie,
    !!filtres.surface,
    filtres.pieces > 0,
    filtres.options.size > 0,
    filtres.dpe.size > 0,
    !!filtres.ville,
    !!filtres.departement,
  ].filter(Boolean).length

  const hasAny = filtres.type !== 'all' || activeCount > 0

  return (
    <>
      {/* Tabs Tout / Vente / Location */}
      <div className="flex-shrink-0 p-3 border-b border-navy/10 bg-white">
        <div className="flex bg-navy/06 rounded-lg p-0.5 gap-0.5">
          {(['all', 'vente', 'location'] as const).map(t => (
            <button key={t} onClick={() => setFiltreType(t)}
              className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${
                filtres.type === t ? 'bg-white text-navy shadow-sm' : 'text-navy/50 hover:text-navy'
              }`}>
              {t === 'all' ? 'Tout' : t === 'vente' ? 'Vente' : 'Location'}
            </button>
          ))}
        </div>
      </div>

      {/* Barre filtres */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b border-navy/10 bg-white">
        <button
          onClick={() => setFiltersOpen(o => !o)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filtersOpen || activeCount > 0
              ? 'bg-primary text-white shadow-sm shadow-primary/25'
              : 'bg-navy/08 text-navy hover:bg-navy/14'
          }`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="4" y1="6" x2="20" y2="6"/>
            <line x1="4" y1="12" x2="20" y2="12"/>
            <line x1="4" y1="18" x2="20" y2="18"/>
            <circle cx="9" cy="6" r="2.5" fill="currentColor" stroke="none"/>
            <circle cx="15" cy="12" r="2.5" fill="currentColor" stroke="none"/>
            <circle cx="9" cy="18" r="2.5" fill="currentColor" stroke="none"/>
          </svg>
          Filtres
          {activeCount > 0 && (
            <span className="bg-white/25 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {activeCount}
            </span>
          )}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={`transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <SaveSearchButton compact />
        {hasAny && (
          <button onClick={resetFiltres}
            className="ml-auto text-[10px] text-primary hover:underline font-medium">
            Réinitialiser
          </button>
        )}
      </div>

      {/* Filtres repliables */}
      <div
        className="flex-shrink-0 overflow-hidden transition-all duration-300"
        style={{ maxHeight: filtersOpen ? 700 : 0 }}
      >
        <div className="overflow-y-auto border-b border-navy/10" style={{ maxHeight: 700 }}>
          <Filters hideReset hideTabs />
        </div>
      </div>

      {/* Liste des biens */}
      <BienList />
    </>
  )
}

// ─── Sidebar principale ────────────────────────────────────────
export default function Sidebar() {
  const { sidebarOpen, filtres } = useMapStore()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [snapIdx, setSnapIdx] = useState<SnapIdx>(0)
  const biens = useBiensFiltres()
  useFiltersUrlSync()

  // Refs pour le drag
  const sheetRef = useRef<HTMLDivElement>(null)
  const drag = useRef({
    active: false,
    startY: 0,
    startH: 0,
    lastY: 0,
    lastT: 0,
    velY: 0,   // px/ms, positif = vers le haut
  })

  const activeCount = [
    !!filtres.categorie,
    !!filtres.surface,
    filtres.pieces > 0,
    filtres.options.size > 0,
    filtres.dpe.size > 0,
    !!filtres.ville,
    !!filtres.departement,
  ].filter(Boolean).length

  // ── Snap helpers ──────────────────────────────────────────
  const applySnap = useCallback((idx: SnapIdx) => {
    const el = sheetRef.current
    if (!el) return
    el.style.transition = 'height 0.32s cubic-bezier(0.34,1.2,0.64,1)'
    el.style.height = SNAP_CSS[idx]
    setSnapIdx(idx)
  }, [])

  // ── Replier quand un bien est sélectionné ─────────────────
  const activeBienId = useMapStore(s => s.activeBienId)
  useEffect(() => {
    if (activeBienId) applySnap(0)
  }, [activeBienId, applySnap])

  // ── Touch handlers (handle uniquement) ───────────────────
  function onTouchStart(e: React.TouchEvent) {
    const el = sheetRef.current
    if (!el) return
    const now = performance.now()
    drag.current = {
      active: true,
      startY: e.touches[0].clientY,
      startH: el.getBoundingClientRect().height,
      lastY: e.touches[0].clientY,
      lastT: now,
      velY: 0,
    }
    // Couper la transition pendant le drag pour un suivi direct
    el.style.transition = 'none'
  }

  function onTouchMove(e: React.TouchEvent) {
    const el = sheetRef.current
    if (!drag.current.active || !el) return

    const touch = e.touches[0]
    const now = performance.now()
    const dt = Math.max(1, now - drag.current.lastT)

    // Vélocité instantanée (vers le haut = positif)
    drag.current.velY = (drag.current.lastY - touch.clientY) / dt
    drag.current.lastY = touch.clientY
    drag.current.lastT = now

    const dy = drag.current.startY - touch.clientY
    const newH = Math.max(44, Math.min(window.innerHeight * 0.90, drag.current.startH + dy))
    el.style.height = `${newH}px`
  }

  function onTouchEnd(e: React.TouchEvent) {
    const el = sheetRef.current
    if (!drag.current.active || !el) return
    drag.current.active = false

    const totalDy = Math.abs(drag.current.startY - (e.changedTouches[0]?.clientY ?? drag.current.lastY))

    // ── Tap court (< 10px) → cycle des snaps ──
    if (totalDy < 10) {
      const next: SnapIdx = snapIdx === 0 ? 1 : snapIdx === 1 ? 2 : 0
      applySnap(next)
      return
    }

    // ── Drag → snapper au plus proche, corrigé par la vélocité ──
    const currentH = el.getBoundingClientRect().height
    const snaps: [number, number, number] = [
      snapPx(0), snapPx(1), snapPx(2),
    ]

    // Trouver le snap le plus proche
    let nearest: SnapIdx = 0
    let minDist = Infinity
    snaps.forEach((s, i) => {
      const d = Math.abs(s - currentH)
      if (d < minDist) { minDist = d; nearest = i as SnapIdx }
    })

    // Correction vélocité : swipe rapide → snap suivant/précédent
    const vel = drag.current.velY
    if (vel > 0.5 && nearest < 2) nearest = (nearest + 1) as SnapIdx
    else if (vel < -0.5 && nearest > 0) nearest = (nearest - 1) as SnapIdx

    applySnap(nearest)
  }

  return (
    <>
      {/* ════════════════════════════════════════
          Desktop sidebar (lg+)
      ════════════════════════════════════════ */}
      <div
        className="hidden lg:flex flex-shrink-0 bg-surface border-r border-navy/10 flex-col overflow-hidden transition-all duration-300"
        style={{ width: sidebarOpen ? 360 : 0, opacity: sidebarOpen ? 1 : 0 }}
      >
        <div className="flex flex-col overflow-hidden h-full" style={{ minWidth: 360 }}>
          <SidebarContent filtersOpen={filtersOpen} setFiltersOpen={setFiltersOpen} />
        </div>
      </div>

      {/* ════════════════════════════════════════
          Mobile bottom sheet (< lg)
      ════════════════════════════════════════ */}
      <div
        ref={sheetRef}
        className="lg:hidden fixed bottom-0 left-0 right-0 z-[200] flex flex-col"
        style={{
          height: SNAP_CSS[snapIdx],
          transition: 'height 0.32s cubic-bezier(0.34,1.2,0.64,1)',
          overflow: 'hidden',
          /* Ombre portée sur la carte en-dessous */
          filter: 'drop-shadow(0 -6px 24px rgba(15,23,42,0.12))',
          willChange: 'height',
        }}
      >
        {/* ── Handle draggable ── */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="relative flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white border-t border-navy/10 select-none"
          style={{
            borderRadius: snapIdx === 0 ? '14px 14px 0 0' : '0',
            touchAction: 'none',   /* bloque le scroll navigateur sur le handle */
            cursor: 'grab',
          }}
        >
          {/* Pill drag visuel */}
          <span className="absolute top-2 left-1/2 -translate-x-1/2 w-9 h-1 rounded-full transition-colors"
            style={{ background: snapIdx === 0 ? 'rgba(15,23,42,0.18)' : 'rgba(15,23,42,0.12)' }}
          />

          {/* Gauche : compteur + filtres actifs */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[13px] font-semibold text-navy">
              {biens.length} bien{biens.length > 1 ? 's' : ''} trouvé{biens.length > 1 ? 's' : ''}
            </span>
            {activeCount > 0 && (
              <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {activeCount} filtre{activeCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Droite : badge type + indicateur de snap */}
          <div className="flex items-center gap-2 mt-1">
            {filtres.type !== 'all' && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white"
                style={{ background: filtres.type === 'vente' ? '#4F46E5' : '#0891B2' }}>
                {filtres.type === 'vente' ? 'Vente' : 'Location'}
              </span>
            )}
            {/* Indicateur de position (3 dots) */}
            <div className="flex gap-1 items-center">
              {([0, 1, 2] as SnapIdx[]).map(i => (
                <div key={i} style={{
                  width: i === snapIdx ? 14 : 5,
                  height: 5, borderRadius: 3,
                  background: i === snapIdx ? '#4F46E5' : 'rgba(15,23,42,0.18)',
                  transition: 'all 0.25s',
                }} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Corps du sheet ── */}
        {/* Toujours monté, visibility contrôlée par l'overflow du parent */}
        <div className="flex-1 bg-white overflow-hidden flex flex-col">
          <SidebarContent filtersOpen={filtersOpen} setFiltersOpen={setFiltersOpen} />
        </div>
      </div>
    </>
  )
}
