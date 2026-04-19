'use client'

import Image from 'next/image'
import { useState } from 'react'

interface Props {
  photos: string[]
  icon: string
  titre: string
}

export default function PhotoGallery({ photos, icon, titre }: Props) {
  const [active, setActive] = useState(0)

  if (photos.length === 0) {
    return (
      <div className="w-full rounded-2xl overflow-hidden bg-gradient-to-br from-[#e0ddd8] to-[#c8c4bc] flex items-center justify-center"
        style={{ height: 380 }}>
        <span style={{ fontSize: 80, opacity: 0.25 }}>{icon}</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Photo principale */}
      <div className="w-full rounded-2xl overflow-hidden bg-navy relative" style={{ height: 420 }}>
        <Image
          key={active}
          src={photos[active]}
          alt={`${titre} — photo ${active + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 960px"
          priority={active === 0}
        />
        {/* Compteur */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
            {active + 1} / {photos.length}
          </div>
        )}
        {/* Flèches */}
        {photos.length > 1 && (
          <>
            <button
              onClick={() => setActive(i => (i - 1 + photos.length) % photos.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/65 text-white flex items-center justify-center transition-colors backdrop-blur-sm text-xl font-light"
              aria-label="Photo précédente"
            >‹</button>
            <button
              onClick={() => setActive(i => (i + 1) % photos.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/65 text-white flex items-center justify-center transition-colors backdrop-blur-sm text-xl font-light"
              aria-label="Photo suivante"
            >›</button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {photos.map((url, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="flex-shrink-0 rounded-xl overflow-hidden relative transition-all"
              style={{
                width: 80, height: 60,
                outline: i === active ? '2px solid #4F46E5' : '2px solid transparent',
                outlineOffset: 2,
                opacity: i === active ? 1 : 0.55,
              }}
            >
              <Image src={url} alt="" fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
