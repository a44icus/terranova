'use server'

import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { ALL_FEATURES } from '@/lib/plan'

async function checkAdmin() { await requireAdmin() }

export async function updatePlanConfig(formData: FormData) {
  await checkAdmin()
  const supabase = createAdminClient()
  const featureKeys = ALL_FEATURES.map(f => f.key)

  // Helpers
  const int = (name: string, fallback = 0) =>
    parseInt(formData.get(name) as string) || fallback
  const str = (name: string) =>
    (formData.get(name) as string)?.trim() || null
  // getAll() est nécessaire car chaque checkbox a un <input type="hidden" value="off"> avant elle.
  // formData.get() retourne la PREMIÈRE valeur (toujours "off"), getAll().includes("on") est correct.
  const bool = (name: string) =>
    formData.getAll(name).includes('on')
  const features = (tier: string) =>
    featureKeys.filter(key => formData.getAll(`${tier}_feature_${key}`).includes('on'))

  // ── 5 lignes plan_config ─────────────────────────────────────────────────────
  //   Les champs partagés (annonces, photos, features…) viennent du tier.
  //   Seuls prix et stripe_price_id sont propres à chaque variante de facturation.
  const planRows = [
    {
      plan: 'gratuit',
      annonces:        int('gratuit_annonces', 1),
      photos:          int('gratuit_photos', 10),
      duree_jours:     int('gratuit_duree_jours', 90),
      prix:            0,
      stripe_price_id: null,
      label:       str('gratuit_label'),
      description: str('gratuit_description'),
      actif:       bool('gratuit_actif'),
      features:    features('gratuit'),
    },
    {
      plan: 'pro_mensuel',
      annonces:        int('pro_annonces', 10),
      photos:          int('pro_photos', 20),
      duree_jours:     30,
      prix:            int('pro_mensuel_prix', 29),
      stripe_price_id: str('pro_mensuel_stripe_price_id'),
      label:       str('pro_label'),
      description: str('pro_description'),
      actif:       bool('pro_actif'),
      features:    features('pro'),
    },
    {
      plan: 'pro_annuel',
      annonces:        int('pro_annonces', 10),
      photos:          int('pro_photos', 20),
      duree_jours:     365,
      prix:            int('pro_annuel_prix', 249),
      stripe_price_id: str('pro_annuel_stripe_price_id'),
      label:       str('pro_label'),
      description: str('pro_description'),
      actif:       bool('pro_actif'),
      features:    features('pro'),
    },
    {
      plan: 'agence_mensuel',
      annonces:        int('agence_annonces', 999),
      photos:          int('agence_photos', 30),
      duree_jours:     30,
      prix:            int('agence_mensuel_prix', 79),
      stripe_price_id: str('agence_mensuel_stripe_price_id'),
      label:       str('agence_label'),
      description: str('agence_description'),
      actif:       bool('agence_actif'),
      features:    features('agence'),
    },
    {
      plan: 'agence_annuel',
      annonces:        int('agence_annonces', 999),
      photos:          int('agence_photos', 30),
      duree_jours:     365,
      prix:            int('agence_annuel_prix', 699),
      stripe_price_id: str('agence_annuel_stripe_price_id'),
      label:       str('agence_label'),
      description: str('agence_description'),
      actif:       bool('agence_actif'),
      features:    features('agence'),
    },
  ] as const

  // Tout va dans plan_config, source unique (voir getPlanConfig dans lib/plan.ts)
  const updated_at = new Date().toISOString()
  const { error } = await supabase
    .from('plan_config')
    .upsert(planRows.map(row => ({ ...row, features: [...row.features], updated_at })), { onConflict: 'plan' })
  if (error) {
    const migration = /column .* does not exist|Could not find the '.*' column/i.test(error.message)
      ? ' — exécutez supabase/migrations/20261026_plan_config_unifie.sql'
      : ''
    throw new Error(`Erreur plan_config: ${error.message}${migration}`)
  }

  // Les avantages déjà appliqués aux annonces (badge Pro, mise en avant…) suivent la nouvelle config
  const { error: syncError } = await supabase.rpc('sync_biens_plan')
  if (syncError) console.warn('[updatePlanConfig] sync_biens_plan:', syncError.message)

  revalidatePath('/admin/parametres')
  revalidatePath('/compte/plan')
}

export async function updateCategoriesActives(formData: FormData) {
  await checkAdmin()
  const supabase = createAdminClient()

  const ALL_CATS = [
    'appartement','maison','studio','villa','chalet','loft','colocation',
    'bureau','local','restaurant','entrepot','hotel','fonds_commerce','murs_commerciaux',
    'terrain','terrain_agricole','terrain_constructible','parking',
  ]

  const actives = ALL_CATS.filter(cat => formData.getAll(`cat_${cat}`).includes('on'))

  const { data: existing } = await supabase
    .from('site_settings').select('settings').eq('id', 1).single()
  const current = (existing?.settings as Record<string, unknown>) ?? {}

  const { error } = await supabase
    .from('site_settings')
    .upsert({ id: 1, settings: { ...current, categories_actives: actives } }, { onConflict: 'id' })
  if (error) throw new Error(`Erreur catégories: ${error.message}`)

  revalidatePath('/admin/parametres')
  revalidatePath('/publier')
}
