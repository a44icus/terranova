'use client'

import { useMapStore } from '@/store/mapStore'
import { haversineKm, formatDist, formatRadius, formatPrix } from '@/lib/geo'
import type { BienPublic } from '@/lib/types'

const CAT_ICON: Record<string, string> = {
  appartement: '🏢', maison: '🏠', bureau: '🏗️', terrain: '🌱', parking: '🅿️', local: '🏪',
}

interface Props {
  biens: BienPublic[]
  position: { lat: number; lng: number; acc: number }
  onSelectBien: (id: string) => void
  onClose: () => void
}

export default function NearbyPanel({ biens, position, onSelectBien, onClose }: Props) {
  const { nearbyRadius, setNearbyRadius } = useMapStore()

  const nearby = biens
    .map(b => ({ ...b, distKm: haversineKm(position.lat, position.lng, b.lat, b.lng) }))
    .filter(b => b.distKm * 1000 <= nearbyRadius)
    .sort((a, b) => a.distKm - b.distKm)

  return (
    <div className="absolute top-4 left-4 w-[268px] bg-white rounded-2xl shadow-xl border border-navy/10 z-20 overflow-hidden font-['DM_Sans'] animate-slide-down">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 pt-3 pb-2 border-b border-navy/10">
        <span className="text-[11px] font-medium text-navy/45 uppercase tracking-wider">📍 À proximité</span>
        <button onClick={onClose} className="w-5 h-5 rounded-full bg-navy/07 flex items-center justify-center text-[11px] hover:bg-navy/15 transition-colors">✕</button>
      </div>

      {/* Rayon */}
      <div className="flex items-center gap-2 px-3.5 py-2 border-b border-navy/10">
        <span className="text-[11px] text-navy/50 whitespace-nowrap">Rayon</span>
        <input type="range" min="500" max="20000" step="500" value={nearbyRadius}
          onChange={e => setNearbyRadius(parseInt(e.target.value))}
          className="flex-1 accent-[#2980b9]" />
        <span className="text-[11px] font-semibold text-[#2980b9] whitespace-nowrap">{formatRadius(nearbyRadius)}</span>
      </div>

      {/* Liste */}
      <div className="max-h-[310px] overflow-y-auto">
        {nearby.length === 0 ? (
          <div className="py-6 text-center text-xs text-navy/38">
            Aucun bien dans un rayon de {formatRadius(nearbyRadius)}
          </div>
        ) : (
          nearby.map(b => (
            <button key={b.id} onClick={() => onSelectBien(b.id)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 border-b border-navy/08 last:border-b-0 hover:bg-navy/03 transition-colors text-left">
              <span className="text-lg w-7 text-center flex-shrink-0">{CAT_ICON[b.categorie] ?? '🏠'}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-navy truncate">{b.titre}</div>
                <div className="text-[10px] text-navy/45 mt-0.5">{formatPrix(b.prix, b.type)} · {b.surface} m²</div>
              </div>
              <span className="text-[11px] font-semibold text-[#2980b9] bg-[#2980b9]/10 px-2 py-0.5 rounded-full flex-shrink-0">
                {formatDist(b.distKm)}
              </span>
            </button>
          ))
        )}
      </div>

      <style>{`
        @keyframes slide-down { from { transform: translateY(-12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-down { animation: slide-down 0.28s cubic-bezier(.34,1.2,.64,1); }
      `}</style>
    </div>
  )
}



