import Image from 'next/image'
import Link from 'next/link'
import { formatPrix } from '@/lib/geo'

const DPE_COLORS: Record<string, string> = {
  A: '#2E7D32', B: '#558B2F', C: '#9E9D24',
  D: '#F9A825', E: '#EF6C00', F: '#D84315', G: '#B71C1C',
}

export interface AnnonceCardBien {
  id:             string
  titre:          string
  ville:          string
  code_postal:    string
  prix:           number
  type:           string
  surface?:       number | null
  pieces?:        number | null
  dpe?:           string | null
  photo_url?:     string | null
  coup_de_coeur?: boolean
  vendeur_logo?:  string | null
  publie_at?:     string | null
  featured?:      boolean
}

interface Props {
  bien:   AnnonceCardBien
  sizes?: string
  /** Afficher le vendeur logo (défaut: true) */
  showLogo?: boolean
}

function isNouveau(date?: string | null) {
  if (!date) return false
  return (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24) < 7
}

export default function AnnonceCard({
  bien,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw',
  showLogo = true,
}: Props) {
  return (
    <Link
      href={`/annonce/${bien.id}`}
      className="bg-white rounded-2xl overflow-hidden border border-navy/08 hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 block group"
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#e0ddd8,#c8c4bc)' }}>
        {bien.photo_url ? (
          <Image
            src={bien.photo_url}
            alt={bien.titre}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes={sizes}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🏠</div>
        )}

        {/* Badge type — top-left */}
        <span
          className="absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded text-white z-10"
          style={{ background: bien.type === 'vente' ? '#4F46E5' : '#0891B2' }}
        >
          {bien.type === 'vente' ? 'Vente' : 'Location'}
        </span>

        {/* Badges top-right — empilés en colonne si les deux sont présents */}
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10">
          {/* Nouveau animé */}
          {isNouveau(bien.publie_at) && (
            <span
              className="relative overflow-hidden inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full text-white uppercase tracking-wide"
              style={{ background: 'linear-gradient(90deg,#4F46E5,#818CF8)' }}
            >
              <span className="relative z-10">Nouveau</span>
              <span className="badge-shimmer" aria-hidden="true" />
            </span>
          )}
          {/* Coup de cœur — toujours visible si vrai */}
          {bien.coup_de_coeur && (
            <span className="text-xs bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded font-semibold shadow-sm">
              ❤ Coup de cœur
            </span>
          )}
        </div>

        {/* Logo vendeur */}
        {showLogo && bien.vendeur_logo && (
          <div className="absolute bottom-2 right-2 w-8 h-8 rounded-lg bg-white shadow overflow-hidden flex items-center justify-center p-0.5 border border-white/60 z-10">
            <img src={bien.vendeur_logo} alt="" className="w-full h-full object-contain" />
          </div>
        )}
      </div>

      {/* Infos */}
      <div className="p-3.5">
        <div className="font-serif text-lg text-navy leading-tight">
          {formatPrix(bien.prix, bien.type as 'vente' | 'location')}
        </div>
        <div className="text-xs font-medium text-navy mt-0.5 truncate">{bien.titre}</div>
        <div className="text-[11px] text-navy/45 mt-0.5">📍 {bien.ville} {bien.code_postal}</div>
        <div className="flex items-center gap-2 mt-2 text-[10px] text-navy/50">
          {bien.surface && <span>{bien.surface} m²</span>}
          {(bien.pieces ?? 0) > 0 && <span>{bien.pieces} p.</span>}
          {bien.dpe && (
            <span
              className="ml-auto text-white font-bold px-1.5 py-0.5 rounded text-[9px]"
              style={{ background: DPE_COLORS[bien.dpe] }}
            >
              {bien.dpe}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
