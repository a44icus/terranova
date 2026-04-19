'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export interface VilleData {
  ville: string
  slug: string
  total: number
  avgVente: number | null
  avgLoc: number | null
  topCat: string
}

const CAT_ICON: Record<string, string> = {
  appartement: '🏛️', maison: '🌿', bureau: '🏢',
  terrain: '🌱', parking: '🅿️', local: '🏪',
}

function slugify(ville: string) {
  return ville.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function MarcheVilles({ villes }: { villes: VilleData[] }) {
  const [userSlug, setUserSlug] = useState<string | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lon } }) => {
        try {
          const res = await fetch(
            `https://api-adresse.data.gouv.fr/reverse/?lon=${lon}&lat=${lat}`
          )
          const data = await res.json()
          const city: string | undefined =
            data.features?.[0]?.properties?.city ??
            data.features?.[0]?.properties?.municipality
          if (city) setUserSlug(slugify(city))
        } catch {}
      },
      () => {},
      { timeout: 6000, maximumAge: 60_000 }
    )
  }, [])

  // Ville de l'utilisateur en premier si elle figure dans la liste
  const userVille = userSlug ? villes.find(v => v.slug === userSlug) : null
  const sorted = userVille
    ? [userVille, ...villes.filter(v => v.slug !== userSlug)]
    : villes

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sorted.map(v => {
        const isUser = v.slug === userSlug
        return (
          <Link
            key={v.ville}
            href={`/marche/${v.slug}`}
            className={`relative bg-white rounded-2xl p-5 border hover:border-primary/40 hover:-translate-y-0.5 transition-all group block ${
              isUser
                ? 'border-primary ring-1 ring-primary/20 shadow-md shadow-primary/08'
                : 'border-navy/08'
            }`}
          >
            {/* Badge "Votre ville" */}
            {isUser && (
              <span className="absolute top-3 right-3 flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Votre ville
              </span>
            )}

            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className={`font-medium transition-colors ${isUser ? 'text-primary' : 'text-navy group-hover:text-primary'}`}>
                  {v.ville}
                </h3>
                <div className="text-xs text-navy/40 mt-0.5">
                  {v.total} bien{v.total > 1 ? 's' : ''} · {CAT_ICON[v.topCat] ?? '🏠'} {v.topCat}
                </div>
              </div>
              <span className={`text-lg transition-colors ${isUser ? 'text-primary' : 'text-navy/20 group-hover:text-primary'}`}>
                →
              </span>
            </div>

            <div className="flex gap-3 pt-3 border-t border-navy/06">
              {v.avgVente && (
                <div>
                  <div className="text-[10px] text-navy/35 mb-0.5">Vente</div>
                  <div className="text-sm font-semibold text-navy">
                    {v.avgVente.toLocaleString('fr-FR')}{' '}
                    <span className="font-normal text-navy/40 text-[10px]">€/m²</span>
                  </div>
                </div>
              )}
              {v.avgLoc && (
                <div className={v.avgVente ? 'border-l border-navy/08 pl-3' : ''}>
                  <div className="text-[10px] text-navy/35 mb-0.5">Location</div>
                  <div className="text-sm font-semibold text-navy">
                    {v.avgLoc.toLocaleString('fr-FR')}{' '}
                    <span className="font-normal text-navy/40 text-[10px]">€/m²/mois</span>
                  </div>
                </div>
              )}
              {!v.avgVente && !v.avgLoc && (
                <div className="text-xs text-navy/30">Surface non renseignée</div>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
