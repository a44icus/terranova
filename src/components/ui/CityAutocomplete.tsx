'use client'

import { useEffect, useRef, useState } from 'react'

export interface CityResult {
  label: string        // "Paris 1er Arrondissement (75001)"
  ville: string        // "Paris"
  codePostal: string   // "75001"
  codeInsee: string    // "75056"
  lat: number
  lng: number
}

interface Props {
  value: string
  onChange: (result: CityResult) => void
  onTextChange?: (text: string) => void   // saisie libre sans suggestion sélectionnée
  placeholder?: string
  className?: string
}

interface BanFeature {
  properties: {
    label: string
    name: string
    city: string
    postcode: string
    citycode: string
    type: string
    score: number
    x: number
    y: number
  }
  geometry: {
    coordinates: [number, number]
  }
}

export default function CityAutocomplete({
  value,
  onChange,
  onTextChange,
  placeholder = 'Paris, Lyon, Bordeaux…',
  className = '',
}: Props) {
  const [inputValue, setInputValue] = useState(value)
  const [suggestions, setSuggestions] = useState<BanFeature[]>([])
  const [showSugg, setShowSugg] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const timer = useRef<NodeJS.Timeout | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync external value
  useEffect(() => { setInputValue(value) }, [value])

  async function handleInput(val: string) {
    setInputValue(val)
    setActiveIndex(-1)
    clearTimeout(timer.current)
    // Propagation immédiate de la saisie libre (fallback sans autocomplétion)
    onTextChange?.(val)

    if (val.length < 2) {
      setSuggestions([])
      setShowSugg(false)
      return
    }

    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        // BAN — Base Adresse Nationale, type=municipality pour villes uniquement
        const res = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(val)}&type=municipality&limit=6&autocomplete=1`,
          { headers: { 'Accept': 'application/json' } }
        )
        if (!res.ok) return
        const data = await res.json()
        const features: BanFeature[] = data.features ?? []
        setSuggestions(features)
        setShowSugg(features.length > 0)
      } catch {
        // réseau indisponible — on laisse l'utilisateur taper librement
      } finally {
        setLoading(false)
      }
    }, 250)
  }

  function selectFeature(f: BanFeature) {
    const p = f.properties
    const result: CityResult = {
      label:      p.label,
      ville:      p.city || p.name,
      codePostal: p.postcode ?? '',
      codeInsee:  p.citycode ?? '',
      lat:        f.geometry.coordinates[1],
      lng:        f.geometry.coordinates[0],
    }
    setInputValue(result.ville)
    setSuggestions([])
    setShowSugg(false)
    setActiveIndex(-1)
    onChange(result)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSugg || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      selectFeature(suggestions[activeIndex])
    } else if (e.key === 'Escape') {
      setShowSugg(false)
      setActiveIndex(-1)
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSugg(true)}
          onBlur={() => setTimeout(() => { setShowSugg(false); setActiveIndex(-1) }, 180)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className={`w-full border border-[#0F172A]/15 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-[#4F46E5] transition-colors ${className}`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {loading
            ? <svg className="w-4 h-4 text-[#0F172A]/30 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10"/></svg>
            : <svg className="w-4 h-4 text-[#0F172A]/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          }
        </span>
      </div>

      {showSugg && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-[#0F172A]/10 rounded-xl shadow-xl overflow-hidden">
          {suggestions.map((f, i) => {
            const p = f.properties
            const isActive = i === activeIndex
            return (
              <button
                key={`${p.citycode}-${i}`}
                type="button"
                onMouseDown={() => selectFeature(f)}
                onMouseEnter={() => setActiveIndex(i)}
                className="w-full text-left px-4 py-2.5 flex items-center gap-3 border-b border-[#0F172A]/05 last:border-b-0 transition-colors"
                style={{ background: isActive ? 'rgba(79,70,229,0.06)' : 'white' }}
              >
                <svg className="w-3.5 h-3.5 text-[#4F46E5]/50 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                </svg>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#0F172A] truncate">{p.city || p.name}</div>
                  <div className="text-xs text-[#0F172A]/40 truncate">{p.postcode} · {p.label}</div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
