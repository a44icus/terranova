'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

const FALLBACK = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=90&auto=format&fit=crop'
const INTERVAL = 6000   // ms entre chaque photo
const DURATION = 1800   // ms de la transition (doit correspondre au CSS)

interface Props {
  photos: string[]
}

export default function HeroSlideshow({ photos }: Props) {
  const urls = photos.length > 0 ? photos : [FALLBACK]
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (urls.length <= 1) return
    const id = setInterval(() => setCurrent(c => (c + 1) % urls.length), INTERVAL)
    return () => clearInterval(id)
  }, [urls.length])

  return (
    <>
      {urls.map((url, i) => (
        <div
          key={url}
          className="absolute inset-0"
          style={{
            opacity:    i === current ? 1 : 0,
            transition: `opacity ${DURATION}ms ease-in-out`,
            zIndex:     i === current ? 1 : 0,
          }}
        >
          <Image
            src={url}
            alt=""
            fill
            className="object-cover object-center"
            sizes="100vw"
            quality={90}
            priority={i === 0}
          />
        </div>
      ))}

      {/* Indicateurs (dots) — visibles si plusieurs photos */}
      {urls.length > 1 && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2"
          style={{ zIndex: 20 }}
        >
          {urls.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Photo ${i + 1}`}
              style={{
                width:      i === current ? 20 : 6,
                height:     6,
                borderRadius: 9999,
                background: i === current ? '#ffffff' : 'rgba(255,255,255,0.35)',
                transition: 'all 0.4s ease',
                border:     'none',
                cursor:     'pointer',
                padding:    0,
              }}
            />
          ))}
        </div>
      )}
    </>
  )
}
