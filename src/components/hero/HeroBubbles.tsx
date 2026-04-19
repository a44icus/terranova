'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatPrix } from '@/lib/geo'

type Bien = {
  id: string
  titre: string
  prix: number
  type: 'vente' | 'location'
  ville: string
  photo_url: string | null
  lat: number | null
  lng: number | null
}

type Props = {
  fallback: Bien[]
}

type Status = 'idle' | 'loading' | 'ready' | 'denied'

// Distance en km entre deux points (Haversine simplifié)
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

export default function HeroBubbles({ fallback }: Props) {
  const [biens, setBiens] = useState<(Bien & { dist?: number })[]>(fallback)
  const [status, setStatus] = useState<Status>('idle')
  const [label, setLabel] = useState<string>('Sélection récente')

  useEffect(() => {
    if (!navigator.geolocation) return

    setStatus('loading')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        const supabase = createClient()

        // Bounding box ~40 km autour de l'utilisateur
        const delta = 0.4
        const { data } = await supabase
          .from('biens_publics')
          .select('id, titre, prix, type, ville, photo_url, lat, lng')
          .gte('lat', lat - delta)
          .lte('lat', lat + delta)
          .gte('lng', lng - delta)
          .lte('lng', lng + delta)
          .order('featured', { ascending: false })
          .limit(4)

        if (data && data.length >= 2) {
          const sorted = data
            .map((b: any) => ({
              ...b,
              dist: b.lat && b.lng ? distanceKm(lat, lng, b.lat, b.lng) : 999,
            }))
            .sort((a: any, b: any) => a.dist - b.dist)
          setBiens(sorted)
          setLabel('Près de chez vous')
        } else {
          // Pas assez de résultats proches → élargir à 150 km
          const delta2 = 1.5
          const { data: data2 } = await supabase
            .from('biens_publics')
            .select('id, titre, prix, type, ville, photo_url, lat, lng')
            .gte('lat', lat - delta2)
            .lte('lat', lat + delta2)
            .gte('lng', lng - delta2)
            .lte('lng', lng + delta2)
            .order('featured', { ascending: false })
            .limit(4)

          if (data2 && data2.length > 0) {
            const sorted = data2
              .map((b: any) => ({
                ...b,
                dist: b.lat && b.lng ? distanceKm(lat, lng, b.lat, b.lng) : 999,
              }))
              .sort((a: any, b: any) => a.dist - b.dist)
            setBiens(sorted)
            setLabel('Dans votre région')
          }
          // sinon on garde le fallback
        }

        setStatus('ready')
      },
      () => {
        setStatus('denied')
        // Garde le fallback silencieusement
      },
      { timeout: 5000, maximumAge: 300_000 }
    )
  }, [])

  return (
    <div className="hidden lg:flex flex-col gap-3 absolute inset-0 items-center justify-center z-20 pointer-events-none">
      <div className="flex flex-col gap-3 pointer-events-auto">

      <style>{`
        @keyframes bubbleFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-7px); }
        }
        @keyframes bubbleIn {
          from { opacity: 0; transform: translateX(16px) translateY(0px); }
          to   { opacity: 1; transform: translateX(0px) translateY(0px); }
        }
      `}</style>

      {/* Label + indicateur */}
      <div className="flex items-center gap-2 px-1 mb-1">
        {status === 'loading' ? (
          <span className="flex items-center gap-2 text-[10px] text-white/40 font-semibold tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] animate-pulse" />
            Localisation…
          </span>
        ) : (
          <span className="flex items-center gap-2 text-[10px] text-white/40 font-semibold tracking-widest uppercase">
            <span className={`w-1.5 h-1.5 rounded-full ${status === 'ready' ? 'bg-emerald-400' : 'bg-[#4F46E5]'}`} />
            {label}
          </span>
        )}
      </div>

      {/* Cartes */}
      {biens.slice(0, 4).map((b, i) => (
        <Link key={b.id} href={`/annonce/${b.id}`}
          className="flex items-center gap-3 rounded-2xl px-3 py-2.5 border border-white/12 hover:border-[#4F46E5]/50 hover:shadow-xl group"
          style={{
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            width: '230px',
            marginLeft: i % 2 === 1 ? '28px' : '0px',
            animation: `bubbleIn 0.5s ease both, bubbleFloat ${3.5 + i * 0.4}s ease-in-out ${i * 0.6}s infinite`,
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}>
          {/* Photo */}
          <div className="relative w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-white/10">
            {b.photo_url
              ? <Image src={b.photo_url} alt="" fill className="object-cover" sizes="44px" />
              : <div className="w-full h-full bg-indigo-800" />
            }
          </div>
          {/* Infos */}
          <div className="min-w-0 flex-1">
            <div className="font-serif text-sm text-white leading-tight truncate"
              style={{ fontFamily: "'DM Serif Display', serif" }}>
              {formatPrix(b.prix, b.type)}
            </div>
            <div className="text-white/50 text-[11px] truncate mt-0.5">{b.titre}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full text-white"
                style={{ background: b.type === 'vente' ? '#4F46E5' : '#0891B2' }}>
                {b.type === 'vente' ? 'Vente' : 'Location'}
              </span>
              <span className="text-white/30 text-[10px] truncate">
                {(b as any).dist !== undefined ? `${(b as any).dist} km` : b.ville}
              </span>
            </div>
          </div>
          {/* Flèche */}
          <svg className="w-3.5 h-3.5 text-white/20 group-hover:text-[#818CF8] transition-colors flex-shrink-0"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </Link>
      ))}

      {/* Lien voir plus */}
      <Link href="/annonces"
        className="text-center text-[11px] text-white/30 hover:text-[#818CF8] transition-colors mt-1 px-1">
        Voir toutes les annonces &rarr;
      </Link>
      </div>
    </div>
  )
}



