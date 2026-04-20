'use client'

import { useState, useRef, RefObject, useMemo } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import type { BienPublic } from '@/lib/types'
import { formatPrix } from '@/lib/geo'

type RouteMode = 'foot' | 'bike' | 'car'
const OSRM: Record<RouteMode, string> = {
  foot: 'https://routing.openstreetmap.de/routed-foot/route/v1/foot',
  bike: 'https://routing.openstreetmap.de/routed-bike/route/v1/bike',
  car:  'https://routing.openstreetmap.de/routed-car/route/v1/driving',
}
const ROUTE_COLORS: Record<RouteMode, string> = { foot: '#27ae60', bike: '#e67e22', car: '#2980b9' }

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function fmtDist(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

interface Props {
  origin: { lng: number; lat: number } | null
  mapRef: RefObject<MapLibreMap | null>
  picking: boolean
  onPlaceDest: (lng: number, lat: number) => void
  onCancel: () => void
  biens?: BienPublic[]
  originBienId?: string
}

interface Suggestion { display_name: string; lat: string; lon: string }

export default function RoutePanel({ origin, mapRef, picking, onPlaceDest, onCancel, biens = [], originBienId }: Props) {
  const [mode, setMode] = useState<RouteMode>('foot')
  const [dist, setDist] = useState('')
  const [dur, setDur] = useState('')
  const [status, setStatus] = useState('Clique sur la carte ou saisis une adresse')
  const [destValue, setDestValue] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [sugOpen, setSugOpen] = useState(false)
  const [activeBienSugg, setActiveBienSugg] = useState<string | null>(null)
  const timer = useRef<NodeJS.Timeout | undefined>(undefined)
  const currentDest = useRef<{lng: number; lat: number} | null>(null)

  // ── Biens proches ──────────────────────────────────────────
  const nearbyBiens = useMemo(() => {
    if (!origin || biens.length === 0) return []
    return biens
      .filter(b => b.id !== originBienId && b.lat && b.lng)
      .map(b => ({ b, km: haversineKm(origin.lat, origin.lng, b.lat, b.lng) }))
      .sort((a, z) => a.km - z.km)
      .slice(0, 5)
  }, [origin, biens, originBienId])

  async function calcRoute(destLng: number, destLat: number, routeMode = mode) {
    if (!origin) return
    setStatus('Calcul en cours…')
    setDist(''); setDur('')
    try {
      const url = `${OSRM[routeMode]}/${origin.lng},${origin.lat};${destLng},${destLat}?overview=full&geometries=geojson`
      const res = await fetch(url)
      const data = await res.json()
      if (!data.routes?.[0]) { setStatus('Itinéraire introuvable'); return }
      const route = data.routes[0]
      const d = route.distance as number, t = route.duration as number
      setDist(d >= 1000 ? `${(d/1000).toFixed(1)} km` : `${Math.round(d)} m`)
      setDur(t >= 3600 ? `${Math.floor(t/3600)}h${Math.floor((t%3600)/60)}min` : `${Math.round(t/60)} min`)
      setStatus('')
      const map = mapRef.current
      if (!map) return
      try { if (map.getLayer('route-layer')) map.removeLayer('route-layer') } catch {}
      try { if (map.getSource('route-source')) map.removeSource('route-source') } catch {}
      map.addSource('route-source', { type: 'geojson', data: route.geometry })
      map.addLayer({ id: 'route-layer', type: 'line', source: 'route-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': ROUTE_COLORS[routeMode], 'line-width': 5, 'line-opacity': 0.85 }
      })
      const coords = route.geometry.coordinates
      const lngs = coords.map((c: number[]) => c[0])
      const lats = coords.map((c: number[]) => c[1])
      map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 80, duration: 800 })
    } catch { setStatus('Erreur de connexion') }
  }

  // Exposer pour le clic carte
  ;(typeof window !== 'undefined') && ((window as any).__routeCalc = (lng: number, lat: number) => {
    currentDest.current = { lng, lat }
    onPlaceDest(lng, lat)
    calcRoute(lng, lat)
  })

  function changeMode(m: RouteMode) {
    setMode(m)
    if (currentDest.current) calcRoute(currentDest.current.lng, currentDest.current.lat, m)
  }

  async function onDestInput(val: string) {
    setDestValue(val)
    clearTimeout(timer.current)
    if (val.length < 3) { setSuggestions([]); setSugOpen(false); return }
    timer.current = setTimeout(async () => {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5&countrycodes=fr`, { headers: { 'Accept-Language': 'fr' } })
      const data: Suggestion[] = await res.json()
      setSuggestions(data); setSugOpen(data.length > 0)
    }, 300)
  }

  function selectDest(s: Suggestion) {
    const lng = parseFloat(s.lon), lat = parseFloat(s.lat)
    setDestValue(s.display_name.split(',').slice(0,2).join(','))
    setSugOpen(false)
    setActiveBienSugg(null)
    currentDest.current = { lng, lat }
    onPlaceDest(lng, lat)
    calcRoute(lng, lat)
  }

  function selectBienDest(bien: BienPublic) {
    setActiveBienSugg(bien.id)
    setDestValue('')
    setSugOpen(false)
    currentDest.current = { lng: bien.lng, lat: bien.lat }
    onPlaceDest(bien.lng, bien.lat)
    calcRoute(bien.lng, bien.lat)
  }

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-xl z-25 border border-navy/10 min-w-[320px] max-w-[360px] font-['DM_Sans'] overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        <div className="text-[11px] font-medium text-navy/40 uppercase tracking-wider mb-3">Itinéraire depuis ce bien</div>

        {/* Modes */}
        <div className="flex gap-2 mb-3">
          {(['foot','bike','car'] as RouteMode[]).map(m => (
            <button key={m} onClick={() => changeMode(m)}
              className={`flex-1 py-2 rounded-lg border text-lg transition-all ${mode === m ? 'bg-navy border-navy' : 'bg-white border-navy/15 hover:border-navy/30'}`}>
              {m === 'foot' ? '🚶' : m === 'bike' ? '🚴' : '🚗'}
            </button>
          ))}
        </div>

        {/* Recherche adresse */}
        <div className="relative mb-2">
          <div className="flex items-center border border-navy/15 rounded-lg px-3 py-2 gap-2 focus-within:border-primary transition-colors">
            <span className="text-navy/35 text-sm">🔍</span>
            <input type="text" value={destValue} onChange={e => onDestInput(e.target.value)}
              onFocus={() => { setActiveBienSugg(null) }}
              placeholder="Saisir une adresse…"
              className="flex-1 text-xs outline-none bg-transparent text-navy placeholder-navy/35" />
            {destValue && <button onClick={() => { setDestValue(''); setSugOpen(false) }} className="text-navy/30 text-xs">✕</button>}
          </div>
          {sugOpen && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-navy/10 rounded-lg shadow-lg z-50 overflow-hidden">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => selectDest(s)}
                  className="w-full text-left px-3 py-2 text-xs border-b border-navy/08 last:border-b-0 hover:bg-navy/04 truncate">
                  📍 {s.display_name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status / résultat */}
        {status && !activeBienSugg && <div className="text-center text-xs text-navy/50 py-1">{status}</div>}
        {(dist || dur) && (
          <div className="flex justify-center gap-6 py-2">
            <div className="text-center">
              <div className="font-serif text-xl text-navy">{dist}</div>
              <div className="text-[11px] text-navy/45">distance</div>
            </div>
            <div className="text-center">
              <div className="font-serif text-xl text-navy">{dur}</div>
              <div className="text-[11px] text-navy/45">durée</div>
            </div>
          </div>
        )}

        <button onClick={onCancel}
          className="w-full mt-2 border border-navy/15 rounded-lg py-1.5 text-xs text-navy/50 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all">
          ✕ Annuler l'itinéraire
        </button>
      </div>

      {/* Biens proches */}
      {nearbyBiens.length > 0 && (
        <div className="border-t border-navy/08">
          <div className="px-4 pt-2.5 pb-1 text-[10px] font-semibold text-navy/35 uppercase tracking-wider">
            Biens proches dans la sélection
          </div>
          {nearbyBiens.map(({ b, km }) => {
            const isActive = activeBienSugg === b.id
            return (
              <button
                key={b.id}
                onClick={() => selectBienDest(b)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-b border-navy/06 last:border-b-0 ${isActive ? 'bg-primary/08' : 'hover:bg-navy/04'}`}
              >
                {/* Distance badge */}
                <div style={{ flexShrink: 0, width: 44, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: isActive ? '#4F46E5' : 'rgba(26,26,24,0.55)', lineHeight: 1 }}>
                    {fmtDist(km)}
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(26,26,24,0.3)', marginTop: 1 }}>
                    {b.ville}
                  </div>
                </div>

                {/* Infos bien */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: isActive ? '#4F46E5' : 'rgba(26,26,24,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.titre}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(26,26,24,0.4)', marginTop: 1 }}>
                    {b.surface ? `${b.surface} m²` : ''}{b.surface && b.pieces ? ' · ' : ''}{b.pieces ? `${b.pieces} p.` : ''}
                  </div>
                </div>

                {/* Prix */}
                <div style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: isActive ? '#4F46E5' : 'rgba(26,26,24,0.65)', textAlign: 'right' }}>
                  {formatPrix(b.prix, b.type)}
                </div>

                {/* Chevron / check */}
                {isActive
                  ? <svg width="14" height="14" viewBox="0 0 20 20" fill="#4F46E5"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(26,26,24,0.25)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                }
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}



