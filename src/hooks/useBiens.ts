'use client'

import { useMemo } from 'react'
import { useMapStore } from '@/store/mapStore'
import { pointInPolygon, haversineKm } from '@/lib/geo'
import type { BienPublic } from '@/lib/types'

export function useBiensFiltres(): BienPublic[] {
  const { biens, filtres, sortMode, lassoPolygon } = useMapStore()

  return useMemo(() => {
    let list = biens.filter(b => {
      if (filtres.type !== 'all' && b.type !== filtres.type) return false
      if (filtres.categorie && b.categorie !== filtres.categorie) return false
      if (filtres.surface) {
        const [mn, mx] = filtres.surface.split('-').map(Number)
        if (!b.surface || b.surface < mn || b.surface > mx) return false
      }
      const seuil = b.type === 'location' ? filtres.prixMax / 200 : filtres.prixMax
      if (b.prix > seuil) return false
      if (filtres.pieces === 4 && (b.pieces ?? 0) < 4) return false
      if (filtres.pieces > 0 && filtres.pieces < 4 && b.pieces !== filtres.pieces) return false
      for (const opt of filtres.options) {
        if (!b.options.includes(opt)) return false
      }
      if (filtres.dpe.size > 0 && b.dpe && !filtres.dpe.has(b.dpe)) return false
      if (filtres.ville) {
        const v = filtres.ville.toLowerCase()
        if (!b.ville.toLowerCase().includes(v)) return false
      }
      if (filtres.departement) {
        if (!b.code_postal.startsWith(filtres.departement)) return false
      }
      if (filtres.rayonKm > 0 && filtres.rayonLat != null && filtres.rayonLng != null) {
        if (haversineKm(b.lat, b.lng, filtres.rayonLat, filtres.rayonLng) > filtres.rayonKm) return false
      }
      if (lassoPolygon && !pointInPolygon([b.lng, b.lat], lassoPolygon)) return false
      return true
    })

    if (sortMode === 'prix-asc') list.sort((a, b) => a.prix - b.prix)
    else if (sortMode === 'prix-desc') list.sort((a, b) => b.prix - a.prix)
    else if (sortMode === 'surf-desc') list.sort((a, b) => (b.surface ?? 0) - (a.surface ?? 0))
    else if (sortMode === 'surf-asc') list.sort((a, b) => (a.surface ?? 0) - (b.surface ?? 0))
    else list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))

    return list
  }, [biens, filtres, sortMode, lassoPolygon])
}
