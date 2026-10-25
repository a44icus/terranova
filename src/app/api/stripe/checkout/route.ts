import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPlanConfig } from '@/lib/plan'
import { SITE_URL } from '@/lib/site'
import type { PlanType } from '@/lib/types'

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await req.json().catch(() => null) as { plan?: unknown } | null
    const plan = body?.plan
    if (typeof plan !== 'string' || plan === 'gratuit') {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
    }

    // Récupérer la config des plans
    const planConfig = await getPlanConfig()
    // Object.hasOwn : un nom inconnu (ou « constructor ») ne doit pas remonter au prototype
    const config = Object.hasOwn(planConfig, plan) ? planConfig[plan as PlanType] : undefined

    if (!config) {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
    }
    if (config.actif === false) {
      return NextResponse.json({ error: 'Ce plan n\'est plus proposé' }, { status: 400 })
    }
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

    // Créer ou récupérer le customer Stripe
    let customerId = profile?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: `${profile?.prenom ?? ''} ${profile?.nom ?? ''}`.trim(),
        metadata: { user_id: user.id },
      })
      customerId = customer.id

      // Sauvegarder le customer_id. Service role obligatoire : la colonne est protégée
      // contre les écritures utilisateur (migration 20261026_profiles_colonnes_protegees.sql).
      await createAdminClient()
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
      success_url: `${SITE_URL}/compte/plan?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/compte/plan?canceled=1`,
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
  } catch (err) {
    console.error('[Stripe checkout]', err)
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
