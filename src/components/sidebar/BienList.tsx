'use client'

import { useState } from 'react'
import { useMapStore } from '@/store/mapStore'
import { useBiensFiltres } from '@/hooks/useBiens'
import BienCard from './BienCard'

const PAGE_SIZE = 20

export default function BienList() {
  const { listView, setListView, sortMode, setSortMode } = useMapStore()
  const biens = useBiensFiltres()
  const [visible, setVisible] = useState(PAGE_SIZE)

  const shown = biens.slice(0, visible)
  const remaining = biens.length - visible

  // Réinitialiser la pagination quand les filtres changent
  if (visible > PAGE_SIZE && biens.length <= PAGE_SIZE) {
    setVisible(PAGE_SIZE)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-navy/10 flex-shrink-0">
        <span className="text-[11px] font-medium text-navy/45 uppercase tracking-wider">
          {biens.length} bien{biens.length > 1 ? 's' : ''} trouvé{biens.length > 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-2">
          <select
            value={sortMode}
            onChange={e => { setSortMode(e.target.value as any); setVisible(PAGE_SIZE) }}
            className="border-none bg-transparent text-xs text-navy/60 cursor-pointer focus:outline-none"
          >
            <option value="default">Pertinence</option>
            <option value="prix-asc">Prix ↑</option>
            <option value="prix-desc">Prix ↓</option>
            <option value="surf-desc">Surface ↓</option>
            <option value="surf-asc">Surface ↑</option>
          </select>
          <div className="flex gap-1">
            <button
              onClick={() => setListView('list')}
              className={`w-6 h-6 rounded border text-xs flex items-center justify-center transition-all ${
                listView === 'list' ? 'bg-navy text-white border-navy' : 'bg-white border-navy/15'
              }`}
            >≡</button>
            <button
              onClick={() => setListView('grid')}
              className={`w-6 h-6 rounded border text-xs flex items-center justify-center transition-all ${
                listView === 'grid' ? 'bg-navy text-white border-navy' : 'bg-white border-navy/15'
              }`}
            >⊞</button>
          </div>
        </div>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto p-3">
        {biens.length === 0 ? (
          <div className="text-center py-16 text-navy/35 text-sm">
            Aucun bien ne correspond à vos critères
          </div>
        ) : (
          <>
            <div className={listView === 'grid' ? 'grid grid-cols-2 gap-2' : ''}>
              {shown.map(bien => (
                <BienCard key={bien.id} bien={bien} grid={listView === 'grid'} />
              ))}
            </div>

            {remaining > 0 && (
              <div className="pt-2 pb-1">
                <button
                  onClick={() => setVisible(v => v + PAGE_SIZE)}
                  className="w-full py-2.5 text-xs font-medium text-navy/60 border border-navy/15 rounded-xl hover:border-navy/30 hover:text-navy transition-all"
                >
                  Voir {Math.min(remaining, PAGE_SIZE)} de plus
                  <span className="ml-1 text-navy/35">({remaining} restants)</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}



