'use client'

import { useState, useRef, RefObject } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'

interface Suggestion {
  display_name: string
  lat: string
  lon: string
}

interface Props {
  mapRef: RefObject<MapLibreMap | null>
}

export default function SearchBar({ mapRef }: Props) {
  const [value, setValue] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(-1)
  const timer = useRef<NodeJS.Timeout | undefined>(undefined)

  async function onInput(val: string) {
    setValue(val)
    setSelectedIdx(-1)
    clearTimeout(timer.current)
    if (val.length < 3) { setSuggestions([]); setOpen(false); return }

    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5&countrycodes=fr`,
          { headers: { 'Accept-Language': 'fr' } }
        )
        const data: Suggestion[] = await res.json()
        setSuggestions(data)
        setOpen(data.length > 0)
      } finally {
        setLoading(false)
      }
    }, 350)
  }

  function selectSuggestion(s: Suggestion) {
    setValue(s.display_name.split(',').slice(0, 2).join(','))
    setOpen(false)
    setSuggestions([])
    mapRef.current?.flyTo({ center: [parseFloat(s.lon), parseFloat(s.lat)], zoom: 14, speed: 1.3 })
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) return
    if (e.key === 'ArrowDown') { setSelectedIdx(i => Math.min(i + 1, suggestions.length - 1)); e.preventDefault() }
    else if (e.key === 'ArrowUp') { setSelectedIdx(i => Math.max(i - 1, 0)); e.preventDefault() }
    else if (e.key === 'Enter' && selectedIdx >= 0) selectSuggestion(suggestions[selectedIdx])
    else if (e.key === 'Escape') setOpen(false)
  }

  function clear() {
    setValue('')
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[380px] z-20">
      <div className={`flex items-center bg-white rounded-xl shadow-lg border-[1.5px] overflow-hidden transition-colors ${open ? 'border-primary' : 'border-transparent'}`}>
        <span className="pl-3 text-navy/35 text-sm flex-shrink-0">🔍</span>
        <input
          type="text" value={value}
          onChange={e => onInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Rechercher une adresse, une ville…"
          className="flex-1 py-2.5 px-2 text-sm text-navy placeholder-navy/35 border-none outline-none bg-transparent"
          autoComplete="off"
        />
        {loading && <span className="pr-3 text-xs text-navy/30 animate-spin">⟳</span>}
        {value && !loading && (
          <button onClick={clear} className="pr-3 text-navy/30 hover:text-navy text-sm">✕</button>
        )}
      </div>
      {open && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-white rounded-xl shadow-xl border border-navy/10 overflow-hidden z-50">
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => selectSuggestion(s)}
              className={`w-full text-left px-3 py-2.5 text-sm border-b border-navy/08 last:border-b-0 transition-colors flex items-start gap-2 ${selectedIdx === i ? 'bg-navy/05' : 'hover:bg-navy/03'}`}>
              <span className="mt-0.5 flex-shrink-0 text-navy/40">📍</span>
              <div>
                <div className="font-medium text-navy text-xs">{s.display_name.split(',')[0]}</div>
                <div className="text-[11px] text-navy/45 mt-0.5">{s.display_name.split(',').slice(1, 3).join(',')}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}



