// ════════════════════════════════════════════════════════════════════
//  MODIFICATIONS À APPLIQUER — src/app/carte/page.tsx
// ════════════════════════════════════════════════════════════════════
//
// 1. Ajouter l'import du type MapAd après les autres imports :
//
//    import type { MapAd } from '@/lib/mapAds'
//
//
// 2. Dans la fonction CartePage, après la récupération de `biens`,
//    ajouter la requête pour les pubs :
//
//    const { data: ads } = await supabase
//      .from('map_ads')
//      .select('*')
//      .eq('actif', true)
//
//
// 3. Passer les ads à MapApp :
//
//    <MapApp
//      biens={biens ?? []}
//      user={user}
//      initialBienId={initialBienId}
//      carteSettings={carteSettings}
//      ads={ads ?? []}          // ← AJOUTER
//    />
//
// ════════════════════════════════════════════════════════════════════
//  VERSION COMPLÈTE DU FICHIER MODIFIÉ
// ════════════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MapApp from '@/components/map/MapApp'
import Header from '@/components/Header'
import { getSiteSettings } from '@/lib/siteSettings'
import type { MapStyleKey } from '@/lib/mapStyles'
import type { MapAd } from '@/lib/mapAds'   // ← NOUVEAU

interface Props {
  searchParams: Promise<{ bien?: string }>
}

export default async function CartePage({ searchParams }: Props) {
  const supabase = await createClient()
  const [{ bien: initialBienId }, settings] = await Promise.all([
    searchParams,
    getSiteSettings(),
  ])

  if (!settings.marche_active) redirect('/')

  const [
    { data: { user } },
    { data: biens },
    { data: ads },             // ← NOUVEAU
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('biens_publics').select('*')
      .order('featured', { ascending: false })
      .order('publie_at', { ascending: false })
      .limit(settings.carte_biens_max),
    supabase.from('map_ads').select('*').eq('actif', true),  // ← NOUVEAU
  ])

  let unreadCount = 0
  if (user) {
    const { count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('vendeur_id', user.id)
      .eq('lu', false)
    unreadCount = count ?? 0
  }

  const carteSettings = {
    lat:            settings.carte_lat,
    lng:            settings.carte_lng,
    zoom:           settings.carte_zoom,
    style:          settings.carte_style as MapStyleKey,
    heatmapDefaut:  settings.heatmap_defaut,
    zoomMin:        settings.carte_zoom_min,
    zoomMax:        settings.carte_zoom_max,
    clusteringSeuil: settings.clustering_seuil,
    heatmapOpacite: settings.heatmap_opacite,
    poiDistanceMax: settings.poi_distance_max_m,
    devise:         settings.marche_devise,
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header user={user} unreadCount={unreadCount} />
      <MapApp
        biens={biens ?? []}
        user={user}
        initialBienId={initialBienId}
        carteSettings={carteSettings}
        ads={(ads ?? []) as MapAd[]}   // ← NOUVEAU
      />
    </div>
  )
}
