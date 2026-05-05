import { createAdminClient } from './supabase/admin'
import type { PlanType } from './types'

// ── Toutes les features disponibles ───────────────────────────────────────────
export interface FeatureDef {
  key:   string
  label: string
  hint:  string
  group: string
}

export const ALL_FEATURES: FeatureDef[] = [
  // Publication
  { key: 'photos_360',              group: 'Publication',   label: 'Photos 360°',               hint: 'Upload et visualisation de photos immersives' },
  { key: 'badge_pro',               group: 'Publication',   label: 'Badge Pro',                  hint: 'Badge affiché sur les annonces de l\'utilisateur' },
  { key: 'annonces_mises_en_avant', group: 'Publication',   label: 'Mise en avant',              hint: 'Annonces prioritaires en tête de liste et sur la carte' },
  { key: 'coup_de_coeur',           group: 'Publication',   label: 'Label Coup de cœur',         hint: 'Badge spécial visible sur la fiche annonce' },
  { key: 'ref_agence',              group: 'Publication',   label: 'Référence agence',           hint: 'Champ référence interne sur les annonces' },
  // Statistiques
  { key: 'stats_avancees',          group: 'Statistiques',  label: 'Statistiques avancées',      hint: 'Vues, contacts, évolution dans le temps' },
  { key: 'score_quartier',          group: 'Statistiques',  label: 'Score de quartier',          hint: 'Calcul et affichage du score OSM sur les fiches' },
  { key: 'estimation',              group: 'Statistiques',  label: 'Estimateur de prix',         hint: 'Accès à l\'outil d\'estimation automatique' },
  // Communication
  { key: 'messagerie',              group: 'Communication', label: 'Messagerie intégrée',        hint: 'Réception et envoi de messages depuis la plateforme' },
  { key: 'demande_visite',          group: 'Communication', label: 'Demandes de visite',         hint: 'Formulaire de demande de visite sur les annonces' },
  { key: 'alerte_email',            group: 'Communication', label: 'Alertes email',              hint: 'Notification email à chaque nouveau message ou contact' },
  // Pro / Agence
  { key: 'multi_utilisateurs',      group: 'Pro / Agence',  label: 'Multi-utilisateurs',         hint: 'Gestion de plusieurs agents sous un compte agence' },
  { key: 'api_acces',               group: 'Pro / Agence',  label: 'Accès API',                  hint: 'Accès à l\'API REST pour import/export de biens' },
  { key: 'support_prioritaire',     group: 'Pro / Agence',  label: 'Support prioritaire',        hint: 'Réponse sous 24h par email ou chat dédié' },
]

export const FEATURE_GROUPS = [...new Set(ALL_FEATURES.map(f => f.group))]

// ── Config d'un plan ──────────────────────────────────────────────────────────
export interface PlanConfig {
  annonces:        number
  photos:          number
  duree_jours:     number
  prix:            number
  stripe_price_id?: string
  label?:          string
  description?:    string
  actif?:          boolean
  features:        string[]
}

export type PlanConfigs = Record<PlanType, PlanConfig>

// Valeurs par défaut (fallback si la table plan_config n'existe pas)
export const DEFAULT_PLAN_CONFIG: PlanConfigs = {
  gratuit: {
    annonces: 1, photos: 10, duree_jours: 90, prix: 0,
    label: 'Gratuit', description: 'Pour découvrir la plateforme',
    actif: true,
    features: ['messagerie', 'demande_visite', 'score_quartier'],
  },
  pro_mensuel: {
    annonces: 10, photos: 20, duree_jours: 30, prix: 29,
    label: 'Pro', description: 'Pour les particuliers et indépendants',
    actif: true,
    features: [
      'messagerie', 'demande_visite', 'score_quartier',
      'badge_pro', 'stats_avancees', 'photos_360',
      'alerte_email', 'ref_agence', 'estimation', 'support_prioritaire',
    ],
  },
  pro_annuel: {
    annonces: 10, photos: 20, duree_jours: 365, prix: 249,
    label: 'Pro', description: 'Pour les particuliers et indépendants',
    actif: true,
    features: [
      'messagerie', 'demande_visite', 'score_quartier',
      'badge_pro', 'stats_avancees', 'photos_360',
      'alerte_email', 'ref_agence', 'estimation', 'support_prioritaire',
    ],
  },
  agence_mensuel: {
    annonces: 999, photos: 30, duree_jours: 30, prix: 79,
    label: 'Agence', description: 'Pour les professionnels et agences',
    actif: true,
    features: [
      'messagerie', 'demande_visite', 'score_quartier',
      'badge_pro', 'stats_avancees', 'photos_360',
      'alerte_email', 'ref_agence', 'estimation',
      'annonces_mises_en_avant', 'coup_de_coeur',
      'multi_utilisateurs', 'api_acces', 'support_prioritaire',
    ],
  },
  agence_annuel: {
    annonces: 999, photos: 30, duree_jours: 365, prix: 699,
    label: 'Agence', description: 'Pour les professionnels et agences',
    actif: true,
    features: [
      'messagerie', 'demande_visite', 'score_quartier',
      'badge_pro', 'stats_avancees', 'photos_360',
      'alerte_email', 'ref_agence', 'estimation',
      'annonces_mises_en_avant', 'coup_de_coeur',
      'multi_utilisateurs', 'api_acces', 'support_prioritaire',
    ],
  },
}

// ── Récupère la config depuis la DB ──────────────────────────────────────────
// Stratégie deux sources :
//   - plan_config (table existante) → données numériques + Stripe
//   - site_settings.plans_meta (JSONB) → label, description, actif, features
export async function getPlanConfig(): Promise<PlanConfigs> {
  try {
    const supabase = createAdminClient()

    const [{ data: rows }, { data: settings }] = await Promise.all([
      supabase.from('plan_config').select('*'),
      supabase.from('site_settings').select('settings').eq('id', 1).single(),
    ])

    const config = structuredClone(DEFAULT_PLAN_CONFIG) as PlanConfigs

    // 1. Données numériques depuis plan_config
    for (const row of rows ?? []) {
      const plan = row.plan as PlanType
      if (!(plan in config)) continue
      config[plan].annonces        = row.annonces        ?? config[plan].annonces
      config[plan].photos          = row.photos          ?? config[plan].photos
      config[plan].duree_jours     = row.duree_jours     ?? config[plan].duree_jours
      config[plan].prix            = row.prix            ?? config[plan].prix
      config[plan].stripe_price_id = row.stripe_price_id ?? config[plan].stripe_price_id
    }

    // 2. Métadonnées depuis site_settings.plans_meta
    const meta = (settings?.settings as Record<string, unknown>)?.plans_meta as Record<string, Partial<PlanConfig>> | undefined
    if (meta) {
      for (const plan of Object.keys(config) as PlanType[]) {
        const m = meta[plan]
        if (!m) continue
        if (m.label       !== undefined) config[plan].label       = m.label
        if (m.description !== undefined) config[plan].description = m.description
        if (m.actif       !== undefined) config[plan].actif       = m.actif
        if (m.features    !== undefined) config[plan].features    = m.features
      }
    }

    return config
  } catch {
    return DEFAULT_PLAN_CONFIG
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function isPlanExpired(plan: PlanType, expire_at?: string | null): boolean {
  if (plan === 'gratuit') return false
  if (!expire_at) return false
  return new Date(expire_at) < new Date()
}

export function getEffectivePlan(plan: PlanType, expire_at?: string | null): PlanType {
  if (isPlanExpired(plan, expire_at)) return 'gratuit'
  return plan
}

export function planHasFeature(config: PlanConfig, feature: string): boolean {
  return config.features?.includes(feature) ?? false
}

export const PLAN_LABEL: Record<PlanType, string> = {
  gratuit:        'Gratuit',
  pro_mensuel:    'Pro',
  pro_annuel:     'Pro',
  agence_mensuel: 'Agence',
  agence_annuel:  'Agence',
}

/** Retourne le tier (gratuit / pro / agence) d'un plan */
export function getPlanTier(plan: PlanType): 'gratuit' | 'pro' | 'agence' {
  if (plan === 'gratuit') return 'gratuit'
  if (plan.startsWith('pro')) return 'pro'
  return 'agence'
}
