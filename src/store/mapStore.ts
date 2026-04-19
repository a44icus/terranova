import { create } from 'zustand'
import type { BienPublic, BienType, BienCategorie, DpeClasse } from '@/lib/types'

interface Filtres {
  type: 'all' | BienType
  categorie: BienCategorie | ''
  prixMax: number
  surface: string
  pieces: number
  options: Set<string>
  dpe: Set<DpeClasse>
  ville: string
  departement: string
  rayonKm: number
  rayonLat: number | null
  rayonLng: number | null
  rayonAdresse: string
}

interface MapStore {
  biens: BienPublic[]
  setBiens: (biens: BienPublic[]) => void

  activeBienId: string | null
  setActiveBienId: (id: string | null) => void

  filtres: Filtres
  setFiltreType: (type: Filtres['type']) => void
  setFiltreCategorie: (cat: BienCategorie | '') => void
  setFiltrePrixMax: (prix: number) => void
  setFiltreSurface: (surf: string) => void
  setFiltrePieces: (pieces: number) => void
  toggleFiltreOption: (opt: string) => void
  toggleFiltreDpe: (dpe: DpeClasse) => void
  setFiltreVille: (ville: string) => void
  setFiltreDepartement: (dept: string) => void
  setFiltreRayonKm: (km: number) => void
  setFiltreRayonCenter: (lat: number | null, lng: number | null) => void
  setFiltreRayonAdresse: (adresse: string) => void
  resetFiltres: () => void

  sortMode: 'default' | 'prix-asc' | 'prix-desc' | 'surf-asc' | 'surf-desc'
  setSortMode: (mode: MapStore['sortMode']) => void
  listView: 'list' | 'grid'
  setListView: (view: 'list' | 'grid') => void

  sidebarOpen: boolean
  toggleSidebar: () => void

  favorites: Set<string>
  toggleFavorite: (id: string) => void
  setFavorites: (ids: string[]) => void

  compareSet: Set<string>
  toggleCompare: (id: string) => void
  clearCompare: () => void

  favsPanelOpen: boolean
  setFavsPanelOpen: (open: boolean) => void

  lassoPolygon: [number, number][] | null
  setLassoPolygon: (poly: [number, number][] | null) => void

  toast: string
  showToast: (msg: string) => void

  geoPosition: { lat: number; lng: number; acc: number } | null
  setGeoPosition: (pos: MapStore['geoPosition']) => void
  nearbyRadius: number
  setNearbyRadius: (r: number) => void
}

const DEFAULT_FILTRES: Filtres = {
  type: 'all',
  categorie: '',
  prixMax: 1200000,
  surface: '',
  pieces: 0,
  options: new Set(),
  dpe: new Set(),
  ville: '',
  departement: '',
  rayonKm: 0,
  rayonLat: null,
  rayonLng: null,
  rayonAdresse: '',
}

export const useMapStore = create<MapStore>((set, get) => ({
  biens: [],
  setBiens: (biens) => set({ biens }),

  activeBienId: null,
  setActiveBienId: (id) => set({ activeBienId: id }),

  filtres: DEFAULT_FILTRES,
  setFiltreType: (type) => set(s => ({ filtres: { ...s.filtres, type } })),
  setFiltreCategorie: (categorie) => set(s => ({ filtres: { ...s.filtres, categorie } })),
  setFiltrePrixMax: (prixMax) => set(s => ({ filtres: { ...s.filtres, prixMax } })),
  setFiltreSurface: (surface) => set(s => ({ filtres: { ...s.filtres, surface } })),
  setFiltrePieces: (pieces) => set(s => ({ filtres: { ...s.filtres, pieces } })),
  toggleFiltreOption: (opt) => set(s => {
    const options = new Set(s.filtres.options)
    options.has(opt) ? options.delete(opt) : options.add(opt)
    return { filtres: { ...s.filtres, options } }
  }),
  toggleFiltreDpe: (dpe) => set(s => {
    const d = new Set(s.filtres.dpe)
    d.has(dpe) ? d.delete(dpe) : d.add(dpe)
    return { filtres: { ...s.filtres, dpe: d } }
  }),
  setFiltreVille: (ville) => set(s => ({ filtres: { ...s.filtres, ville } })),
  setFiltreDepartement: (departement) => set(s => ({ filtres: { ...s.filtres, departement } })),
  setFiltreRayonKm: (rayonKm) => set(s => ({ filtres: { ...s.filtres, rayonKm } })),
  setFiltreRayonCenter: (rayonLat, rayonLng) => set(s => ({ filtres: { ...s.filtres, rayonLat, rayonLng } })),
  setFiltreRayonAdresse: (rayonAdresse) => set(s => ({ filtres: { ...s.filtres, rayonAdresse } })),
  resetFiltres: () => set({ filtres: DEFAULT_FILTRES }),

  sortMode: 'default',
  setSortMode: (sortMode) => set({ sortMode }),
  listView: 'list',
  setListView: (listView) => set({ listView }),

  sidebarOpen: true,
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),

  favorites: new Set(
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('tn_favs') || '[]')
      : []
  ),
  toggleFavorite: (id) => {
    const favorites = new Set(get().favorites)
    favorites.has(id) ? favorites.delete(id) : favorites.add(id)
    if (typeof window !== 'undefined') {
      localStorage.setItem('tn_favs', JSON.stringify([...favorites]))
    }
    set({ favorites })
    // Sync DB de façon asynchrone et silencieuse
    import('@/app/api/favoris/actions')
      .then(({ toggleFavoriDB }) => toggleFavoriDB(id))
      .catch(() => {})
  },
  setFavorites: (ids) => {
    const merged = new Set([...get().favorites, ...ids])
    if (typeof window !== 'undefined') {
      localStorage.setItem('tn_favs', JSON.stringify([...merged]))
    }
    set({ favorites: merged })
  },

  compareSet: new Set(),
  toggleCompare: (id) => set(s => {
    const compareSet = new Set(s.compareSet)
    if (compareSet.has(id)) {
      compareSet.delete(id)
    } else {
      if (compareSet.size >= 3) {
        get().showToast('Maximum 3 biens à comparer')
        return {}
      }
      compareSet.add(id)
    }
    return { compareSet }
  }),
  clearCompare: () => set({ compareSet: new Set() }),

  favsPanelOpen: false,
  setFavsPanelOpen: (favsPanelOpen) => set({ favsPanelOpen }),

  lassoPolygon: null,
  setLassoPolygon: (lassoPolygon) => set({ lassoPolygon }),

  toast: '',
  showToast: (msg) => {
    set({ toast: msg })
    setTimeout(() => set({ toast: '' }), 2500)
  },

  geoPosition: null,
  setGeoPosition: (geoPosition) => set({ geoPosition }),
  nearbyRadius: 5000,
  setNearbyRadius: (nearbyRadius) => set({ nearbyRadius }),
}))
