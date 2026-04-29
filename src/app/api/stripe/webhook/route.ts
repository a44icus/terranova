import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import type { PlanType } from '@/lib/types'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY non configuré')
  return new Stripe(key, { apiVersion: '2026-03-25.dahlia' })
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
  } catch (err: any) {
    console.error('[Webhook] Signature invalide:', err.message)
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
        const plan = session.metadata?.plan as PlanType
        if (!userId || !plan) break

        const subscriptionId = session.subscription as string
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000).toISOString()

        await supabase.from('profiles').update({
          plan,
          plan_expire_at: currentPeriodEnd,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscriptionId,
        }).eq('id', userId)

        console.log(`[Webhook] Plan ${plan} activé pour user ${userId}, expire le ${currentPeriodEnd}`)
        break
      }

      // Renouvellement automatique réussi
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any
        if (!invoice.subscription) break

        const subscriptionId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription.id
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const userId = subscription.metadata?.user_id
        const plan = subscription.metadata?.plan as PlanType
        if (!userId || !plan) break

        const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000).toISOString()

        await supabase.from('profiles').update({
          plan,
          plan_expire_at: currentPeriodEnd,
        }).eq('id', userId)

        console.log(`[Webhook] Renouvellement ${plan} pour user ${userId}, expire le ${currentPeriodEnd}`)
        break
      }

      // Paiement échoué
      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        if (!invoice.subscription) break

        const subId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription.id
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
        }).eq('id', userId)

        console.log(`[Webhook] Abonnement annulé pour user ${userId}, retour au plan gratuit`)
        break
      }

      // Abonnement modifié (changement de plan, pause, etc.)
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.user_id
        const plan = subscription.metadata?.plan as PlanType
        if (!userId || !plan) break

        // Si actif, mettre à jour l'expiration
        if (subscription.status === 'active') {
          const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000).toISOString()
          await supabase.from('profiles').update({
            plan,
            plan_expire_at: currentPeriodEnd,
          }).eq('id', userId)
        }
        break
      }

      default:
        // Événement non géré, ignorer
        break
    }
  } catch (err: any) {
    console.error('[Webhook] Erreur traitement:', err)
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
