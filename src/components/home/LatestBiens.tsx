'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrix } from '@/lib/geo'

const DPE_COLORS: Record<string, string> = {
  A: '#2E7D32', B: '#558B2F', C: '#9E9D24',
  D: '#F9A825', E: '#EF6C00', F: '#D84315', G: '#B71C1C',
}

interface Bien {
  id:            string
  titre:         string
  ville:         string
  code_postal:   string
  prix:          number
  type:          string
  categorie?:    string
  surface?:      number | null
  pieces?:       number | null
  dpe?:          string | null
  photo_url?:    string | null
  publie_at?:    string | null
  coup_de_coeur?: boolean
  vendeur_logo?: string | null
}

interface Props {
  biens: Bien[]
  nearbyCity?: string | null
}

const FILTRES = [
  { key: 'all',         label: 'Tout' },
  { key: 'vente',       label: 'Vente' },
  { key: 'location',    label: 'Location' },
  { key: 'maison',      label: 'Maisons' },
  { key: 'appartement', label: 'Apparts' },
]

function isNouveau(date?: string | null) {
  if (!date) return false
  const days = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
  return days < 7
}

export default function LatestBiens({ biens, nearbyCity }: Props) {
  const [filter, setFilter] = useState('all')

  const filtered = useMemo(() => {
    if (filter === 'all')      return biens
    if (filter === 'vente')    return biens.filter(b => b.type === 'vente')
    if (filter === 'location') return biens.filter(b => b.type === 'location')
    return biens.filter(b => b.categorie === filter)
  }, [biens, filter])

  const hero = filtered[0]
  const rest = filtered.slice(1, 6)

  return (
    <section className="max-w-7xl mx-auto px-4 py-12 lg:py-20">
      <style>{`
        .bien-card { transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        .bien-card:hover { transform: translateY(-4px); }
        .bien-card .card-overlay { transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        .bien-card:hover .card-overlay { transform: translateY(0); }
        .bien-card .card-img { transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1); }
        .bien-card:hover .card-img { transform: scale(1.08); }
      `}</style>

      {/* En-tête */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#4F46E5]">
            {nearbyCity ? 'Près de vous' : 'Sélection'}
          </span>
          <h2 className="font-serif text-2xl lg:text-4xl text-[#0F172A] mt-1"
            style={{ fontFamily: "'DM Serif Display', serif" }}>
            {nearbyCity ? <>Annonces près de <em style={{ color: '#4F46E5' }}>{nearbyCity}</em></> : 'Dernières annonces'}
          </h2>
        </div>
        <Link href="/annonces"
          className="hidden sm:inline-flex items-center gap-2 text-sm text-[#0F172A]/50 hover:text-[#4F46E5] transition-colors font-medium border-b border-[#0F172A]/20 hover:border-[#4F46E5] pb-0.5 self-start lg:self-auto">
          Tout parcourir →
        </Link>
      </div>

      {/* Filtres rapides */}
      <div className="flex gap-2 mb-6 lg:mb-8 overflow-x-auto pb-1 scrollbar-hide">
        {FILTRES.map(f => {
          const active = filter === f.key
          return (
            <button key={f.key}
              onClick={() => setFilter(f.key)}
              className={`whitespace-nowrap text-sm font-medium px-4 py-2 rounded-full transition-all ${
                active
                  ? 'bg-[#0F172A] text-white shadow-md'
                  : 'bg-white text-[#0F172A]/60 border border-[#0F172A]/10 hover:border-[#4F46E5]/40 hover:text-[#0F172A]'
              }`}>
              {f.label}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[#0F172A]/30 text-sm">
          Aucune annonce dans cette catégorie pour le moment.
        </div>
      ) : (
        <>
          {/* Mobile : carrousel scroll-x snap */}
          <div className="lg:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 scrollbar-hide">
            {filtered.slice(0, 8).map(b => (
              <BienCardMobile key={b.id} bien={b} />
            ))}
          </div>

          {/* Desktop : grille magazine */}
          <div className="hidden lg:grid grid-cols-3 gap-3" style={{ gridAutoRows: 'clamp(140px, 20vw, 220px)' }}>
            {hero && <BienCardHero bien={hero} />}
            {rest.map(b => (
              <BienCardSmall key={b.id} bien={b} />
            ))}
          </div>
        </>
      )}

      <div className="text-center mt-8 sm:hidden">
        <Link href="/annonces" className="text-sm text-[#4F46E5] font-medium">
          Voir toutes les annonces →
        </Link>
      </div>
    </section>
  )
}

/* ── Carte HÉROS (grande, 2x2) ────────────────────────────────────── */
function BienCardHero({ bien }: { bien: Bien }) {
  return (
    <Link href={`/annonce/${bien.id}`}
      className="bien-card relative rounded-2xl overflow-hidden group block col-span-2 row-span-2">
      {bien.photo_url
        ? <Image src={bien.photo_url} alt={bien.titre} fill className="card-img object-cover" sizes="66vw" />
        : <div className="w-full h-full bg-gradient-to-br from-[#c7d2fe] to-[#4F46E5]" />
      }
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Badge nouveau (animé) */}
      {isNouveau(bien.publie_at) && (
        <div className="absolute top-4 left-4 overflow-hidden bg-gradient-to-r from-[#4F46E5] to-[#818CF8] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg flex items-center">
          <span className="relative z-10">Nouveau</span>
          <span className="badge-shimmer" aria-hidden="true" />
        </div>
      )}
      {/* Coup de cœur */}
      {bien.coup_de_coeur && (
        <div className="absolute top-4 right-4 bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full shadow">❤ Coup de cœur</div>
      )}
      {/* Logo vendeur */}
      {bien.vendeur_logo && !isNouveau(bien.publie_at) && (
        <div className="absolute top-4 left-4 w-9 h-9 rounded-lg bg-white shadow-md overflow-hidden flex items-center justify-center p-0.5 border border-white/60">
          <img src={bien.vendeur_logo} alt="" className="w-full h-full object-contain" />
        </div>
      )}

      {/* Contenu */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded text-white mb-3 inline-block"
          style={{ background: bien.type === 'vente' ? '#4F46E5' : '#0891B2' }}>
          {bien.type === 'vente' ? 'Vente' : 'Location'}
        </span>
        <div className="font-serif text-3xl text-white mb-1"
          style={{ fontFamily: "'DM Serif Display', serif" }}>
          {formatPrix(bien.prix, bien.type as 'vente' | 'location')}
        </div>
        <div className="text-white/85 text-sm truncate mb-1">{bien.titre}</div>
        <div className="text-white/55 text-xs">{bien.ville} {bien.code_postal}</div>

        {/* Pills caractéristiques */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {bien.surface && (
            <span className="text-[11px] text-white/85 px-2 py-0.5 rounded-md backdrop-blur-md"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
              {bien.surface} m²
            </span>
          )}
          {(bien.pieces ?? 0) > 0 && (
            <span className="text-[11px] text-white/85 px-2 py-0.5 rounded-md backdrop-blur-md"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
              {bien.pieces} pièces
            </span>
          )}
          {bien.dpe && (
            <span className="text-[11px] font-bold text-white px-2 py-0.5 rounded-md"
              style={{ background: DPE_COLORS[bien.dpe] }}>
              DPE {bien.dpe}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

/* ── Carte petite (desktop) ─────────────────────────────────────────── */
function BienCardSmall({ bien }: { bien: Bien }) {
  return (
    <Link href={`/annonce/${bien.id}`}
      className="bien-card relative rounded-2xl overflow-hidden group block">
      {bien.photo_url
        ? <Image src={bien.photo_url} alt={bien.titre} fill className="card-img object-cover" sizes="33vw" />
        : <div className="w-full h-full bg-gradient-to-br from-[#c7d2fe] to-[#4F46E5]" />
      }
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />

      {isNouveau(bien.publie_at) && (
        <div className="absolute top-2 left-2 overflow-hidden bg-gradient-to-r from-[#4F46E5] to-[#818CF8] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shadow flex items-center">
          <span className="relative z-10">Nouveau</span>
          <span className="badge-shimmer" aria-hidden="true" />
        </div>
      )}
      {bien.vendeur_logo && (
        <div className="absolute top-2 right-2 w-7 h-7 rounded-md bg-white shadow-md overflow-hidden flex items-center justify-center p-0.5 border border-white/60">
          <img src={bien.vendeur_logo} alt="" className="w-full h-full object-contain" />
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-3.5">
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-white mb-1.5 inline-block"
          style={{ background: bien.type === 'vente' ? '#4F46E5' : '#0891B2' }}>
          {bien.type === 'vente' ? 'Vente' : 'Location'}
        </span>
        <div className="font-serif text-lg text-white"
          style={{ fontFamily: "'DM Serif Display', serif" }}>
          {formatPrix(bien.prix, bien.type as 'vente' | 'location')}
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-white/55 text-[11px] truncate">{bien.ville}</span>
          {bien.dpe && (
            <span className="text-white font-bold px-1.5 py-0.5 rounded text-[9px] flex-shrink-0 ml-2"
              style={{ background: DPE_COLORS[bien.dpe] }}>{bien.dpe}</span>
          )}
        </div>
      </div>

      {/* Overlay slide-up au hover : caractéristiques */}
      <div className="card-overlay absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/85 to-black/0 px-3.5 pt-12 pb-3.5">
        <div className="flex flex-wrap gap-1 mb-2">
          {bien.surface && (
            <span className="text-[10px] text-white/85 px-1.5 py-0.5 rounded backdrop-blur-md"
              style={{ background: 'rgba(255,255,255,0.12)' }}>{bien.surface} m²</span>
          )}
          {(bien.pieces ?? 0) > 0 && (
            <span className="text-[10px] text-white/85 px-1.5 py-0.5 rounded backdrop-blur-md"
              style={{ background: 'rgba(255,255,255,0.12)' }}>{bien.pieces} p.</span>
          )}
        </div>
        <div className="text-[11px] text-white/90 truncate">{bien.titre}</div>
        <div className="text-[10px] text-[#818CF8] mt-1.5 font-medium flex items-center gap-1">
          Voir l'annonce <span className="ml-auto">→</span>
        </div>
      </div>
    </Link>
  )
}

/* ── Carte mobile (carrousel snap) ──────────────────────────────────── */
function BienCardMobile({ bien }: { bien: Bien }) {
  return (
    <Link href={`/annonce/${bien.id}`}
      className="snap-start flex-shrink-0 w-[78%] relative rounded-2xl overflow-hidden block"
      style={{ aspectRatio: '4/5' }}>
      {bien.photo_url
        ? <Image src={bien.photo_url} alt={bien.titre} fill className="object-cover" sizes="78vw" />
        : <div className="w-full h-full bg-gradient-to-br from-[#c7d2fe] to-[#4F46E5]" />
      }
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

      {isNouveau(bien.publie_at) && (
        <div className="absolute top-3 left-3 overflow-hidden bg-gradient-to-r from-[#4F46E5] to-[#818CF8] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide shadow flex items-center">
          <span className="relative z-10">Nouveau</span>
          <span className="badge-shimmer" aria-hidden="true" />
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded text-white mb-2 inline-block"
          style={{ background: bien.type === 'vente' ? '#4F46E5' : '#0891B2' }}>
          {bien.type === 'vente' ? 'Vente' : 'Location'}
        </span>
        <div className="font-serif text-2xl text-white mb-1"
          style={{ fontFamily: "'DM Serif Display', serif" }}>
          {formatPrix(bien.prix, bien.type as 'vente' | 'location')}
        </div>
        <div className="text-white/80 text-xs truncate mb-1.5">{bien.titre}</div>
        <div className="text-white/50 text-[10px] mb-2">{bien.ville}</div>
        <div className="flex flex-wrap gap-1">
          {bien.surface && (
            <span className="text-[10px] text-white/85 px-1.5 py-0.5 rounded backdrop-blur-md"
              style={{ background: 'rgba(255,255,255,0.15)' }}>{bien.surface} m²</span>
          )}
          {(bien.pieces ?? 0) > 0 && (
            <span className="text-[10px] text-white/85 px-1.5 py-0.5 rounded backdrop-blur-md"
              style={{ background: 'rgba(255,255,255,0.15)' }}>{bien.pieces} p.</span>
          )}
          {bien.dpe && (
            <span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded"
              style={{ background: DPE_COLORS[bien.dpe] }}>DPE {bien.dpe}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
