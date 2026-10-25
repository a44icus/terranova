import Stripe from 'stripe'

/** Client Stripe serveur. Lève une erreur si STRIPE_SECRET_KEY n'est pas configurée. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY non configuré')
  return new Stripe(key, { apiVersion: '2026-03-25.dahlia' })
}
