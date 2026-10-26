import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { signalerErreur } from '@/lib/alertesErreurs'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPlanConfig, type PlanConfigs } from '@/lib/plan'
import type { PlanType } from '@/lib/types'

/**
 * Fin de la période en cours, en ISO.
 * Depuis l'API 2025-03-31, current_period_end est porté par chaque item et non plus par
 * l'abonnement. On garde la lecture de l'ancien champ pour les événements plus anciens,
 * puis on retombe sur la durée du plan si Stripe ne fournit rien.
 */
function getPeriodEnd(subscription: Stripe.Subscription, plan: PlanType): string {
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
function getPlanFromSubscription(subscription: Stripe.Subscription, configs: PlanConfigs): PlanType | null {
  const priceId = subscription.items?.data?.[0]?.price?.id
  if (priceId) {
    const match = (Object.keys(configs) as PlanType[])
      .find(p => p !== 'gratuit' && configs[p].stripe_price_id === priceId)
    if (match) return match
    console.warn(`[Webhook] price ${priceId} inconnu dans plan_config, repli sur les métadonnées`)
  }
  const meta = subscription.metadata?.plan
  return meta && meta !== 'gratuit' && meta in configs ? meta as PlanType : null
}

/** Identifiant de l'abonnement d'une facture (déplacé dans parent.subscription_details depuis l'API 2025-03-31). */
function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const sub = invoice.parent?.subscription_details?.subscription
    ?? (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }).subscription
  if (!sub) return null
  return typeof sub === 'string' ? sub : sub.id
}

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!sig || !webhookSecret) {
    console.error('[Webhook] stripe-signature ou STRIPE_WEBHOOK_SECRET manquant')
    return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('[Webhook] Signature invalide:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      // Paiement initial réussi
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const userId = session.metadata?.user_id
        if (!userId) break

        const subscriptionId = session.subscription as string
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const plan = getPlanFromSubscription(subscription, await getPlanConfig())
          ?? session.metadata?.plan as PlanType | undefined
        if (!plan) break

        const currentPeriodEnd = getPeriodEnd(subscription, plan)

        await supabase.from('profiles').update({
          plan,
          plan_expire_at: currentPeriodEnd,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscriptionId,
        }).eq('id', userId).throwOnError()

        console.log(`[Webhook] Plan ${plan} activé pour user ${userId}, expire le ${currentPeriodEnd}`)
        break
      }

      // Renouvellement automatique réussi
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = getInvoiceSubscriptionId(invoice)
        if (!subscriptionId) break

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const userId = subscription.metadata?.user_id
        const plan = getPlanFromSubscription(subscription, await getPlanConfig())
        if (!userId || !plan) break

        const currentPeriodEnd = getPeriodEnd(subscription, plan)

        await supabase.from('profiles').update({
          plan,
          plan_expire_at: currentPeriodEnd,
        }).eq('id', userId).throwOnError()

        console.log(`[Webhook] Renouvellement ${plan} pour user ${userId}, expire le ${currentPeriodEnd}`)
        break
      }

      // Paiement échoué
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subId = getInvoiceSubscriptionId(invoice)
        if (!subId) break

        const subscription = await stripe.subscriptions.retrieve(subId)
        const userId = subscription.metadata?.user_id
        if (!userId) break

        console.warn(`[Webhook] Paiement échoué pour user ${userId}`)
        // On ne dégrade pas immédiatement, Stripe réessaie automatiquement
        break
      }

      // Abonnement annulé ou expiré
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.user_id
        if (!userId) break

        await supabase.from('profiles').update({
          plan: 'gratuit',
          plan_expire_at: null,
          stripe_subscription_id: null,
        }).eq('id', userId).throwOnError()

        console.log(`[Webhook] Abonnement annulé pour user ${userId}, retour au plan gratuit`)
        break
      }

      // Abonnement modifié (changement de plan, pause, etc.)
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.user_id
        if (!userId) break

        // Si actif, mettre à jour le plan (il a pu changer via le portail) et l'expiration
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          const plan = getPlanFromSubscription(subscription, await getPlanConfig())
          if (!plan) break

          const currentPeriodEnd = getPeriodEnd(subscription, plan)
          await supabase.from('profiles').update({
            plan,
            plan_expire_at: currentPeriodEnd,
          }).eq('id', userId).throwOnError()

          console.log(`[Webhook] Abonnement mis à jour : ${plan} pour user ${userId}, expire le ${currentPeriodEnd}`)
        }
        break
      }

      default:
        // Événement non géré, ignorer
        break
    }
  } catch (err) {
    console.error('[Webhook] Erreur traitement:', err)
    await signalerErreur({ source: 'Webhook Stripe', erreur: err, details: { evenement: event.type, id: event.id } })
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
