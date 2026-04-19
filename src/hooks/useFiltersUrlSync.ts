'use client'

import { useEffect, useRef } from 'react'
import { useMapStore } from '@/store/mapStore'
import type { BienCategorie, BienType, DpeClasse } from '@/lib/types'

/**
 * Synchronise les filtres Zustand avec l'URL (sans provoquer de re-render serveur).
 * - Au montage : lit les paramètres URL et hydrate le store
 * - À chaque changement de filtres : met à jour l'URL silencieusement via replaceState
 */
export function useFiltersUrlSync() {
  const store = useMapStore()
  const initialized = useRef(false)

  // ── Lecture URL → store (une seule fois au montage) ──────────────────
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const params = new URLSearchParams(window.location.search)

    if (params.get('type')) store.setFiltreType(params.get('type') as 'all' | BienType)
    if (params.get('categorie')) store.setFiltreCategorie(params.get('categorie') as BienCategorie)
    if (params.get('ville')) store.setFiltreVille(params.get('ville')!)
    if (params.get('dept')) store.setFiltreDepartement(params.get('dept')!)
    if (params.get('prix')) store.setFiltrePrixMax(parseInt(params.get('prix')!))
    if (params.get('surface')) store.setFiltreSurface(params.get('surface')!)
    if (params.get('pieces')) store.setFiltrePieces(parseInt(params.get('pieces')!))
    if (params.get('opts')) {
      params.get('opts')!.split(',').filter(Boolean).forEach(o => store.toggleFiltreOption(o))
    }
    if (params.get('dpe')) {
      params.get('dpe')!.split(',').filter(Boolean).forEach(d => store.toggleFiltreDpe(d as DpeClasse))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Store → URL (à chaque changement de filtres) ─────────────────────
  useEffect(() => {
    if (!initialized.current) return
    const { filtres } = store
    const params = new URLSearchParams()

    if (filtres.type !== 'all') params.set('type', filtres.type)
    if (filtres.categorie) params.set('categorie', filtres.categorie)
    if (filtres.ville) params.set('ville', filtres.ville)
    if (filtres.departement) params.set('dept', filtres.departement)
    if (filtres.prixMax !== 1200000) params.set('prix', String(filtres.prixMax))
    if (filtres.surface) params.set('surface', filtres.surface)
    if (filtres.pieces > 0) params.set('pieces', String(filtres.pieces))
    if (filtres.options.size > 0) params.set('opts', [...filtres.options].join(','))
    if (filtres.dpe.size > 0) params.set('dpe', [...filtres.dpe].join(','))

    const search = params.toString()
    const newUrl = search ? `${window.location.pathname}?${search}` : window.location.pathname
    window.history.replaceState(null, '', newUrl)
  }, [store.filtres]) // eslint-disable-line react-hooks/exhaustive-deps
}
