import { createAdminClient } from '@/lib/supabase/admin'
import MapAdsClient from './MapAdsClient'
import type { MapAd } from '@/lib/mapAds'

export default async function AdminMapAdsPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('map_ads')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-[#0F172A] mb-1">Publicités sur la carte</h1>
        <p className="text-sm text-[#0F172A]/50">
          Gérez les emplacements publicitaires affichés sur la carte interactive
        </p>
      </div>
      <MapAdsClient ads={(data ?? []) as MapAd[]} />
    </div>
  )
}
