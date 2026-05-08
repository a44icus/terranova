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

export default async function SuggestionsPage() {
  const supabase  = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/compte/suggestions')

  const viewId = await getViewUserId() ?? user.id
  const admin  = createAdminClient()

  // Charger les critères du profil chercheur
  const { data: recherche } = await admin
    .from('recherches')
    .select('*')
    .eq('user_id', viewId)
    .single()

  // Construire la requête sur biens_publics en appliquant les critères
  let query = admin
    .from('biens_publics')
    .select('*')
    .eq('statut', 'publie')
    .order('featured', { ascending: false })
    .order('publie_at',  { ascending: false })
    .limit(48)

  if (recherche) {
    if (recherche.type)                    query = query.eq('type', recherche.type)
    if (recherche.categories?.length > 0)  query = query.in('categorie', recherche.categories)
    if (recherche.ville)                   query = query.ilike('ville', `%${recherche.ville}%`)
    if (recherche.code_postal)             query = query.eq('code_postal', recherche.code_postal)
    if (recherche.prix_min)                query = query.gte('prix', recherche.prix_min)
    if (recherche.prix_max)                query = query.lte('prix', recherche.prix_max)
    if (recherche.surface_min)             query = query.gte('surface', recherche.surface_min)
    if (recherche.surface_max)             query = query.lte('surface', recherche.surface_max)
    if (recherche.pieces_min)              query = query.gte('pieces', recherche.pieces_min)
    if (recherche.score_quartier_min > 0)  query = query.gte('score_quartier', recherche.score_quartier_min)
  }

  const { data: biens } = await query
  const results = biens ?? []

  // Résumé des critères actifs
  function criteresSummary() {
    if (!recherche) return null
    const parts: string[] = []
    if (recherche.type) parts.push(recherche.type === 'vente' ? 'Vente' : 'Location')
    if (recherche.categories?.length) parts.push(recherche.categories.map((c: string) => CAT_LABEL[c] ?? c).join(', '))
    if (recherche.ville) parts.push(recherche.ville)
    if (recherche.score_quartier_min > 0) parts.push(`Quartier ≥ ${recherche.score_quartier_min}/10`)
    if (recherche.prix_min || recherche.prix_max) {
      const min = recherche.prix_min ? `${recherche.prix_min.toLocaleString('fr-FR')} €` : ''
      const max = recherche.prix_max ? `${recherche.prix_max.toLocaleString('fr-FR')} €` : ''
      parts.push(min && max ? `${min} – ${max}` : min ? `min ${min}` : `max ${max}`)
    }
    if (recherche.surface_min) parts.push(`${recherche.surface_min} m² min`)
    if (recherche.pieces_min)  parts.push(`${recherche.pieces_min} pièces min`)
    return parts.join(' · ') || 'Tous les biens'
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <PageHeader
        title="Mes suggestions"
        description={recherche
          ? `${results.length} bien${results.length > 1 ? 's' : ''} correspond${results.length > 1 ? 'ent' : ''} à vos critères`
          : 'Biens sélectionnés pour vous'
        }
        action={
          <Link href="/compte/chercheur"
            className="text-xs border border-navy/20 text-navy/60 px-3 py-2 rounded-lg hover:border-navy/40 hover:text-navy transition-colors whitespace-nowrap">
            ✏️ Modifier mes critères
          </Link>
        }
      />

      {/* Résumé des critères */}
      {recherche && (
        <div className="mb-6 bg-primary/05 border border-primary/15 rounded-xl px-4 py-3 space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-lg">🔍</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-primary">Vos critères de recherche</p>
              <p className="text-xs text-navy/60 mt-0.5 truncate">{criteresSummary()}</p>
            </div>
            <Link href="/compte/chercheur"
              className="text-[11px] text-primary hover:underline whitespace-nowrap flex-shrink-0">
              Modifier →
            </Link>
          </div>
          {recherche.poi_priorites?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-primary/10">
              {recherche.poi_priorites.map((key: string) => {
                // Retrouver le POI précis et sa couleur de groupe
                let poiLabel = key, poiEmoji = '📍', poiColor = '#7f8c8d'
                for (const groupe of POI_GROUPES) {
                  const found = groupe.pois.find(p => p.key === key)
                  if (found) { poiLabel = found.label; poiEmoji = found.emoji; poiColor = groupe.categorie.color; break }
                }
                return (
                  <span key={key}
                    className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full text-white"
                    style={{ background: poiColor }}>
                    {poiEmoji} {poiLabel}
                  </span>
                )
              })}
              {recherche.rayon_poi_km && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-navy/10 text-navy/70">
                  📍 dans {recherche.rayon_poi_km < 1 ? `${recherche.rayon_poi_km * 1000} m` : `${recherche.rayon_poi_km} km`}
                </span>
              )}
              {recherche.score_quartier_min > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-navy/10 text-navy/70">
                  ⭐ Score ≥ {recherche.score_quartier_min}/10
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pas de profil chercheur */}
      {!recherche && (
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

      {/* Pas de résultats malgré des critères */}
      {recherche && results.length === 0 && (
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

      {/* Grille de résultats */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((bien: any) => (
            <AnnonceCard
              key={bien.id}
              bien={bien}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ))}
        </div>
      )}

      {/* Lien vers les alertes email */}
      {recherche && (
        <div className="mt-8 pt-6 border-t border-navy/08 flex items-center justify-between">
          <p className="text-xs text-navy/40">
            Vous voulez être averti par email dès qu'un nouveau bien correspond ?
          </p>
          <Link href="/compte/alertes"
            className="text-xs text-primary hover:underline font-medium whitespace-nowrap ml-4">
            🔔 Créer une alerte email →
          </Link>
        </div>
      )}
    </div>
  )
}
