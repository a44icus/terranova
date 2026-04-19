'use client'

import { useState } from 'react'
import { useMapStore } from '@/store/mapStore'
import { useFiltersUrlSync } from '@/hooks/useFiltersUrlSync'
import Filters from './Filters'
import BienList from './BienList'

export default function Sidebar() {
  const { sidebarOpen, filtres, setFiltreType, resetFiltres } = useMapStore()
  const [filtersOpen, setFiltersOpen] = useState(false)
  useFiltersUrlSync()

  // Compte les filtres actifs (hors type car toujours visible)
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
    <div
      className="flex-shrink-0 bg-surface border-r border-navy/10 flex flex-col overflow-hidden transition-all duration-300"
      style={{ width: sidebarOpen ? 360 : 0, opacity: sidebarOpen ? 1 : 0 }}
    >
      <div className="flex flex-col overflow-hidden h-full" style={{ minWidth: 360 }}>

        {/* Tabs Tout / Vente / Location — toujours visibles */}
        <div className="flex-shrink-0 p-3 border-b border-navy/10 bg-white">
          <div className="flex bg-navy/06 rounded-lg p-0.5 gap-0.5">
            {(['all', 'vente', 'location'] as const).map(t => (
              <button key={t} onClick={() => setFiltreType(t)}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${filtres.type === t ? 'bg-white text-navy shadow-sm' : 'text-navy/50 hover:text-navy'}`}>
                {t === 'all' ? 'Tout' : t === 'vente' ? 'Vente' : 'Location'}
              </button>
            ))}
          </div>
        </div>

        {/* Barre toggle filtres */}
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
            <span className="text-navy/40 text-[10px]">
              {filtersOpen ? '▲' : '▼'}
            </span>
          </button>

          {hasAny && (
            <button
              onClick={resetFiltres}
              className="text-[10px] text-primary hover:underline font-medium"
            >
              Réinitialiser
            </button>
          )}
        </div>

        {/* Filtres avancés repliables */}
        <div
          className="flex-shrink-0 overflow-hidden transition-all duration-300"
          style={{ maxHeight: filtersOpen ? 700 : 0 }}
        >
          <div className="overflow-y-auto border-b border-navy/10" style={{ maxHeight: 700 }}>
            <Filters hideReset hideTabs />
          </div>
        </div>

        {/* Liste des biens — prend tout l'espace restant */}
        <BienList />

      </div>
    </div>
  )
}
