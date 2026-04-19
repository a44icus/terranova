'use client'

import { useEffect, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import type { BienPublic } from '@/lib/types'
import Header from './Header'

interface Props {
  biens: BienPublic[]
  user: User | null
}

export default function MapPage({ biens, user }: Props) {
  return (
    <div id="app" className="flex flex-col h-screen">
      <Header user={user} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar biens={biens} />
        <MapContainer biens={biens} />
      </div>
    </div>
  )
}

function Sidebar({ biens }: { biens: BienPublic[] }) {
  return (
    <div className="w-[360px] flex-shrink-0 bg-surface border-r border-navy/10 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-navy/10">
        <p className="text-xs font-medium text-navy/45 uppercase tracking-widest">
          {biens.length} bien{biens.length > 1 ? 's' : ''} trouvé{biens.length > 1 ? 's' : ''}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {biens.length === 0 ? (
          <div className="text-center py-16 text-navy/40 text-sm">
            Aucun bien publié pour l'instant
          </div>
        ) : (
          biens.map(bien => (
            <BienCard key={bien.id} bien={bien} />
          ))
        )}
      </div>
    </div>
  )
}

function BienCard({ bien }: { bien: BienPublic }) {
  const color = bien.type === 'vente' ? 'bg-primary' : 'bg-location'
  const label = bien.type === 'vente' ? 'Vente' : 'Location'
  const prix = bien.type === 'location'
    ? `${bien.prix.toLocaleString('fr-FR')} €/mois`
    : bien.prix >= 1000000
      ? `${(bien.prix / 1000000).toFixed(2).replace(/\.?0+$/, '')} M€`
      : `${bien.prix.toLocaleString('fr-FR')} €`

  return (
    <div className="bg-white rounded-xl mb-2 overflow-hidden cursor-pointer border-[1.5px] border-transparent hover:border-primary transition-all hover:-translate-y-px flex h-[108px]">
      {/* Image */}
      <div className="w-[108px] flex-shrink-0 bg-gradient-to-br from-[#e0ddd8] to-[#c8c4bc] relative overflow-hidden">
        {bien.photo_url ? (
          <img src={bien.photo_url} alt={bien.titre} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl opacity-30">🏠</div>
        )}
        <span className={`absolute top-1.5 left-1.5 ${color} text-white text-[10px] font-semibold px-1.5 py-0.5 rounded`}>
          {label}
        </span>
        {bien.pro && (
          <span className="absolute bottom-1.5 left-1.5 bg-navy/70 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">
            PRO
          </span>
        )}
      </div>
      {/* Contenu */}
      <div className="flex-1 min-w-0 p-2.5 flex flex-col justify-between">
        <div>
          <div className="font-serif text-base leading-tight truncate">{prix}</div>
          <div className="text-xs font-medium truncate mt-0.5">{bien.titre}</div>
          <div className="text-[11px] text-navy/45 truncate">{bien.ville} · {bien.code_postal}</div>
        </div>
        <div className="flex gap-2 text-[10px] text-navy/50">
          {bien.surface && <span>{bien.surface} m²</span>}
          {bien.pieces && bien.pieces > 0 && <span>{bien.pieces} p.</span>}
          {bien.sdb && bien.sdb > 0 && <span>{bien.sdb} sdb</span>}
          {bien.dpe && (
            <span className="ml-auto bg-green-600 text-white px-1.5 rounded font-bold text-[9px]">
              DPE {bien.dpe}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function MapContainer({ biens }: { biens: BienPublic[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    import('maplibre-gl').then(({ default: maplibregl }) => {
      const map = new maplibregl.Map({
        container: mapRef.current!,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [2.3522, 48.8566],
        zoom: 11,
      })

      mapInstanceRef.current = map

      map.on('load', () => {
        // Ajouter les markers
        biens.forEach(bien => {
          const color = bien.type === 'vente' ? '#4F46E5' : '#0891B2'
          const prix = bien.type === 'location'
            ? `${bien.prix.toLocaleString('fr-FR')}€/m`
            : bien.prix >= 1000000
              ? `${(bien.prix / 1000000).toFixed(1)}M€`
              : `${Math.round(bien.prix / 1000)}k€`

          const el = document.createElement('div')
          el.style.cssText = 'display:inline-flex;flex-direction:column;align-items:center;cursor:pointer;'
          el.innerHTML = `
            <div style="background:${color};color:white;padding:5px 11px;border-radius:20px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;white-space:nowrap;box-shadow:0 2px 12px rgba(0,0,0,0.25);border:2px solid white;">
              ${prix}
            </div>
            <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid white;margin-top:-1px;"></div>
          `

          new maplibregl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([bien.lng, bien.lat])
            .addTo(map)
        })
      })
    })

    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
    }
  }, [biens])

  return (
    <div className="flex-1 relative">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  )
}


