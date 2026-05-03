'use client'

import { useState, useRef } from 'react'
import { getMap } from '@/components/map/MapCanvas'

interface Suggestion {
  display_name: string
  lat: string
  lon: string
}

export default function MapSearchBarInline() {
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
    setValue(s.display_name.split(',').slice(0, 2).join(', '))
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
      if (data.length > 0) selectSuggestion(data[0])
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
      if (selectedIdx >= 0 && suggestions[selectedIdx]) selectSuggestion(suggestions[selectedIdx])
      else if (suggestions.length > 0) selectSuggestion(suggestions[0])
      else search(value)
    }
  }

  function clear() {
    setValue('')
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div className="relative">
      {/* Input inline */}
      <div className="flex items-center gap-1.5 px-3">
        <div className="w-px h-4 bg-white/15 flex-shrink-0" />
        <button
          tabIndex={-1}
          onClick={() => suggestions.length > 0 ? selectSuggestion(suggestions[0]) : search(value)}
          className="text-white/40 hover:text-white/80 transition-colors flex-shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
          </svg>
        </button>
        <input
          type="text"
          value={value}
          onChange={e => onInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Adresse, ville…"
          autoComplete="off"
          className="w-40 text-sm text-white placeholder:text-white/35 bg-transparent outline-none"
        />
        {loading && (
          <span className="text-white/30 text-xs animate-spin">⟳</span>
        )}
        {value && !loading && (
          <button onClick={clear} className="text-white/30 hover:text-white/70 text-xs leading-none">✕</button>
        )}
      </div>

      {/* Dropdown suggestions */}
      {open && (
        <div className="absolute top-[calc(100%+10px)] left-0 w-72 bg-[#1E293B] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => selectSuggestion(s)}
              className={`w-full text-left px-4 py-2.5 flex items-start gap-2.5 transition-colors border-b border-white/05 last:border-b-0 ${
                selectedIdx === i ? 'bg-white/10' : 'hover:bg-white/07'
              }`}>
              <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <div className="min-w-0">
                <div className="text-xs font-medium text-white truncate">{s.display_name.split(',')[0]}</div>
                <div className="text-[11px] text-white/40 truncate mt-0.5">{s.display_name.split(',').slice(1, 3).join(',')}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
