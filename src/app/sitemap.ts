import { createClient } from '@/lib/supabase/server'
import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://terranova.fr'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  const { data: biens } = await supabase
    .from('biens')
    .select('id, updated_at')
    .eq('statut', 'publie')
    .order('updated_at', { ascending: false })
    .limit(1000)

  const bienEntries: MetadataRoute.Sitemap = (biens ?? []).map(b => ({
    url: `${BASE_URL}/annonce/${b.id}`,
    lastModified: new Date(b.updated_at),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [
    { url: BASE_URL,                                    lastModified: new Date(), changeFrequency: 'daily',   priority: 1   },
    { url: `${BASE_URL}/annonces`,                      lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/carte`,                         lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/publier`,                       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/legal/mentions-legales`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/legal/confidentialite`,         lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/legal/cgu`,                     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    ...bienEntries,
  ]
}
