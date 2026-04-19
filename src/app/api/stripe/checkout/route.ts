import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { getPlanConfig } from '@/lib/plan'
import type { PlanType } from '@/lib/types'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY non configuré')
  return new Stripe(key, { apiVersion: '2026-03-25.dahlia' })
}

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { plan } = await req.json() as { plan: PlanType }
    if (!plan || plan === 'gratuit') {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
    }

    // Récupérer la config des plans
    const planConfig = await getPlanConfig()
    const config = planConfig[plan]

    if (!config.stripe_price_id) {
      return NextResponse.json(
        { error: 'Prix Stripe non configuré. Configurez le price_id dans les paramètres admin.' },
        { status: 400 }
      )
    }

    // Récupérer le profil
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, prenom, nom')
      .eq('id', user.id)
      .single()

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

    // Créer ou récupérer le customer Stripe
    let customerId = profile?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: `${profile?.prenom ?? ''} ${profile?.nom ?? ''}`.trim(),
        metadata: { user_id: user.id },
      })
      customerId = customer.id

      // Sauvegarder le customer_id
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Créer la session Checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: config.stripe_price_id, quantity: 1 }],
      success_url: `${baseUrl}/compte/plan?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/compte/plan?canceled=1`,
      metadata: {
        user_id: user.id,
        plan,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan,
        },
      },
      allow_promotion_codes: true,
      locale: 'fr',
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('[Stripe checkout]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
