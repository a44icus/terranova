'use client'

import { useEffect, useRef, useState } from 'react'
import { MAP_STYLES } from '@/lib/mapStyles'

interface Suggestion {
  display_name: string
  lat: string
  lon: string
  address?: {
    house_number?: string
    road?: string
    city?: string
    town?: string
    village?: string
    postcode?: string
  }
}

interface Fields {
  adresse?: string
  ville?: string
  code_postal?: string
  lat?: number
  lng?: number
}

interface Props {
  adresse: string
  ville: string
  codePostal: string
  lat: number
  lng: number
  onChange: (fields: Fields) => void
}

export default function LocationPicker({ adresse, ville, codePostal, lat, lng, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  const [inputValue, setInputValue] = useState(adresse)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSugg, setShowSugg] = useState(false)
  const [loading, setLoading] = useState(false)
  const timer = useRef<NodeJS.Timeout | undefined>(undefined)

  // ── Init MapLibre ──────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    import('maplibre-gl').then(({ default: mgl }) => {
      const hasPos = lat !== 0 && lng !== 0
      const map = new mgl.Map({
        container: containerRef.current!,
        style: MAP_STYLES.street as any,
        center: hasPos ? [lng, lat] : [2.3522, 46.8],
        zoom: hasPos ? 15 : 5,
        attributionControl: false,
      })
      mapRef.current = map

      // Marker draggable indigo
      const el = document.createElement('div')
      el.style.cssText = `
        width:28px;height:34px;cursor:grab;
        background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 34'%3E%3Cellipse cx='14' cy='31' rx='6' ry='2.5' fill='rgba(0,0,0,0.18)'/%3E%3Cpath d='M14 2C8.477 2 4 6.477 4 12c0 7.5 10 20 10 20s10-12.5 10-20c0-5.523-4.477-10-10-10z' fill='%234F46E5'/%3E%3Ccircle cx='14' cy='12' r='4' fill='white'/%3E%3C/svg%3E") center/contain no-repeat;
      `
      const marker = new mgl.Marker({ element: el, draggable: true, anchor: 'bottom' })

      if (hasPos) marker.setLngLat([lng, lat]).addTo(map)
      markerRef.current = marker

      marker.on('dragend', () => {
        const ll = marker.getLngLat()
        onChange({ lat: ll.lat, lng: ll.lng })
      })

      map.on('click', e => {
        marker.setLngLat([e.lngLat.lng, e.lngLat.lat]).addTo(map)
        onChange({ lat: e.lngLat.lat, lng: e.lngLat.lng })
      })
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // ── Sync marker depuis props ───────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || lat === 0) return
    markerRef.current.setLngLat([lng, lat]).addTo(mapRef.current)
    mapRef.current.flyTo({ center: [lng, lat], zoom: 15, speed: 1.4, essential: true })
  }, [lat, lng])

  // ── Autocomplete ───────────────────────────────────────────
  async function handleInput(val: string) {
    setInputValue(val)
    onChange({ adresse: val })
    clearTimeout(timer.current)
    if (val.length < 4) { setSuggestions([]); setShowSugg(false); return }

    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val + ', France')}&limit=5&countrycodes=fr&addressdetails=1`,
          { headers: { 'Accept-Language': 'fr' } }
        )
        const data: Suggestion[] = await res.json()
        setSuggestions(data)
        setShowSugg(data.length > 0)
      } finally {
        setLoading(false)
      }
    }, 350)
  }

  function selectSuggestion(s: Suggestion) {
    const a = s.address ?? {}
    const street = [a.house_number, a.road].filter(Boolean).join(' ')
    const city = a.city || a.town || a.village || ''
    const cp = (a.postcode ?? '').slice(0, 5)
    const displayAdresse = street || s.display_name.split(',')[0]

    setInputValue(displayAdresse)
    setSuggestions([])
    setShowSugg(false)
    onChange({ adresse: displayAdresse, ville: city, code_postal: cp, lat: parseFloat(s.lat), lng: parseFloat(s.lon) })
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Adresse avec autocomplete */}
      <div className="relative">
        <label className="block text-xs font-medium text-navy/60 mb-2">Adresse</label>
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={e => handleInput(e.target.value)}
            onBlur={() => setTimeout(() => setShowSugg(false), 180)}
            onFocus={() => suggestions.length > 0 && setShowSugg(true)}
            placeholder="12 rue de la Paix"
            autoComplete="off"
            className="w-full border border-navy/15 rounded-lg px-4 py-3 pr-10 text-sm focus:outline-none focus:border-primary transition-colors"
          />
          {loading
            ? <span className="absolute right-3 top-1/2 -translate-y-1/2 text-navy/30 text-base animate-spin">⟳</span>
            : <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
          }
        </div>

        {showSugg && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-navy/10 rounded-xl shadow-xl overflow-hidden">
            {suggestions.map((s, i) => (
              <button key={i} type="button" onMouseDown={() => selectSuggestion(s)}
                className="w-full text-left px-4 py-2.5 hover:bg-navy/04 border-b border-navy/06 last:border-b-0 flex items-start gap-2.5 transition-colors">
                <span className="text-navy/35 flex-shrink-0 mt-0.5">📍</span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-navy truncate">
                    {s.display_name.split(',').slice(0, 2).join(', ')}
                  </div>
                  <div className="text-[11px] text-navy/40 truncate">
                    {s.display_name.split(',').slice(2, 4).join(', ')}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Ville + CP */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-navy/60 mb-2">Ville *</label>
          <input type="text" value={ville}
            onChange={e => onChange({ ville: e.target.value })}
            placeholder="Paris"
            className="w-full border border-navy/15 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors" />
        </div>
        <div>
          <label className="block text-xs font-medium text-navy/60 mb-2">Code postal *</label>
          <input type="text" value={codePostal}
            onChange={e => onChange({ code_postal: e.target.value })}
            placeholder="75001" maxLength={5}
            className="w-full border border-navy/15 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors" />
        </div>
      </div>

      {/* Carte */}
      <div className="rounded-xl overflow-hidden border border-navy/10 relative" style={{ height: 280 }}>
        <div ref={containerRef} className="w-full h-full" />

        {/* Hint quand pas encore de position */}
        {lat === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm border border-navy/08 text-xs text-navy/45 text-center">
              Saisissez une adresse ci-dessus<br />ou cliquez sur la carte
            </div>
          </div>
        )}

        {/* Hint drag */}
        {lat !== 0 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] text-navy/40 border border-navy/08 shadow-sm whitespace-nowrap">
              Glissez le marqueur pour ajuster
            </div>
          </div>
        )}
      </div>

      {/* Confirmation coords */}
      {lat !== 0 && (
        <p className="text-xs text-emerald-600 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
          Position confirmée · {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      )}
    </div>
  )
}
