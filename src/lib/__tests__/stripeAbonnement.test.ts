import { describe, it, expect, vi, afterEach } from 'vitest'
import type Stripe from 'stripe'
import { getPeriodEnd, getPlanFromSubscription, getInvoiceSubscriptionId } from '@/lib/stripeAbonnement'
import { DEFAULT_PLAN_CONFIG, type PlanConfigs } from '@/lib/plan'

const configs: PlanConfigs = structuredClone(DEFAULT_PLAN_CONFIG)
configs.pro_mensuel.stripe_price_id    = 'price_pro_m'
configs.agence_annuel.stripe_price_id  = 'price_agence_a'

function abonnement(opts: { priceId?: string; periodEnd?: number; legacyEnd?: number; metaPlan?: string }) {
  return {
    items: { data: [{ price: { id: opts.priceId }, current_period_end: opts.periodEnd }] },
    current_period_end: opts.legacyEnd,
    metadata: opts.metaPlan ? { plan: opts.metaPlan } : {},
  } as unknown as Stripe.Subscription
}

afterEach(() => vi.useRealTimers())

describe('getPeriodEnd', () => {
  it('lit current_period_end sur le premier item (API ≥ 2025-03-31)', () => {
    expect(getPeriodEnd(abonnement({ periodEnd: 1_800_000_000 }), 'pro_mensuel'))
      .toBe(new Date(1_800_000_000 * 1000).toISOString())
  })

  it("se rabat sur l'ancien champ de l'abonnement", () => {
    expect(getPeriodEnd(abonnement({ legacyEnd: 1_700_000_000 }), 'pro_mensuel'))
      .toBe(new Date(1_700_000_000 * 1000).toISOString())
  })

  it('ne lève jamais : sans date, repli sur la durée du plan', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(getPeriodEnd(abonnement({}), 'pro_annuel')).toBe('2027-01-01T00:00:00.000Z')
    expect(getPeriodEnd(abonnement({}), 'pro_mensuel')).toBe('2026-01-31T00:00:00.000Z')
  })
})

describe('getPlanFromSubscription', () => {
  it('déduit le plan du prix facturé, même si les métadonnées sont périmées', () => {
    expect(getPlanFromSubscription(abonnement({ priceId: 'price_agence_a', metaPlan: 'pro_mensuel' }), configs))
      .toBe('agence_annuel')
  })

  it('se rabat sur les métadonnées pour un prix inconnu', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(getPlanFromSubscription(abonnement({ priceId: 'price_inconnu', metaPlan: 'pro_annuel' }), configs))
      .toBe('pro_annuel')
  })

  it('refuse gratuit et les plans inexistants', () => {
    expect(getPlanFromSubscription(abonnement({ metaPlan: 'gratuit' }), configs)).toBeNull()
    expect(getPlanFromSubscription(abonnement({ metaPlan: 'constructor' }), configs)).toBeNull()
    expect(getPlanFromSubscription(abonnement({}), configs)).toBeNull()
  })
})

describe('getInvoiceSubscriptionId', () => {
  it('lit parent.subscription_details (API dahlia)', () => {
    const invoice = { parent: { subscription_details: { subscription: 'sub_123' } } } as unknown as Stripe.Invoice
    expect(getInvoiceSubscriptionId(invoice)).toBe('sub_123')
  })

  it("accepte l'ancien champ et un objet abonnement", () => {
    expect(getInvoiceSubscriptionId({ subscription: { id: 'sub_456' } } as unknown as Stripe.Invoice)).toBe('sub_456')
  })

  it('retourne null pour une facture hors abonnement', () => {
    expect(getInvoiceSubscriptionId({ parent: null } as unknown as Stripe.Invoice)).toBeNull()
  })
})
