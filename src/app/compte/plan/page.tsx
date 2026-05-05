import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPlanConfig, ALL_FEATURES, PLAN_LABEL, getPlanTier } from '@/lib/plan'
import { getEffectivePlan, isPlanExpired } from '@/lib/plan'
import type { PlanType } from '@/lib/types'
import PlanCheckoutButton from '@/components/compte/PlanCheckoutButton'
import StripePortalButton from '@/components/compte/StripePortalButton'
import PageHeader from '@/components/compte/ui/PageHeader'

const TIER_COLOR: Record<'gratuit' | 'pro' | 'agence', string> = {
  gratuit: '#64748b',
  pro:     '#4F46E5',
  agence:  '#0891b2',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function buildFeatureLines(config: { annonces: number; photos: number; features: string[] }): string[] {
  const lines: string[] = []
  lines.push(config.annonces >= 999 ? 'Annonces illimitées' : `${config.annonces} annonce${config.annonces > 1 ? 's' : ''} active${config.annonces > 1 ? 's' : ''}`)
  lines.push(`${config.photos} photos par annonce`)
  for (const key of config.features) {
    const def = ALL_FEATURES.find(f => f.key === key)
    if (def) lines.push(def.label)
  }
  return lines
}

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/compte/plan')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  const params = await searchParams
  const planConfig = await getPlanConfig()

  const currentPlan   = profile?.plan as PlanType ?? 'gratuit'
  const effectivePlan = getEffectivePlan(currentPlan, profile?.plan_expire_at)
  const expired       = isPlanExpired(currentPlan, profile?.plan_expire_at)
  const effectiveTier = getPlanTier(effectivePlan)

  const annoncesActives = profile?.annonces_actives ?? 0
  const limite          = planConfig[effectivePlan]

  // ── 3 tiers affichés ─────────────────────────────────────────────────────────
  // On n'affiche un tier payant que si au moins sa variante mensuelle est active
  // (ou si l'utilisateur est déjà sur ce tier)
  const tiers = [
    {
      key:    'gratuit' as const,
      label:  planConfig.gratuit.label ?? 'Gratuit',
      desc:   planConfig.gratuit.description ?? '',
      color:  TIER_COLOR.gratuit,
      config: planConfig.gratuit,
      lines:  buildFeatureLines(planConfig.gratuit),
      visible: planConfig.gratuit.actif !== false || effectiveTier === 'gratuit',
    },
    {
      key:    'pro' as const,
      label:  planConfig.pro_mensuel.label ?? 'Pro',
      desc:   planConfig.pro_mensuel.description ?? '',
      color:  TIER_COLOR.pro,
      config: planConfig.pro_mensuel,   // features / limites partagées
      lines:  buildFeatureLines(planConfig.pro_mensuel),
      mensuel: planConfig.pro_mensuel,
      annuel:  planConfig.pro_annuel,
      visible: planConfig.pro_mensuel.actif !== false || effectiveTier === 'pro',
    },
    {
      key:    'agence' as const,
      label:  planConfig.agence_mensuel.label ?? 'Agence',
      desc:   planConfig.agence_mensuel.description ?? '',
      color:  TIER_COLOR.agence,
      config: planConfig.agence_mensuel,
      lines:  buildFeatureLines(planConfig.agence_mensuel),
      mensuel: planConfig.agence_mensuel,
      annuel:  planConfig.agence_annuel,
      visible: planConfig.agence_mensuel.actif !== false || effectiveTier === 'agence',
    },
  ].filter(t => t.visible)

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <PageHeader title="Mon abonnement" description="Gérez votre plan et vos limites de publication" />

      {/* Notifications */}
      {params.success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">✓</span>
          <div>
            <p className="text-sm font-semibold text-green-800">Abonnement activé !</p>
            <p className="text-xs text-green-600 mt-0.5">Votre plan a été mis à jour. Profitez de toutes les fonctionnalités.</p>
          </div>
        </div>
      )}
      {params.canceled && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">ℹ</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">Paiement annulé</p>
            <p className="text-xs text-amber-700 mt-0.5">Votre abonnement n'a pas été modifié.</p>
          </div>
        </div>
      )}
      {expired && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">⚠</span>
          <div>
            <p className="text-sm font-semibold text-red-800">Votre abonnement a expiré</p>
            <p className="text-xs text-red-700 mt-0.5">Vous êtes repassé au plan gratuit. Renouvelez pour retrouver vos avantages.</p>
          </div>
        </div>
      )}

      {/* Plan actuel */}
      <div className="bg-white rounded-2xl border border-navy/08 p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-semibold text-navy/40 uppercase tracking-wider mb-2">Plan actuel</p>
            <div className="flex items-center gap-3 mb-3">
              <span className="font-serif text-2xl text-navy">
                {planConfig[effectivePlan].label ?? PLAN_LABEL[effectivePlan]}
                {effectiveTier !== 'gratuit' && (
                  <span className="text-base text-navy/40 font-sans ml-1.5">
                    ({effectivePlan.endsWith('_mensuel') ? 'mensuel' : 'annuel'})
                  </span>
                )}
              </span>
              {effectiveTier !== 'gratuit' && !expired && (
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">Actif</span>
              )}
              {expired && (
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-700">Expiré</span>
              )}
            </div>
            {profile?.plan_expire_at && !expired && (
              <p className="text-sm text-navy/50">
                Renouvellement le{' '}
                <span className="font-medium text-navy/80">{formatDate(profile.plan_expire_at)}</span>
              </p>
            )}
            {profile?.plan_expire_at && expired && (
              <p className="text-sm text-red-600">Expiré le {formatDate(profile.plan_expire_at)}</p>
            )}
          </div>

          {/* Utilisation */}
          <div className="min-w-[200px]">
            <div className="flex justify-between text-xs text-navy/50 mb-1.5">
              <span>Annonces actives</span>
              <span className="font-medium">{annoncesActives} / {limite.annonces >= 999 ? '∞' : limite.annonces}</span>
            </div>
            <div className="h-2 bg-navy/06 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{
                  width: `${limite.annonces >= 999 ? 10 : Math.min((annoncesActives / limite.annonces) * 100, 100)}%`,
                  background: annoncesActives >= limite.annonces && limite.annonces < 999 ? '#ef4444' : TIER_COLOR[effectiveTier],
                }} />
            </div>
            <p className="mt-1.5 text-[11px] text-navy/40">
              {limite.photos} photos/annonce
            </p>
          </div>
        </div>
      </div>

      {/* ── Cartes des tiers ── */}
      <div className={`grid grid-cols-1 gap-5 ${tiers.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
        {tiers.map(tier => {
          const isCurrent = effectiveTier === tier.key
          const color = tier.color

          return (
            <div key={tier.key}
              className={`relative bg-white rounded-2xl border p-6 flex flex-col transition-all ${
                tier.key === 'pro' && !isCurrent
                  ? 'border-primary/40 shadow-lg shadow-primary/08'
                  : isCurrent ? 'border-navy/20' : 'border-navy/08'
              }`}
              style={isCurrent ? { borderTopColor: color, borderTopWidth: 3 } : {}}>

              {/* Badge plan actuel / recommandé */}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-[10px] font-semibold px-3 py-1 rounded-full text-white whitespace-nowrap"
                    style={{ background: color }}>Plan actuel</span>
                </div>
              )}
              {tier.key === 'pro' && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-white text-[10px] font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                    Recommandé
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="font-semibold text-navy text-lg mb-1">{tier.label}</h3>
                {tier.desc && <p className="text-xs text-navy/45">{tier.desc}</p>}
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-6 flex-1">
                {tier.lines.map(line => (
                  <li key={line} className="flex items-start gap-2 text-sm text-navy/70">
                    <span className="mt-0.5 flex-shrink-0 text-xs font-bold" style={{ color }}>✓</span>
                    {line}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {tier.key === 'gratuit' ? (
                <div className="w-full text-center py-2.5 rounded-xl border border-navy/10 text-sm text-navy/40">
                  {isCurrent ? 'Plan actuel' : 'Gratuit'}
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Mensuel */}
                  <div className="rounded-xl border border-navy/10 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-navy/02">
                      <div>
                        <span className="font-serif text-xl text-navy">{tier.mensuel!.prix} €</span>
                        <span className="text-xs text-navy/50 ml-1">/ mois</span>
                      </div>
                      <PlanCheckoutButton
                        plan={tier.key === 'pro' ? 'pro_mensuel' : 'agence_mensuel'}
                        isCurrent={
                          effectivePlan === (tier.key === 'pro' ? 'pro_mensuel' : 'agence_mensuel')
                        }
                        hasPriceId={!!tier.mensuel!.stripe_price_id}
                        color={color}
                        compact
                      />
                    </div>
                  </div>

                  {/* Annuel */}
                  <div className="rounded-xl border overflow-hidden" style={{ borderColor: color + '40' }}>
                    <div className="flex items-center justify-between px-4 py-2.5" style={{ background: color + '08' }}>
                      <div>
                        <span className="font-serif text-xl text-navy">{tier.annuel!.prix} €</span>
                        <span className="text-xs text-navy/50 ml-1">/ an</span>
                        <span className="text-[10px] ml-2 font-medium" style={{ color }}>
                          ~{Math.round(tier.annuel!.prix / 12)} €/mois
                        </span>
                      </div>
                      <PlanCheckoutButton
                        plan={tier.key === 'pro' ? 'pro_annuel' : 'agence_annuel'}
                        isCurrent={
                          effectivePlan === (tier.key === 'pro' ? 'pro_annuel' : 'agence_annuel')
                        }
                        hasPriceId={!!tier.annuel!.stripe_price_id}
                        color={color}
                        compact
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Portail Stripe */}
      {effectiveTier !== 'gratuit' && !expired && profile?.stripe_customer_id && (
        <div className="mt-6 text-center">
          <StripePortalButton />
        </div>
      )}
    </div>
  )
}
