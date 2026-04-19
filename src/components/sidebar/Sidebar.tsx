'use client'

import { useState } from 'react'
import { useMapStore } from '@/store/mapStore'
import { useFiltersUrlSync } from '@/hooks/useFiltersUrlSync'
import { useBiensFiltres } from '@/hooks/useBiens'
import Filters from './Filters'
import BienList from './BienList'

interface SidebarContentProps {
  filtersOpen: boolean
  setFiltersOpen: React.Dispatch<React.SetStateAction<boolean>>
}

// Contenu partagé entre desktop et mobile
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
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-navy/10 bg-white">
        <button
          onClick={() => setFiltersOpen(o => !o)}
          className="flex items-center gap-2 text-xs font-medium text-navy/70 hover:text-navy transition-colors"
        >
          <span>🔍 Filtres avancés</span>
          {activeCount > 0 && (
            <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
          <span className="text-navy/40 text-[10px]">{filtersOpen ? '▲' : '▼'}</span>
        </button>
        {hasAny && (
          <button onClick={resetFiltres}
            className="text-[10px] text-primary hover:underline font-medium">
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

export default function Sidebar() {
  const { sidebarOpen, filtres } = useMapStore()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const biens = useBiensFiltres()
  useFiltersUrlSync()

  const activeCount = [
    !!filtres.categorie,
    !!filtres.surface,
    filtres.pieces > 0,
    filtres.options.size > 0,
    filtres.dpe.size > 0,
    !!filtres.ville,
    !!filtres.departement,
  ].filter(Boolean).length

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
        className="lg:hidden fixed bottom-0 left-0 right-0 z-[200] flex flex-col"
        style={{
          height: mobileOpen ? '72vh' : 'auto',
          transition: 'height 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* ── Handle / drag pill ── */}
        <button
          onClick={() => setMobileOpen(o => !o)}
          className="relative flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white border-t border-navy/10"
          style={{
            borderRadius: mobileOpen ? '0' : '14px 14px 0 0',
            boxShadow: '0 -4px 20px rgba(15,23,42,0.10)',
          }}
        >
          {/* Indicateur de glissement */}
          <span className="absolute top-2 left-1/2 -translate-x-1/2 w-9 h-1 bg-navy/15 rounded-full" />

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

          {/* Droite : badge type + chevron */}
          <div className="flex items-center gap-2 mt-1">
            {filtres.type !== 'all' && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white"
                style={{ background: filtres.type === 'vente' ? '#4F46E5' : '#0891B2' }}>
                {filtres.type === 'vente' ? 'Vente' : 'Location'}
              </span>
            )}
            <svg
              className={`w-4 h-4 text-navy/40 transition-transform duration-300 ${mobileOpen ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </div>
        </button>

        {/* ── Corps du sheet ── */}
        {mobileOpen && (
          <div className="flex-1 bg-white overflow-hidden flex flex-col">
            <SidebarContent filtersOpen={filtersOpen} setFiltersOpen={setFiltersOpen} />
          </div>
        )}
      </div>
    </>
  )
}
