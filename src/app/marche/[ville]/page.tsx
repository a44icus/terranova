import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { BienPublic } from '@/lib/types'
import { formatPrix } from '@/lib/geo'
import Image from 'next/image'
import MarcheCharts from './MarcheCharts'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

interface Props { params: Promise<{ ville: string }> }

function deslugify(slug: string) {
  return slug.replace(/-/g, ' ')
}

function slugify(ville: string) {
  return ville.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const DPE_COLORS: Record<string, string> = {
  A: '#2E7D32', B: '#558B2F', C: '#9E9D24',
  D: '#F9A825', E: '#EF6C00', F: '#D84315', G: '#B71C1C',
}
const CAT_LABEL: Record<string, string> = {
  appartement: 'Appartement', maison: 'Maison', bureau: 'Bureau',
  terrain: 'Terrain', parking: 'Parking', local: 'Local commercial',
}
const CAT_ICON: Record<string, string> = {
  appartement: '🏛️', maison: '🌿', bureau: '🏢',
  terrain: '🌱', parking: '🅿️', local: '🏪',
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ville: slug } = await params
  const villeRaw = deslugify(slug)
  const ville = villeRaw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  return {
    title: `Marché immobilier à ${ville} – Prix, tendances | Terranova`,
    description: `Prix au m², évolution du marché et biens disponibles à ${ville}. Consultez les statistiques immobilières et trouvez votre bien.`,
    openGraph: {
      title: `Immobilier ${ville} – Prix du marché | Terranova`,
      description: `Découvrez les prix de l'immobilier à ${ville} : vente, location, évolution des prix.`,
      type: 'website',
    },
  }
}

export default async function MarcheVillePage({ params }: Props) {
  const { ville: slug } = await params
  const villeRaw = deslugify(slug)
  const supabase = await createClient()

  // Chercher des biens dont la ville normalisée correspond au slug
  const { data: allBiens } = await supabase
    .from('biens_publics')
    .select('*')
    .not('ville', 'is', null)

  // Filtrer par slug normalisé
  const biens = (allBiens ?? []).filter(
    b => slugify(b.ville ?? '') === slug
  )

  if (!biens.length) notFound()

  const nomVille = biens[0].ville ?? villeRaw
  const villeAffichee = nomVille.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  // ── Calculs statistiques ────────────────────────────────────────────
  const vente    = biens.filter(b => b.type === 'vente')
  const location = biens.filter(b => b.type === 'location')

  function avgPrixM2(list: BienPublic[]) {
    const valid = list.filter(b => b.surface && b.surface > 5 && b.prix > 0)
    if (!valid.length) return null
    return Math.round(valid.reduce((s, b) => s + b.prix / b.surface!, 0) / valid.length)
  }

  function medianPrixM2(list: BienPublic[]) {
    const vals = list.filter(b => b.surface && b.surface > 5 && b.prix > 0)
      .map(b => b.prix / b.surface!).sort((a, b) => a - b)
    if (!vals.length) return null
    const mid = Math.floor(vals.length / 2)
    return Math.round(vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2)
  }

  const avgVente  = avgPrixM2(vente)
  const avgLoc    = avgPrixM2(location)
  const medVente  = medianPrixM2(vente)
  const minVente  = vente.length ? Math.min(...vente.map(b => b.prix)) : null
  const maxVente  = vente.length ? Math.max(...vente.map(b => b.prix)) : null
  const avgSurface = biens.filter(b => b.surface).length
    ? Math.round(biens.filter(b => b.surface).reduce((s, b) => s + b.surface!, 0) / biens.filter(b => b.surface).length)
    : null

  // Répartition par catégorie
  const byCategorie: Record<string, number> = {}
  for (const b of biens) byCategorie[b.categorie] = (byCategorie[b.categorie] ?? 0) + 1

  // Répartition DPE
  const byDpe: Record<string, number> = {}
  for (const b of biens.filter(b => b.dpe)) byDpe[b.dpe!] = (byDpe[b.dpe!] ?? 0) + 1

  // Évolution prix par mois (6 derniers mois) — depuis created_at des annonces
  const now = new Date()
  const months: { label: string; key: string }[] = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
    }
  })

  const prixParMois = months.map(m => {
    const subset = vente.filter(b => {
      const ca = b.created_at ? (b.created_at as string).slice(0, 7) : ''
      return ca === m.key
    }).filter(b => b.surface && b.surface > 5)
    const avg = subset.length
      ? Math.round(subset.reduce((s, b) => s + b.prix / b.surface!, 0) / subset.length)
      : 0
    return { date: m.label, value: avg }
  })

  // Annonces récentes
  const recentes = [...biens]
    .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
    .slice(0, 6)

  // Schema.org JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Marché immobilier à ${villeAffichee}`,
    description: `Prix au m², tendances et biens disponibles à ${villeAffichee}`,
    url: `https://terranova.fr/marche/${slug}`,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://terranova.fr' },
        { '@type': 'ListItem', position: 2, name: 'Marché', item: 'https://terranova.fr/marche' },
        { '@type': 'ListItem', position: 3, name: villeAffichee },
      ],
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="min-h-screen bg-surface">
        <SiteHeader />
        {/* Header hero */}
        <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }} className="px-6 py-14 text-white">
          <div className="max-w-5xl mx-auto">
            {/* Breadcrumb */}
            <nav className="text-xs text-white/30 flex items-center gap-1.5 mb-6">
              <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
              <span>›</span>
              <Link href="/marche" className="hover:text-white transition-colors">Marché</Link>
              <span>›</span>
              <span className="text-white/70">{villeAffichee}</span>
            </nav>

            <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-primary flex items-center gap-2 mb-3">
              <span className="w-6 h-px bg-primary" /> Marché immobilier
            </span>
            <h1 className="font-serif text-4xl xl:text-5xl mb-2">
              {villeAffichee}
            </h1>
            <p className="text-white/45 text-sm mt-2">
              {biens.length} bien{biens.length > 1 ? 's' : ''} analysé{biens.length > 1 ? 's' : ''} ·
              {vente.length > 0 && ` ${vente.length} en vente`}
              {location.length > 0 && ` · ${location.length} en location`}
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">

          {/* ── KPIs ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Prix moyen/m² (vente)', value: avgVente ? `${avgVente.toLocaleString('fr-FR')} €` : '—', sub: medVente ? `Médiane : ${medVente.toLocaleString('fr-FR')} €/m²` : '', icon: '📊', color: '#4F46E5' },
              { label: 'Loyer moyen/m²', value: avgLoc ? `${avgLoc.toLocaleString('fr-FR')} €` : '—', sub: 'par mois', icon: '🔑', color: '#0891B2' },
              { label: 'Surface moyenne', value: avgSurface ? `${avgSurface} m²` : '—', sub: 'Tous biens confondus', icon: '📐', color: '#D97706' },
              { label: 'Biens disponibles', value: biens.length.toString(), sub: `${vente.length} vente · ${location.length} location`, icon: '🏠', color: '#16A34A' },
            ].map(k => (
              <div key={k.label} className="bg-white rounded-2xl p-5 border border-navy/08">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{k.icon}</span>
                  <div className="w-2 h-2 rounded-full mt-1" style={{ background: k.color }} />
                </div>
                <div className="font-serif text-2xl text-navy mb-0.5">{k.value}</div>
                <div className="text-[11px] text-navy/50 font-medium">{k.label}</div>
                {k.sub && <div className="text-[10px] text-navy/30 mt-0.5">{k.sub}</div>}
              </div>
            ))}
          </div>

          {/* ── Fourchette de prix ───────────────────────────────────── */}
          {minVente && maxVente && (
            <div className="bg-white rounded-2xl p-6 border border-navy/08">
              <h2 className="font-medium text-navy mb-4">Fourchette de prix (vente)</h2>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-xs text-navy/40 mb-1">Entrée de gamme</div>
                  <div className="font-serif text-xl text-navy">{formatPrix(minVente, 'vente')}</div>
                </div>
                <div className="flex-1 h-2 bg-gradient-to-r from-green-400 via-primary to-purple-500 rounded-full" />
                <div className="text-center">
                  <div className="text-xs text-navy/40 mb-1">Haut de gamme</div>
                  <div className="font-serif text-xl text-navy">{formatPrix(maxVente, 'vente')}</div>
                </div>
              </div>
            </div>
          )}

          {/* ── Graphiques ───────────────────────────────────────────── */}
          <MarcheCharts
            prixParMois={prixParMois}
            byCategorie={Object.entries(byCategorie).map(([label, value]) => ({ label: CAT_LABEL[label] ?? label, value, icon: CAT_ICON[label] ?? '🏠' }))}
            byDpe={Object.entries(byDpe).sort(([a],[b]) => a.localeCompare(b)).map(([label, value]) => ({ label, value, color: DPE_COLORS[label] }))}
          />

          {/* ── Répartition par catégorie ────────────────────────────── */}
          <div className="bg-white rounded-2xl p-6 border border-navy/08">
            <h2 className="font-medium text-navy mb-5">Répartition par type de bien</h2>
            <div className="space-y-3">
              {Object.entries(byCategorie)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, count]) => (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-lg w-6 flex-shrink-0">{CAT_ICON[cat] ?? '🏠'}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-navy">{CAT_LABEL[cat] ?? cat}</span>
                        <span className="text-navy/50">{count} · {Math.round((count / biens.length) * 100)}%</span>
                      </div>
                      <div className="h-1.5 bg-navy/06 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full"
                          style={{ width: `${(count / biens.length) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* ── Répartition DPE ──────────────────────────────────────── */}
          {Object.keys(byDpe).length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-navy/08">
              <h2 className="font-medium text-navy mb-5">Performance énergétique (DPE)</h2>
              <div className="flex items-end gap-2 h-24">
                {['A','B','C','D','E','F','G'].map(l => {
                  const count = byDpe[l] ?? 0
                  const max = Math.max(...Object.values(byDpe))
                  const pct = max > 0 ? (count / max) * 100 : 0
                  return (
                    <div key={l} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-navy/50 font-medium">{count > 0 ? count : ''}</span>
                      <div className="w-full rounded-t-md transition-all"
                        style={{ height: `${Math.max(pct, count > 0 ? 8 : 0)}%`, background: DPE_COLORS[l], opacity: count > 0 ? 1 : 0.15 }} />
                      <span className="text-xs font-bold" style={{ color: DPE_COLORS[l] }}>{l}</span>
                    </div>
                  )
                })}
              </div>
              {(() => {
                const bonsTotal = (byDpe['A'] ?? 0) + (byDpe['B'] ?? 0) + (byDpe['C'] ?? 0)
                const pct = biens.filter(b => b.dpe).length > 0 ? Math.round((bonsTotal / biens.filter(b => b.dpe).length) * 100) : 0
                return pct > 0 ? (
                  <p className="text-xs text-navy/40 mt-3">{pct}% des biens ont un DPE A, B ou C</p>
                ) : null
              })()}
            </div>
          )}

          {/* ── Annonces récentes ─────────────────────────────────────── */}
          {recentes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-serif text-2xl text-navy">Dernières annonces</h2>
                <Link href={`/annonces?ville=${encodeURIComponent(nomVille)}`}
                  className="text-sm text-primary hover:underline">
                  Voir tout →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentes.map(b => (
                  <Link key={b.id} href={`/annonce/${b.id}`}
                    className="bg-white rounded-2xl overflow-hidden border border-navy/08 hover:border-primary/40 hover:-translate-y-0.5 transition-all group block">
                    <div className="relative h-36 bg-gradient-to-br from-[#e0ddd8] to-[#c8c4bc] overflow-hidden">
                      {b.photo_url
                        ? <Image src={b.photo_url} alt={b.titre} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="33vw" />
                        : <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">{CAT_ICON[b.categorie] ?? '🏠'}</div>
                      }
                      <span className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded text-white"
                        style={{ background: b.type === 'vente' ? '#4F46E5' : '#0891B2' }}>
                        {b.type === 'vente' ? 'Vente' : 'Location'}
                      </span>
                      {b.dpe && (
                        <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                          style={{ background: DPE_COLORS[b.dpe] }}>{b.dpe}</span>
                      )}
                    </div>
                    <div className="p-3.5">
                      <div className="font-serif text-base text-navy">{formatPrix(b.prix, b.type)}</div>
                      <div className="text-xs text-navy/70 mt-0.5 truncate">{b.titre}</div>
                      <div className="flex gap-2 mt-1.5 text-[10px] text-navy/40">
                        {b.surface && <span>{b.surface} m²</span>}
                        {(b.pieces ?? 0) > 0 && <span>{b.pieces} p.</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── CTA ──────────────────────────────────────────────────── */}
          <div className="bg-navy rounded-2xl p-8 text-center text-white">
            <h2 className="font-serif text-2xl mb-2">Vous avez un bien à {villeAffichee} ?</h2>
            <p className="text-white/50 text-sm mb-6">Publiez votre annonce gratuitement et touchez des milliers d'acheteurs.</p>
            <div className="flex justify-center gap-3">
              <Link href="/publier" className="bg-primary text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors">
                Publier une annonce →
              </Link>
              <Link href="/estimer" className="border border-white/20 text-white/70 text-sm px-6 py-3 rounded-xl hover:border-white/40 hover:text-white transition-all">
                Estimer mon bien
              </Link>
            </div>
          </div>

        </div>
        <SiteFooter />
      </div>
    </>
  )
}
