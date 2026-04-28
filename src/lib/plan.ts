import { createAdminClient } from './supabase/admin'
import type { PlanType } from './types'

export interface PlanConfig {
  annonces: number
  photos: number
  duree_jours: number
  prix: number       // en euros, mensuel
  stripe_price_id?: string
}

export type PlanConfigs = Record<PlanType, PlanConfig>

// Valeurs par défaut (fallback si la table plan_config n'existe pas)
export const DEFAULT_PLAN_CONFIG: PlanConfigs = {
  gratuit:     { annonces: 3,   photos: 5,  duree_jours: 30,  prix: 0  },
  pro_mensuel: { annonces: 50,  photos: 20, duree_jours: 30,  prix: 29,  stripe_price_id: '' },
  pro_annuel:  { annonces: 999, photos: 20, duree_jours: 365, prix: 249, stripe_price_id: '' },
}

// Récupère la config des plans depuis la DB (avec fallback)
export async function getPlanConfig(): Promise<PlanConfigs> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.from('plan_config').select('*')
    if (error || !data || data.length === 0) return DEFAULT_PLAN_CONFIG

    const config = structuredClone(DEFAULT_PLAN_CONFIG) as PlanConfigs
    for (const row of data) {
      const plan = row.plan as PlanType
      if (plan in config) {
        config[plan] = {
          annonces:       row.annonces       ?? config[plan].annonces,
          photos:         row.photos         ?? config[plan].photos,
          duree_jours:    row.duree_jours    ?? config[plan].duree_jours,
          prix:           row.prix           ?? config[plan].prix,
          stripe_price_id: row.stripe_price_id ?? config[plan].stripe_price_id,
        }
      }
    }
    return config
  } catch {
    return DEFAULT_PLAN_CONFIG
  }
}

// Vérifie si le plan est expiré
// expire_at = null sur un plan pro signifie "illimité" (pas expiré)
export function isPlanExpired(plan: PlanType, expire_at?: string | null): boolean {
  if (plan === 'gratuit') return false
  if (!expire_at) return false
  return new Date(expire_at) < new Date()
}

// Retourne le plan effectif (dégradé si expiré)
export function getEffectivePlan(plan: PlanType, expire_at?: string | null): PlanType {
  if (isPlanExpired(plan, expire_at)) return 'gratuit'
  return plan
}

// Label lisible
export const PLAN_LABEL: Record<PlanType, string> = {
  gratuit:     'Gratuit',
  pro_mensuel: 'Pro Mensuel',
  pro_annuel:  'Pro Annuel',
}
