'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMapStore } from '@/store/mapStore'
import { formatPrix } from '@/lib/geo'
import type { BienPublic } from '@/lib/types'

const DPE_COLORS: Record<string, string> = {
  A: '#2E7D32', B: '#558B2F', C: '#9E9D24',
  D: '#F9A825', E: '#EF6C00', F: '#D84315', G: '#B71C1C',
}

const CAT_ICON: Record<string, string> = {
  appartement: '🏢', maison: '🏠', bureau: '🏗️',
  terrain: '🌱', parking: '🅿️', local: '🏪',
}

interface Props {
  bien: BienPublic
  grid?: boolean
}

export default function BienCard({ bien, grid = false }: Props) {
  const { activeBienId, setActiveBienId, favorites, toggleFavorite } = useMapStore()
  const isActive = activeBienId === bien.id
  const isFav = favorites.has(bien.id)
  const prix = formatPrix(bien.prix, bien.type)
  const typeColor = bien.type === 'vente' ? 'bg-primary' : 'bg-location'
  const icon = CAT_ICON[bien.categorie] ?? '🏠'

  if (grid) {
    return (
      <div
        onClick={() => setActiveBienId(isActive ? null : bien.id)}
        className={`bg-white rounded-xl overflow-hidden cursor-pointer border-[1.5px] transition-all hover:-translate-y-px ${
          isActive ? 'border-primary' : 'border-transparent hover:border-primary'
        }`}
        style={bien.coup_de_coeur ? { borderColor: '#F59E0B' } : undefined}
      >
        <div className="relative h-28 bg-gradient-to-br from-[#e0ddd8] to-[#c8c4bc] overflow-hidden">
          {bien.photo_url
            ? <Image src={bien.photo_url} alt={bien.titre} fill className="object-cover" sizes="200px" />
            : <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">{icon}</div>
          }
          <span className={`absolute top-1.5 left-1.5 ${typeColor} text-white text-[10px] font-semibold px-1.5 py-0.5 rounded`}>
            {bien.type === 'vente' ? 'Vente' : 'Location'}
          </span>
          {bien.coup_de_coeur && (
            <span className="absolute top-1.5 left-1.5 bg-amber-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded z-10">
              ⭐ Coup de cœur
            </span>
          )}
          <button
            onClick={e => { e.stopPropagation(); toggleFavorite(bien.id) }}
            className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center text-xs transition-colors"
            style={{ color: isFav ? '#e05a5a' : 'rgba(26,26,24,0.35)' }}
          >
            {isFav ? '♥' : '♡'}
          </button>
          {bien.vendeur_logo && (
            <div className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-md bg-white shadow-sm overflow-hidden flex items-center justify-center p-0.5 border border-white/60">
              <img src={bien.vendeur_logo} alt="" className="w-full h-full object-contain" />
            </div>
          )}
        </div>
        <div className="p-2.5">
          <div className="font-serif text-sm leading-tight truncate">{prix}</div>
          <div className="text-[11px] font-medium truncate mt-0.5">{bien.titre}</div>
          <div className="text-[10px] text-navy/45 truncate">{bien.ville}</div>
          <div className="flex gap-1.5 mt-1.5 text-[9px] text-navy/50 flex-wrap items-center">
            {bien.surface && <span>{bien.surface} m²</span>}
            {(bien.pieces ?? 0) > 0 && <span>{bien.pieces} p.</span>}
            {bien.dpe && (
              <span className="text-white font-bold px-1 rounded" style={{ background: DPE_COLORS[bien.dpe] }}>
                {bien.dpe}
              </span>
            )}
            <Link
              href={`/annonce/${bien.id}`}
              onClick={e => e.stopPropagation()}
              className="ml-auto text-primary hover:underline font-medium"
            >
              Voir →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={() => setActiveBienId(isActive ? null : bien.id)}
      className={`bg-white rounded-xl mb-2 overflow-hidden cursor-pointer border-[1.5px] transition-all hover:-translate-y-px flex h-[108px] ${
        isActive ? 'border-primary' : 'border-transparent hover:border-primary'
      }`}
      style={bien.coup_de_coeur ? { borderColor: '#F59E0B' } : undefined}
    >
      {/* Image */}
      <div className="w-[108px] flex-shrink-0 bg-gradient-to-br from-[#e0ddd8] to-[#c8c4bc] relative overflow-hidden">
        {bien.photo_url
          ? <Image src={bien.photo_url} alt={bien.titre} fill className="object-cover" sizes="108px" />
          : <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">{icon}</div>
        }
        <span className={`absolute top-1.5 left-1.5 ${typeColor} text-white text-[10px] font-semibold px-1.5 py-0.5 rounded`}>
          {bien.type === 'vente' ? 'Vente' : 'Location'}
        </span>
        {bien.coup_de_coeur && (
          <span className="absolute top-1.5 left-1.5 bg-amber-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded z-10">
            ⭐ Coup de cœur
          </span>
        )}
        {bien.pro && (
          <span className="absolute bottom-1.5 left-1.5 bg-navy/70 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">
            PRO
          </span>
        )}
        <button
          onClick={e => { e.stopPropagation(); toggleFavorite(bien.id) }}
          className="absolute top-1.5 right-1.5 w-[22px] h-[22px] bg-white/90 rounded-full flex items-center justify-center text-xs transition-colors"
          style={{ color: isFav ? '#e05a5a' : 'rgba(26,26,24,0.35)' }}
        >
          {isFav ? '♥' : '♡'}
        </button>
        {bien.vendeur_logo && (
          <div className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-md bg-white shadow-sm overflow-hidden flex items-center justify-center p-0.5 border border-white/60">
            <img src={bien.vendeur_logo} alt="" className="w-full h-full object-contain" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0 p-2.5 flex flex-col justify-between">
        <div className="min-w-0">
          <div className="font-serif text-base leading-tight truncate">{prix}</div>
          <div className="text-xs font-medium truncate mt-0.5">{bien.titre}</div>
          <div className="text-[11px] text-navy/45 truncate">{bien.ville} · {bien.code_postal}</div>
        </div>
        <div className="flex gap-2 items-center flex-wrap text-[10px] text-navy/50">
          {bien.surface && <span>{bien.surface} m²</span>}
          {(bien.pieces ?? 0) > 0 && <span>{bien.pieces} p.</span>}
          {(bien.sdb ?? 0) > 0 && <span>{bien.sdb} sdb</span>}
          {bien.dpe && (
            <span className="text-white font-bold px-1.5 py-0.5 rounded text-[9px]" style={{ background: DPE_COLORS[bien.dpe] }}>
              DPE {bien.dpe}
            </span>
          )}
          <Link
            href={`/annonce/${bien.id}`}
            onClick={e => e.stopPropagation()}
            className="ml-auto text-primary hover:underline font-medium"
          >
            Voir →
          </Link>
        </div>
      </div>
    </div>
  )
}


