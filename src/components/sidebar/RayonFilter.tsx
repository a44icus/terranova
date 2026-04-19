'use client'
import { useState } from 'react'
import { useMapStore } from '@/store/mapStore'

const RAYONS = [
  { label: 'Désactivé', value: 0 },
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '20 km', value: 20 },
  { label: '50 km', value: 50 },
]

export default function RayonFilter() {
  const { filtres, setFiltreRayonKm, setFiltreRayonCenter, setFiltreRayonAdresse } = useMapStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function geocode() {
    if (!input.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input + ', France')}&limit=1&countrycodes=fr`)
      const data = await res.json()
      if (data[0]) {
        setFiltreRayonCenter(parseFloat(data[0].lat), parseFloat(data[0].lon))
        setFiltreRayonAdresse(data[0].display_name.split(',').slice(0, 2).join(','))
        if (filtres.rayonKm === 0) setFiltreRayonKm(10) // default 10km
      } else {
        setError('Adresse non trouvée')
      }
    } catch {
      setError('Erreur de géocodage')
    } finally {
      setLoading(false)
    }
  }

  function clear() {
    setFiltreRayonKm(0)
    setFiltreRayonCenter(null, null)
    setFiltreRayonAdresse('')
    setInput('')
    setError('')
  }

  const isActive = filtres.rayonKm > 0 && filtres.rayonLat != null

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={isActive ? filtres.rayonAdresse : input}
          onChange={e => { setInput(e.target.value); if (isActive) clear() }}
          onKeyDown={e => e.key === 'Enter' && geocode()}
          placeholder="Ville, adresse…"
          className="flex-1 border border-[#0F172A]/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#4F46E5] transition-colors"
          readOnly={isActive}
        />
        {isActive ? (
          <button onClick={clear} className="text-xs text-[#0F172A]/40 hover:text-red-500 px-2">✕</button>
        ) : (
          <button onClick={geocode} disabled={loading} className="text-xs bg-[#0F172A] text-white px-3 py-1.5 rounded-lg hover:bg-[#4F46E5] transition-colors disabled:opacity-40">
            {loading ? '…' : '→'}
          </button>
        )}
      </div>
      {error && <p className="text-[10px] text-red-500 mb-2">{error}</p>}
      {/* Radius selector — only shown when center is set */}
      {filtres.rayonLat != null && (
        <div className="flex flex-wrap gap-1.5">
          {RAYONS.filter(r => r.value > 0).map(r => (
            <button
              key={r.value}
              onClick={() => setFiltreRayonKm(r.value)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                filtres.rayonKm === r.value
                  ? 'bg-[#4F46E5] text-white border-[#4F46E5]'
                  : 'border-[#0F172A]/15 text-[#0F172A]/60 hover:border-[#4F46E5]/40'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}



