import { createAdminClient } from '@/lib/supabase/admin'
import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://terranova-beta.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient()

  const [{ data: biens }, { data: chercheurs }, { data: agences }, { data: reseaux }, { data: articles }] = await Promise.all([
    supabase
      .from('biens')
      .select('id, updated_at')
      .eq('statut', 'publie')
      .order('updated_at', { ascending: false })
      .limit(5000),
    supabase
      .from('recherches')
      .select('id, updated_at')
      .eq('actif', true)
      .limit(1000),
    supabase
      .from('profiles')
      .select('id, updated_at')
      .eq('type', 'pro')
      .gt('annonces_actives', 0)
      .limit(500),
    supabase
      .from('reseaux')
      .select('slug, updated_at')
      .limit(200),
    supabase
      .from('articles')
      .select('slug, updated_at')
      .eq('publie', true)
      .limit(500),
  ])

  const bienEntries: MetadataRoute.Sitemap = (biens ?? []).map(b => ({
    url: `${BASE_URL}/annonce/${b.id}`,
    lastModified: new Date(b.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const chercheurEntries: MetadataRoute.Sitemap = (chercheurs ?? []).map(c => ({
    url: `${BASE_URL}/chercheurs/${c.id}`,
    lastModified: new Date(c.updated_at),
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  const agenceEntries: MetadataRoute.Sitemap = (agences ?? []).map(a => ({
    url: `${BASE_URL}/vendeur/${a.id}`,
    lastModified: new Date(a.updated_at),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  const reseauEntries: MetadataRoute.Sitemap = (reseaux ?? []).map(r => ({
    url: `${BASE_URL}/agences/reseau/${r.slug}`,
    lastModified: new Date(r.updated_at),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const articleEntries: MetadataRoute.Sitemap = (articles ?? []).map(a => ({
    url: `${BASE_URL}/blog/${a.slug}`,
    lastModified: new Date(a.updated_at),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [
    { url: BASE_URL,                               lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/carte`,                    lastModified: new Date(), changeFrequency: 'always',  priority: 0.9 },
    { url: `${BASE_URL}/annonces`,                 lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${BASE_URL}/agences`,                  lastModified: new Date(), changeFrequency: 'daily',   priority: 0.7 },
    { url: `${BASE_URL}/blog`,                     lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE_URL}/marche`,                   lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE_URL}/estimer`,                  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/chercheurs`,               lastModified: new Date(), changeFrequency: 'daily',   priority: 0.6 },
    { url: `${BASE_URL}/publicite`,                lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/legal/mentions-legales`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/legal/confidentialite`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/legal/cgu`,                lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    ...bienEntries,
    ...chercheurEntries,
    ...agenceEntries,
    ...reseauEntries,
    ...articleEntries,
  ]
}
