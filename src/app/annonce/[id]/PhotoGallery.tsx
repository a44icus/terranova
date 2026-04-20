'use client'

import Image from 'next/image'
import { useState, useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Thumbs, Zoom, Keyboard } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/thumbs'
import 'swiper/css/zoom'

interface Props {
  photos: string[]
  icon: string
  titre: string
}

export default function PhotoGallery({ photos, icon, titre }: Props) {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null)
  const [lightbox, setLightbox] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const mainSwiperRef = useRef<SwiperType | null>(null)

  if (photos.length === 0) {
    return (
      <div className="w-full rounded-2xl overflow-hidden bg-gradient-to-br from-[#e0ddd8] to-[#c8c4bc] flex items-center justify-center"
        style={{ height: 380 }}>
        <span style={{ fontSize: 80, opacity: 0.25 }}>{icon}</span>
      </div>
    )
  }

  return (
    <>
      <style>{`
        /* ── Swiper custom ── */
        .pg-main .swiper-button-prev,
        .pg-main .swiper-button-next {
          width: 36px; height: 36px;
          background: rgba(0,0,0,0.42);
          backdrop-filter: blur(4px);
          border-radius: 50%;
          color: white;
          transition: background 0.15s;
        }
        .pg-main .swiper-button-prev:hover,
        .pg-main .swiper-button-next:hover { background: rgba(0,0,0,0.68); }
        .pg-main .swiper-button-prev::after,
        .pg-main .swiper-button-next::after { font-size: 14px; font-weight: 700; }
        .pg-main .swiper-pagination-bullet { background: white; opacity: 0.5; }
        .pg-main .swiper-pagination-bullet-active { opacity: 1; }

        .pg-thumbs .swiper-slide { opacity: 0.5; cursor: pointer; transition: opacity 0.15s; border-radius: 10px; overflow: hidden; }
        .pg-thumbs .swiper-slide-thumb-active { opacity: 1; outline: 2px solid #4F46E5; outline-offset: 2px; }

        /* Lightbox */
        .pg-lb .swiper-button-prev,
        .pg-lb .swiper-button-next {
          width: 44px; height: 44px;
          background: rgba(255,255,255,0.1);
          border-radius: 50%;
          color: white;
          transition: background 0.15s;
        }
        .pg-lb .swiper-button-prev:hover,
        .pg-lb .swiper-button-next:hover { background: rgba(255,255,255,0.25); }
        .pg-lb .swiper-button-prev::after,
        .pg-lb .swiper-button-next::after { font-size: 16px; font-weight: 700; }
        .pg-lb .swiper-pagination-bullet { background: white; opacity: 0.4; }
        .pg-lb .swiper-pagination-bullet-active { opacity: 1; }
        .pg-lb .swiper-zoom-container { cursor: zoom-in; }
        .pg-lb .swiper-slide-zoomed .swiper-zoom-container { cursor: zoom-out; }
      `}</style>

      <div className="space-y-2">

        {/* ── Slider principal ──────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden relative" style={{ height: 420 }}>
          <Swiper
            modules={[Navigation, Pagination, Thumbs, Keyboard]}
            navigation
            pagination={{ clickable: true }}
            thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
            keyboard={{ enabled: true }}
            loop={photos.length > 1}
            className="pg-main w-full h-full"
            onSwiper={s => { mainSwiperRef.current = s }}
            onSlideChange={s => setLightboxIndex(s.realIndex)}
          >
            {photos.map((url, i) => (
              <SwiperSlide key={i}>
                <div
                  className="relative w-full h-full cursor-zoom-in"
                  onClick={() => { setLightboxIndex(mainSwiperRef.current?.realIndex ?? i); setLightbox(true) }}
                >
                  <Image
                    src={url}
                    alt={`${titre} — photo ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 960px"
                    priority={i === 0}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Bouton plein écran */}
          <button
            onClick={() => setLightbox(true)}
            className="absolute bottom-4 left-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center backdrop-blur-sm transition-colors"
            aria-label="Plein écran"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
            </svg>
          </button>
        </div>

        {/* ── Thumbnails ────────────────────────────────────── */}
        {photos.length > 1 && (
          <Swiper
            modules={[Thumbs]}
            onSwiper={setThumbsSwiper}
            slidesPerView="auto"
            spaceBetween={8}
            watchSlidesProgress
            className="pg-thumbs"
          >
            {photos.map((url, i) => (
              <SwiperSlide key={i} style={{ width: 80, height: 60 }}>
                <div className="relative w-full h-full">
                  <Image src={url} alt="" fill className="object-cover" sizes="80px" />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>

      {/* ── Lightbox ────────────────────────────────────────── */}
      {lightbox && (
        <div className="fixed inset-0 z-[1000] bg-black/96 flex flex-col">

          {/* Header lightbox */}
          <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
            <span className="text-white/50 text-sm">{titre}</span>
            <button
              onClick={() => setLightbox(false)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors text-lg"
              aria-label="Fermer"
            >✕</button>
          </div>

          {/* Slider lightbox */}
          <div className="flex-1 min-h-0">
            <Swiper
              modules={[Navigation, Pagination, Zoom, Keyboard]}
              navigation
              pagination={{ clickable: true, type: 'fraction' }}
              zoom={{ maxRatio: 3 }}
              keyboard={{ enabled: true }}
              initialSlide={lightboxIndex}
              loop={photos.length > 1}
              className="pg-lb w-full h-full"
            >
              {photos.map((url, i) => (
                <SwiperSlide key={i}>
                  <div className="swiper-zoom-container w-full h-full flex items-center justify-center">
                    <Image
                      src={url}
                      alt={`${titre} — photo ${i + 1}`}
                      fill
                      className="object-contain"
                      sizes="100vw"
                      priority={i === lightboxIndex}
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      )}
    </>
  )
}
