/**
 * lib/stripeAbonnement.ts — Lecture des objets Stripe pour le webhook (fonctions pures, testées).
 */
import type Stripe from 'stripe'
import type { PlanConfigs } from '@/lib/plan'
import type { PlanType } from '@/lib/types'

/**
 * Fin de la période en cours, en ISO.
 * Depuis l'API 2025-03-31, current_period_end est porté par chaque item et non plus par
 * l'abonnement. On garde la lecture de l'ancien champ pour les événements plus anciens,
 * puis on retombe sur la durée du plan si Stripe ne fournit rien.
 */
export function getPeriodEnd(subscription: Stripe.Subscription, plan: PlanType): string {
  const legacy = (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end
  const rawEnd = subscription.items?.data?.[0]?.current_period_end ?? legacy
  const dureeFallback = plan.includes('annuel') ? 365 : 30
  const periodEnd = (typeof rawEnd === 'number' && rawEnd > 0)
    ? rawEnd
    : Math.floor(Date.now() / 1000) + dureeFallback * 24 * 3600
  if (periodEnd !== rawEnd) console.warn(`[Webhook] current_period_end absent, repli sur ${dureeFallback} jours`)
  return new Date(periodEnd * 1000).toISOString()
}

/**
 * Plan correspondant à l'abonnement, déduit du prix facturé.
 * Les métadonnées ne sont fixées qu'au checkout : elles restent sur l'ancien plan si
 * l'utilisateur en change via le portail client. Elles ne servent donc que de repli.
 */
export function getPlanFromSubscription(subscription: Stripe.Subscription, configs: PlanConfigs): PlanType | null {
  const priceId = subscription.items?.data?.[0]?.price?.id
  if (priceId) {
    const match = (Object.keys(configs) as PlanType[])
      .find(p => p !== 'gratuit' && configs[p].stripe_price_id === priceId)
    if (match) return match
    console.warn(`[Webhook] price ${priceId} inconnu dans plan_config, repli sur les métadonnées`)
  }
  const meta = subscription.metadata?.plan
  return meta && meta !== 'gratuit' && Object.hasOwn(configs, meta) ? meta as PlanType : null
}

/** Identifiant de l'abonnement d'une facture (déplacé dans parent.subscription_details depuis l'API 2025-03-31). */
export function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const sub = invoice.parent?.subscription_details?.subscription
    ?? (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }).subscription
  if (!sub) return null
  return typeof sub === 'string' ? sub : sub.id
}
