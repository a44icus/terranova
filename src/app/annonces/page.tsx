import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { formatPrix } from '@/lib/geo'
import type { Metadata } from 'next'
import type { BienCategorie, BienType } from '@/lib/types'

const PAGE_SIZE = 24

const CAT_LABEL: Record<string, string> = {
  appartement: 'Appartement', maison: 'Maison', bureau: 'Bureau',
  terrain: 'Terrain', parking: 'Parking', local: 'Local commercial',
}
const DPE_COLORS: Record<string, string> = {
  A: '#2E7D32', B: '#558B2F', C: '#9E9D24',
  D: '#F9A825', E: '#EF6C00', F: '#D84315', G: '#B71C1C',
}

interface Props {
  searchParams: Promise<{
    type?: string
    categorie?: string
    ville?: string
    dept?: string
    page?: string
  }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = await searchParams
  const parts = ['Annonces immobilières']
  if (p.ville) parts.push(`à ${p.ville}`)
  if (p.type === 'vente') parts.push('— Vente')
  if (p.type === 'location') parts.push('— Location')
  return {
    title: parts.join(' ') + ' | Terranova',
    description: 'Trouvez des biens immobiliers à vendre et à louer partout en France sur Terranova.',
  }
}

export default async function AnnoncesPage({ searchParams }: Props) {
  const p = await searchParams
  const supabase = await createClient()
  const page = Math.max(1, parseInt(p.page ?? '1'))
  const offset = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('biens_publics')
    .select('*', { count: 'exact' })
    .order('featured', { ascending: false })
    .order('publie_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (p.type && (p.type === 'vente' || p.type === 'location')) query = query.eq('type', p.type as BienType)
  if (p.categorie) query = query.eq('categorie', p.categorie as BienCategorie)
  if (p.ville) query = query.ilike('ville', `%${p.ville}%`)
  if (p.dept) query = query.eq('code_postal', p.dept)

  const { data: biens, count } = await query
  const total = count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    const merged = { type: p.type, categorie: p.categorie, ville: p.ville, dept: p.dept, page: String(page), ...overrides }
    Object.entries(merged).forEach(([k, v]) => { if (v && v !== '1') params.set(k, v) })
    const s = params.toString()
    return s ? `/annonces?${s}` : '/annonces'
  }

  return (
    <div className="min-h-screen bg-surface">
      <SiteHeader />

      {/* Hero */}
      <div className="bg-navy relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 85% 40%, rgba(79,70,229,0.18) 0%, transparent 65%), radial-gradient(ellipse at 15% 80%, rgba(124,58,237,0.10) 0%, transparent 55%)',
        }} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-12">
          <p className="text-[11px] font-bold text-primary uppercase tracking-[0.18em] mb-3">Annonces immobilières</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-white mb-3 leading-tight">
            {p.ville ? `Annonces à ${p.ville}` : 'Toutes les annonces'}
          </h1>
          <p className="text-white/45 text-sm mb-8 max-w-lg leading-relaxed">
            Appartements, maisons, terrains et locaux — achat et location partout en France.
          </p>

          {/* Stats pills */}
          <div className="flex flex-wrap gap-3 mb-8">
            {total > 0 && (
              <div className="flex items-baseline gap-1.5 bg-white/08 border border-white/10 rounded-full px-4 py-2">
                <span className="font-serif text-xl text-white">{total.toLocaleString('fr-FR')}</span>
                <span className="text-xs text-white/50">bien{total > 1 ? 's' : ''}</span>
              </div>
            )}
            {p.type && (
              <div className="flex items-baseline gap-1.5 bg-white/08 border border-white/10 rounded-full px-4 py-2">
                <span className="text-xs text-white/70">{p.type === 'vente' ? 'Vente' : 'Location'}</span>
              </div>
            )}
            {p.categorie && (
              <div className="flex items-baseline gap-1.5 bg-white/08 border border-white/10 rounded-full px-4 py-2">
                <span className="text-xs text-white/70">{CAT_LABEL[p.categorie] ?? p.categorie}</span>
              </div>
            )}
          </div>

          {/* Filtres */}
          <form method="get" action="/annonces" className="flex flex-wrap gap-2">
            <select name="type" defaultValue={p.type ?? ''} className="text-xs border border-white/15 bg-white/08 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-primary">
              <option value="" className="text-navy">Vente & Location</option>
              <option value="vente" className="text-navy">Vente</option>
              <option value="location" className="text-navy">Location</option>
            </select>
            <select name="categorie" defaultValue={p.categorie ?? ''} className="text-xs border border-white/15 bg-white/08 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-primary">
              <option value="" className="text-navy">Tous types</option>
              <option value="appartement" className="text-navy">Appartement</option>
              <option value="maison" className="text-navy">Maison</option>
              <option value="bureau" className="text-navy">Bureau</option>
              <option value="terrain" className="text-navy">Terrain</option>
              <option value="parking" className="text-navy">Parking</option>
              <option value="local" className="text-navy">Local commercial</option>
            </select>
            <input name="ville" type="text" defaultValue={p.ville ?? ''} placeholder="Ville…"
              className="text-xs border border-white/15 bg-white/08 text-white placeholder-white/35 rounded-xl px-3 py-2 focus:outline-none focus:border-primary w-32" />
            <button type="submit" className="text-xs bg-primary hover:bg-primary/90 text-white font-semibold px-4 py-2 rounded-xl transition-colors">
              Filtrer
            </button>
            {(p.type || p.categorie || p.ville || p.dept) && (
              <Link href="/annonces" className="text-xs border border-white/15 text-white/60 px-3 py-2 rounded-xl hover:border-white/35 hover:text-white transition-colors">
                ✕ Réinitialiser
              </Link>
            )}
          </form>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Grille */}
        {!biens?.length ? (
          <div className="text-center py-20 text-navy/40">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm">Aucun bien ne correspond à ces critères</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {biens.map((b: any) => (
              <Link key={b.id} href={`/annonce/${b.id}`}
                className="bg-white rounded-2xl overflow-hidden border border-navy/08 hover:border-primary/40 hover:-translate-y-0.5 transition-all block group">
                <div className="relative h-44 bg-gradient-to-br from-[#e0ddd8] to-[#c8c4bc] overflow-hidden">
                  {b.photo_url
                    ? <Image src={b.photo_url} alt={b.titre} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
                    : <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🏠</div>
                  }
                  <span className="absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded text-white"
                    style={{ background: b.type === 'vente' ? '#4F46E5' : '#0891B2' }}>
                    {b.type === 'vente' ? 'Vente' : 'Location'}
                  </span>
                  {b.coup_de_coeur && (
                    <span className="absolute top-2 right-2 text-xs bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded font-semibold">❤</span>
                  )}
                  {b.vendeur_logo && (
                    <div className="absolute bottom-2 right-2 w-8 h-8 rounded-lg bg-white shadow overflow-hidden flex items-center justify-center p-0.5 border border-white/60">
                      <img src={b.vendeur_logo} alt="" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>
                <div className="p-3.5">
                  <div className="font-serif text-lg text-navy">
                    {formatPrix(b.prix, b.type)}
                  </div>
                  <div className="text-xs font-medium text-navy mt-0.5 truncate">{b.titre}</div>
                  <div className="text-[11px] text-navy/45 mt-0.5">📍 {b.ville} {b.code_postal}</div>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-navy/50">
                    {b.surface && <span>{b.surface} m²</span>}
                    {(b.pieces ?? 0) > 0 && <span>{b.pieces} p.</span>}
                    {b.dpe && (
                      <span className="ml-auto text-white font-bold px-1.5 py-0.5 rounded text-[9px]"
                        style={{ background: DPE_COLORS[b.dpe] }}>
                        {b.dpe}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            {page > 1 && (
              <Link href={buildUrl({ page: String(page - 1) })}
                className="px-4 py-2 text-sm border border-navy/15 rounded-xl hover:border-navy/30 transition-colors text-navy/60">
                ← Précédent
              </Link>
            )}
            <span className="text-sm text-navy/50 px-3">
              Page {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link href={buildUrl({ page: String(page + 1) })}
                className="px-4 py-2 text-sm border border-navy/15 rounded-xl hover:border-navy/30 transition-colors text-navy/60">
                Suivant →
              </Link>
            )}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  )
}
