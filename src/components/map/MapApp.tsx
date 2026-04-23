'use client'

import { useEffect, useState } from 'react'
import { useMapStore } from '@/store/mapStore'
import Sidebar from '@/components/sidebar/Sidebar'
import MapCanvas from '@/components/map/MapCanvas'
import SearchBar from '@/components/map/SearchBar'
import Toast from '@/components/ui/Toast'
import FavoritesPanel from '@/components/panels/FavoritesPanel'
import ComparePanel from '@/components/panels/ComparePanel'
import type { BienPublic } from '@/lib/types'
import type { User } from '@supabase/supabase-js'
import type { MapStyleKey } from '@/lib/mapStyles'
import type { MapAd } from '@/lib/mapAds'   // ← NOUVEAU

export interface CarteSettings {
  lat: number
  lng: number
  zoom: number
  style: MapStyleKey
  heatmapDefaut: boolean
  zoomMin: number
  zoomMax: number
  clusteringSeuil: number
  heatmapOpacite: number
  poiDistanceMax: number
  devise: string
}

interface Props {
  biens: BienPublic[]
  user: User | null
  initialBienId?: string
  carteSettings: CarteSettings
  ads?: MapAd[]   // ← NOUVEAU
}

export default function MapApp({ biens, user, initialBienId, carteSettings, ads = [] }: Props) {
  const { setBiens, setAds, setActiveBienId, compareSet, favsPanelOpen, setFavsPanelOpen, activeBienId } = useMapStore()
  const [showCompare, setShowCompare] = useState(false)
  const [mounted, setMounted] = useState(false)
  const cmpCount = compareSet.size

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    setBiens(biens)
    if (initialBienId) setActiveBienId(initialBienId)
  }, [biens])

  useEffect(() => {
    setAds(ads)
  }, [ads])

  useEffect(() => {
    if (!mounted) return
    const url = new URL(window.location.href)
    if (activeBienId) url.searchParams.set('bien', activeBienId)
    else url.searchParams.delete('bien')
    window.history.replaceState({}, '', url.toString())
  }, [activeBienId, mounted])

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <SearchBar />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <MapCanvas carteSettings={carteSettings} ads={ads} />  {/* ← ads passé ici */}
        <Toast />

        {mounted && cmpCount > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-navy text-white z-[150] px-6 py-3 flex items-center gap-4 shadow-2xl">
            <span className="text-sm font-medium flex-shrink-0">Comparer</span>
            <div className="flex gap-2 flex-1">
              {[...compareSet].map(id => {
                const b = biens.find(x => x.id === id)
                if (!b) return null
                return (
                  <div key={id} className="bg-white/10 rounded-lg px-3 py-1.5 text-xs flex items-center gap-2">
                    <span>{b.titre.split(' ').slice(0, 3).join(' ')}</span>
                    <button onClick={() => useMapStore.getState().toggleCompare(id)} className="text-white/50 hover:text-white">✕</button>
                  </div>
                )
              })}
            </div>
            <button onClick={() => setShowCompare(true)}
              className="bg-primary text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-primary-dark transition-colors flex-shrink-0">
              Comparer {cmpCount}
            </button>
            <button onClick={() => useMapStore.getState().clearCompare()}
              className="border border-white/20 text-white/60 text-sm px-3 py-1.5 rounded-lg hover:border-white/40 transition-colors flex-shrink-0">
              Effacer
            </button>
          </div>
        )}

        {favsPanelOpen && <FavoritesPanel onClose={() => setFavsPanelOpen(false)} />}
        {showCompare && <ComparePanel onClose={() => setShowCompare(false)} />}
      </div>
    </div>
  )
}
