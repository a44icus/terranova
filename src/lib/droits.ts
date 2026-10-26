/**
 * lib/droits.ts — Ce qu'un utilisateur a le droit de faire selon son plan.
 *
 * Le plan pris en compte est le plan effectif (un plan payant expiré redevient « gratuit »).
 * Les limites (nombre d'annonces, photos, 360°…) sont aussi vérifiées en base par des
 * triggers (supabase/migrations/20261026_droits_plans.sql) : ce module sert à adapter
 * l'interface et à protéger les routes serveur, la base reste la garantie finale.
 */
import { createAdminClient } from '@/lib/supabase/admin'
import { getPlanConfig, getEffectivePlan, ALL_FEATURES, type PlanConfig } from '@/lib/plan'
import type { PlanType } from '@/lib/types'

export type FeatureKey =
  | 'photos_360' | 'badge_pro' | 'annonces_mises_en_avant' | 'coup_de_coeur' | 'ref_agence'
  | 'stats_avancees' | 'score_quartier' | 'estimation'
  | 'messagerie' | 'demande_visite' | 'alerte_email'
  | 'multi_utilisateurs' | 'api_acces' | 'support_prioritaire'

export interface Droits {
  plan:   PlanType
  config: PlanConfig
  /** true si le plan inclut la feature (toujours true pour une feature « public »). */
  a:      (feature: FeatureKey) => boolean
}

const FEATURES_PUBLIQUES = new Set(ALL_FEATURES.filter(f => f.statut === 'public').map(f => f.key))

export function droitsDepuis(plan: PlanType, planExpireAt: string | null | undefined, configs: Record<PlanType, PlanConfig>): Droits {
  const effectif = getEffectivePlan(plan, planExpireAt)
  const config = configs[effectif] ?? configs.gratuit
  const features = new Set(config.features ?? [])
  return {
    plan: effectif,
    config,
    a: feature => FEATURES_PUBLIQUES.has(feature) || features.has(feature),
  }
}

/** Droits d'un utilisateur (lecture en service role : utilisable pour le vendeur d'une annonce). */
export async function getDroits(userId: string): Promise<Droits> {
  const [{ data: profile }, configs] = await Promise.all([
    createAdminClient().from('profiles').select('plan, plan_expire_at').eq('id', userId).maybeSingle(),
    getPlanConfig(),
  ])
  return droitsDepuis((profile?.plan as PlanType) ?? 'gratuit', profile?.plan_expire_at, configs)
}
