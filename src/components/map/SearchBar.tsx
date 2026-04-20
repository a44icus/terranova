'use client'

import { useState, useRef } from 'react'
import { getMap } from '@/components/map/MapCanvas'

interface Suggestion {
  display_name: string
  lat: string
  lon: string
}

export default function SearchBar() {
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
    getMap()?.flyTo({ center: [parseFloat(s.lon), parseFloat(s.lat)], zoom: 14, speed: 1.3 })
  }

  async function search(query: string) {
    if (query.length < 2) return
    setLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=fr`,
        { headers: { 'Accept-Language': 'fr' } }
      )
      const data: Suggestion[] = await res.json()
      if (data.length > 0) {
        selectSuggestion(data[0])
      }
    } finally {
      setLoading(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { setSelectedIdx(i => Math.min(i + 1, suggestions.length - 1)); e.preventDefault(); return }
    if (e.key === 'ArrowUp')   { setSelectedIdx(i => Math.max(i - 1, 0)); e.preventDefault(); return }
    if (e.key === 'Escape')    { setOpen(false); return }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIdx >= 0 && suggestions[selectedIdx]) {
        // Suggestion sélectionnée au clavier → l'utiliser
        selectSuggestion(suggestions[selectedIdx])
      } else if (suggestions.length > 0) {
        // Suggestions disponibles mais aucune sélectionnée → prendre la première
        selectSuggestion(suggestions[0])
      } else {
        // Pas encore de suggestions → lancer la recherche directement
        search(value)
      }
    }
  }

  function clear() {
    setValue('')
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div className="relative flex-shrink-0 z-30 border-b border-navy/10 bg-white">
      <div className={`flex items-center transition-colors ${open ? 'ring-1 ring-inset ring-primary' : ''}`}>
        <button
          onClick={() => suggestions.length > 0 ? selectSuggestion(suggestions[0]) : search(value)}
          className="pl-4 pr-1 text-navy/35 hover:text-primary transition-colors flex-shrink-0"
          tabIndex={-1}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
          </svg>
        </button>
        <input
          type="text"
          value={value}
          onChange={e => onInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Rechercher une adresse, une ville…"
          className="flex-1 h-11 px-3 text-sm text-navy placeholder-navy/35 border-none outline-none bg-transparent"
          autoComplete="off"
        />
        {loading && (
          <span className="pr-4 text-xs text-navy/30 animate-spin">⟳</span>
        )}
        {value && !loading && (
          <button onClick={clear} className="pr-4 text-navy/30 hover:text-navy text-sm">✕</button>
        )}
      </div>

      {/* Suggestions */}
      {open && (
        <div className="absolute top-full left-0 right-0 bg-white shadow-xl border-b border-x border-navy/10 overflow-hidden z-50">
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => selectSuggestion(s)}
              className={`w-full text-left px-4 py-2.5 text-sm border-b border-navy/08 last:border-b-0 transition-colors flex items-start gap-2 ${selectedIdx === i ? 'bg-navy/05' : 'hover:bg-navy/03'}`}>
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
