import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AnnonceCard from '@/components/AnnonceCard'
import { getViewUserId } from '@/lib/impersonation'
import PageHeader from '@/components/compte/ui/PageHeader'
import EmptyState from '@/components/compte/ui/EmptyState'
import { POI_GROUPES } from '@/lib/poi'

const CAT_LABEL: Record<string, string> = {
  appartement: 'Appartement', maison: 'Maison', studio: 'Studio / T1', villa: 'Villa',
  chalet: 'Chalet', loft: 'Loft / Atelier', colocation: 'Colocation',
  bureau: 'Bureau', local: 'Local commercial', restaurant: 'Restaurant',
  entrepot: 'Entrepôt', hotel: 'Hôtel', fonds_commerce: 'Fonds de commerce',
  murs_commerciaux: 'Murs commerciaux', terrain: 'Terrain',
  terrain_agricole: 'Terrain agricole', terrain_constructible: 'Terrain constructible',
  parking: 'Parking',
}

function formatPrix(n: number) { return n.toLocaleString('fr-FR') + ' €' }

export default async function SuggestionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/compte/suggestions')

  const viewId = await getViewUserId() ?? user.id
  const admin  = createAdminClient()

  // Critères du profil chercheur
  const { data: r } = await admin
    .from('recherches')
    .select('*')
    .eq('user_id', viewId)
    .single()

  // ── Construction de la requête ──────────────────────────────────────────────
  let query = admin
    .from('biens_publics')
    .select('*')
    .eq('statut', 'publie')
    .order('featured',  { ascending: false })
    .order('publie_at', { ascending: false })
    .limit(48)

  let usedGeoFilter = false

  if (r) {
    // Type vente / location
    if (r.type) query = query.eq('type', r.type)

    // Catégories de bien
    if (r.categories?.length > 0) query = query.in('categorie', r.categories)

    // ── Localisation ──
    // Si ville + rayon_km : bounding box géographique (englobe ville + communes voisines)
    if (r.ville && r.rayon_km) {
      const { data: centerData } = await admin
        .from('biens')
        .select('lat, lng')
        .ilike('ville', `%${r.ville}%`)
        .not('lat', 'is', null)
        .not('lng', 'is', null)
        .limit(100)

      if (centerData && centerData.length >= 2) {
        const avgLat = centerData.reduce((s: number, b: any) => s + b.lat, 0) / centerData.length
        const avgLng = centerData.reduce((s: number, b: any) => s + b.lng, 0) / centerData.length
        const degLat = r.rayon_km / 111
        const degLng = r.rayon_km / (111 * Math.cos(avgLat * Math.PI / 180))
        query = query
          .gte('lat', avgLat - degLat).lte('lat', avgLat + degLat)
          .gte('lng', avgLng - degLng).lte('lng', avgLng + degLng)
        usedGeoFilter = true
      }
    }

    // Si ville seule (sans rayon ou rayon introuvable) : filtre textuel
    if (r.ville && !usedGeoFilter) query = query.ilike('ville', `%${r.ville}%`)

    // Code postal (précision supplémentaire si pas de rayon géo)
    if (r.code_postal && !usedGeoFilter) query = query.eq('code_postal', r.code_postal)

    // Prix
    if (r.prix_min) query = query.gte('prix', r.prix_min)
    if (r.prix_max) query = query.lte('prix', r.prix_max)

    // Surface
    if (r.surface_min) query = query.gte('surface', r.surface_min)
    if (r.surface_max) query = query.lte('surface', r.surface_max)

    // Pièces
    if (r.pieces_min) query = query.gte('pieces', r.pieces_min)

    // Score de quartier (lié aux POI)
    if (r.score_quartier_min > 0) query = query.gte('score_quartier', r.score_quartier_min)
  }

  const { data: biens } = await query
  const results = biens ?? []

  // ── Résumé lisible des critères actifs ─────────────────────────────────────
  const lignes: string[] = []
  if (r) {
    if (r.type) lignes.push(r.type === 'vente' ? 'Vente' : 'Location')
    if (r.categories?.length) lignes.push(r.categories.map((c: string) => CAT_LABEL[c] ?? c).join(', '))
    if (r.ville && usedGeoFilter)   lignes.push(`${r.ville} + ${r.rayon_km} km alentour`)
    if (r.ville && !usedGeoFilter)  lignes.push(r.ville)
    if (r.code_postal && !usedGeoFilter) lignes.push(r.code_postal)
    if (r.prix_min && r.prix_max)   lignes.push(`${formatPrix(r.prix_min)} – ${formatPrix(r.prix_max)}`)
    else if (r.prix_min)            lignes.push(`min ${formatPrix(r.prix_min)}`)
    else if (r.prix_max)            lignes.push(`max ${formatPrix(r.prix_max)}`)
    if (r.surface_min && r.surface_max) lignes.push(`${r.surface_min} – ${r.surface_max} m²`)
    else if (r.surface_min)         lignes.push(`${r.surface_min} m² min`)
    else if (r.surface_max)         lignes.push(`${r.surface_max} m² max`)
    if (r.pieces_min)               lignes.push(`${r.pieces_min} pièce${r.pieces_min > 1 ? 's' : ''} min`)
  }

  // POI précis avec label et couleur
  const poisAffiches = (r?.poi_priorites ?? []).map((key: string) => {
    for (const groupe of POI_GROUPES) {
      const found = groupe.pois.find(p => p.key === key)
      if (found) return { key, label: found.label, emoji: found.emoji, color: groupe.categorie.color }
    }
    return { key, label: key, emoji: '📍', color: '#7f8c8d' }
  })

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <PageHeader
        title="Mes suggestions"
        description={r
          ? `${results.length} bien${results.length > 1 ? 's' : ''} correspond${results.length > 1 ? 'ent' : ''} à vos critères`
          : 'Définissez vos critères pour voir des suggestions'}
        action={
          <Link href="/compte/chercheur"
            className="text-xs border border-navy/20 text-navy/60 px-3 py-2 rounded-lg hover:border-navy/40 hover:text-navy transition-colors whitespace-nowrap">
            ✏️ Modifier mes critères
          </Link>
        }
      />

      {/* Résumé des critères */}
      {r && (
        <div className="mb-6 bg-primary/05 border border-primary/15 rounded-xl px-4 py-3 space-y-2.5">

          {/* Ligne texte des critères principaux */}
          <div className="flex items-start gap-3">
            <span className="text-lg mt-0.5">🔍</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-primary mb-0.5">Critères appliqués</p>
              {lignes.length > 0
                ? <p className="text-xs text-navy/60">{lignes.join(' · ')}</p>
                : <p className="text-xs text-navy/40 italic">Aucun filtre — tous les biens</p>
              }
            </div>
            <Link href="/compte/chercheur"
              className="text-[11px] text-primary hover:underline whitespace-nowrap flex-shrink-0 mt-0.5">
              Modifier →
            </Link>
          </div>

          {/* Bloc POI — séparé car indicatif */}
          {poisAffiches.length > 0 && (
            <div className="pt-2 border-t border-primary/10">
              <p className="text-[10px] text-navy/40 uppercase tracking-wider mb-1.5 font-medium">
                Proximité souhaitée
                {r.rayon_poi_km && (
                  <span className="ml-1 normal-case font-normal">
                    · dans {r.rayon_poi_km < 1 ? `${r.rayon_poi_km * 1000} m` : `${r.rayon_poi_km} km`} (indicatif)
                  </span>
                )}
                {r.score_quartier_min > 0 && (
                  <span className="ml-1 normal-case font-normal">· score quartier ≥ {r.score_quartier_min}/10</span>
                )}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {poisAffiches.map((poi: any) => (
                  <span key={poi.key}
                    className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full text-white"
                    style={{ background: poi.color }}>
                    {poi.emoji} {poi.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pas de profil chercheur */}
      {!r && (
        <EmptyState
          icon="🔍"
          title="Aucun critère enregistré"
          action={
            <Link href="/compte/chercheur"
              className="inline-block bg-primary text-white text-sm px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors">
              Définir mes critères
            </Link>
          }
        />
      )}

      {/* Pas de résultats */}
      {r && results.length === 0 && (
        <EmptyState
          icon="🏠"
          title="Aucun bien ne correspond à vos critères pour le moment"
          action={
            <Link href="/compte/chercheur"
              className="inline-block border border-navy/20 text-navy/60 text-sm px-5 py-2.5 rounded-xl hover:border-navy/40 transition-colors">
              Élargir mes critères
            </Link>
          }
        />
      )}

      {/* Grille */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((bien: any) => (
            <AnnonceCard key={bien.id} bien={bien}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
          ))}
        </div>
      )}

      {/* Lien alertes */}
      {r && (
        <div className="mt-8 pt-6 border-t border-navy/08 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-xs text-navy/40">
            Vous voulez être averti par email dès qu'un nouveau bien correspond ?
          </p>
          <Link href="/compte/alertes"
            className="text-xs text-primary hover:underline font-medium whitespace-nowrap">
            🔔 Créer une alerte email →
          </Link>
        </div>
      )}
    </div>
  )
}
