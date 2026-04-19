'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMapStore } from '@/store/mapStore'
import { formatPrix } from '@/lib/geo'

interface Props {
  onClose: () => void
}

export default function FavoritesPanel({ onClose }: Props) {
  const { biens, favorites, toggleFavorite, setActiveBienId } = useMapStore()
  const favBiens = biens.filter(b => favorites.has(b.id))

  return (
    <div className="fixed inset-0 bg-surface z-[160] overflow-y-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b border-navy/10 bg-surface sticky top-0 z-10">
        <h2 className="font-serif text-2xl text-navy">Mes favoris</h2>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-navy/07 flex items-center justify-center text-sm hover:bg-navy/15 transition-colors">✕</button>
      </div>

      {favBiens.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-navy/40">
          <div className="text-5xl mb-3">♡</div>
          <p className="text-sm">Aucun bien en favori pour l'instant</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6 max-w-5xl mx-auto">
          {favBiens.map(b => (
            <div key={b.id} className="bg-white rounded-2xl overflow-hidden border border-navy/10 hover:border-primary transition-all hover:-translate-y-1">
              <div className="h-40 bg-gradient-to-br from-[#e0ddd8] to-[#c8c4bc] relative overflow-hidden cursor-pointer"
                onClick={() => { onClose(); setActiveBienId(b.id) }}>
                {b.photo_url
                  ? <Image src={b.photo_url} alt={b.titre} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                  : <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🏠</div>
                }
                <span className={`absolute top-2 left-2 text-white text-[10px] font-semibold px-2 py-0.5 rounded ${b.type === 'vente' ? 'bg-primary' : 'bg-location'}`}>
                  {b.type === 'vente' ? 'Vente' : 'Location'}
                </span>
                <button onClick={e => { e.stopPropagation(); toggleFavorite(b.id) }}
                  className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-[#e05a5a] text-sm hover:scale-110 transition-transform">
                  ♥
                </button>
              </div>
              <div className="p-3">
                <div className="font-serif text-base">{formatPrix(b.prix, b.type)}</div>
                <div className="text-xs font-medium mt-0.5 truncate">{b.titre}</div>
                <div className="text-[11px] text-navy/45 mt-0.5">📍 {b.ville} · {b.code_postal}</div>
                <div className="flex gap-2 mt-2 text-[10px] text-navy/50 items-center">
                  {b.surface && <span>{b.surface} m²</span>}
                  {(b.pieces ?? 0) > 0 && <span>🛏 {b.pieces} p.</span>}
                  <Link href={`/annonce/${b.id}`} onClick={e => e.stopPropagation()}
                    className="ml-auto text-primary hover:underline font-medium">
                    Voir →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}



