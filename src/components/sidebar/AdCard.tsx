'use client'

import type { MapAd } from '@/lib/mapAds'

interface Props {
  ad: MapAd
  grid?: boolean
}

async function trackClick(id: string) {
  try {
    await fetch('/api/ad-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ad_id: id, event_type: 'click' }),
    })
  } catch {}
}

export default function AdCard({ ad, grid = false }: Props) {
  const color = ad.couleur ?? '#F59E0B'

  function handleClick() {
    trackClick(ad.id)
    if (ad.lien_url) window.open(ad.lien_url, '_blank', 'noopener,noreferrer')
  }

  if (grid) {
    return (
      <div
        onClick={handleClick}
        className="bg-white rounded-xl overflow-hidden cursor-pointer border-[1.5px] transition-all hover:-translate-y-px relative"
        style={{ borderColor: color }}
      >
        {/* Badge PUB */}
        <span className="absolute top-1.5 right-1.5 z-10 text-[9px] font-bold px-1.5 py-0.5 rounded text-white"
          style={{ background: color }}>
          PUB
        </span>

        {/* Image ou couleur */}
        <div className="relative h-28 overflow-hidden flex items-center justify-center"
          style={{ background: ad.image_url ? undefined : `${color}18` }}>
          {ad.image_url
            ? <img src={ad.image_url} alt={ad.titre} className="w-full h-full object-cover" />
            : <span className="text-4xl opacity-60">{ad.emoji || '📢'}</span>
          }
        </div>

        <div className="p-2.5">
          <div className="font-semibold text-sm leading-tight truncate text-navy">{ad.titre}</div>
          {ad.description && (
            <div className="text-[11px] text-navy/50 truncate mt-0.5">{ad.description}</div>
          )}
          {ad.lien_url && (
            <div className="mt-1.5 text-[10px] font-semibold" style={{ color }}>
              En savoir plus →
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={handleClick}
      className="mb-2 rounded-xl overflow-hidden cursor-pointer border-[1.5px] transition-all hover:-translate-y-px flex h-[88px] relative"
      style={{ borderColor: color, background: 'white' }}
    >
      {/* Bande colorée à gauche + emoji/image */}
      <div className="w-[88px] flex-shrink-0 relative overflow-hidden flex items-center justify-center"
        style={{ background: ad.image_url ? undefined : `${color}18` }}>
        {ad.image_url
          ? <img src={ad.image_url} alt={ad.titre} className="w-full h-full object-cover" />
          : <span className="text-3xl">{ad.emoji || '📢'}</span>
        }
        {/* Trait coloré sur le bord gauche */}
        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: color }} />
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0 p-2.5 flex flex-col justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white flex-shrink-0"
              style={{ background: color }}>
              PUB
            </span>
            <span className="font-semibold text-sm truncate text-navy">{ad.titre}</span>
          </div>
          {ad.description && (
            <div className="text-[11px] text-navy/50 line-clamp-2 leading-tight">{ad.description}</div>
          )}
        </div>
        {ad.lien_url && (
          <div className="text-[10px] font-semibold mt-1" style={{ color }}>
            En savoir plus →
          </div>
        )}
      </div>
    </div>
  )
}
