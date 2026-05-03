import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPlanConfig } from '@/lib/plan'
import { getEffectivePlan, isPlanExpired, PLAN_LABEL } from '@/lib/plan'
import type { PlanType } from '@/lib/types'
import PlanCheckoutButton from '@/components/compte/PlanCheckoutButton'
import StripePortalButton from '@/components/compte/StripePortalButton'
import PageHeader from '@/components/compte/ui/PageHeader'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
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
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const params = await searchParams
  const planConfig = await getPlanConfig()

  const currentPlan = profile?.plan as PlanType ?? 'gratuit'
  const effectivePlan = getEffectivePlan(currentPlan, profile?.plan_expire_at)
  const expired = isPlanExpired(currentPlan, profile?.plan_expire_at)
  const annoncesActives = profile?.annonces_actives ?? 0
  const limite = planConfig[effectivePlan]

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <PageHeader title="Mon abonnement" description="Gérez votre plan et vos limites de publication" />

      {/* Notifications */}
      {params.success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">✓</span>
          <div>
            <p className="text-sm font-semibold text-green-800">Abonnement activé avec succès !</p>
            <p className="text-xs text-green-600 mt-0.5">Votre plan a été mis à jour. Profitez de toutes les fonctionnalités Pro.</p>
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
            <p className="text-sm font-semibold text-red-800">Votre abonnement Pro a expiré</p>
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
              <span className="font-serif text-2xl text-navy">{PLAN_LABEL[effectivePlan]}</span>
              {effectivePlan !== 'gratuit' && (
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                  Actif
                </span>
              )}
              {expired && (
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-700">
                  Expiré
                </span>
              )}
            </div>

            {profile?.plan_expire_at && !expired && (
              <p className="text-sm text-navy/50">
                Renouvellement automatique le{' '}
                <span className="font-medium text-navy/80">{formatDate(profile.plan_expire_at)}</span>
              </p>
            )}
            {profile?.plan_expire_at && expired && (
              <p className="text-sm text-red-600">
                Expiré le {formatDate(profile.plan_expire_at)}
              </p>
            )}
          </div>

          {/* Utilisation */}
          <div className="min-w-[200px]">
            <div className="flex justify-between text-xs text-navy/50 mb-1.5">
              <span>Annonces actives</span>
              <span className="font-medium">{annoncesActives} / {limite.annonces === 999 ? '∞' : limite.annonces}</span>
            </div>
            <div className="h-2 bg-navy/06 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${limite.annonces === 999 ? 10 : Math.min((annoncesActives / limite.annonces) * 100, 100)}%`,
                  background: annoncesActives >= limite.annonces && limite.annonces !== 999
                    ? '#ef4444'
                    : '#4F46E5',
                }}
              />
            </div>
            <div className="mt-1.5 text-[11px] text-navy/40">
              {limite.photos} photos/annonce · Visibilité {limite.duree_jours} jours
            </div>
          </div>
        </div>
      </div>

      {/* Cartes des plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gratuit */}
        <PlanCard
          plan="gratuit"
          config={planConfig.gratuit}
          isCurrent={effectivePlan === 'gratuit'}
          label="Gratuit"
          description="Pour découvrir la plateforme"
          color="#7f8c8d"
          features={[
            `${planConfig.gratuit.annonces} annonces simultanées`,
            `${planConfig.gratuit.photos} photos par annonce`,
            `Visible ${planConfig.gratuit.duree_jours} jours`,
            'Accès à la carte',
            'Messagerie intégrée',
          ]}
          profile={profile}
        />

        {/* Pro Mensuel */}
        <PlanCard
          plan="pro_mensuel"
          config={planConfig.pro_mensuel}
          isCurrent={effectivePlan === 'pro_mensuel'}
          label="Pro Mensuel"
          description="Pour les particuliers actifs"
          color="#4F46E5"
          highlight
          features={[
            `${planConfig.pro_mensuel.annonces} annonces simultanées`,
            `${planConfig.pro_mensuel.photos} photos par annonce`,
            `Visible ${planConfig.pro_mensuel.duree_jours} jours`,
            'Badge Pro sur vos annonces',
            'Statistiques avancées',
            'Support prioritaire',
          ]}
          profile={profile}
        />

        {/* Pro Annuel */}
        <PlanCard
          plan="pro_annuel"
          config={planConfig.pro_annuel}
          isCurrent={effectivePlan === 'pro_annuel'}
          label="Pro Annuel"
          description="Pour les professionnels"
          color="#0891b2"
          badge="Économisez 28%"
          features={[
            'Annonces illimitées',
            `${planConfig.pro_annuel.photos} photos par annonce`,
            `Visible ${planConfig.pro_annuel.duree_jours} jours`,
            'Badge Pro premium',
            'Annonces mises en avant',
            'API accès partenaires',
            'Support dédié',
          ]}
          profile={profile}
        />
      </div>

      {/* Portail Stripe pour gérer l'abonnement */}
      {effectivePlan !== 'gratuit' && !expired && profile?.stripe_customer_id && (
        <div className="mt-6 text-center">
          <StripePortalButton />
        </div>
      )}
    </div>
  )
}

function PlanCard({
  plan,
  config,
  isCurrent,
  label,
  description,
  color,
  highlight = false,
  badge,
  features,
  profile,
}: {
  plan: PlanType
  config: { annonces: number; photos: number; duree_jours: number; prix: number; stripe_price_id?: string }
  isCurrent: boolean
  label: string
  description: string
  color: string
  highlight?: boolean
  badge?: string
  features: string[]
  profile: any
}) {
  const priceDisplay = plan === 'gratuit'
    ? 'Gratuit'
    : plan === 'pro_annuel'
      ? `${config.prix} €/an`
      : `${config.prix} €/mois`

  const perMonth = plan === 'pro_annuel'
    ? `soit ~${Math.round(config.prix / 12)} €/mois`
    : null

  return (
    <div
      className={`relative bg-white rounded-2xl border p-6 flex flex-col transition-all ${
        highlight && !isCurrent
          ? 'border-primary/40 shadow-lg shadow-primary/08'
          : isCurrent
            ? 'border-[' + color + ']/40'
            : 'border-navy/08'
      }`}
    >
      {badge && !isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-white text-[10px] font-semibold px-3 py-1 rounded-full whitespace-nowrap">
            {badge}
          </span>
        </div>
      )}

      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="text-[10px] font-semibold px-3 py-1 rounded-full whitespace-nowrap text-white"
            style={{ background: color }}>
            Plan actuel
          </span>
        </div>
      )}

      <div className="mb-4">
        <h3 className="font-semibold text-navy mb-1">{label}</h3>
        <p className="text-xs text-navy/45">{description}</p>
      </div>

      <div className="mb-5">
        <span className="font-serif text-3xl text-navy">{priceDisplay}</span>
        {perMonth && (
          <p className="text-xs text-navy/40 mt-0.5">{perMonth}</p>
        )}
      </div>

      <ul className="space-y-2 mb-6 flex-1">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2 text-sm text-navy/70">
            <span className="mt-0.5 flex-shrink-0" style={{ color }}>✓</span>
            {f}
          </li>
        ))}
      </ul>

      {plan === 'gratuit' ? (
        <div className="w-full text-center py-2.5 rounded-xl border border-navy/10 text-sm text-navy/40">
          {isCurrent ? 'Plan actuel' : 'Gratuit'}
        </div>
      ) : (
        <PlanCheckoutButton
          plan={plan}
          isCurrent={isCurrent}
          hasPriceId={!!config.stripe_price_id}
          color={color}
        />
      )}
    </div>
  )
}
